import { NextRequest, NextResponse } from "next/server";
import { getGoogleCloudConfig } from "@/app/api/utils/serverConfig";

interface TranslateRequest {
  text?: string;
  texts?: string[];
  sourceLang: string;
  targetLang: string;
}

interface TranslateResponse {
  translatedText?: string;
  translatedTexts?: string[];
}

interface GoogleTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string;
    }>;
  };
}

const getAccessToken = async (): Promise<string> => {
  const { clientEmail, privateKey } = getGoogleCloudConfig();

  if (!clientEmail || !privateKey) {
    throw new Error("Google Cloud credentials not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/cloud-translation",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64UrlEncode = (data: object): string => {
    const jsonStr = JSON.stringify(data);
    const base64 = Buffer.from(jsonStr).toString("base64");
    return base64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  };

  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  const crypto = await import("node:crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signatureInput);
  const signature = sign.sign(privateKey, "base64");
  const signatureEncoded = signature
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

  const jwt = `${signatureInput}.${signatureEncoded}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${errorText}`);
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string };
  return tokenData.access_token;
};

const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string,
  accessToken: string
): Promise<string> => {
  const results = await translateTexts(
    [text],
    sourceLang,
    targetLang,
    accessToken
  );
  return results[0];
};

const BATCH_SIZE = 50;

const translateTexts = async (
  texts: string[],
  sourceLang: string,
  targetLang: string,
  accessToken: string
): Promise<string[]> => {
  const { projectId } = getGoogleCloudConfig();

  if (!projectId) {
    throw new Error("Google Cloud Project ID not configured");
  }

  if (texts.length === 0) {
    return [];
  }

  const url = `https://translation.googleapis.com/language/translate/v2`;

  const results: string[] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: batch,
        source: sourceLang,
        target: targetLang,
        format: "html",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Translation failed: ${errorText}`);
    }

    const data = (await response.json()) as GoogleTranslateResponse;
    results.push(...data.data.translations.map((t) => t.translatedText));
  }

  return results;
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<TranslateResponse | { error: string }>> {
  try {
    const body = (await request.json()) as TranslateRequest;
    const { text, texts, sourceLang, targetLang } = body;

    const isBatch = Array.isArray(texts);
    const hasText = typeof text === "string" && text.length > 0;

    if (!isBatch && !hasText) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: text or texts, sourceLang, targetLang",
        },
        { status: 400 }
      );
    }

    if (!sourceLang || !targetLang) {
      return NextResponse.json(
        { error: "Missing required fields: sourceLang, targetLang" },
        { status: 400 }
      );
    }

    if (sourceLang === targetLang) {
      if (isBatch) {
        return NextResponse.json({ translatedTexts: texts });
      }
      return NextResponse.json({ translatedText: text });
    }

    const accessToken = await getAccessToken();

    if (isBatch) {
      const translatedTexts = await translateTexts(
        texts,
        sourceLang,
        targetLang,
        accessToken
      );
      return NextResponse.json({ translatedTexts });
    }

    const translatedText = await translateText(
      text!,
      sourceLang,
      targetLang,
      accessToken
    );

    return NextResponse.json({ translatedText });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
