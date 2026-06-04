import "server-only";

export const GRAPH_VERSION = "v21.0";
export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
export const OAUTH_DIALOG_BASE = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;

export interface GraphError {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
}

export class MetaApiError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly subcode?: number,
    public readonly transient = false,
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

// Transient (retryable) Graph API error codes: rate limiting + transient.
const TRANSIENT_CODES = new Set([1, 2, 4, 17, 32, 341, 368]);

function isTransient(code?: number, httpStatus?: number): boolean {
  if (httpStatus && httpStatus >= 500) return true;
  return code !== undefined && TRANSIENT_CODES.has(code);
}

async function parseGraphResponse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as
    | { error?: GraphError }
    | T;
  if (!res.ok || (body as { error?: GraphError }).error) {
    const err = (body as { error?: GraphError }).error;
    const code = err?.code;
    throw new MetaApiError(
      err?.message ?? `Graph API request failed (HTTP ${res.status})`,
      code,
      err?.error_subcode,
      isTransient(code, res.status),
    );
  }
  return body as T;
}

export async function graphGet<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { method: "GET" });
  return parseGraphResponse<T>(res);
}

export async function graphPost<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}/${path}`);
  const body = new URLSearchParams(params);
  const res = await fetch(url, { method: "POST", body });
  return parseGraphResponse<T>(res);
}
