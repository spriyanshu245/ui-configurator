import * as fs from "node:fs";
import * as path from "node:path";

const CO_PROPERTIES_PATH = path.resolve("/config/co.properties");

let cachedConfig: Record<string, string> | null = null;

const parsePropertiesFile = (filePath: string): Record<string, string> => {
  const parsed: Record<string, string> = {};
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    fileContent.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const parts = trimmedLine.split("=");
        if (parts.length > 1) {
          const key = parts[0].trim();
          const value = parts.slice(1).join("=").trim();
          parsed[key] = value;
        }
      }
    });
  } else {
    console.warn(`Warning: co.properties file not found at ${filePath}.`);
  }
  return parsed;
};

export const getServerConfig = (): Record<string, string> => {
  cachedConfig ??= parsePropertiesFile(CO_PROPERTIES_PATH);
  return cachedConfig;
};

export const getGoogleCloudConfig = () => {
  const config = getServerConfig();

  let privateKey = config.GOOGLE_CLOUD_PRIVATE_KEY ?? "";

  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
    privateKey = privateKey.slice(1, -1);
  }

  privateKey = privateKey.replaceAll(String.raw`\n`, "\n");

  if (privateKey && !privateKey.includes("-----BEGIN")) {
    try {
      const decoded = Buffer.from(privateKey, "base64").toString("utf8");
      if (decoded.includes("-----BEGIN")) {
        privateKey = decoded;
      }
    } catch {
      // Not base64 encoded, use as-is
    }
  }

  return {
    projectId: config.GOOGLE_CLOUD_PROJECT_ID ?? "",
    clientEmail: config.GOOGLE_CLOUD_CLIENT_EMAIL ?? "",
    privateKey,
  };
};

export const clearConfigCache = () => {
  cachedConfig = null;
};
