/// <reference types="node" />
import OpenAI from "openai";

// FreeLLMAPI configuration
export const freeLLMClient = new OpenAI({
  baseURL: process.env.FREELLM_BASE_URL ?? "http://localhost:3001/v1",
  apiKey: process.env.FREELLM_API_KEY ?? "freellmapi-key-from-dashboard",
  maxRetries: 5,
});

// Fallback logic for NVIDIA NIM if needed
export const nimClient = new OpenAI({
  baseURL:
    process.env.NVIDIA_NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_NIM_API_KEY ?? "nim-api-key",
});

export const TOOL_CAPABLE_MODEL = process.env.FREELLM_MODEL ?? "auto";
