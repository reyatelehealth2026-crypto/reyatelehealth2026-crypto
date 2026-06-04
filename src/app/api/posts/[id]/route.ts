import { z } from "zod";
import { prisma } from "@/lib/db";
import { json, error } from "@/lib/http";
import { isTerminal, type PostStatusValue } from "@/lib/posts/state";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  caption: z.string().min(1).optional(),
  hashtags: z.array(z.string()).optional(),
  altText: z.string().optional(),
  warnings: z.array(z.string()).optional(),
  linkUrl: z.string().url().nullable().optional(),
  mediaId: z.string().nullable().optional(),
  type: z.enum(["TEXT", "LINK", "PHOTO"]).optional(),
});

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { media: true },
  });
  if (!post) return error("Post not found", 404);
  return json({ post });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return error("Post not found", 404);

  // Only editable while not terminal and not in flight.
  if (isTerminal(existing.status as PostStatusValue) || existing.status === "PUBLISHING") {
    return error(`Cannot edit a post in status ${existing.status}`, 409);
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Invalid request body", 400, parsed.error.issues);

  const post = await prisma.post.update({
    where: { id },
    data: parsed.data as never,
    include: { media: true },
  });
  return json({ post });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return error("Post not found", 404);
  await prisma.post.delete({ where: { id } });
  return json({ ok: true });
}
