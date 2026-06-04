import { z } from "zod";
import { prisma } from "@/lib/db";
import { decryptToken, encryptToken } from "@/lib/crypto/token-cipher";
import { listManagedPages } from "@/lib/meta/oauth";
import { json, error } from "@/lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({ pageId: z.string().min(1) });

/** GET lists the pages the connected user can manage (id + name only). */
export async function GET() {
  const conn = await prisma.facebookConnection.findUnique({
    where: { id: "default" },
  });
  if (!conn?.userTokenCipher) return error("Not connected to Facebook", 409);

  const userToken = decryptToken(conn.userTokenCipher);
  const pages = await listManagedPages(userToken);
  return json({ pages: pages.map((p) => ({ id: p.id, name: p.name })) });
}

/** POST persists the selected Page and its encrypted page access token. */
export async function POST(req: Request) {
  const conn = await prisma.facebookConnection.findUnique({
    where: { id: "default" },
  });
  if (!conn?.userTokenCipher) return error("Not connected to Facebook", 409);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("pageId is required", 400);

  const userToken = decryptToken(conn.userTokenCipher);
  const pages = await listManagedPages(userToken);
  const page = pages.find((p) => p.id === parsed.data.pageId);
  if (!page) return error("Page not found among managed pages", 404);

  await prisma.facebookConnection.update({
    where: { id: "default" },
    data: {
      pageId: page.id,
      pageName: page.name,
      pageTokenCipher: encryptToken(page.access_token),
    },
  });
  return json({ ok: true, page: { id: page.id, name: page.name } });
}
