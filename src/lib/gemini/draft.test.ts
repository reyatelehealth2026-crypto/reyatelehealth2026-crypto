import { describe, it, expect, vi, beforeEach } from "vitest";

const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));

vi.mock("./client", () => ({
  genai: { models: { generateContent } },
  GEMINI_MODEL: "gemini-2.5-flash",
}));

import { generateDraft } from "./draft";
import { DraftError } from "./schema";

const validJson = JSON.stringify({
  caption: "แคปชันทดสอบ",
  hashtags: ["สุขภาพ"],
  altText: "ภาพ",
  warnings: [],
  suggestedScheduleTimeIso: "2026-06-05T19:00:00+07:00",
});

describe("generateDraft", () => {
  beforeEach(() => generateContent.mockReset());

  it("returns a validated draft from the model response", async () => {
    generateContent.mockResolvedValue({
      text: validJson,
      candidates: [{ finishReason: "STOP" }],
    });

    const { draft, model } = await generateDraft({ topic: "โปรโมชั่นวิตามิน" });
    expect(draft.caption).toBe("แคปชันทดสอบ");
    expect(model).toBe("gemini-2.5-flash");
    expect(generateContent).toHaveBeenCalledOnce();
  });

  it("throws DraftError when the model is blocked (finishReason != STOP)", async () => {
    generateContent.mockResolvedValue({
      text: "",
      candidates: [{ finishReason: "SAFETY" }],
    });
    await expect(generateDraft({ topic: "x" })).rejects.toThrow(DraftError);
  });

  it("throws DraftError on unparseable output", async () => {
    generateContent.mockResolvedValue({
      text: "not json",
      candidates: [{ finishReason: "STOP" }],
    });
    await expect(generateDraft({ topic: "x" })).rejects.toThrow(DraftError);
  });
});
