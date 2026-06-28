import { getSessionUser } from "@/lib/auth/session";
import { makePgRepo } from "@/lib/repo/pgRepo";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  await makePgRepo(user.uid).deletePlant(id);
  return Response.json({ ok: true });
}
