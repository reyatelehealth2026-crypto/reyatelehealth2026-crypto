/**
 * Post status state machine. Values mirror the Prisma `PostStatus` enum so the
 * string literals are interchangeable with `@prisma/client` enum values.
 * This module is intentionally free of server-only / Prisma imports so it can
 * be unit-tested in isolation.
 */
export const PostStatus = {
  DRAFT: "DRAFT",
  APPROVED: "APPROVED",
  SCHEDULED: "SCHEDULED",
  PUBLISHING: "PUBLISHING",
  PUBLISHED: "PUBLISHED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export type PostStatusValue = (typeof PostStatus)[keyof typeof PostStatus];

/** Allowed transitions keyed by source status. */
const TRANSITIONS: Record<PostStatusValue, PostStatusValue[]> = {
  DRAFT: ["APPROVED", "CANCELLED"],
  APPROVED: ["SCHEDULED", "DRAFT", "CANCELLED"],
  SCHEDULED: ["PUBLISHING", "APPROVED", "CANCELLED"],
  PUBLISHING: ["PUBLISHED", "FAILED", "SCHEDULED"],
  PUBLISHED: [],
  FAILED: ["SCHEDULED", "CANCELLED"],
  CANCELLED: [],
};

export const MAX_PUBLISH_ATTEMPTS = 3;

export function canTransition(
  from: PostStatusValue,
  to: PostStatusValue,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Throws a descriptive error if the transition is not allowed. */
export function assertTransition(
  from: PostStatusValue,
  to: PostStatusValue,
): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: PostStatusValue,
    public readonly to: PostStatusValue,
  ) {
    super(`Invalid post transition: ${from} -> ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export function isTerminal(status: PostStatusValue): boolean {
  return status === PostStatus.PUBLISHED || status === PostStatus.CANCELLED;
}
