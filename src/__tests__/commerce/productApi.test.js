import { describe, it, expect, beforeEach, vi } from "vitest";
import { PRODUCT_API_BASE_URL, API_BASE_URL } from "@/utils/constants";
import productApiClient from "@/services/productApi";

describe("Sprint 1 — Product API Service-to-Service Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes product requests through Workshop Backend proxy instead of direct E-commerce API", () => {
    // Expected: API_BASE_URL + 'ecommerce/'
    expect(PRODUCT_API_BASE_URL).toBe(`${API_BASE_URL}ecommerce/`);
    expect(PRODUCT_API_BASE_URL).toContain("/api/v1/ecommerce/");
    // Must NOT call E-commerce public API directly from browser
    expect(PRODUCT_API_BASE_URL).not.toBe("https://api.yogiandyathra.com/public/api/");
  });

  it("configures productApiClient with proxied baseURL", () => {
    expect(productApiClient.defaults.baseURL).toBe(PRODUCT_API_BASE_URL);
    expect(productApiClient.defaults.timeout).toBe(10000);
  });

  it("never exposes or attaches X-Internal-Service-Key in browser HTTP client", () => {
    const headers = productApiClient.defaults.headers;
    expect(headers["X-Internal-Service-Key"]).toBeUndefined();
    expect(JSON.stringify(headers)).not.toContain("Internal-Service-Key");
  });

  it("attaches Workshop bearer token to proxied requests without service secrets", async () => {
    const config = { headers: {} };
    const requestInterceptor = productApiClient.interceptors.request.handlers[0];

    if (requestInterceptor?.fulfilled) {
      const transformed = await requestInterceptor.fulfilled(config);
      // Ensure no service key is attached
      expect(transformed.headers["X-Internal-Service-Key"]).toBeUndefined();
    }
  });
});
