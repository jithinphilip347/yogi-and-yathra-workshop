import { describe, it, expect, vi } from "vitest";
import { urlBase64ToUint8Array, isWebPushSupported, getPushPermissionState } from "@/libs/webPush";
import notificationApi from "@/libs/notificationApi";

describe("Web Push Infrastructure", () => {
  it("converts urlBase64 VAPID public key to Uint8Array", () => {
    // Valid standard test VAPID base64 key
    const vapidPublicKey = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
    const uint8Array = urlBase64ToUint8Array(vapidPublicKey);

    expect(uint8Array).toBeInstanceOf(Uint8Array);
    expect(uint8Array.length).toBeGreaterThan(0);
  });

  it("throws on empty base64 string", () => {
    expect(() => urlBase64ToUint8Array("")).toThrow("Base64 string is required");
  });

  it("exposes push API client methods", () => {
    expect(typeof notificationApi.getPushPublicKey).toBe("function");
    expect(typeof notificationApi.subscribePush).toBe("function");
    expect(typeof notificationApi.unsubscribePush).toBe("function");
    expect(typeof notificationApi.registerDevice).toBe("function");
    expect(typeof notificationApi.deleteDevice).toBe("function");
  });
});
