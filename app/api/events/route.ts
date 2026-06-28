import { getSessionUser } from "@/lib/auth/session";
import { makePgRepo } from "@/lib/repo/pgRepo";
import { careEventSchema } from "@/lib/db/validation";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Not signed in." }, { status: 401 });
  const plantId = new URL(req.url).searchParams.get("plantId") ?? undefined;
  return Response.json({ events: await makePgRepo(user.uid).listEvents(plantId) });
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
  const parsed = careEventSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid event data." }, { status: 400 });
  }

  await makePgRepo(user.uid).addEvent(parsed.data);
  return Response.json({ ok: true });
}
