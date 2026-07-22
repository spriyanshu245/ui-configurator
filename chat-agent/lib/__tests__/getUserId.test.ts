/**
 * @jest-environment node
 */
import { getUserId } from "../getUserId";

function makeJwt(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
}

describe("getUserId", () => {
  it("returns the x-user-id header when present", () => {
    const req = new Request("https://example.test/api/chat", {
      headers: { "x-user-id": "12345" },
    });
    expect(getUserId(req)).toBe("12345");
  });

  it("prefers the x-user-id header over a Bearer JWT", () => {
    const jwt = makeJwt({ preferred_username: "user999" });
    const req = new Request("https://example.test/api/chat", {
      headers: {
        "x-user-id": "header-user",
        authorization: `Bearer ${jwt}`,
      },
    });
    expect(getUserId(req)).toBe("header-user");
  });

  it("decodes the userId (digits only) from a Bearer JWT's preferred_username", () => {
    const jwt = makeJwt({ preferred_username: "user-9988776" });
    const req = new Request("https://example.test/api/chat", {
      headers: { authorization: `Bearer ${jwt}` },
    });
    expect(getUserId(req)).toBe("9988776");
  });

  it('falls back to "anonymous" when no header or JWT is present', () => {
    const req = new Request("https://example.test/api/chat");
    expect(getUserId(req)).toBe("anonymous");
  });

  it('falls back to "anonymous" when the JWT cannot be decoded', () => {
    const req = new Request("https://example.test/api/chat", {
      headers: { authorization: "Bearer not-a-valid-jwt" },
    });
    expect(getUserId(req)).toBe("anonymous");
  });

  it('falls back to "anonymous" when preferred_username has no digits', () => {
    const jwt = makeJwt({ preferred_username: "no-digits-here" });
    const req = new Request("https://example.test/api/chat", {
      headers: { authorization: `Bearer ${jwt}` },
    });
    expect(getUserId(req)).toBe("anonymous");
  });
});
