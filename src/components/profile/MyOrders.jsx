"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FiPackage, FiBookOpen, FiLayers, FiChevronRight, FiAlertCircle, FiInbox } from "react-icons/fi";
import orderApi from "@/libs/orderApi";
import {
  normalizeOrderList,
  formatAmount,
  accessLabel,
} from "@/features/commerce/utils/unifiedOrder";
import OrderDetail from "@/components/profile/OrderDetail";
import "@/assets/css/order-history.scss";

/**
 * My Orders — Sprint 9 unified order history.
 *
 * One customer-facing list spanning learning purchases (Workshop-owned) and
 * physical purchases (E-commerce-owned), correlated by the server through
 * `checkout_session_id`. The browser only ever talks to the Workshop backend.
 *
 * WORKSHOP-DS-07D: presentation moved out of inline styles into
 * `order-history.scss`. Those styles were a dark palette (`#fff` headings,
 * `rgba(255,255,255,0.03)` surfaces, `#9CA3AF`/`#E5E7EB` text) applied inside the
 * profile's WHITE `.ContentCard`, which made the cards, borders and text weights
 * effectively disappear. Behaviour, data flow and copy are unchanged.
 */

const TYPE_ICONS = {
  learning: <FiBookOpen aria-hidden="true" />,
  physical: <FiPackage aria-hidden="true" />,
  mixed: <FiLayers aria-hidden="true" />,
};

const formatPlaced = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null;

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
      <section className="OrderHistory" aria-busy="true">
        <header className="OrderHistoryHead">
          <h2 className="OrderHistoryTitle">My Orders</h2>
          <p className="OrderHistorySub">Loading your orders…</p>
        </header>
        <div className="OrderSkeletonList" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span className="OrderSkeletonRow" key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (state.error && state.orders.length === 0 && !selected) {
    return (
      <section className="OrderHistory">
        <header className="OrderHistoryHead">
          <h2 className="OrderHistoryTitle">My Orders</h2>
        </header>
        <div className="OrderAlert is-error" role="alert">
          <span className="OrderAlertText">
            <FiAlertCircle aria-hidden="true" /> {state.error}
          </span>
          <button type="button" className="OrderButton" onClick={() => load(page)}>
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (selected || detailLoading) {
    return (
      <div className="OrderHistory">
        {detailLoading ? (
          <div className="OrderSkeletonList" aria-busy="true" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span className="OrderSkeletonRow" key={i} />
            ))}
          </div>
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
    <section className="OrderHistory">
      <header className="OrderHistoryHead">
        <h2 className="OrderHistoryTitle">My Orders</h2>
        <p className="OrderHistorySub">
          Everything you have purchased — courses, classes and physical products.
        </p>
      </header>

      {state.degradedMessage && (
        <div className="OrderAlert is-warning OrderAlert--spaced" role="status">
          <span className="OrderAlertText">
            <FiAlertCircle aria-hidden="true" /> {state.degradedMessage}
          </span>
        </div>
      )}

      {state.error && (
        <div className="OrderAlert is-error OrderAlert--spaced" role="alert">
          <span className="OrderAlertText">
            <FiAlertCircle aria-hidden="true" /> {state.error}
          </span>
        </div>
      )}

      {state.orders.length === 0 ? (
        <div className="OrderEmpty">
          <FiInbox aria-hidden="true" />
          <p>You have not placed any orders yet.</p>
        </div>
      ) : (
        <ul className="OrderList">
          {state.orders.map((order) => {
            const title =
              order.learning?.title ||
              (order.ecommerce ? `Physical order #${order.ecommerce.orderId}` : "Order");

            const contextLine = [order.statusLabel, formatPlaced(order.createdAt)]
              .filter(Boolean)
              .join(" · ");

            // Shown whenever the backend gave a label — including when the store
            // is temporarily unavailable, so the card itself carries the reason
            // rather than silently looking like an order with no shipment.
            const fulfillmentLine = order.fulfillment?.label
              ? `${order.fulfillment.label}${
                  order.fulfillment.trackingId ? ` · ${order.fulfillment.trackingId}` : ""
                }`
              : null;

            const learningLine = order.learning ? accessLabel(order) : null;
            const syncIncomplete =
              order.synchronization && order.synchronization.status === "partially_synchronized";

            return (
              <li key={order.reference}>
                <button
                  type="button"
                  className="OrderCard"
                  onClick={() => openDetail(order.reference)}
                  aria-label={`View order ${order.reference}`}
                >
                  <span className="OrderCardIcon">{TYPE_ICONS[order.type] || TYPE_ICONS.physical}</span>

                  <span className="OrderCardBody">
                    <span className="OrderCardTitleRow">
                      <span className="OrderCardRef">#{order.reference}</span>
                      <span className="OrderBadge is-muted">{order.typeLabel}</span>
                    </span>
                    <span className="OrderCardName">{title}</span>
                    {contextLine && <span className="OrderCardMeta">{contextLine}</span>}
                    {learningLine && <span className="OrderCardMeta">{learningLine}</span>}
                    {fulfillmentLine && <span className="OrderCardMeta">{fulfillmentLine}</span>}
                  </span>

                  <span className="OrderCardSide">
                    <span className="OrderCardAmount">{formatAmount(order.total, order.currency)}</span>
                    <span className={`OrderBadge is-${order.payment.tone}`}>{order.payment.label}</span>
                    {syncIncomplete && (
                      <span className="OrderBadge is-warning">{order.synchronization.label}</span>
                    )}
                  </span>

                  <FiChevronRight className="OrderCardChevron" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {state.pagination.lastPage > 1 && (
        <div className="OrderPagination">
          <button
            type="button"
            className="OrderButton"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </button>
          <span className="OrderPaginationStatus">
            Page {state.pagination.currentPage} of {state.pagination.lastPage}
          </span>
          <button
            type="button"
            className="OrderButton"
            disabled={page >= state.pagination.lastPage}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default MyOrders;
