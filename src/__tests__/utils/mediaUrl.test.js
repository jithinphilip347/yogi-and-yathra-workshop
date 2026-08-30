/**
 * mediaUrl.test.js
 *
 * Vitest unit tests for the centralized image URL resolver
 * (src/utils/mediaUrl.js). Run with:
 *   npx vitest run src/__tests__/utils/
 */
import { describe, it, expect } from "vitest";
import { resolveMediaUrl, resolveProductMediaUrl } from "../../utils/mediaUrl";
import { MEDIA_BASE_URL } from "../../utils/constants";

// MEDIA_BASE_URL defaults to http://localhost:8001/storage/ when no env var
// is present — the resolver tests assert against that configured base.
const BASE = MEDIA_BASE_URL.replace(/\/+$/, "");

describe("resolveMediaUrl — empty values (Rule 1)", () => {
  it("returns the fallback for null", () => {
    expect(resolveMediaUrl(null)).toBe("");
    expect(resolveMediaUrl(null, "/images/placeholder.webp")).toBe("/images/placeholder.webp");
  });

  it("returns the fallback for undefined", () => {
    expect(resolveMediaUrl(undefined)).toBe("");
  });

  it("returns the fallback for empty string", () => {
    expect(resolveMediaUrl("")).toBe("");
    expect(resolveMediaUrl("   ")).toBe("");
  });

  it("never produces a backend/undefined URL", () => {
    expect(resolveMediaUrl(null)).not.toContain("undefined");
    expect(resolveMediaUrl(undefined)).not.toContain("undefined");
  });
});

describe("resolveMediaUrl — absolute URLs (Rules 2 & 3)", () => {
  it("returns http URLs unchanged", () => {
    expect(resolveMediaUrl("http://example.com/a.jpg")).toBe("http://example.com/a.jpg");
  });

  it("returns https URLs unchanged", () => {
    expect(resolveMediaUrl("https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
  });

  it("does not prefix absolute URLs with the base", () => {
    const result = resolveMediaUrl("https://cdn.example.com/storage/a.jpg");
    expect(result).toBe("https://cdn.example.com/storage/a.jpg");
    expect(result.startsWith(BASE)).toBe(false);
  });
});

describe("resolveMediaUrl — protocol-relative URLs (Rule 4)", () => {
  it("promotes // URLs to https", () => {
    expect(resolveMediaUrl("//cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
  });
});

describe("resolveMediaUrl — relative paths (Rules 5 & 6)", () => {
  it("resolves a leading-slash storage path", () => {
    expect(resolveMediaUrl("/storage/a.jpg")).toBe(`${BASE}/a.jpg`);
  });

  it("resolves a storage path without leading slash", () => {
    expect(resolveMediaUrl("storage/a.jpg")).toBe(`${BASE}/a.jpg`);
  });

  it("resolves an /uploads/ path", () => {
    expect(resolveMediaUrl("/uploads/a.jpg")).toBe(`${BASE}/uploads/a.jpg`);
  });

  it("resolves an uploads path without leading slash", () => {
    expect(resolveMediaUrl("uploads/a.jpg")).toBe(`${BASE}/uploads/a.jpg`);
  });

  it("resolves a plain relative path (legacy DB value)", () => {
    expect(resolveMediaUrl("profile/avatar.png")).toBe(`${BASE}/profile/avatar.png`);
  });

  it("avoids double slashes between base and path", () => {
    expect(resolveMediaUrl("/storage/a.jpg")).toBe(`${BASE}/a.jpg`);
    expect(resolveMediaUrl("storage///a.jpg")).toBe(`${BASE}/a.jpg`);
    expect(resolveMediaUrl("/storage/a.jpg")).not.toContain(`${BASE}//`);
    // Leading "//" is a protocol-relative URL, handled by Rule 4 — never a path.
    expect(resolveMediaUrl("//storage/a.jpg")).toBe("https://storage/a.jpg");
  });
});

describe("resolveMediaUrl — query strings & hashes (Rules 7 & 8)", () => {
  it("preserves query parameters", () => {
    expect(resolveMediaUrl("/storage/a.jpg?width=500")).toBe(`${BASE}/a.jpg?width=500`);
  });

  it("preserves URL fragments", () => {
    expect(resolveMediaUrl("/storage/a.jpg#section-2")).toBe(`${BASE}/a.jpg#section-2`);
  });
});

describe("resolveMediaUrl — blob & data URLs (Rule 10)", () => {
  it("preserves blob URLs untouched", () => {
    const blob = "blob:http://localhost:5173/abc-123";
    expect(resolveMediaUrl(blob)).toBe(blob);
    expect(resolveMediaUrl(blob)).not.toContain(BASE);
  });

  it("preserves data URLs untouched", () => {
    const data = "data:image/png;base64,iVBORw0KGgo=";
    expect(resolveMediaUrl(data)).toBe(data);
  });
});

describe("resolveMediaUrl — media objects", () => {
  it("resolves via url key", () => {
    expect(resolveMediaUrl({ url: "/storage/x.jpg" })).toBe(`${BASE}/x.jpg`);
  });

  it("resolves via thumbnail_url before url", () => {
    expect(
      resolveMediaUrl({
        thumbnail_url: "/storage/thumb.jpg",
        url: "/storage/full.jpg",
      })
    ).toBe(`${BASE}/thumb.jpg`);
  });

  it("resolves via file_path", () => {
    expect(resolveMediaUrl({ file_path: "storage/uploaded.png" })).toBe(`${BASE}/uploaded.png`);
  });

  it("returns fallback when the object has no resolvable key", () => {
    expect(resolveMediaUrl({}, "/fallback.png")).toBe("/fallback.png");
  });
});

describe("resolveMediaUrl — double-resolution safety (Rule 14)", () => {
  it("is idempotent for resolved URLs", () => {
    const once = resolveMediaUrl("/storage/a.jpg");
    expect(resolveMediaUrl(once)).toBe(once);
  });

  it("never produces base/base/... URLs", () => {
    const double = resolveMediaUrl(resolveMediaUrl("/storage/a.jpg"));
    expect(double).toBe(`${BASE}/a.jpg`);
    expect(double.split(BASE)).toHaveLength(2); // exactly one base
  });
});

describe("resolveMediaUrl — fallback handling", () => {
  it("returns a provided fallback when nothing resolves", () => {
    expect(resolveMediaUrl(null, "https://placehold.co/100x70?text=No+Image")).toBe(
      "https://placehold.co/100x70?text=No+Image"
    );
  });
});

describe("resolveProductMediaUrl — separate commerce backend", () => {
  it("resolves relative paths against the product base", () => {
    expect(resolveProductMediaUrl("images/gear.jpg")).toBe(
      "https://api.yogiandyathra.com/public/images/gear.jpg"
    );
  });

  it("passes absolute URLs through", () => {
    expect(resolveProductMediaUrl("https://cdn.example.com/gear.jpg")).toBe(
      "https://cdn.example.com/gear.jpg"
    );
  });
});
