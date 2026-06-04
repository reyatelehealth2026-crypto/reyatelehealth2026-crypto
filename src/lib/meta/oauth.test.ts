import { describe, it, expect } from "vitest";
import { buildAuthUrl, META_SCOPES } from "./oauth";

describe("buildAuthUrl", () => {
  it("includes app id, redirect uri, state, and scopes", () => {
    const url = new URL(buildAuthUrl("xyz-state"));
    expect(url.origin + url.pathname).toContain("facebook.com");
    expect(url.searchParams.get("client_id")).toBe("test-app-id");
    expect(url.searchParams.get("state")).toBe("xyz-state");
    expect(url.searchParams.get("scope")).toBe(META_SCOPES.join(","));
    expect(url.searchParams.get("response_type")).toBe("code");
  });
});
