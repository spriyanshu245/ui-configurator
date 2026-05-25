import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "node:util";

if (globalThis.TextEncoder === undefined) {
  globalThis.TextEncoder = TextEncoder;
}
if (globalThis.TextDecoder === undefined) {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

if (typeof structuredClone === "undefined") {
  global.structuredClone = <T>(val: T): T =>
    JSON.parse(JSON.stringify(val)) as T;
}
