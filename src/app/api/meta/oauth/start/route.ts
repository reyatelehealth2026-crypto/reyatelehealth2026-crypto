import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { buildAuthUrl } from "@/lib/meta/oauth";

export const runtime = "nodejs";

export async function GET() {
  const state = randomBytes(16).toString("hex");
  await prisma.oAuthState.create({ data: { state } });
  return Response.redirect(buildAuthUrl(state), 302);
}
