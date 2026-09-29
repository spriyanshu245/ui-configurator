/**
 * @jest-environment node
 */
import {
  classifyAttachment,
  maxBytesFor,
  formatBytes,
  sanitizeDocName,
  MAX_IMAGE_BYTES,
  MAX_DOC_BYTES,
} from "../attachments";

describe("classifyAttachment", () => {
  it("classifies images by MIME with the Bedrock format", () => {
    expect(classifyAttachment("image/png", "a.png")).toEqual({ kind: "image", format: "png" });
    expect(classifyAttachment("image/jpg", "a.jpg")).toEqual({ kind: "image", format: "jpeg" });
    expect(classifyAttachment("image/webp", "a.webp")).toEqual({ kind: "image", format: "webp" });
  });

  it("classifies documents by MIME", () => {
    expect(classifyAttachment("application/pdf", "r.pdf")).toEqual({ kind: "document", format: "pdf" });
    expect(classifyAttachment("text/csv", "r.csv")).toEqual({ kind: "document", format: "csv" });
    expect(classifyAttachment("application/json", "dsl.json")).toEqual({ kind: "document", format: "txt" });
  });

  it("falls back to the file extension when MIME is empty/unknown", () => {
    expect(classifyAttachment("", "notes.md")).toEqual({ kind: "document", format: "md" });
    expect(classifyAttachment("application/octet-stream", "component.tsx")).toEqual({
      kind: "document",
      format: "txt",
    });
    expect(classifyAttachment("", "photo.PNG")).toEqual({ kind: "image", format: "png" });
  });

  it("returns null for unsupported types", () => {
    expect(classifyAttachment("application/zip", "a.zip")).toBeNull();
    expect(classifyAttachment("", "a.exe")).toBeNull();
  });
});

describe("maxBytesFor", () => {
  it("uses the image ceiling for images and the doc ceiling for documents", () => {
    expect(maxBytesFor("image")).toBe(MAX_IMAGE_BYTES);
    expect(maxBytesFor("document")).toBe(MAX_DOC_BYTES);
  });
});

describe("formatBytes", () => {
  it("formats bytes, KB and MB", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("sanitizeDocName", () => {
  it("strips illegal characters (incl. dots) and collapses whitespace", () => {
    expect(sanitizeDocName("Loan Report v2.pdf")).toBe("Loan Report v2 pdf");
    expect(sanitizeDocName("weird__name!!.csv")).toBe("weird name csv");
  });

  it("falls back to a positional name when nothing usable remains", () => {
    expect(sanitizeDocName("***", 0)).toBe("document-1");
    expect(sanitizeDocName("", 2)).toBe("document-3");
  });
});
