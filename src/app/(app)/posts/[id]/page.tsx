import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { PostActions } from "@/components/post-actions";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { media: true },
  });
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">รายละเอียดโพสต์</h1>
        <StatusBadge status={post.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>เนื้อหา</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="whitespace-pre-wrap text-sm">{post.caption}</p>
          {post.hashtags.length > 0 && (
            <p className="text-sm text-primary">
              {post.hashtags.map((h) => `#${h}`).join(" ")}
            </p>
          )}
          {post.linkUrl && (
            <a href={post.linkUrl} className="text-sm underline" target="_blank" rel="noreferrer">
              {post.linkUrl}
            </a>
          )}
          {post.media && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.media.blobUrl}
              alt={post.altText ?? ""}
              className="max-h-64 rounded-md border"
            />
          )}
          {post.fbPostId && (
            <p className="text-sm text-green-700 dark:text-green-400">
              Facebook post id: <code>{post.fbPostId}</code>
            </p>
          )}
          {post.failedReason && (
            <p className="text-sm text-destructive">
              ข้อผิดพลาด: {post.failedReason} (พยายาม {post.retryCount} ครั้ง)
            </p>
          )}
        </CardContent>
      </Card>

      <PostActions
        id={post.id}
        status={post.status}
        suggestedAt={post.suggestedAt?.toISOString() ?? null}
        scheduledAt={post.scheduledAt?.toISOString() ?? null}
      />
    </div>
  );
}
