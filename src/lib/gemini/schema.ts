import { z } from "zod";

/**
 * Zod schema for the validated Gemini draft output. Used to re-validate the
 * model's structured JSON at runtime (structured output is reliable but not
 * guaranteed). Kept free of server-only imports for easy unit testing.
 */
export const DraftSchema = z.object({
  caption: z.string().min(1).max(5000),
  hashtags: z.array(z.string()).max(30).default([]),
  altText: z.string().max(1000).default(""),
  warnings: z.array(z.string()).default([]),
  suggestedScheduleTimeIso: z.string().datetime({ offset: true }),
  rationale: z.string().optional(),
});

export type Draft = z.infer<typeof DraftSchema>;

export class DraftError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "DraftError";
  }
}

/**
 * Parses and validates raw text returned by Gemini into a Draft.
 * Throws DraftError with a clear message on malformed JSON or schema mismatch.
 */
export function parseDraft(rawText: string | undefined | null): Draft {
  if (!rawText || rawText.trim() === "") {
    throw new DraftError("Gemini returned an empty response");
  }

  let json: unknown;
  try {
    json = JSON.parse(rawText);
  } catch (err) {
    throw new DraftError("Gemini returned invalid JSON", err);
  }

  const result = DraftSchema.safeParse(json);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new DraftError(`Gemini output did not match the expected schema: ${issues}`);
  }

  return result.data;
}
