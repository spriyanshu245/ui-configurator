const mockExistsSync = jest.fn();
const mockReadFileSync = jest.fn();

jest.mock("node:fs", () => ({
  existsSync: (path: string) => mockExistsSync(path),
  readFileSync: (path: string, encoding: string) =>
    mockReadFileSync(path, encoding),
}));

jest.mock("node:path", () => ({
  resolve: jest.fn((...args: string[]) => args.join("/")),
}));

describe("serverConfig", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("getServerConfig", () => {
    it("should parse properties file and cache the result", async () => {
      const mockPropertiesContent = `
# This is a comment
SERVICE_BASE_URL=http://localhost:8080
API_KEY=test-key
GOOGLE_CLOUD_PROJECT_ID=my-project
`;
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockPropertiesContent);

      const { getServerConfig, clearConfigCache } = await import(
        "./serverConfig"
      );
      clearConfigCache();

      const config = getServerConfig();

      expect(config.SERVICE_BASE_URL).toBe("http://localhost:8080");
      expect(config.API_KEY).toBe("test-key");
      expect(config.GOOGLE_CLOUD_PROJECT_ID).toBe("my-project");

      getServerConfig();
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    });

    it("should handle missing properties file", async () => {
      mockExistsSync.mockReturnValue(false);
      const consoleWarnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const { getServerConfig, clearConfigCache } = await import(
        "./serverConfig"
      );
      clearConfigCache();

      const config = getServerConfig();

      expect(config).toEqual({});
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Warning: co.properties file not found")
      );

      consoleWarnSpy.mockRestore();
    });

    it("should skip empty lines and comments", async () => {
      const mockPropertiesContent = `
# Comment line
   
KEY1=value1

# Another comment
KEY2=value2
   # Indented comment
`;
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockPropertiesContent);

      const { getServerConfig, clearConfigCache } = await import(
        "./serverConfig"
      );
      clearConfigCache();

      const config = getServerConfig();

      expect(Object.keys(config)).toHaveLength(2);
      expect(config.KEY1).toBe("value1");
      expect(config.KEY2).toBe("value2");
    });

    it("should handle values with equals signs", async () => {
      const mockPropertiesContent = `CONNECTION_STRING=host=localhost;port=5432;db=test`;
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockPropertiesContent);

      const { getServerConfig, clearConfigCache } = await import(
        "./serverConfig"
      );
      clearConfigCache();

      const config = getServerConfig();

      expect(config.CONNECTION_STRING).toBe("host=localhost;port=5432;db=test");
    });

    it("should handle lines without equals sign", async () => {
      const mockPropertiesContent = `VALID_KEY=valid_value
INVALID_LINE_NO_EQUALS
ANOTHER_VALID=value`;
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockPropertiesContent);

      const { getServerConfig, clearConfigCache } = await import(
        "./serverConfig"
      );
      clearConfigCache();

      const config = getServerConfig();

      expect(config.VALID_KEY).toBe("valid_value");
      expect(config.ANOTHER_VALID).toBe("value");
      expect(config.INVALID_LINE_NO_EQUALS).toBeUndefined();
    });
  });

  describe("getGoogleCloudConfig", () => {
    it("should return Google Cloud configuration", async () => {
      const mockPropertiesContent = `
GOOGLE_CLOUD_PROJECT_ID=my-project-id
GOOGLE_CLOUD_CLIENT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIkey\n-----END PRIVATE KEY-----
`;
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockPropertiesContent);

      const { getGoogleCloudConfig, clearConfigCache } = await import(
        "./serverConfig"
      );
      clearConfigCache();

      const cloudConfig = getGoogleCloudConfig();

      expect(cloudConfig.projectId).toBe("my-project-id");
      expect(cloudConfig.clientEmail).toBe(
        "service@project.iam.gserviceaccount.com"
      );
      expect(cloudConfig.privateKey).toContain("BEGIN PRIVATE KEY");
    });

    it("should handle private key with double quotes", async () => {
      const mockPropertiesContent = `GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIkey\\n-----END PRIVATE KEY-----"`;
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockPropertiesContent);

      const { getGoogleCloudConfig, clearConfigCache } = await import(
        "./serverConfig"
      );
      clearConfigCache();

      const cloudConfig = getGoogleCloudConfig();

      expect(cloudConfig.privateKey).toContain("BEGIN PRIVATE KEY");
      expect(cloudConfig.privateKey.startsWith('"')).toBe(false);
    });

    it("should handle private key with single quotes", async () => {
      const mockPropertiesContent = `GOOGLE_CLOUD_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\\nMIIkey\\n-----END PRIVATE KEY-----'`;
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockPropertiesContent);

      const { getGoogleCloudConfig, clearConfigCache } = await import(
        "./serverConfig"
      );
      clearConfigCache();

      const cloudConfig = getGoogleCloudConfig();

      expect(cloudConfig.privateKey).toContain("BEGIN PRIVATE KEY");
      expect(cloudConfig.privateKey.startsWith("'")).toBe(false);
    });

    it("should decode base64 encoded private key", async () => {
      const originalKey =
        "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg\n-----END PRIVATE KEY-----";
      const base64Key = Buffer.from(originalKey).toString("base64");
      const mockPropertiesContent = `GOOGLE_CLOUD_PRIVATE_KEY=${base64Key}`;
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockPropertiesContent);

      const { getGoogleCloudConfig, clearConfigCache } = await import(
        "./serverConfig"
      );
      clearConfigCache();

      const cloudConfig = getGoogleCloudConfig();

      expect(cloudConfig.privateKey).toContain("BEGIN PRIVATE KEY");
    });

    it("should handle non-base64 encoded private key that is not PEM format", async () => {
      const mockPropertiesContent = `GOOGLE_CLOUD_PRIVATE_KEY=some-random-key-value`;
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockPropertiesContent);

      const { getGoogleCloudConfig, clearConfigCache } = await import(
        "./serverConfig"
      );
      clearConfigCache();

      const cloudConfig = getGoogleCloudConfig();

      expect(cloudConfig.privateKey).toBe("some-random-key-value");
    });

    it("should handle invalid base64 that throws error", async () => {
      const mockPropertiesContent = `GOOGLE_CLOUD_PRIVATE_KEY=not-valid-base64!!!@@@`;
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockPropertiesContent);

      const { getGoogleCloudConfig, clearConfigCache } = await import(
        "./serverConfig"
      );
      clearConfigCache();

      const cloudConfig = getGoogleCloudConfig();

      expect(cloudConfig.privateKey).toBe("not-valid-base64!!!@@@");
    });

    it("should return empty strings when config values are missing", async () => {
      const mockPropertiesContent = `SOME_OTHER_KEY=value`;
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockPropertiesContent);

      const { getGoogleCloudConfig, clearConfigCache } = await import(
        "./serverConfig"
      );
      clearConfigCache();

      const cloudConfig = getGoogleCloudConfig();

      expect(cloudConfig.projectId).toBe("");
      expect(cloudConfig.clientEmail).toBe("");
      expect(cloudConfig.privateKey).toBe("");
    });

    it("should replace escaped newlines in private key", async () => {
      const mockPropertiesContent = `GOOGLE_CLOUD_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBg\\n-----END PRIVATE KEY-----`;
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(mockPropertiesContent);

      const { getGoogleCloudConfig, clearConfigCache } = await import(
        "./serverConfig"
      );
      clearConfigCache();

      const cloudConfig = getGoogleCloudConfig();

      expect(cloudConfig.privateKey).toContain("\n");
      expect(cloudConfig.privateKey).not.toContain("\\n");
    });
  });

  describe("clearConfigCache", () => {
    it("should clear the cached configuration", async () => {
      const mockPropertiesContent1 = `KEY=value1`;
      const mockPropertiesContent2 = `KEY=value2`;

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValueOnce(mockPropertiesContent1);
      mockReadFileSync.mockReturnValueOnce(mockPropertiesContent2);

      const { getServerConfig, clearConfigCache } = await import(
        "./serverConfig"
      );
      clearConfigCache();

      const config1 = getServerConfig();
      expect(config1.KEY).toBe("value1");

      clearConfigCache();

      const config2 = getServerConfig();
      expect(config2.KEY).toBe("value2");

      expect(mockReadFileSync).toHaveBeenCalledTimes(2);
    });
  });
});
