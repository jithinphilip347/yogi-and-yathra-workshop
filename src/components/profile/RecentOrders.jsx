"use client";

import React, { useEffect, useState } from "react";
import { FiPackage, FiBookOpen, FiLayers, FiAlertCircle } from "react-icons/fi";
import orderApi from "@/libs/orderApi";
import { normalizeStudentSummary, formatAmount } from "@/features/commerce/utils/unifiedOrder";

const TYPE_ICONS = {
  learning: <FiBookOpen />,
  physical: <FiPackage />,
  mixed: <FiLayers />,
};

/**
 * Recent orders widget for the student dashboard.
 *
 * Reads the unified summary endpoint. If the physical section is degraded the
 * widget still renders the learning purchases and states the degradation —
 * a temporary E-commerce outage must not blank the dashboard.
 */
const RecentOrders = ({ onViewAll = null, limit = 5 }) => {
  const [state, setState] = useState({ loading: true, summary: null, error: null });

  useEffect(() => {
    let cancelled = false;

    orderApi
      .summary()
      .then((response) => {
        if (cancelled) return;
        setState({ loading: false, summary: normalizeStudentSummary(response), error: null });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ loading: false, summary: null, error: "Orders are unavailable right now." });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="RecentOrders" style={{ padding: "20px", color: "#9CA3AF", fontSize: "13px" }}>
        Loading recent orders...
      </div>
    );
  }

  if (state.error || !state.summary) {
    return (
      <div className="RecentOrders" style={{ padding: "20px", color: "#9CA3AF", fontSize: "13px" }}>
        {state.error || "No recent orders."}
      </div>
    );
  }

  const { recentOrders, physical, degraded } = state.summary;

  return (
    <div className="RecentOrders">
      <div className="DashBoardHead">
        <h2>Recent Orders</h2>
        <p>Your latest learning and physical purchases.</p>
      </div>

      {degraded && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "8px",
            background: "rgba(245, 158, 11, 0.12)",
            color: "#F59E0B",
            fontSize: "12px",
            marginBottom: "14px",
          }}
        >
          <FiAlertCircle /> Physical order details are temporarily unavailable.
        </div>
      )}

      {physical.inTransit > 0 && (
        <p style={{ color: "#60A5FA", fontSize: "13px", marginBottom: "12px" }}>
          {physical.inTransit} {physical.inTransit === 1 ? "order" : "orders"} in transit
        </p>
      )}

      {recentOrders.length === 0 ? (
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "8px",
          }}
        >
          <p style={{ color: "#9CA3AF", fontSize: "13px" }}>No orders yet.</p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {recentOrders.slice(0, limit).map((order) => (
            <li
              key={order.reference}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                marginBottom: "8px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <span style={{ color: "#874429", flexShrink: 0, fontSize: "16px" }}>
                {TYPE_ICONS[order.type] || <FiPackage />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", color: "#E5E7EB", fontSize: "13px", fontWeight: 600 }}>
                  {order.learning?.title || (order.ecommerce ? `Order #${order.ecommerce.orderId}` : order.typeLabel)}
                </span>
                <span style={{ display: "block", color: "#9CA3AF", fontSize: "12px", marginTop: "2px" }}>
                  {order.statusLabel}
                  {order.fulfillment?.available && order.fulfillment.label ? ` · ${order.fulfillment.label}` : ""}
                </span>
              </span>
              <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>
                {formatAmount(order.total, order.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          style={{
            marginTop: "12px",
            padding: "8px 18px",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "#E5E7EB",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          View all orders
        </button>
      )}
    </div>
  );
};

export default RecentOrders;
