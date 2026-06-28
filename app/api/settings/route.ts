import { getSessionUser } from "@/lib/auth/session";
import { getServerSettings, saveServerSettings } from "@/lib/repo/pgRepo";
import { settingsSchema } from "@/lib/db/validation";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Not signed in." }, { status: 401 });
  return Response.json({ settings: await getServerSettings(user.uid) });
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Not signed in." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid settings." }, { status: 400 });
  }

  await saveServerSettings(user.uid, parsed.data);
  return Response.json({ ok: true });
}
