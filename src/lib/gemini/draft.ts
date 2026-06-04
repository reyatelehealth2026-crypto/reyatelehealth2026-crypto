import "server-only";
import { Type } from "@google/genai";
import { genai, GEMINI_MODEL } from "./client";
import { parseDraft, type Draft, DraftError } from "./schema";

export interface DraftInput {
  /** The topic / brief the admin wants a post about (Thai or any language). */
  topic: string;
  /** Optional product or promotion context. */
  context?: string;
  /** Optional tone hint, e.g. "เป็นกันเอง", "ทางการ". */
  tone?: string;
  /** Optional link to include in the post. */
  linkUrl?: string;
}

/** Gemini structured-output response schema (OpenAPI subset via the Type enum). */
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    caption: { type: Type.STRING },
    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
    altText: { type: Type.STRING },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestedScheduleTimeIso: { type: Type.STRING },
    rationale: { type: Type.STRING },
  },
  required: [
    "caption",
    "hashtags",
    "altText",
    "warnings",
    "suggestedScheduleTimeIso",
  ],
  propertyOrdering: [
    "caption",
    "hashtags",
    "altText",
    "warnings",
    "suggestedScheduleTimeIso",
    "rationale",
  ],
};

const SYSTEM_INSTRUCTION = `คุณเป็นนักเขียนคอนเทนต์การตลาดภาษาไทยสำหรับเพจ Facebook ของธุรกิจ
หน้าที่ของคุณคือร่างโพสต์ที่:
- เขียนแคปชัน (caption) เป็นภาษาไทย กระชับ น่าสนใจ เหมาะกับ Facebook Page
- เสนอแฮชแท็ก (hashtags) ที่เกี่ยวข้อง ไม่เกิน 10 รายการ (ไม่ต้องใส่เครื่องหมาย #)
- เขียน alt text สั้น ๆ เป็นภาษาไทยอธิบายภาพประกอบที่แนะนำ
- ระบุคำเตือน (warnings) หากเนื้อหาอาจเข้าข่ายคำกล่าวอ้างทางการแพทย์/สุขภาพ
  หรือขัดนโยบายโฆษณาของ Facebook (ถ้าไม่มีให้เป็น array ว่าง)
- แนะนำเวลาที่ควรโพสต์ (suggestedScheduleTimeIso) เป็น ISO 8601 พร้อม timezone
  offset ของไทย (+07:00) โดยเลือกช่วงเวลาที่มีผู้ใช้งานสูง
ตอบกลับเป็น JSON ตาม schema ที่กำหนดเท่านั้น`;

function buildPrompt(input: DraftInput): string {
  const lines = [`หัวข้อ/บรีฟ: ${input.topic}`];
  if (input.context) lines.push(`บริบทเพิ่มเติม: ${input.context}`);
  if (input.tone) lines.push(`โทนเสียง: ${input.tone}`);
  if (input.linkUrl) lines.push(`ลิงก์ที่ต้องการแนบ: ${input.linkUrl}`);
  lines.push(`เวลาปัจจุบัน (อ้างอิง): ${new Date().toISOString()}`);
  return lines.join("\n");
}

export interface DraftResult {
  draft: Draft;
  model: string;
  raw: unknown;
}

/**
 * Calls Gemini to generate a Thai Facebook post draft using structured output.
 * Throws DraftError when the model is blocked or returns unparseable output.
 */
export async function generateDraft(input: DraftInput): Promise<DraftResult> {
  const response = await genai.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildPrompt(input),
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.7,
    },
  });

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== "STOP") {
    throw new DraftError(`Gemini stopped early (finishReason: ${finishReason})`);
  }

  const draft = parseDraft(response.text);
  return { draft, model: GEMINI_MODEL, raw: response.text };
}
