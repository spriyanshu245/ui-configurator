/// <reference types="node" />
import OpenAI from "openai";

import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

export const awsBedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Fallback logic for NVIDIA NIM if needed
export const nimClient = new OpenAI({
  baseURL:
    process.env.NVIDIA_NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_NIM_API_KEY ?? "nim-api-key",
});

export const googleGeminiClient = new OpenAI({
  baseURL:
    process.env.GOOGLE_GEMINI_BASE_URL ??
    "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: process.env.GOOGLE_GEMINI_API_KEY ?? "google-gemini-api-key",
  maxRetries: 5,
});

// Keep switchable back to googleGeminiClient by replacing this export
export const freeLLMClient = awsBedrockClient;
export const TOOL_CAPABLE_MODEL = process.env.LLM_MODEL ?? "auto";
