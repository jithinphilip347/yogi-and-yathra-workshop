"use client";

/**
 * TEMPORARY VERIFICATION HARNESS — WORKSHOP-DS-07D. Not shipped; deleted after
 * the browser review. Mounts the REAL <MyOrders /> (which renders the real
 * <OrderDetail />) through the REAL orderApi/apiClient path, stubbing only the
 * transport, so both pages can be reviewed without a signed-in user or a live
 * backend. It also replicates the profile shell it actually lives in — the
 * white `.ContentCard` on the `#Profile` surface — because the dark palette this
 * sprint removed only misbehaved against that specific surface.
 */

import React, { useEffect, useState } from "react";
import { store } from "../../../store";
import { setLogin } from "@/features/auth/authSlice";
import apiClient from "@/services/apiClient";
import MyOrders from "@/components/profile/MyOrders";

const learningOrder = {
  reference: "ORD-2026-00041",
  order_id: 41,
  type: "learning",
  status: "completed",
  status_label: "Completed",
  payment_status: "paid",
  total: 2499,
  paid_amount: 2499,
  balance_due: 0,
  currency: "INR",
  created_at: "2026-09-02T09:15:00+00:00",
  checkout_session_id: "cs_learning_41",
  synchronization: { status: "not_applicable", source: null, recorded_at: null },
  learning: {
    title: "200-Hour Hatha Yoga Teacher Training",
    product_type: "course",
    slug: "hatha-200",
    access: { state: "active", label: "Active", expires_at: null, progress: { percentage: 40 } },
  },
  ecommerce: null,
  ecommerce_state: "not_applicable",
};

const shippedMixed = {
  reference: "ORD-2026-00042",
  order_id: 42,
  type: "mixed",
  status: "completed",
  status_label: "Completed",
  payment_status: "paid",
  total: 3298,
  paid_amount: 3298,
  balance_due: 0,
  currency: "INR",
  created_at: "2026-09-10T10:00:00+00:00",
  checkout_session_id: "cs_mixed_42",
  synchronization: { status: "synchronized", source: "live", recorded_at: null },
  learning: {
    title: "Pranayama & Breathwork Intensive",
    product_type: "course",
    slug: "pranayama",
    access: { state: "active", label: "Active", expires_at: "2027-03-10T00:00:00+00:00", progress: { percentage: 65 } },
  },
  ecommerce: {
    order_id: 9001,
    status: "shipped",
    payment_status: "paid",
    total: 999,
    items_count: 2,
    created_at: "2026-09-10T10:05:00+00:00",
    items: [
      { product_id: 77, product_type: "normal", quantity: 2, price: 249.5 },
      { product_id: 92, product_type: "combo", quantity: 1, price: 500 },
    ],
    shipping_address: {
      address: "Maravanthuruthu, Kochukarukathara",
      city: "Kottayam",
      state: "Kerala",
      pincode: "686004",
      country: "India",
    },
    fulfillment: {
      stage: "shipped",
      label: "Shipped",
      is_shipped: true,
      is_delivered: false,
      carrier: "speed&fast",
      tracking_id: "AWB-2451",
      tracking_url: "https://example.com/track?awb=AWB-2451",
      delivered_at: null,
    },
  },
  ecommerce_state: "available",
};

const pendingPhysical = {
  reference: "ORD-2026-00043",
  order_id: 43,
  type: "physical",
  status: "pending",
  status_label: "Payment pending",
  payment_status: "pending",
  total: 1798,
  paid_amount: 0,
  balance_due: 1798,
  currency: "INR",
  created_at: "2026-09-18T16:40:00+00:00",
  checkout_session_id: "cs_physical_43",
  synchronization: { status: "pending", source: "recorded", recorded_at: null },
  learning: null,
  ecommerce: {
    order_id: 2450,
    status: "pending",
    payment_status: "pending",
    total: 1798,
    items_count: 1,
    created_at: "2026-09-18T16:41:00+00:00",
    items: [{ product_id: 12, product_type: "normal", quantity: 1, price: 1798 }],
    shipping_address: null,
    fulfillment: {
      stage: "pending",
      label: "Awaiting confirmation",
      is_shipped: false,
      is_delivered: false,
      carrier: null,
      tracking_id: null,
      tracking_url: null,
      delivered_at: null,
    },
  },
  ecommerce_state: "available",
};

const cancelledPhysical = {
  reference: "ORD-2026-00044",
  order_id: 44,
  type: "physical",
  status: "cancelled",
  status_label: "Cancelled",
  payment_status: "cancelled",
  total: 899,
  paid_amount: 0,
  balance_due: 0,
  currency: "INR",
  created_at: "2026-08-28T11:20:00+00:00",
  checkout_session_id: "cs_physical_44",
  synchronization: { status: "synchronized", source: "recorded", recorded_at: null },
  learning: null,
  ecommerce: {
    order_id: 2448,
    status: "cancelled",
    payment_status: "pending",
    total: 899,
    items_count: 1,
    created_at: "2026-08-28T11:21:00+00:00",
    items: [{ product_id: 5, product_type: "normal", quantity: 1, price: 899 }],
    shipping_address: {
      address: "12 Marine Drive",
      city: "Kochi",
      state: "Kerala",
      pincode: "682031",
      country: "India",
    },
    fulfillment: {
      stage: "cancelled",
      label: "Cancelled",
      is_shipped: false,
      is_delivered: false,
      carrier: null,
      tracking_id: null,
      tracking_url: null,
      delivered_at: null,
    },
  },
  ecommerce_state: "available",
};

