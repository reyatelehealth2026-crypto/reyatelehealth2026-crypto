import { prisma } from "@/lib/db";
import { json, error } from "@/lib/http";
import { assertTransition, InvalidTransitionError, type PostStatusValue } from "@/lib/posts/state";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return error("Post not found", 404);

  try {
    assertTransition(post.status as PostStatusValue, "CANCELLED");
  } catch (e) {
    if (e instanceof InvalidTransitionError) return error(e.message, 409);
    throw e;
  }

  const updated = await prisma.post.update({
    where: { id },
    data: { status: "CANCELLED", lockedAt: null },
  });
  return json({ post: updated });
}
