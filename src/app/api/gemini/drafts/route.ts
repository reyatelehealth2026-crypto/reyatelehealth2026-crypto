import { z } from "zod";
import { generateDraft } from "@/lib/gemini/draft";
import { DraftError } from "@/lib/gemini/schema";
import { json, error } from "@/lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({
  topic: z.string().min(1),
  context: z.string().optional(),
  tone: z.string().optional(),
  linkUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Invalid request body", 400, parsed.error.issues);

  try {
    const result = await generateDraft(parsed.data);
    return json(result);
  } catch (e) {
    if (e instanceof DraftError) return error(e.message, 422);
    const message = e instanceof Error ? e.message : "Gemini request failed";
    return error(message, 502);
  }
}
