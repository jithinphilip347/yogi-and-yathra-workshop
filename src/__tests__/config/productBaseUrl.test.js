import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { configuredBaseUrl, joinUrl, normalizeBaseUrl } from "@/utils/url";
import {
  API_BASE_URL,
  PRODUCT_API_BASE_URL,
  PRODUCT_MEDIA_BASE_URL,
} from "@/utils/constants";
import { resolveProductMediaUrl } from "@/utils/mediaUrl";

/**
 * Sprint — Product API Base URL & Product Media Base URL configuration.
 *
 * The product API base and the product media base are two independent,
 * environment-driven values. These tests pin the canonical defaults, the URL
 * normalization and the proof that the two bases can point at different hosts.
 */

const ENV_KEYS = [
  "NEXT_PUBLIC_PRODUCT_API_BASE_URL",
  "NEXT_PUBLIC_PRODUCT_MEDIA_BASE_URL",
  "NEXT_PUBLIC_ECOMMERCE_MEDIA_URL",
];

describe("URL helpers", () => {
  describe("normalizeBaseUrl", () => {
    it("trims and drops trailing slashes", () => {
      expect(normalizeBaseUrl("https://api.example.com/")).toBe("https://api.example.com");
      expect(normalizeBaseUrl("https://api.example.com///")).toBe("https://api.example.com");
      expect(normalizeBaseUrl("  https://api.example.com  ")).toBe("https://api.example.com");
    });

    it("returns an empty string for missing values instead of 'undefined'", () => {
      expect(normalizeBaseUrl(undefined)).toBe("");
      expect(normalizeBaseUrl(null)).toBe("");
      expect(normalizeBaseUrl("")).toBe("");
      expect(normalizeBaseUrl("   ")).toBe("");
    });

    it("keeps root-relative bases intact", () => {
      expect(normalizeBaseUrl("/api/v1/ecommerce/")).toBe("/api/v1/ecommerce");
    });
  });

  describe("joinUrl", () => {
    it("produces exactly one slash however the two sides are spelled", () => {
      expect(joinUrl("https://api.example.com", "products/10")).toBe(
        "https://api.example.com/products/10"
      );
      expect(joinUrl("https://api.example.com/", "products/10")).toBe(
        "https://api.example.com/products/10"
      );
      expect(joinUrl("https://api.example.com", "/products/10")).toBe(
        "https://api.example.com/products/10"
      );
      expect(joinUrl("https://api.example.com/", "/products/10")).toBe(
        "https://api.example.com/products/10"
      );
      expect(joinUrl("https://api.example.com/", "///products/10")).toBe(
        "https://api.example.com/products/10"
      );
    });

    it("never emits a double slash after a non-protocol base", () => {
      const base = "https://admin.varixialabs.com/workshopapi/public/api/v1/ecommerce/";
      expect(joinUrl(base, "products-list")).toBe(
        "https://admin.varixialabs.com/workshopapi/public/api/v1/ecommerce/products-list"
      );
    });

    it("returns the base unchanged when there is no path", () => {
      expect(joinUrl("https://api.example.com/", "")).toBe("https://api.example.com");
      expect(joinUrl("https://api.example.com/", null)).toBe("https://api.example.com");
      expect(joinUrl("https://api.example.com/", undefined)).toBe("https://api.example.com");
    });

    it("degrades to the path rather than a malformed URL when the base is missing", () => {
      expect(joinUrl("", "products/10")).toBe("products/10");
      expect(joinUrl(undefined, "products/10")).toBe("products/10");
    });
  });

  describe("configuredBaseUrl", () => {
    let warn;

    beforeEach(() => {
      warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      warn.mockRestore();
    });

    it("returns the configured value normalized when it is valid", () => {
      expect(configuredBaseUrl("https://api.example.test/api/", "https://fallback")).toBe(
        "https://api.example.test/api"
      );
      expect(configuredBaseUrl("/proxy/api", "https://fallback")).toBe("/proxy/api");
      expect(warn).not.toHaveBeenCalled();
    });

    it("falls back to the documented default when nothing is configured", () => {
      expect(configuredBaseUrl(undefined, "https://fallback/")).toBe("https://fallback");
      expect(configuredBaseUrl("", "https://fallback/")).toBe("https://fallback");
      expect(configuredBaseUrl("   ", "https://fallback/")).toBe("https://fallback");
      expect(warn).not.toHaveBeenCalled();
    });

    it("rejects malformed values instead of building 'undefined/...' URLs", () => {
      for (const bad of ["undefined", "null", "products", "ftp://cdn.example.com"]) {
        expect(configuredBaseUrl(bad, "https://fallback")).toBe("https://fallback");
      }
      expect(warn).toHaveBeenCalledTimes(4);
    });
  });
});

