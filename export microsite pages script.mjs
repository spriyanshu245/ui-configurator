import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

const COMMON_HEADERS = {
  accept: "*/*",
  "Content-Type": "application/json",
  "workspace-code": "engineering-workspace",
  "x-user-type": "employee",
};
class FileOutputHandler {
  constructor(baseDir) {
    this.baseDir = baseDir;
    mkdirSync(baseDir, { recursive: true });
  }

  write(fileName, json) {
    writeFileSync(
      join(this.baseDir, fileName),
      JSON.stringify(json, null, 2),
      "utf-8",
    );
  }
}

const SOURCE_BASE = "https://api.dev.rahi.cloud/api/v1/config";

const VERSION = 1;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = join(__dirname);
const OUTPUT_DIR = join(ROOT_DIR, "dsl");
console.log(`Output directory: ${OUTPUT_DIR}`);

const outputHandler = new FileOutputHandler(join(OUTPUT_DIR, "migratedPages"));

const request = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: {
      ...COMMON_HEADERS,
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    const error = new Error(`HTTP ${res.status}`);
    error.status = res.status;
    error.body = errorText;
    throw error;
  }

  return res.json();
};

const getRequest = (url, options) => request(url, options);

const fetchMicrosite = (micrositeCode) => {
  return getRequest(
    `${SOURCE_BASE}/microsites/${micrositeCode}?version=${VERSION}`,
    {
      method: "GET",
      headers: {
        "content-type": "application/json",
        "x-user-id": "40001",
        "x-user-type": "employee",
      },
    },
  );
};

const fetchPage = (pageCode) => {
  return getRequest(`${SOURCE_BASE}/pages/${pageCode}?version=${VERSION}`);
};

const processInBatches = async (items, handler, batchSize = 5) => {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(handler));
  }
};

const migrateMicrosite = async (micrositeCode) => {
  try {
    const microsite = await fetchMicrosite(micrositeCode);

    const pages = microsite.pages || [];

    const uniquePages = [...new Set(pages.map((p) => p.pageCode))];

    await processInBatches(uniquePages, async (pageCode) => {
      try {
        const pageData = await fetchPage(pageCode);

        outputHandler.write(`${pageCode}.json`, pageData);
      } catch (err) {
        console.error(`❌ Failed page: ${pageCode}`);
      }
    });
  } catch (err) {
    console.error(`🔥 Migration failed`, err);
  }
};

const microsites = [
  {
    code: "loan-accounts",
    version: 1,
  },
];

microsites.map(async (microsite) => {
  await migrateMicrosite(microsite.code);
});
