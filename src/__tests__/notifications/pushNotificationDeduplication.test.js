import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import notificationApi from "@/libs/notificationApi";
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  clearRegistrationCache,
} from "@/libs/webPush";

// Mock the API client
vi.mock("@/libs/notificationApi", () => ({
  default: {
    getPushPublicKey: vi.fn(),
    subscribePush: vi.fn(),
    unsubscribePush: vi.fn(),
    registerDevice: vi.fn(),
    deleteDevice: vi.fn(),
  },
}));

describe("Push Notification Deduplication & Idempotency", () => {
  let mockPushManager;
  let mockRegistration;

  beforeEach(() => {
    vi.clearAllMocks();
    clearRegistrationCache();

    const mockNotification = {
      permission: "granted",
      requestPermission: vi.fn().mockResolvedValue("granted"),
    };
    vi.stubGlobal("Notification", mockNotification);

    // Mock standard push subscription
    const mockSubscription = {
      endpoint: "https://push.example.com/sub/device-12345",
      options: {
        applicationServerKey: new Uint8Array([1, 2, 3, 4]).buffer,
      },
      toJSON: () => ({
        endpoint: "https://push.example.com/sub/device-12345",
        keys: { p256dh: "mock-p256dh", auth: "mock-auth" },
      }),
      unsubscribe: vi.fn().mockResolvedValue(true),
    };

    mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue(mockSubscription),
      subscribe: vi.fn().mockResolvedValue(mockSubscription),
    };

    mockRegistration = {
      pushManager: mockPushManager,
    };

    const mockNavigator = {
      userAgent: "Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36",
      platform: "MacIntel",
      serviceWorker: {
        register: vi.fn().mockResolvedValue(mockRegistration),
        ready: Promise.resolve(mockRegistration),
      },
    };
    vi.stubGlobal("navigator", mockNavigator);

    vi.stubGlobal("window", {
      Notification: mockNotification,
      serviceWorker: mockNavigator.serviceWorker,
      PushManager: {},
    });

    notificationApi.getPushPublicKey.mockResolvedValue({
      data: {
        public_key: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U",
      },
    });

    notificationApi.subscribePush.mockResolvedValue({
      data: { success: true, message: "Device registered" },
    });

    notificationApi.unsubscribePush.mockResolvedValue({
      data: { success: true, message: "Device unregistered" },
    });
  });

  afterEach(() => {
    clearRegistrationCache();
  });

  it("registers device on initial call and hits backend API", async () => {
    const result = await subscribeToPushNotifications({}, 42);

    expect(result.success).toBe(true);
    expect(result.alreadyRegistered).toBeUndefined();
    expect(notificationApi.subscribePush).toHaveBeenCalledTimes(1);
    expect(notificationApi.subscribePush).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "https://push.example.com/sub/device-12345",
        keys: { p256dh: "mock-p256dh", auth: "mock-auth" },
      })
    );
  });

  it("deduplicates concurrent in-flight registration attempts into exactly ONE backend call", async () => {
    // Fire 4 concurrent calls simultaneously (simulating Nav + NotificationPopover + StrictMode mount)
    const [res1, res2, res3, res4] = await Promise.all([
      subscribeToPushNotifications({}, 42),
      subscribeToPushNotifications({}, 42),
      subscribeToPushNotifications({}, 42),
      subscribeToPushNotifications({}, 42),
    ]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    expect(res3.success).toBe(true);
    expect(res4.success).toBe(true);

    // Exactly one backend API request must have been sent
    expect(notificationApi.subscribePush).toHaveBeenCalledTimes(1);
  });

  it("skips redundant API call on subsequent invocation with same user and endpoint", async () => {
    // First registration
    const firstResult = await subscribeToPushNotifications({}, 42);
    expect(firstResult.success).toBe(true);
    expect(notificationApi.subscribePush).toHaveBeenCalledTimes(1);

    // Second registration with identical user ID and subscription endpoint
    const secondResult = await subscribeToPushNotifications({}, 42);
    expect(secondResult.success).toBe(true);
    expect(secondResult.alreadyRegistered).toBe(true);

    // Backend API was NOT called again
    expect(notificationApi.subscribePush).toHaveBeenCalledTimes(1);
  });

  it("allows new registration call if user ID changes (account switch)", async () => {
    // First registration for User 42
    await subscribeToPushNotifications({}, 42);
    expect(notificationApi.subscribePush).toHaveBeenCalledTimes(1);

    // User switches to User 99
    const secondResult = await subscribeToPushNotifications({}, 99);
    expect(secondResult.success).toBe(true);
    expect(secondResult.alreadyRegistered).toBeUndefined();

    // Backend API called a 2nd time for the new user
    expect(notificationApi.subscribePush).toHaveBeenCalledTimes(2);
  });

  it("allows new registration call if subscription endpoint changes", async () => {
    // First registration with endpoint A
    await subscribeToPushNotifications({}, 42);
    expect(notificationApi.subscribePush).toHaveBeenCalledTimes(1);

    // Browser subscription changes to endpoint B
    const newSubscription = {
      endpoint: "https://push.example.com/sub/device-NEW-99999",
      options: { applicationServerKey: new Uint8Array([1, 2, 3, 4]).buffer },
      toJSON: () => ({
        endpoint: "https://push.example.com/sub/device-NEW-99999",
        keys: { p256dh: "new-p256dh", auth: "new-auth" },
      }),
      unsubscribe: vi.fn().mockResolvedValue(true),
    };
    mockPushManager.getSubscription.mockResolvedValue(newSubscription);
    mockPushManager.subscribe.mockResolvedValue(newSubscription);

    // Second registration with new endpoint
    const secondResult = await subscribeToPushNotifications({}, 42);
    expect(secondResult.success).toBe(true);
    expect(secondResult.alreadyRegistered).toBeUndefined();

    // Backend API called a 2nd time for the new endpoint
    expect(notificationApi.subscribePush).toHaveBeenCalledTimes(2);
  });

  it("forces backend update when force=true even if fingerprint matches", async () => {
    await subscribeToPushNotifications({}, 42);
    expect(notificationApi.subscribePush).toHaveBeenCalledTimes(1);

    // Forced registration (e.g. user clicked Enable in UI)
    await subscribeToPushNotifications({}, 42, true);
    expect(notificationApi.subscribePush).toHaveBeenCalledTimes(2);
  });

  it("clears fingerprint cache when unsubscribe is called", async () => {
    await subscribeToPushNotifications({}, 42);
    expect(notificationApi.subscribePush).toHaveBeenCalledTimes(1);

    // Unsubscribe
    await unsubscribeFromPushNotifications();
    expect(notificationApi.unsubscribePush).toHaveBeenCalledTimes(1);

    // Re-subscribing now triggers a new backend registration call
    await subscribeToPushNotifications({}, 42);
    expect(notificationApi.subscribePush).toHaveBeenCalledTimes(2);
  });
});
