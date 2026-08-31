"use client";

import React from "react";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useNotificationPreferences";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { FiBell, FiMail, FiCheck, FiAlertCircle } from "react-icons/fi";

const CATEGORIES = [
  {
    key: "live_class",
    label: "Live Classes",
    description: "Reminders for upcoming interactive sessions & workshops",
  },
  {
    key: "daily_class",
    label: "Daily Classes",
    description: "Daily practice reminders & new routine alerts",
  },
  {
    key: "course",
    label: "Courses",
    description: "Course updates, announcements, and newly published lessons",
  },
  {
    key: "payment",
    label: "Payments",
    description: "Invoices, payment receipts, and billing notifications",
  },
];

const NotificationPreferences = () => {
  const { data: preferences = {}, isLoading, isError, refetch } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();
  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    subscribe: subscribePush,
  } = usePushNotifications();

  const handleToggle = (categoryKey, channelKey, currentValue) => {
    const nextValue = !currentValue;
    updateMutation.mutate({
      [categoryKey]: {
        [channelKey]: nextValue,
      },
    });

    // If enabling push and browser permission is default, prompt user to subscribe
    if (channelKey === "push" && nextValue && pushPermission === "default" && isPushSupported) {
      subscribePush();
    }
  };

  if (isLoading) {
    return (
      <div className="PreferencesLoading" style={{ padding: "20px 0", color: "#64748b" }}>
        <p>Loading notification preferences...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="PreferencesError"
        style={{
          padding: "20px",
          background: "#fff1f2",
          borderRadius: "12px",
          color: "#be123c",
          marginBottom: "20px",
        }}
      >
        <p style={{ margin: "0 0 10px 0", fontWeight: "600" }}>
          Unable to load notification preferences.
        </p>
        <button
          onClick={() => refetch()}
          style={{
            padding: "6px 14px",
            background: "#be123c",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="NotificationPreferencesSection" style={{ marginTop: "35px" }}>
      <div className="DashBoardHead" style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: "0 0 6px 0" }}>
          Notification Preferences
        </h3>
        <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
          Manage your push and email notification delivery channels across categories.
        </p>
      </div>

      {isPushSupported && pushPermission === "denied" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#fffbeb",
            border: "1px solid #fef3c7",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#92400e",
          }}
        >
          <FiAlertCircle style={{ fontSize: "18px", flexShrink: 0 }} />
          <span>
            Browser push notifications are blocked in your browser settings. To receive native push alerts, please enable notification permissions in your browser.
          </span>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        {CATEGORIES.map((cat) => {
          const catPrefs = preferences[cat.key] || {};
          const isPushOn = catPrefs.push !== false;
          const isEmailOn = catPrefs.email !== false;

          return (
            <div
              key={cat.key}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                gap: "15px",
              }}
            >
              <div style={{ flex: "1 1 240px" }}>
                <h4
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "#0f172a",
                    margin: "0 0 4px 0",
                  }}
                >
                  {cat.label}
                </h4>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                  {cat.description}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "24px",
                  flexShrink: 0,
                }}
              >
                {/* Push Toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "13px",
                      fontWeight: "500",
                      color: isPushOn ? "#0f172a" : "#94a3b8",
                    }}
                  >
                    <FiBell style={{ fontSize: "14px" }} /> Push
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isPushOn}
                    aria-label={`Toggle push notifications for ${cat.label}`}
                    onClick={() => handleToggle(cat.key, "push", isPushOn)}
                    disabled={updateMutation.isPending}
                    style={{
                      width: "44px",
                      height: "24px",
                      background: isPushOn ? "#22c55e" : "#cbd5e1",
                      borderRadius: "12px",
                      border: "none",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.2s ease",
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "2px",
                        left: isPushOn ? "22px" : "2px",
                        width: "20px",
                        height: "20px",
                        background: "#fff",
                        borderRadius: "50%",
                        transition: "left 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </button>
                </div>

                {/* Email Toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "13px",
                      fontWeight: "500",
                      color: isEmailOn ? "#0f172a" : "#94a3b8",
                    }}
                  >
                    <FiMail style={{ fontSize: "14px" }} /> Email
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isEmailOn}
                    aria-label={`Toggle email notifications for ${cat.label}`}
                    onClick={() => handleToggle(cat.key, "email", isEmailOn)}
                    disabled={updateMutation.isPending}
                    style={{
                      width: "44px",
                      height: "24px",
                      background: isEmailOn ? "#22c55e" : "#cbd5e1",
                      borderRadius: "12px",
                      border: "none",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.2s ease",
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "2px",
                        left: isEmailOn ? "22px" : "2px",
                        width: "20px",
                        height: "20px",
                        background: "#fff",
                        borderRadius: "50%",
                        transition: "left 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationPreferences;
