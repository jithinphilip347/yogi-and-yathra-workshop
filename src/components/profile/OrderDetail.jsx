"use client";

import React from "react";
import {
  FiArrowLeft,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiBookOpen,
  FiExternalLink,
  FiAlertCircle,
} from "react-icons/fi";
import { formatAmount, accessLabel, isPhysicalOrder, isLearningOrder } from "@/features/commerce/utils/unifiedOrder";

const TONE_COLORS = {
  success: { color: "#10B981", background: "rgba(16, 185, 129, 0.15)" },
  warning: { color: "#F59E0B", background: "rgba(245, 158, 11, 0.15)" },
  danger: { color: "#EF4444", background: "rgba(239, 68, 68, 0.15)" },
  info: { color: "#60A5FA", background: "rgba(96, 165, 250, 0.15)" },
  muted: { color: "#9CA3AF", background: "rgba(156, 163, 175, 0.15)" },
};

const Badge = ({ label, tone = "muted" }) => (
  <span
    style={{
      ...(TONE_COLORS[tone] || TONE_COLORS.muted),
      padding: "5px 12px",
      borderRadius: "999px",
      fontSize: "11px",
      fontWeight: 700,
      letterSpacing: "0.03em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </span>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: "22px" }}>
    <h3
      style={{
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#9CA3AF",
        marginBottom: "10px",
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);

const Row = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "7px 0" }}>
    <span style={{ color: "#9CA3AF", fontSize: "13px" }}>{label}</span>
    <span style={{ color: "#E5E7EB", fontSize: "13px", fontWeight: 600, textAlign: "right" }}>{value}</span>
  </div>
);

/**
 * Unified order detail.
 *
 * Renders the Workshop-owned learning data and the E-commerce-owned physical
 * data side by side for a correlated purchase. Nothing that the authoritative
 * backend did not report is ever displayed.
 */
const OrderDetail = ({ order, onBack, degradedMessage = null }) => {
  if (!order) return null;

  const fulfillment = order.fulfillment;

  return (
    <div className="OrderDetail">
      <button
        type="button"
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "transparent",
          border: "none",
          color: "#9CA3AF",
          cursor: "pointer",
          fontSize: "13px",
          marginBottom: "18px",
          padding: 0,
        }}
      >
        <FiArrowLeft /> Back to orders
      </button>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: 0 }}>
          #{order.reference}
        </h2>
        <Badge label={order.typeLabel} tone="info" />
        <Badge label={order.payment.label} tone={order.payment.tone} />
        {order.synchronization && (
          <Badge label={order.synchronization.label} tone={order.synchronization.tone} />
        )}
      </div>

      <p style={{ color: "#9CA3AF", fontSize: "13px", marginBottom: "22px" }}>
        {order.statusLabel}
        {order.createdAt ? ` · Placed ${new Date(order.createdAt).toLocaleDateString()}` : ""}
        {order.checkoutSessionId ? ` · Session ${order.checkoutSessionId}` : ""}
      </p>

      {degradedMessage && isPhysicalOrder(order) && (
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
            marginBottom: "20px",
          }}
        >
          <FiAlertCircle /> {degradedMessage}
        </div>
      )}

      {/* ─── Learning portion (Workshop authority) ─── */}
      {isLearningOrder(order) && order.learning && (
        <Section title="Learning">
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: "10px",
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <FiBookOpen style={{ color: "#874429", flexShrink: 0 }} />
              <strong style={{ color: "#fff", fontSize: "15px" }}>
                {order.learning.title || "Learning product"}
              </strong>
            </div>
            {accessLabel(order) && <Row label="Access" value={accessLabel(order)} />}
            {order.learning.access?.expires_at && (
              <Row
                label="Expires"
                value={new Date(order.learning.access.expires_at).toLocaleDateString()}
              />
            )}
            {order.learning.access?.progress?.percentage !== undefined && (
              <Row label="Progress" value={`${order.learning.access.progress.percentage}%`} />
            )}
          </div>
        </Section>
      )}

      {/* ─── Physical portion (E-commerce authority) ─── */}
      {isPhysicalOrder(order) && order.ecommerce && (
        <>
          <Section title="Shipment">
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: "10px",
                padding: "16px 18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <FiTruck style={{ color: "#60A5FA", flexShrink: 0 }} />
                <strong style={{ color: "#fff", fontSize: "15px" }}>
                  {fulfillment?.label || "Awaiting store confirmation"}
                </strong>
              </div>

              <Row label="Store order" value={`#${order.ecommerce.orderId}`} />
              {fulfillment?.carrier && <Row label="Carrier" value={fulfillment.carrier} />}
              {fulfillment?.trackingId && <Row label="Tracking no." value={fulfillment.trackingId} />}
              {fulfillment?.deliveredAt && (
                <Row label="Delivered" value={new Date(fulfillment.deliveredAt).toLocaleDateString()} />
              )}

              {fulfillment?.trackingUrl && (
                <a
                  href={fulfillment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "12px",
                    color: "#60A5FA",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  <FiExternalLink /> Track shipment with {fulfillment.carrier || "carrier"}
                </a>
              )}
            </div>
          </Section>

          {order.timeline.length > 0 && (
            <Section title="Progress">
              <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {order.timeline.map((step) => (
                  <li
                    key={step.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "5px 0",
                      color: step.done ? "#E5E7EB" : "#6B7280",
                      fontSize: "13px",
                    }}
                  >
                    <FiCheckCircle style={{ color: step.done ? "#10B981" : "#4B5563", flexShrink: 0 }} />
                    <span>{step.label}</span>
                    {step.done && step.at && (
                      <span style={{ color: "#6B7280", fontSize: "12px" }}>
                        {new Date(step.at).toLocaleDateString()}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {order.ecommerce.items.length > 0 && (
            <Section title="Items">
              {order.ecommerce.items.map((item, index) => (
                <Row
                  key={`${item.product_id}-${index}`}
                  label={`Product #${item.product_id} × ${item.quantity}`}
                  value={formatAmount(item.price * item.quantity, order.currency)}
                />
              ))}
            </Section>
          )}

          {order.ecommerce.shippingAddress && (
            <Section title="Shipping address">
              <div style={{ color: "#E5E7EB", fontSize: "13px", lineHeight: 1.7 }}>
                {[
                  order.ecommerce.shippingAddress.address,
                  order.ecommerce.shippingAddress.city,
                  order.ecommerce.shippingAddress.state,
                  order.ecommerce.shippingAddress.pincode,
                  order.ecommerce.shippingAddress.country,
                ]
                  .filter(Boolean)
                  .map((line) => (
                    <div key={line}>{line}</div>
                  ))}
              </div>
            </Section>
          )}
        </>
      )}

      {/* Physical portion known but not retrievable right now. */}
      {isPhysicalOrder(order) && !order.ecommerce && !degradedMessage && (
        <Section title="Shipment">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#9CA3AF",
              fontSize: "13px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "10px",
              padding: "16px 18px",
            }}
          >
            <FiPackage /> Physical order details are not available right now.
          </div>
        </Section>
      )}

      <Section title="Payment">
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "16px 18px" }}>
          <Row label="Total" value={formatAmount(order.total, order.currency)} />
          <Row label="Paid" value={formatAmount(order.paidAmount, order.currency)} />
          {order.balanceDue > 0 && <Row label="Balance due" value={formatAmount(order.balanceDue, order.currency)} />}
          <Row label="Status" value={order.payment.label} />
          {order.ecommerce && (
            <Row
              label="Store payment"
              value={order.ecommerce.paymentStatus === "paid" ? "Paid" : "Pending"}
            />
          )}
        </div>
      </Section>
    </div>
  );
};

export default OrderDetail;
