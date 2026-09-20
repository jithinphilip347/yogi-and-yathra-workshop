"use client";

import React, { useEffect, useState } from "react";
import {
  FiPackage,
  FiBookOpen,
  FiLayers,
  FiAlertCircle,
  FiArrowRight,
} from "react-icons/fi";
import Link from "next/link";
import orderApi from "@/libs/orderApi";
import { normalizeStudentSummary, formatAmount } from "@/features/commerce/utils/unifiedOrder";
import "@/assets/css/recent-orders.scss";

const TYPE_ICONS = {
  learning: <FiBookOpen />,
  physical: <FiPackage />,
  mixed: <FiLayers />,
};

const TYPE_ICON_CLASS = {
  learning: "is-learning",
  physical: "is-physical",
  mixed: "is-mixed",
};

/**
 * Latest-order preview for the student dashboard.
 *
 * Shows ONLY the single most recent order as a compact card, with a
 * "View All Orders" link to the full My Orders page. The first element
 * of `recentOrders` is the newest by the existing API contract.
 */
const RecentOrders = ({ onViewAll = null }) => {
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

  /* ── Loading state ─────────────────────────────────────────────────────── */
  if (state.loading) {
    return (
      <div className="RecentOrders">
        <div className="RecentOrdersHeader">
          <div className="RecentOrdersHead">
            <h2>Recent Orders</h2>
          </div>
        </div>
        <div className="LatestOrderCard is-loading">
          <span className="OrderSkeleton" />
        </div>
      </div>
    );
  }

  /* ── Error state ───────────────────────────────────────────────────────── */
  if (state.error || !state.summary) {
    return (
      <div className="RecentOrders">
        <div className="RecentOrdersHeader">
          <div className="RecentOrdersHead">
            <h2>Recent Orders</h2>
          </div>
        </div>
        <div className="LatestOrderCard is-empty">
          <span className="OrderPlaceholder">{state.error || "No recent orders."}</span>
        </div>
      </div>
    );
  }

  const { recentOrders, degraded } = state.summary;

  // Show only the most recent *successful* order.
  // An order is successful when its status is completed, payment is paid,
  // or paid amount meets the total.
  const latest = recentOrders.find((order) => {
    if (String(order.status ?? '').toLowerCase() === 'completed') return true;
    if (String(order.paymentStatus ?? '').toLowerCase() === 'paid') return true;
    if (String(order.ecommerce?.payment_status ?? '').toLowerCase() === 'paid') return true;
    const total = Number(order.total ?? 0);
    const paid = Number(order.paidAmount ?? order.paid_amount ?? 0);
    return total > 0 && paid >= total;
  }) || null;

  return (
    <div className="RecentOrders">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="RecentOrdersHeader">
        <div className="RecentOrdersHead">
          <h2>Recent Orders</h2>
        </div>
        {onViewAll && (
          <button type="button" className="ViewAllLink" onClick={onViewAll}>
            View All Orders <FiArrowRight aria-hidden="true" />
          </button>
        )}
      </div>

      {/* ── Degraded notice ────────────────────────────────────────────── */}
      {degraded && (
        <div className="DegradedNotice">
          <FiAlertCircle /> Physical order details are temporarily unavailable.
        </div>
      )}

      {/* ── Latest order card ──────────────────────────────────────────── */}
      {!latest ? (
        <div className="LatestOrderCard is-empty">
          <p className="OrderPlaceholder">
            No orders yet.{" "}
            <Link href="/course">Explore courses</Link> or{" "}
            <Link href="/live-class">join a live class</Link>.
          </p>
        </div>
      ) : (
        <div className="LatestOrderCard">
          <span className={`OrderIcon ${TYPE_ICON_CLASS[latest.type] || "is-physical"}`}>
            {TYPE_ICONS[latest.type] || <FiPackage />}
          </span>

          <div className="OrderContent">
            <span className="OrderTitle">
              {latest.learning?.title ||
                (latest.ecommerce
                  ? `Order #${latest.ecommerce.orderId}`
                  : latest.typeLabel)}
            </span>
            <div className="OrderMeta">
              <span>{latest.statusLabel}</span>
              {latest.fulfillment?.available && latest.fulfillment.label && (
                <>
                  <span className="OrderMetaDot" />
                  <span>{latest.fulfillment.label}</span>
                </>
              )}
              {latest.createdAt && (
                <>
                  <span className="OrderMetaDot" />
                  <span>{formatDate(latest.createdAt)}</span>
                </>
              )}
            </div>
          </div>

          <div className="OrderRight">
            <span className="OrderAmount">
              {formatAmount(latest.total, latest.currency)}
            </span>
            <span
              className={`OrderStatus ${
                latest.status
                  ? `status-${String(latest.status).toLowerCase().replace(/_/g, "-")}`
                  : "status-unknown"
              }`}
            >
              {latest.statusLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Format an ISO date string to "20 Sep 2026".
 */
function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default RecentOrders;
