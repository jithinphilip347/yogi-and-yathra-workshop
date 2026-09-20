"use client";

import React from "react";
import {
  FiArrowLeft,
  FiPackage,
  FiLayers,
  FiTruck,
  FiCheck,
  FiX,
  FiBookOpen,
  FiExternalLink,
  FiAlertCircle,
} from "react-icons/fi";
import ReceiptActions from "@/components/commerce/ReceiptActions";
import {
  formatAmount,
  accessLabel,
  isPhysicalOrder,
  isLearningOrder,
  annotateTimelineSteps,
} from "@/features/commerce/utils/unifiedOrder";
import { receiptStateFromInvoices } from "@/features/commerce/utils/invoiceAvailability";

/**
 * Unified order detail.
 *
 * Renders the Workshop-owned learning data and the E-commerce-owned physical
 * data side by side for a correlated purchase. Nothing that the authoritative
 * backend did not report is ever displayed.
 *
 * WORKSHOP-DS-07D: every section is now a real surface with a heading, label and
 * value rows, a proper status timeline, and item rows — all resolved through the
 * DS-02 tokens in `order-history.scss`. The previous inline dark palette made
 * these sections invisible on the profile's white card. Content, order and copy
 * are unchanged.
 */

/** E-commerce item types, humanised. An unknown value is omitted rather than
    printed raw in front of the customer. */
const ITEM_TYPE_LABELS = {
  normal: "Product",
  product: "Product",
  combo: "Combo",
};

const itemTypeLabel = (type) => ITEM_TYPE_LABELS[String(type || "").toLowerCase()] || null;

/** A bundle reads differently from a single item, so it gets its own glyph. */
const isCombo = (type) => String(type || "").toLowerCase() === "combo";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : null;

const Badge = ({ label, tone = "muted" }) =>
  label ? <span className={`OrderBadge is-${tone}`}>{label}</span> : null;

const Section = ({ title, icon = null, children }) => (
  <section className="OrderSection">
    <h3 className="OrderSectionTitle">
      {icon}
      {title}
    </h3>
    {children}
  </section>
);

const Row = ({ label, value, strong = false }) => (
  <div className="OrderRow">
    <span className="OrderRowLabel">{label}</span>
    <span className={`OrderRowValue${strong ? " is-strong" : ""}`}>{value}</span>
  </div>
);

