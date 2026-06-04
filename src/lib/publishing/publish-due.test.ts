import { describe, it, expect } from "vitest";
import { buildMessage } from "./publish-due";

describe("buildMessage", () => {
  it("returns the caption alone when there are no hashtags", () => {
    expect(buildMessage("สวัสดี", [])).toBe("สวัสดี");
  });

  it("appends hashtags with a leading #", () => {
    expect(buildMessage("สวัสดี", ["สุขภาพ", "#เภสัช"])).toBe(
      "สวัสดี\n\n#สุขภาพ #เภสัช",
    );
  });
});
