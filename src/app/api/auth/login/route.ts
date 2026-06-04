import { z } from "zod";
import { verifyAdminCredentials } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { json, error } from "@/lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Invalid request body", 400);

  const ok = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
  if (!ok) return error("Invalid email or password", 401);

  const token = await createSessionToken({ email: parsed.data.email });
  await setSessionCookie(token);
  return json({ ok: true });
}
