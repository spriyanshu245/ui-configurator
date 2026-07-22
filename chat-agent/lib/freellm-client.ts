/// <reference types="node" />
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

export const awsBedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Active LLM client: currently using AWS Bedrock. Switch by changing the assignment below.
export const freeLLMClient = awsBedrockClient;
export const TOOL_CAPABLE_MODEL = process.env.LLM_MODEL ?? "auto";
