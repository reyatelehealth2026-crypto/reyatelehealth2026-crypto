import { describe, it, expect } from "vitest";
import { parseDraft, DraftError } from "./schema";

const validDraft = {
  caption: "ทดสอบแคปชันภาษาไทย",
  hashtags: ["สุขภาพ", "เภสัช"],
  altText: "ภาพสินค้า",
  warnings: [],
  suggestedScheduleTimeIso: "2026-06-05T19:00:00+07:00",
};

describe("parseDraft", () => {
  it("parses valid structured output", () => {
    const draft = parseDraft(JSON.stringify(validDraft));
    expect(draft.caption).toBe("ทดสอบแคปชันภาษาไทย");
    expect(draft.hashtags).toEqual(["สุขภาพ", "เภสัช"]);
  });

  it("applies defaults for optional arrays", () => {
    const draft = parseDraft(
      JSON.stringify({
        caption: "x",
        suggestedScheduleTimeIso: "2026-06-05T19:00:00+07:00",
      }),
    );
    expect(draft.hashtags).toEqual([]);
    expect(draft.warnings).toEqual([]);
  });

  it("throws DraftError on empty input", () => {
    expect(() => parseDraft("")).toThrow(DraftError);
  });

  it("throws DraftError on invalid JSON", () => {
    expect(() => parseDraft("{not json")).toThrow(DraftError);
  });

  it("throws DraftError on schema mismatch (missing caption)", () => {
    expect(() =>
      parseDraft(
        JSON.stringify({ suggestedScheduleTimeIso: "2026-06-05T19:00:00+07:00" }),
      ),
    ).toThrow(DraftError);
  });

  it("throws DraftError when suggested time is not a valid datetime", () => {
    expect(() =>
      parseDraft(JSON.stringify({ ...validDraft, suggestedScheduleTimeIso: "soon" })),
    ).toThrow(DraftError);
  });
});
