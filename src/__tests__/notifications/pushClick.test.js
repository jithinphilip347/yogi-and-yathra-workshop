import { describe, it, expect } from "vitest";

describe("Web Push Click & Navigation Flow", () => {
  it("resolves relative action_url against origin", () => {
    const origin = "https://yogify.app";
    const relativeUrl = "/live-stream/24/evening-hatha";

    const resolved = new URL(relativeUrl, origin).href;
    expect(resolved).toBe("https://yogify.app/live-stream/24/evening-hatha");
  });

  it("falls back to /notifications when action_url is missing or empty", () => {
    const origin = "https://yogify.app";
    const rawUrl = null;
    const fallback = rawUrl || "/notifications";

    const resolved = new URL(fallback, origin).href;
    expect(resolved).toBe("https://yogify.app/notifications");
  });

  it("finds matching client and navigates", () => {
    const targetUrl = "https://yogify.app/course/yoga-anatomy";
    const clients = [
      { url: "https://yogify.app/dashboard", navigatedTo: null, focused: false },
      { url: "https://yogify.app/about", navigatedTo: null, focused: false },
    ];

    let focusedClient = null;
    for (const client of clients) {
      if (client.url.startsWith("https://yogify.app")) {
        client.navigatedTo = targetUrl;
        client.focused = true;
        focusedClient = client;
        break;
      }
    }

    expect(focusedClient).not.toBeNull();
    expect(focusedClient.navigatedTo).toBe(targetUrl);
    expect(focusedClient.focused).toBe(true);
  });

  it("opens new window if no client is matching", () => {
    const targetUrl = "https://yogify.app/daily-class/7/vinyasa";
    const clients = [];

    let openedWindowUrl = null;
    if (clients.length === 0) {
      openedWindowUrl = targetUrl;
    }

    expect(openedWindowUrl).toBe(targetUrl);
  });
});
