import { z } from "zod";
import { prisma } from "@/lib/db";
import { json, error } from "@/lib/http";
import { assertTransition, InvalidTransitionError, type PostStatusValue } from "@/lib/posts/state";
import { getActiveConnection } from "@/lib/meta/connection";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  scheduledAt: z.string().datetime({ offset: true }),
});

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return error("Post not found", 404);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("A valid scheduledAt is required", 400);

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (scheduledAt.getTime() <= Date.now()) {
    return error("scheduledAt must be in the future", 400);
  }

  const connection = await getActiveConnection();
  if (!connection) return error("Connect a Facebook Page before scheduling", 409);

  try {
    assertTransition(post.status as PostStatusValue, "SCHEDULED");
  } catch (e) {
    if (e instanceof InvalidTransitionError) return error(e.message, 409);
    throw e;
  }

  const updated = await prisma.post.update({
    where: { id },
    data: { status: "SCHEDULED", scheduledAt, retryCount: 0, failedReason: null },
  });
  return json({ post: updated });
}