const deliveredMixed = {
  reference: "ORD-2026-00045",
  order_id: 45,
  type: "mixed",
  status: "completed",
  status_label: "Completed",
  payment_status: "paid",
  total: 5450,
  paid_amount: 5450,
  balance_due: 0,
  currency: "INR",
  created_at: "2026-08-15T08:00:00+00:00",
  checkout_session_id: "cs_mixed_45",
  synchronization: { status: "synchronized", source: "live", recorded_at: null },
  learning: {
    title: "Live Stream: Ashtanga Foundations",
    product_type: "live_section",
    access: { state: "completed", label: "Completed", expires_at: null, progress: { percentage: 100 } },
  },
  ecommerce: {
    order_id: 2449,
    status: "delivered",
    payment_status: "paid",
    total: 950,
    items_count: 1,
    created_at: "2026-08-15T08:01:00+00:00",
    items: [{ product_id: 23, product_type: "combo", quantity: 1, price: 950 }],
    shipping_address: {
      address: "Flat 3B, Elavoor Kavala",
      city: "Angamaly",
      state: "Kerala",
      pincode: "683576",
      country: "India",
    },
    fulfillment: {
      stage: "delivered",
      label: "Delivered",
      is_shipped: true,
      is_delivered: true,
      carrier: "ecart",
      tracking_id: "AWB-2449",
      tracking_url: "https://example.com/track?awb=AWB-2449",
      delivered_at: "2026-08-19T12:30:00+00:00",
    },
  },
  ecommerce_state: "available",
};

const degradedPhysical = {
  reference: "ORD-2026-00046",
  order_id: 46,
  type: "physical",
  status: "completed",
  status_label: "Completed",
  payment_status: "paid",
  total: 1299,
  paid_amount: 1299,
  balance_due: 0,
  currency: "INR",
  created_at: "2026-09-12T13:00:00+00:00",
  checkout_session_id: "cs_physical_46",
  synchronization: { status: "partially_synchronized", source: "recorded", recorded_at: null },
  learning: null,
  ecommerce: null,
  ecommerce_state: "temporarily_unavailable",
};

const ORDERS = [learningOrder, shippedMixed, pendingPhysical, cancelledPhysical, deliveredMixed, degradedPhysical];

/**
 * Installed at MODULE SCOPE, not in an effect.
 *
 * The app shell (nav, notifications) fires requests before any effect of this
 * page runs. If the stub is not already in place, one of those escapes to the
 * real API carrying the harness token, gets a 401, and the apiClient interceptor
 * logs the session out and redirects to /auth/login — which is exactly what
 * happened the first time this harness ran.
 */
function installReviewTransport() {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  window.__ds07d = {
    requests: [],
    degraded: params.get("degraded") === "1",
    empty: params.get("empty") === "1",
    fail: params.get("fail") === "1",
  };

  store.dispatch({
    type: setLogin.type,
    payload: { user: { id: 42, name: "Review Student" }, token: "review-token" },
  });

  apiClient.defaults.adapter = async (config) => {
    const url = String(config.url || "");
    window.__ds07d.requests.push(url);

    const reply = (data, status = 200) => ({
      data,
      status,
      statusText: status === 200 ? "OK" : "Error",
      headers: {},
      config,
      request: {},
    });

    // The app shell's own widgets must answer too, or they would hit the real API.
    if (url.includes("notifications")) return reply({ success: true, data: [] });

    if (window.__ds07d.fail) {
      const error = new Error("Request failed with status code 500");
      error.response = reply({ message: "Internal server error" }, 500);
      error.isAxiosError = true;
      throw error;
    }

    // Detail endpoint: GET orders/{reference}
    const detailMatch = url.match(/^orders\/(.+)$/);
    if (detailMatch) {
      const reference = decodeURIComponent(detailMatch[1]);
      const found = ORDERS.find((o) => o.reference === reference) || ORDERS[0];
      return reply({ success: true, data: found });
    }

    return reply({
      success: true,
      data: {
        orders: window.__ds07d.empty ? [] : ORDERS,
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: window.__ds07d.empty ? 0 : ORDERS.length,
        },
        ecommerce_sync: window.__ds07d.degraded
          ? { status: "temporarily_unavailable", message: "Physical order details are temporarily unavailable." }
          : { status: "available" },
      },
    });
  };
}

installReviewTransport();

export default function Ds07dOrdersReview() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const autoOpen = new URLSearchParams(window.location.search).get("autoOpen");
    if (!autoOpen) return;

    // Click the real card, exactly as a customer would.
    const timer = setInterval(() => {
      const card = [...document.querySelectorAll(".OrderCard")].find((el) =>
        el.textContent.includes(autoOpen)
      );
      if (card) {
        card.click();
        clearInterval(timer);
      }
    }, 150);

    const stop = setTimeout(() => clearInterval(timer), 6000);
    return () => {
      clearInterval(timer);
      clearTimeout(stop);
    };
  }, []);

  return (
    <div id="Profile" style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="ContentCard">
          <MyOrders />
        </div>
      </div>
    </div>
  );
}
