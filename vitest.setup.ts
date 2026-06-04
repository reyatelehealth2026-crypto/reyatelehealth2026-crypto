// Default test env values for modules that read process.env at import time.
process.env.AUTH_SECRET ||= "test-auth-secret-at-least-32-characters-long!!";
process.env.TOKEN_ENCRYPTION_KEY ||= Buffer.alloc(32, 7).toString("base64");
process.env.ADMIN_EMAIL ||= "admin@example.com";
// bcrypt hash of "password123" (cost 10)
process.env.ADMIN_PASSWORD_HASH ||=
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
process.env.GEMINI_API_KEY ||= "test-gemini-key";
process.env.GEMINI_MODEL ||= "gemini-2.5-flash";
process.env.META_APP_ID ||= "test-app-id";
process.env.META_APP_SECRET ||= "test-app-secret";
process.env.META_REDIRECT_URI ||= "http://localhost:3000/api/meta/oauth/callback";
process.env.CRON_SECRET ||= "test-cron-secret";
process.env.DATABASE_URL ||= "postgresql://localhost:5432/test";
process.env.BLOB_READ_WRITE_TOKEN ||= "test-blob-token";
