import { cookies } from "next/headers";
import { signToken, verifyToken, type SessionPayload } from "./token";

export const SESSION_COOKIE = "pp_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 60; // 60 days

function requireSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET is not set (need a long random string).");
  }
  return s;
}

/** Cookie attributes shared by set + clear. */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Build the signed session value to attach to a response cookie. */
export async function newSessionValue(uid: string, email: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return signToken({ uid, email, exp }, requireSecret());
}

/** Read + verify the current session (returns null if signed out / invalid). */
export async function getSessionUser(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token, requireSecret(), Math.floor(Date.now() / 1000));
}
