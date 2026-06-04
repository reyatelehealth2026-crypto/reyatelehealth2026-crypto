import { describe, it, expect, vi, beforeEach } from "vitest";
import * as graphClient from "./graph-client";
import { publishToPage } from "./publish";

describe("publishToPage", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("publishes a text/link post to /feed", async () => {
    const spy = vi
      .spyOn(graphClient, "graphPost")
      .mockResolvedValue({ id: "page_123" } as never);

    const result = await publishToPage({
      pageId: "page",
      pageAccessToken: "tok",
      message: "hello",
      linkUrl: "https://example.com",
    });

    expect(result.fbPostId).toBe("page_123");
    expect(spy).toHaveBeenCalledWith("page/feed", {
      message: "hello",
      access_token: "tok",
      link: "https://example.com",
    });
  });

  it("publishes a photo post to /photos using the public image url", async () => {
    const spy = vi
      .spyOn(graphClient, "graphPost")
      .mockResolvedValue({ id: "media_1", post_id: "page_post_1" } as never);

    const result = await publishToPage({
      pageId: "page",
      pageAccessToken: "tok",
      message: "caption",
      imageUrl: "https://blob/img.png",
    });

    expect(result.fbPostId).toBe("page_post_1");
    expect(spy).toHaveBeenCalledWith("page/photos", {
      url: "https://blob/img.png",
      caption: "caption",
      access_token: "tok",
    });
  });
});
