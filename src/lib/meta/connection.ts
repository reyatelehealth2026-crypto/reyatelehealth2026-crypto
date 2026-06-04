import "server-only";
import { prisma } from "@/lib/db";
import { decryptToken } from "@/lib/crypto/token-cipher";

export interface ActiveConnection {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
}

/** Loads the connected Page and decrypts its access token, or null if none. */
export async function getActiveConnection(): Promise<ActiveConnection | null> {
  const conn = await prisma.facebookConnection.findUnique({
    where: { id: "default" },
  });
  if (!conn?.pageId || !conn.pageTokenCipher) return null;
  return {
    pageId: conn.pageId,
    pageName: conn.pageName ?? conn.pageId,
    pageAccessToken: decryptToken(conn.pageTokenCipher),
  };
}
