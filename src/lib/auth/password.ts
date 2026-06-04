import "server-only";
import bcrypt from "bcryptjs";
import { env } from "@/lib/env";

/**
 * Verifies admin credentials against the configured ADMIN_EMAIL and
 * bcrypt ADMIN_PASSWORD_HASH. Returns true only when both match.
 */
export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  const emailMatches =
    email.trim().toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
  // Always run bcrypt.compare to avoid leaking which field was wrong via timing.
  const passwordMatches = await bcrypt.compare(
    password,
    env.ADMIN_PASSWORD_HASH,
  );
  return emailMatches && passwordMatches;
}
