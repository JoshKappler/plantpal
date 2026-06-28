import { describe, expect, it } from "vitest";
import { randomToken, signToken, verifyToken, type SessionPayload } from "./token";

const SECRET = "test-secret-please-ignore";
const NOW = 1_700_000_000;
const payload: SessionPayload = { uid: "u_123", email: "a@b.com", exp: NOW + 3600 };

describe("session token", () => {
  it("round-trips a valid token", async () => {
    const token = await signToken(payload, SECRET);
    expect(await verifyToken(token, SECRET, NOW)).toEqual(payload);
  });

  it("rejects an expired token", async () => {
    const token = await signToken({ ...payload, exp: NOW - 1 }, SECRET);
    expect(await verifyToken(token, SECRET, NOW)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signToken(payload, SECRET);
    expect(await verifyToken(token, "other-secret", NOW)).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const token = await signToken(payload, SECRET);
    const [, sig] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...payload, uid: "attacker" }),
    ).toString("base64url");
    expect(await verifyToken(`${forged}.${sig}`, SECRET, NOW)).toBeNull();
  });

  it("rejects a tampered signature", async () => {
    const token = await signToken(payload, SECRET);
    expect(await verifyToken(`${token}x`, SECRET, NOW)).toBeNull();
  });

  it("rejects garbage", async () => {
    expect(await verifyToken("not-a-token", SECRET, NOW)).toBeNull();
    expect(await verifyToken("", SECRET, NOW)).toBeNull();
  });

  it("randomToken is unique and url-safe", () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toEqual(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
