import { NextRequest, NextResponse } from "next/server";

interface TransliterateRequest {
  text: string;
  targetLang: string;
}

interface TransliterateResponse {
  suggestions: string[];
}

type InputToolsResponse = [string, [string, string[]][]] | [string];

const transliterateText = async (
  text: string,
  targetLang: string
): Promise<string[]> => {
  const url = `https://inputtools.google.com/request?text=${encodeURIComponent(
    text
  )}&itc=${targetLang}-t-i0-und&num=9`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    return [text];
  }

  const data = (await response.json()) as InputToolsResponse;

  if (data?.[1]?.[0]?.[1]) {
    return data[1][0][1].slice(0, 9);
  }

  return [text];
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<TransliterateResponse | { error: string }>> {
  try {
    const body = (await request.json()) as TransliterateRequest;
    const { text, targetLang } = body;

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "Missing required fields: text, targetLang" },
        { status: 400 }
      );
    }

    if (text.trim().length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await transliterateText(text, targetLang);

    return NextResponse.json({ suggestions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transliteration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
