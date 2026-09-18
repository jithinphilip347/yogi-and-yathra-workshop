"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FiPackage, FiBookOpen, FiLayers, FiChevronRight, FiAlertCircle } from "react-icons/fi";
import orderApi from "@/libs/orderApi";
import {
  normalizeOrderList,
  formatAmount,
  accessLabel,
} from "@/features/commerce/utils/unifiedOrder";
import OrderDetail from "@/components/profile/OrderDetail";

const TYPE_ICONS = {
  learning: <FiBookOpen />,
  physical: <FiPackage />,
  mixed: <FiLayers />,
};

const TYPE_COLORS = {
  learning: "#874429",
  physical: "#60A5FA",
  mixed: "#A78BFA",
};

/**
 * My Orders — Sprint 9 unified order history.
 *
 * One customer-facing list spanning learning purchases (Workshop-owned) and
 * physical purchases (E-commerce-owned), correlated by the server through
 * `checkout_session_id`. The browser only ever talks to the Workshop backend.
 */
const MyOrders = () => {
  const [state, setState] = useState({
    loading: true,
    error: null,
    orders: [],
    pagination: { currentPage: 1, lastPage: 1, total: 0 },
    degradedMessage: null,
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async (targetPage) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await orderApi.list({ page: targetPage, perPage: 10 });
      const normalized = normalizeOrderList(response);

      setState({
        loading: false,
        error: null,
        orders: normalized.orders,
        pagination: normalized.pagination,
        degradedMessage: normalized.degradedMessage,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        // A failed history request is a real error state, never a fake empty list.
        error: "We could not load your orders right now. Please try again.",
      }));
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  const openDetail = async (reference) => {
    setDetailLoading(true);

    try {
      const response = await orderApi.detail(reference);
      setSelected(normalizeOrderList({ orders: [response.data], pagination: {} }).orders[0] || null);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: "We could not load that order right now. Please try again.",
      }));
    } finally {
      setDetailLoading(false);
    }
  };

  if (state.loading && state.orders.length === 0 && !selected) {
    return (
      <div className="MyOrders" style={{ padding: "30px", textAlign: "center", color: "#9CA3AF" }}>
        Loading your orders...
      </div>
    );
  }

  if (state.error && state.orders.length === 0 && !selected) {
    return (
      <div className="MyOrders">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "16px",
            borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.12)",
            color: "#EF4444",
            fontSize: "14px",
            marginBottom: "16px",
          }}
        >
          <FiAlertCircle /> {state.error}
        </div>
        <button
          type="button"
          onClick={() => load(page)}
          style={{
            padding: "8px 18px",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "#E5E7EB",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (selected || detailLoading) {
    return (
      <div className="MyOrders">
        {detailLoading ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#9CA3AF" }}>Loading order...</div>
        ) : (
          <OrderDetail
            order={selected}
            degradedMessage={state.degradedMessage}
            onBack={() => setSelected(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="MyOrders">
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>My Orders</h2>
        <p style={{ color: "#9CA3AF", fontSize: "13px" }}>
          Everything you have purchased — courses, classes and physical products.
        </p>
      </div>

      {state.error && (
        <div style={{ color: "#EF4444", fontSize: "13px", marginBottom: "14px" }}>{state.error}</div>
      )}

      {state.degradedMessage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "rgba(245, 158, 11, 0.12)",
            color: "#F59E0B",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          <FiAlertCircle /> {state.degradedMessage}
        </div>
      )}

      {state.orders.length === 0 ? (
        <div
          style={{
            padding: "30px",
            textAlign: "center",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "8px",
          }}
        >
          <p style={{ color: "#9CA3AF" }}>You have not placed any orders yet.</p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {state.orders.map((order) => {
            const title =
              order.learning?.title ||
              (order.ecommerce ? `Physical order #${order.ecommerce.orderId}` : "Order");

            return (
              <li key={order.reference} style={{ marginBottom: "12px" }}>
                <button
                  type="button"
                  onClick={() => openDetail(order.reference)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    width: "100%",
                    textAlign: "left",
                    padding: "16px 18px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    background: "rgba(255,255,255,0.03)",
                    cursor: "pointer",
                    color: "inherit",
                  }}
                >
                  <span
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "18px",
                      color: TYPE_COLORS[order.type] || "#9CA3AF",
                      background: "rgba(255,255,255,0.05)",
                    }}
                  >
                    {TYPE_ICONS[order.type] || <FiPackage />}
                  </span>

                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        color: "#fff",
                        fontSize: "14px",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {title}
                    </span>
                    <span style={{ display: "block", color: "#9CA3AF", fontSize: "12px", marginTop: "3px" }}>
                      #{order.reference} · {order.statusLabel}
                      {order.createdAt ? ` · ${new Date(order.createdAt).toLocaleDateString()}` : ""}
                    </span>
                    {order.learning && accessLabel(order) && (
                      <span style={{ display: "block", color: "#6B7280", fontSize: "12px", marginTop: "2px" }}>
                        {accessLabel(order)}
                      </span>
                    )}
                    {order.fulfillment?.available && order.fulfillment.label && (
                      <span style={{ display: "block", color: "#6B7280", fontSize: "12px", marginTop: "2px" }}>
                        {order.fulfillment.label}
                        {order.fulfillment.trackingId ? ` · ${order.fulfillment.trackingId}` : ""}
                      </span>
                    )}
                  </span>

                  <span style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ display: "block", color: "#fff", fontSize: "14px", fontWeight: 700 }}>
                      {formatAmount(order.total, order.currency)}
                    </span>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "5px",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: order.payment.tone === "success" ? "#10B981" : "#9CA3AF",
                      }}
                    >
                      {order.payment.label}
                    </span>
                    {order.synchronization && order.synchronization.status === "partially_synchronized" && (
                      <span
                        style={{
                          display: "block",
                          marginTop: "4px",
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "#F59E0B",
                        }}
                      >
                        {order.synchronization.label}
                      </span>
                    )}
                  </span>

                  <FiChevronRight style={{ color: "#6B7280", flexShrink: 0 }} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {state.pagination.lastPage > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            marginTop: "20px",
          }}
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            style={{
              padding: "7px 16px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: page <= 1 ? "#4B5563" : "#E5E7EB",
              cursor: page <= 1 ? "not-allowed" : "pointer",
              fontSize: "13px",
            }}
          >
            Previous
          </button>
          <span style={{ color: "#9CA3AF", fontSize: "13px" }}>
            Page {state.pagination.currentPage} of {state.pagination.lastPage}
          </span>
          <button
            type="button"
            disabled={page >= state.pagination.lastPage}
            onClick={() => setPage((prev) => prev + 1)}
            style={{
              padding: "7px 16px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: page >= state.pagination.lastPage ? "#4B5563" : "#E5E7EB",
              cursor: page >= state.pagination.lastPage ? "not-allowed" : "pointer",
              fontSize: "13px",
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
