import { prisma } from "@/lib/db";
import { encryptToken } from "@/lib/crypto/token-cipher";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getMe,
} from "@/lib/meta/oauth";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

function redirectTo(req: Request, path: string) {
  return Response.redirect(new URL(path, req.url), 302);
}

export async function GET(req: Request) {
  // This route is excluded from the session middleware (Facebook redirects here),
  // so enforce the admin session explicitly.
  const session = await getSession();
  if (!session) return redirectTo(req, "/login");

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return redirectTo(req, "/settings/facebook?error=missing_params");
  }

  // Validate + consume the CSRF state.
  const stored = await prisma.oAuthState.findUnique({ where: { state } });
  if (!stored) return redirectTo(req, "/settings/facebook?error=invalid_state");
  await prisma.oAuthState.delete({ where: { state } });

  try {
    const shortToken = await exchangeCodeForToken(code);
    const { token: longToken, expiresIn } =
      await exchangeForLongLivedToken(shortToken);
    const me = await getMe(longToken);

    await prisma.facebookConnection.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        fbUserId: me.id,
        userTokenCipher: encryptToken(longToken),
        tokenExpiresAt: expiresIn
          ? new Date(Date.now() + expiresIn * 1000)
          : null,
      },
      update: {
        fbUserId: me.id,
        userTokenCipher: encryptToken(longToken),
        tokenExpiresAt: expiresIn
          ? new Date(Date.now() + expiresIn * 1000)
          : null,
      },
    });

    return redirectTo(req, "/settings/facebook?connected=1");
  } catch (e) {
    const message = e instanceof Error ? e.message : "oauth_failed";
    return redirectTo(
      req,
      `/settings/facebook?error=${encodeURIComponent(message)}`,
    );
  }
}
