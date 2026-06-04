import "server-only";
import { graphPost } from "./graph-client";

export interface PublishInput {
  pageId: string;
  pageAccessToken: string;
  message: string;
  linkUrl?: string;
  imageUrl?: string;
}

export interface PublishResult {
  /** The Facebook post id (composed as pageId_postId for feed posts). */
  fbPostId: string;
}

/**
 * Publishes a post to a Facebook Page.
 * - Photo: POST /{pageId}/photos with a public image URL + caption.
 * - Text/link: POST /{pageId}/feed with message (+ link).
 */
export async function publishToPage(input: PublishInput): Promise<PublishResult> {
  if (input.imageUrl) {
    const res = await graphPost<{ id: string; post_id?: string }>(
      `${input.pageId}/photos`,
      {
        url: input.imageUrl,
        caption: input.message,
        access_token: input.pageAccessToken,
      },
    );
    return { fbPostId: res.post_id ?? res.id };
  }

  const params: Record<string, string> = {
    message: input.message,
    access_token: input.pageAccessToken,
  };
  if (input.linkUrl) params.link = input.linkUrl;

  const res = await graphPost<{ id: string }>(`${input.pageId}/feed`, params);
  return { fbPostId: res.id };
}