const OrderDetail = ({ order, onBack, degradedMessage = null }) => {
  if (!order) return null;

  const fulfillment = order.fulfillment;
  const timeline = order.timelineSteps ?? annotateTimelineSteps(order.timeline);
  // Recomputed per order from this order's own documents — never inherited.
  const receipt = receiptStateFromInvoices(order.invoices, { paid: order.isPaid });

  return (
    <div className="OrderDetail">
      <button type="button" className="OrderButton is-ghost OrderDetailBack" onClick={onBack}>
        <FiArrowLeft aria-hidden="true" /> Back to orders
      </button>

      <header className="OrderDetailHead">
        <div className="OrderDetailTitleRow">
          <h2 className="OrderDetailTitle">#{order.reference}</h2>
          <div className="OrderDetailBadges">
            <Badge label={order.typeLabel} tone="muted" />
            <Badge label={order.payment.label} tone={order.payment.tone} />
            {order.synchronization && (
              <Badge label={order.synchronization.label} tone={order.synchronization.tone} />
            )}
          </div>
        </div>

        <p className="OrderDetailMeta">
          {[
            order.statusLabel,
            formatDate(order.createdAt) ? `Placed ${formatDate(order.createdAt)}` : null,
            order.checkoutSessionId ? `Session ${order.checkoutSessionId}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      {degradedMessage && isPhysicalOrder(order) && (
        <div className="OrderAlert is-warning OrderAlert--spaced" role="status">
          <span className="OrderAlertText">
            <FiAlertCircle aria-hidden="true" /> {degradedMessage}
          </span>
        </div>
      )}

      <div className="OrderSectionStack">
        {/* ─── Learning portion (Workshop authority) ─── */}
        {isLearningOrder(order) && order.learning && (
          <Section title="Learning" icon={<FiBookOpen aria-hidden="true" />}>
            <p className="OrderSectionLead">
              <FiBookOpen aria-hidden="true" />
              {order.learning.title || "Learning product"}
            </p>

            <div className="OrderRows">
              {accessLabel(order) && <Row label="Access" value={accessLabel(order)} />}
              {order.learning.access?.expires_at && (
                <Row label="Expires" value={formatDate(order.learning.access.expires_at)} />
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
            <Section title="Shipment" icon={<FiTruck aria-hidden="true" />}>
              <p className="OrderSectionLead">
                <FiTruck aria-hidden="true" />
                {fulfillment?.label || "Awaiting store confirmation"}
              </p>

              <div className="OrderRows">
                <Row label="Store order" value={`#${order.ecommerce.orderId}`} strong />
                {fulfillment?.carrier && <Row label="Carrier" value={fulfillment.carrier} />}
                {fulfillment?.trackingId && <Row label="Tracking no." value={fulfillment.trackingId} />}
                {fulfillment?.deliveredAt && (
                  <Row label="Delivered" value={formatDate(fulfillment.deliveredAt)} />
                )}
              </div>

              {fulfillment?.trackingUrl && (
                <a
                  className="OrderTrackLink"
                  href={fulfillment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FiExternalLink aria-hidden="true" /> Track shipment with {fulfillment.carrier || "carrier"}
                </a>
              )}
            </Section>

            {timeline.length > 0 && (
              <Section title="Progress">
                <ol className="OrderTimeline">
                  {timeline.map((step) => (
                    <li
                      key={step.key}
                      className={`OrderTimelineStep is-${step.state}${step.tone ? ` is-${step.tone}` : ""}`}
                    >
                      <span className="OrderTimelineMarker">
                        {step.tone === "error" ? (
                          <FiX aria-hidden="true" />
                        ) : (
                          step.state === "done" && <FiCheck aria-hidden="true" />
                        )}
                      </span>
                      <span className="OrderTimelineBody">
                        <span className="OrderTimelineLabel">{step.label}</span>
                        {step.done && step.at && (
                          <span className="OrderTimelineDate">{formatDate(step.at)}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {order.ecommerce.items.length > 0 && (
              <Section title="Items" icon={<FiPackage aria-hidden="true" />}>
                <ul className="OrderItems">
                  {order.ecommerce.items.map((item, index) => {
                    const typeLabel = itemTypeLabel(item.product_type);
                    const unit = formatAmount(item.price, order.currency);
                    const combo = isCombo(item.product_type);

                    return (
                      <li className="OrderItem" key={`${item.product_id}-${index}`}>
                        <span className={`OrderItemThumb${combo ? " is-combo" : ""}`}>
                          {combo ? <FiLayers aria-hidden="true" /> : <FiPackage aria-hidden="true" />}
                        </span>
                        <span className="OrderItemBody">
                          <span className="OrderItemName">Product #{item.product_id}</span>
                          <span className="OrderItemMeta">
                            {[`Qty ${item.quantity}`, typeLabel, `${unit} each`].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <span className="OrderItemTotal">
                          {formatAmount(item.price * item.quantity, order.currency)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Section>
            )}

            {order.ecommerce.shippingAddress && (
              <Section title="Shipping address">
                <address className="OrderAddress">
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
                </address>
              </Section>
            )}
          </>
        )}

        {/* Physical portion known but not retrievable right now. */}
        {isPhysicalOrder(order) && !order.ecommerce && !degradedMessage && (
          <Section title="Shipment" icon={<FiPackage aria-hidden="true" />}>
            <p className="OrderSectionLead">
              <FiPackage aria-hidden="true" />
              Physical order details are not available right now.
            </p>
          </Section>
        )}

        {/* The receipt belongs to the payment, so it sits with it — the same
            shared component the billing history uses. */}
        <Section title="Receipt">
          <ReceiptActions receipt={receipt} label={`order ${order.reference}`} />
        </Section>

        <Section title="Payment">
          <div className="OrderRows">
            <Row label="Total" value={formatAmount(order.total, order.currency)} strong />
            <Row label="Paid" value={formatAmount(order.paidAmount, order.currency)} />
            {order.balanceDue > 0 && (
              <Row label="Balance due" value={formatAmount(order.balanceDue, order.currency)} />
            )}
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
    </div>
  );
};

export default OrderDetail;
