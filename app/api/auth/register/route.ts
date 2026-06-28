import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { credentialsSchema } from "@/lib/db/validation";
import { hashPassword } from "@/lib/auth/password";
import { randomToken } from "@/lib/auth/token";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  newSessionValue,
  sessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email or password." },
      { status: 400 },
    );
  }
  const { email, password } = parsed.data;

  // Optional allowlist: set ALLOWED_EMAILS (comma-separated) to close sign-ups to
  // just your people. Unset = anyone can create an account.
  const allow = process.env.ALLOWED_EMAILS;
  if (allow) {
    const list = allow.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!list.includes(email)) {
      return Response.json({ error: "Sign-ups aren't open for that email." }, { status: 403 });
    }
  }

  const db = getDb();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    return Response.json(
      { error: "That email already has an account — sign in instead." },
      { status: 409 },
    );
  }

  const uid = `u_${randomToken(12)}`;
  await db.insert(users).values({ id: uid, email, passwordHash: await hashPassword(password) });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    SESSION_COOKIE,
    await newSessionValue(uid, email),
    sessionCookieOptions(SESSION_TTL_SECONDS),
  );
  return res;
}
