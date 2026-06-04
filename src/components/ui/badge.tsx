import { cn } from "@/lib/utils";
import type { PostStatusValue } from "@/lib/posts/state";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  SCHEDULED: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  PUBLISHING: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  CANCELLED: "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function StatusBadge({ status }: { status: PostStatusValue | string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}
