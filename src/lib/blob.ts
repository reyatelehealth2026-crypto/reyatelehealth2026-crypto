import "server-only";
import { put } from "@vercel/blob";
import { env } from "@/lib/env";

export interface UploadedBlob {
  url: string;
  pathname: string;
}

/** Uploads an image file to Vercel Blob and returns its public URL. */
export async function uploadImage(
  file: File | Blob,
  filename: string,
): Promise<UploadedBlob> {
  const blob = await put(`posts/${Date.now()}-${filename}`, file, {
    access: "public",
    token: env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: true,
  });
  return { url: blob.url, pathname: blob.pathname };
}
