import "server-only";
import { prisma } from "@/lib/db";
import { getActiveConnection } from "@/lib/meta/connection";
import { publishToPage } from "@/lib/meta/publish";
import { MAX_PUBLISH_ATTEMPTS } from "@/lib/posts/state";

const CLAIM_BATCH_SIZE = 10;
const STALE_LOCK_MINUTES = 10;
const RETRY_BACKOFF_MINUTES = 5;

interface ClaimedPost {
  id: string;
}

export interface PublishSummary {
  reaped: number;
  claimed: number;
  published: number;
  failed: number;
}

/**
 * Cron core. Self-healing, idempotent publishing of due scheduled posts.
 * 1. Reaper: reset posts stuck in PUBLISHING beyond the stale-lock window.
 * 2. Atomic claim: flip SCHEDULED -> PUBLISHING via FOR UPDATE SKIP LOCKED so
 *    overlapping cron runs never double-publish.
 * 3. Publish each claimed post; on failure apply retry/backoff or mark FAILED.
 */
export async function publishDuePosts(): Promise<PublishSummary> {
  const summary: PublishSummary = {
    reaped: 0,
    claimed: 0,
    published: 0,
    failed: 0,
  };

  // 1. Reaper — recover crashed runs.
  const reaped = await prisma.$executeRaw`
    UPDATE "Post"
    SET status = CASE
          WHEN "retryCount" >= ${MAX_PUBLISH_ATTEMPTS} THEN 'FAILED'::"PostStatus"
          ELSE 'SCHEDULED'::"PostStatus"
        END,
        "lockedAt" = NULL,
        "updatedAt" = now()
    WHERE status = 'PUBLISHING'
      AND "lockedAt" < now() - (${STALE_LOCK_MINUTES} * INTERVAL '1 minute')
  `;
  summary.reaped = reaped;

  // 2. Atomic claim of due posts.
  const claimed = await prisma.$queryRaw<ClaimedPost[]>`
    UPDATE "Post"
    SET status = 'PUBLISHING'::"PostStatus", "lockedAt" = now(), "updatedAt" = now()
    WHERE id IN (
      SELECT id FROM "Post"
      WHERE status = 'SCHEDULED'::"PostStatus" AND "scheduledAt" <= now()
      ORDER BY "scheduledAt"
      FOR UPDATE SKIP LOCKED
      LIMIT ${CLAIM_BATCH_SIZE}
    )
    RETURNING id
  `;
  summary.claimed = claimed.length;

  if (claimed.length === 0) return summary;

  const connection = await getActiveConnection();

  for (const { id } of claimed) {
    const post = await prisma.post.findUnique({
      where: { id },
      include: { media: true },
    });
    if (!post) continue;

    try {
      if (!connection) {
        throw new Error("No connected Facebook Page");
      }

      const result = await publishToPage({
        pageId: connection.pageId,
        pageAccessToken: connection.pageAccessToken,
        message: buildMessage(post.caption, post.hashtags),
        linkUrl: post.linkUrl ?? undefined,
        imageUrl: post.media?.blobUrl ?? undefined,
      });

      await prisma.post.update({
        where: { id },
        data: {
          status: "PUBLISHED",
          fbPostId: result.fbPostId,
          publishedAt: new Date(),
          lockedAt: null,
          failedReason: null,
        },
      });
      summary.published++;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      const nextRetry = post.retryCount + 1;
      const exhausted = nextRetry >= MAX_PUBLISH_ATTEMPTS;

      await prisma.post.update({
        where: { id },
        data: {
          status: exhausted ? "FAILED" : "SCHEDULED",
          retryCount: nextRetry,
          failedReason: reason,
          lockedAt: null,
          scheduledAt: exhausted
            ? post.scheduledAt
            : new Date(Date.now() + nextRetry * RETRY_BACKOFF_MINUTES * 60_000),
        },
      });
      summary.failed++;
    }
  }

  return summary;
}

/** Combines caption and hashtags into the published message body. */
export function buildMessage(caption: string, hashtags: string[]): string {
  if (hashtags.length === 0) return caption;
  const tags = hashtags
    .map((h) => (h.startsWith("#") ? h : `#${h}`))
    .join(" ");
  return `${caption}\n\n${tags}`;
}
