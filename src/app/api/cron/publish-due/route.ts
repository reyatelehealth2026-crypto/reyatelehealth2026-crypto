import { env } from "@/lib/env";
import { constantTimeEqual } from "@/lib/crypto/token-cipher";
import { publishDuePosts } from "@/lib/publishing/publish-due";
import { json, error } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;
  if (!constantTimeEqual(auth, expected)) {
    return error("Unauthorized", 401);
  }

  const summary = await publishDuePosts();
  return json(summary);
}
