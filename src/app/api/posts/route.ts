import { z } from "zod";
import { prisma } from "@/lib/db";
import { json, error } from "@/lib/http";

export const runtime = "nodejs";

const createSchema = z.object({
  type: z.enum(["TEXT", "LINK", "PHOTO"]).default("TEXT"),
  caption: z.string().min(1),
  hashtags: z.array(z.string()).default([]),
  altText: z.string().optional(),
  warnings: z.array(z.string()).default([]),
  linkUrl: z.string().url().optional(),
  suggestedAt: z.string().datetime({ offset: true }).optional(),
  mediaId: z.string().optional(),
  geminiModel: z.string().optional(),
  geminiRaw: z.unknown().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const posts = await prisma.post.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    include: { media: true },
    take: 200,
  });
  return json({ posts });
}

export async function POST(req: Request) {
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Invalid request body", 400, parsed.error.issues);

  const d = parsed.data;
  const post = await prisma.post.create({
    data: {
      type: d.type,
      caption: d.caption,
      hashtags: d.hashtags,
      altText: d.altText,
      warnings: d.warnings,
      linkUrl: d.linkUrl,
      suggestedAt: d.suggestedAt ? new Date(d.suggestedAt) : undefined,
      mediaId: d.mediaId,
      geminiModel: d.geminiModel,
      geminiRaw: d.geminiRaw as never,
    },
  });
  return json({ post }, { status: 201 });
}
