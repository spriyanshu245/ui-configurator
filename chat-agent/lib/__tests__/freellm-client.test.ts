/**
 * @jest-environment node
 */
const clientCtor = jest.fn();
jest.mock("@aws-sdk/client-bedrock-runtime", () => ({
  BedrockRuntimeClient: class {
    config: any;
    constructor(config: any) {
      this.config = config;
      clientCtor(config);
    }
  },
}));

const ENV_KEYS = ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "LLM_MODEL"] as const;

function loadWithEnv(env: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
  const saved: Record<string, string | undefined> = {};
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  Object.assign(process.env, env);
  try {
    let mod: typeof import("../freellm-client");
    jest.isolateModules(() => {
      mod = require("../freellm-client");
    });
    return mod!;
  } finally {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

describe("freellm-client", () => {
  beforeEach(() => clientCtor.mockClear());

  it("builds the Bedrock client from environment configuration", () => {
    const mod = loadWithEnv({
      AWS_REGION: "eu-west-1",
      AWS_ACCESS_KEY_ID: "AKIA",
      AWS_SECRET_ACCESS_KEY: "secret",
      LLM_MODEL: "my-model",
    });
    expect(clientCtor).toHaveBeenCalledWith({
      region: "eu-west-1",
      credentials: { accessKeyId: "AKIA", secretAccessKey: "secret" },
    });
    expect(mod.freeLLMClient).toBe(mod.awsBedrockClient);
    expect(mod.TOOL_CAPABLE_MODEL).toBe("my-model");
  });

  it("falls back to us-east-1, empty credentials and the 'auto' model", () => {
    const mod = loadWithEnv({});
    expect(clientCtor).toHaveBeenCalledWith({
      region: "us-east-1",
      credentials: { accessKeyId: "", secretAccessKey: "" },
    });
    expect(mod.TOOL_CAPABLE_MODEL).toBe("auto");
  });
});
