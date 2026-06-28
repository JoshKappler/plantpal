// Pure session-token crypto — no Next imports, so it's trivially unit-testable.
// A session token is a tiny signed envelope: base64url(payload).base64url(HMAC).
// This is a hand-rolled mini-JWT (HS256) — enough for a handful of users without
// pulling in a JWT library.

export interface SessionPayload {
  uid: string;
  email: string;
  exp: number; // unix seconds
}

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  return Buffer.from(bytes as Uint8Array).toString("base64url");
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

/** Constant-time string compare to avoid leaking signature bytes via timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signToken(payload: SessionPayload, secret: string): Promise<string> {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = b64url(await hmac(secret, body));
  return `${body}.${sig}`;
}

/** Returns the payload if the signature is valid and not expired, else null. */
export async function verifyToken(
  token: string,
  secret: string,
  nowSec: number,
): Promise<SessionPayload | null> {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = b64url(await hmac(secret, body));
  if (!safeEqual(sig, expected)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    !payload ||
    typeof payload.uid !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.exp !== "number" ||
    payload.exp < nowSec
  ) {
    return null;
  }
  return payload;
}

/** Random URL-safe token (used for user ids). */
export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return b64url(buf);
}
