import { eq } from "drizzle-orm";
import { z } from "zod";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { emailSchema } from "@/lib/db/validation";
import { verifyPassword } from "@/lib/auth/password";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  newSessionValue,
  sessionCookieOptions,
} from "@/lib/auth/session";

// Looser than register on purpose — never reveal the password rules at sign-in;
// a bad credential just returns the generic 401 below.
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1) });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Enter your email and password." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.email, email));
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ error: "Wrong email or password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    SESSION_COOKIE,
    await newSessionValue(user.id, user.email),
    sessionCookieOptions(SESSION_TTL_SECONDS),
  );
  return res;
}
