import "server-only";
import { env } from "@/lib/env";
import { graphGet, OAUTH_DIALOG_BASE } from "./graph-client";

export const META_SCOPES = [
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
];

export function buildAuthUrl(state: string): string {
  const url = new URL(OAUTH_DIALOG_BASE);
  url.searchParams.set("client_id", env.META_APP_ID);
  url.searchParams.set("redirect_uri", env.META_REDIRECT_URI);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", META_SCOPES.join(","));
  url.searchParams.set("response_type", "code");
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

/** Exchanges an OAuth code for a short-lived user access token. */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await graphGet<TokenResponse>("oauth/access_token", {
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    redirect_uri: env.META_REDIRECT_URI,
    code,
  });
  return res.access_token;
}

/** Exchanges a short-lived user token for a long-lived one. */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
): Promise<{ token: string; expiresIn?: number }> {
  const res = await graphGet<TokenResponse>("oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    fb_exchange_token: shortLivedToken,
  });
  return { token: res.access_token, expiresIn: res.expires_in };
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

/** Lists the pages the user manages, each with its page access token. */
export async function listManagedPages(
  userToken: string,
): Promise<FacebookPage[]> {
  const res = await graphGet<{ data: FacebookPage[] }>("me/accounts", {
    access_token: userToken,
    fields: "id,name,access_token",
  });
  return res.data ?? [];
}

/** Returns the authenticated user's id. */
export async function getMe(userToken: string): Promise<{ id: string }> {
  return graphGet<{ id: string }>("me", {
    access_token: userToken,
    fields: "id",
  });
}
