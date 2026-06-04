import { describe, it, expect } from "vitest";
import {
  PostStatus,
  canTransition,
  assertTransition,
  isTerminal,
  InvalidTransitionError,
} from "./state";

describe("post state machine", () => {
  it("allows the happy-path lifecycle", () => {
    expect(canTransition(PostStatus.DRAFT, PostStatus.APPROVED)).toBe(true);
    expect(canTransition(PostStatus.APPROVED, PostStatus.SCHEDULED)).toBe(true);
    expect(canTransition(PostStatus.SCHEDULED, PostStatus.PUBLISHING)).toBe(true);
    expect(canTransition(PostStatus.PUBLISHING, PostStatus.PUBLISHED)).toBe(true);
  });

  it("allows publish failure and retry", () => {
    expect(canTransition(PostStatus.PUBLISHING, PostStatus.FAILED)).toBe(true);
    expect(canTransition(PostStatus.FAILED, PostStatus.SCHEDULED)).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransition(PostStatus.DRAFT, PostStatus.PUBLISHED)).toBe(false);
    expect(canTransition(PostStatus.PUBLISHED, PostStatus.DRAFT)).toBe(false);
    expect(canTransition(PostStatus.CANCELLED, PostStatus.SCHEDULED)).toBe(false);
    expect(canTransition(PostStatus.DRAFT, PostStatus.SCHEDULED)).toBe(false);
  });

  it("assertTransition throws on invalid transition", () => {
    expect(() =>
      assertTransition(PostStatus.PUBLISHED, PostStatus.DRAFT),
    ).toThrow(InvalidTransitionError);
  });

  it("identifies terminal states", () => {
    expect(isTerminal(PostStatus.PUBLISHED)).toBe(true);
    expect(isTerminal(PostStatus.CANCELLED)).toBe(true);
    expect(isTerminal(PostStatus.SCHEDULED)).toBe(false);
  });
});
