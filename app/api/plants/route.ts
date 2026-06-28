import { getSessionUser } from "@/lib/auth/session";
import { makePgRepo } from "@/lib/repo/pgRepo";
import { plantSchema } from "@/lib/db/validation";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Not signed in." }, { status: 401 });
  return Response.json({ plants: await makePgRepo(user.uid).listPlants() });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Not signed in." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const parsed = plantSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid plant data." }, { status: 400 });
  }

  await makePgRepo(user.uid).savePlant(parsed.data);
  return Response.json({ ok: true });
}