describe("Product configuration constants", () => {
  it("keeps the Workshop proxy default for the product API base", () => {
    expect(PRODUCT_API_BASE_URL).toBe(`${API_BASE_URL}ecommerce/`);
    expect(PRODUCT_API_BASE_URL).toContain("/api/v1/ecommerce/");
  });

  it("never exposes the E-commerce host or an internal endpoint as the product API base", () => {
    expect(PRODUCT_API_BASE_URL).not.toMatch(/yogiandyathra/);
    expect(PRODUCT_API_BASE_URL).not.toMatch(/\/internal\//);
  });

  it("keeps a single trailing slash and no double slash inside the base", () => {
    expect(PRODUCT_API_BASE_URL.endsWith("/")).toBe(true);
    expect(PRODUCT_API_BASE_URL).not.toMatch(/\/\/$/);

    // Ignore the protocol's own `//` and assert the path carries no doubles.
    const path = PRODUCT_API_BASE_URL.replace(/^https?:\/\//i, "");
    expect(path).not.toContain("//");
  });

  it("exposes the product media base without trailing slashes", () => {
    expect(PRODUCT_MEDIA_BASE_URL).toBe("https://api.yogiandyathra.com/public");
    expect(PRODUCT_MEDIA_BASE_URL.endsWith("/")).toBe(false);
  });

  it("keeps the two bases as independent values", () => {
    expect(PRODUCT_API_BASE_URL).not.toBe(PRODUCT_MEDIA_BASE_URL);
    // The media base must never be derived from the API base.
    expect(PRODUCT_MEDIA_BASE_URL.startsWith(PRODUCT_API_BASE_URL)).toBe(false);
  });
});

describe("Product media resolution", () => {
  it("resolves a relative product image against the media base", () => {
    expect(resolveProductMediaUrl("products/mat-10.webp")).toBe(
      `${PRODUCT_MEDIA_BASE_URL}/products/mat-10.webp`
    );
    expect(resolveProductMediaUrl("/products/mat-10.webp")).toBe(
      `${PRODUCT_MEDIA_BASE_URL}/products/mat-10.webp`
    );
  });

  it("never double-prefixes an already absolute media URL", () => {
    const absolute = "https://cdn.example.com/products/mat-10.webp";
    expect(resolveProductMediaUrl(absolute)).toBe(absolute);
    expect(resolveProductMediaUrl(absolute)).not.toContain(PRODUCT_MEDIA_BASE_URL);
  });

  it("preserves the existing fallback behaviour for missing media", () => {
    expect(resolveProductMediaUrl(null)).toBe("");
    expect(resolveProductMediaUrl(undefined)).toBe("");
    expect(resolveProductMediaUrl("")).toBe("");
    expect(resolveProductMediaUrl(null, "/images/placeholder.webp")).toBe(
      "/images/placeholder.webp"
    );
  });
});

describe("Environment-driven configuration (independent hosts)", () => {
  const original = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) original[key] = process.env[key];
    vi.resetModules();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
    vi.resetModules();
  });

  it("resolves API and media from DIFFERENT hosts without deriving one from the other", async () => {
    process.env.NEXT_PUBLIC_PRODUCT_API_BASE_URL = "https://api.example.test/api/v1/ecommerce";
    process.env.NEXT_PUBLIC_PRODUCT_MEDIA_BASE_URL = "https://media.example.test";

    const constants = await import("@/utils/constants");

    expect(constants.PRODUCT_API_BASE_URL).toBe("https://api.example.test/api/v1/ecommerce/");
    expect(constants.PRODUCT_MEDIA_BASE_URL).toBe("https://media.example.test");

    const { resolveProductMediaUrl: resolve } = await import("@/utils/mediaUrl");
    // Product image must come from the media host, never from the API host.
    expect(resolve("products/mat-10.webp")).toBe("https://media.example.test/products/mat-10.webp");
    expect(resolve("products/mat-10.webp")).not.toContain("api.example.test");
  });

  it("normalizes a configured API base that is supplied with trailing slashes", async () => {
    process.env.NEXT_PUBLIC_PRODUCT_API_BASE_URL = "https://api.example.test/api/v1/ecommerce///";

    const constants = await import("@/utils/constants");
    expect(constants.PRODUCT_API_BASE_URL).toBe("https://api.example.test/api/v1/ecommerce/");
  });

  it("honours the deprecated NEXT_PUBLIC_ECOMMERCE_MEDIA_URL alias", async () => {
    process.env.NEXT_PUBLIC_PRODUCT_MEDIA_BASE_URL = "";
    process.env.NEXT_PUBLIC_ECOMMERCE_MEDIA_URL = "https://legacy-media.example.test";

    const constants = await import("@/utils/constants");
    expect(constants.PRODUCT_MEDIA_BASE_URL).toBe("https://legacy-media.example.test");
  });

  it("prefers the canonical media variable over the deprecated alias", async () => {
    process.env.NEXT_PUBLIC_PRODUCT_MEDIA_BASE_URL = "https://media.example.test";
    process.env.NEXT_PUBLIC_ECOMMERCE_MEDIA_URL = "https://legacy-media.example.test";

    const constants = await import("@/utils/constants");
    expect(constants.PRODUCT_MEDIA_BASE_URL).toBe("https://media.example.test");
  });

  it("falls back to the defaults when configuration is invalid rather than emitting undefined URLs", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    process.env.NEXT_PUBLIC_PRODUCT_API_BASE_URL = "undefined";
    process.env.NEXT_PUBLIC_PRODUCT_MEDIA_BASE_URL = "not a url";

    const constants = await import("@/utils/constants");

    expect(constants.PRODUCT_API_BASE_URL).toContain("/api/v1/ecommerce/");
    expect(constants.PRODUCT_API_BASE_URL).not.toContain("undefined");
    expect(constants.PRODUCT_MEDIA_BASE_URL).toBe("https://api.yogiandyathra.com/public");
    expect(constants.PRODUCT_MEDIA_BASE_URL).not.toContain("undefined");
    warn.mockRestore();
  });
});
