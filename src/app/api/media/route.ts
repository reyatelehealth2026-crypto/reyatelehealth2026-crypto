import { prisma } from "@/lib/db";
import { uploadImage } from "@/lib/blob";
import { json, error } from "@/lib/http";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return error("Expected multipart/form-data", 400);

  const file = form.get("file");
  const altText = (form.get("altText") as string) || undefined;

  if (!(file instanceof File)) return error("Missing file", 400);
  if (!ALLOWED.includes(file.type)) {
    return error(`Unsupported image type: ${file.type}`, 415);
  }
  if (file.size > MAX_BYTES) return error("Image exceeds 8MB limit", 413);

  const uploaded = await uploadImage(file, file.name || "image");
  const media = await prisma.media.create({
    data: {
      blobUrl: uploaded.url,
      pathname: uploaded.pathname,
      altText,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  });
  return json({ media }, { status: 201 });
}
