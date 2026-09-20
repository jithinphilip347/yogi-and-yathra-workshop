"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { FaCheckCircle, FaBookOpen, FaBoxOpen, FaArrowRight, FaTruck, FaExclamationTriangle } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { courierPartnerLabel } from '@/features/commerce/utils/courierPartners';
import ReceiptActions from '@/components/commerce/ReceiptActions';
import useOrderReceipt from '@/features/commerce/hooks/useOrderReceipt';
import {
  CONFIRMATION_DOMAIN,
  CONFIRMATION_ROUTES,
  CONFIRMATION_STATE,
  buildConfirmationSummary,
  buildNextSteps,
  confirmationDomain,
  confirmationReferences,
  confirmationState,
  formatAmount,
  humanizeStatus,
} from '@/features/commerce/utils/orderConfirmation';
import '@/assets/css/checkout.scss';
import '@/assets/css/checkout-success.scss';

/**
 * Checkout success — the last page of the checkout journey.
 *
 * Behaviour deliberately NOT changed: the TanStack cache invalidation below
 * (its keys are pinned by `checkoutPostPurchaseRedirect.test.js`), and the
 * server-authoritative data model. Everything on screen is read from the
 * unified-order payload or the payment slice — nothing is fetched, recomputed or
 * invented (see `utils/orderConfirmation.js` for the full reasoning).
 *
 * Behaviour deliberately changed: the 3-second auto-redirect to
 * `/auth/profile?tab=my-courses` is gone. It navigated the customer away before
 * they could read the confirmation or use any of the actions on it, which made a
 * real confirmation page impossible. The same destination is now the primary
 * call to action instead of a timer.
 */
export default function CheckoutSuccessPage() {
  const queryClient = useQueryClient();
  const paymentState = useSelector((state) => state.payment || {});
  const activeOrder = useSelector((state) => state.checkout?.activeOrder);
  const courierPartner = useSelector((state) => state.checkout?.courierPartner);

  // Invalidate queries to guarantee fresh enrollment data in Profile/My Learning
  useEffect(() => {
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['course-access'] });
      queryClient.invalidateQueries({ queryKey: ['course-resume'] });
      queryClient.invalidateQueries({ queryKey: ['student-continue-learning'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-upcoming-events'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  }, [queryClient]);

  const state = confirmationState({
    paymentStatus: paymentState.status,
    activeOrder,
  });
  const domain = confirmationDomain(activeOrder);
  const summary = buildConfirmationSummary(activeOrder);
  const refs = confirmationReferences({
    activeOrder,
    transactionId: paymentState.activeTransactionId,
  });
  const nextSteps = buildNextSteps(domain);

  /* The receipt, from the same unified order-detail endpoint the Orders tab
     uses. A lookup failure yields null and simply renders no receipt actions —
     it can never block or contradict the confirmation above. */
  const receipt = useOrderReceipt(refs.orderNumber);

  const hasLearning = domain === CONFIRMATION_DOMAIN.LEARNING || domain === CONFIRMATION_DOMAIN.MIXED;
  const hasPhysical = domain === CONFIRMATION_DOMAIN.PHYSICAL || domain === CONFIRMATION_DOMAIN.MIXED;

  /* ── No order to confirm ───────────────────────────────────────────────────
     Reached by opening this URL directly, or after a cleared browser storage.
     It must NOT claim a payment succeeded — the old page fell back to the
     literal strings "ORD-CONFIRMED" / "TXN-CONFIRMED" and a green tick here. */
  if (state === CONFIRMATION_STATE.NONE) {
    return (
      <div id="Checkout">
        <div className="SuccessStateCard">
          <span className="SuccessStateIcon neutral" aria-hidden="true">
            <FaExclamationTriangle />
          </span>
          <h1 className="SuccessStateTitle">No recent order to show</h1>
          <p className="SuccessStateText">
            We could not find a completed order for this session. If you have just paid, check
            My&nbsp;Courses — your access may already be active.
          </p>
          <div className="SuccessActions single">
            <Link className="ProceedBtn SuccessPrimary" href={CONFIRMATION_ROUTES.myCourses}>
              <FaBookOpen /> Go to My Courses
            </Link>
            <Link className="SuccessGhost" href={CONFIRMATION_ROUTES.continueShopping}>
              Browse Workshops <FaArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isConfirmed = state === CONFIRMATION_STATE.CONFIRMED;

  return (
    <div id="Checkout">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className={`SuccessHero ${isConfirmed ? 'confirmed' : 'pending'}`}>
        <span className="SuccessHeroIcon" aria-hidden="true">
          {isConfirmed ? <FaCheckCircle /> : <FaExclamationTriangle />}
        </span>

        <h1 className="SuccessHeroTitle">
          {isConfirmed ? 'Payment Successful' : 'Confirming your payment'}
        </h1>

        <p className="SuccessHeroText">
          {isConfirmed
            ? 'Thank you for your purchase. Your order is confirmed and your access is being activated.'
            : 'We have your order, but the payment confirmation has not reached us yet. Your reference is below — please do not pay again.'}
        </p>

        {refs.orderNumber && (
          <div className="SuccessHeroRef">
            <span className="SuccessHeroRefLabel">Workshop Order</span>
            <span className="SuccessHeroRefValue">#{refs.orderNumber}</span>
          </div>
        )}
      </section>

      <div className="SuccessLayout">
        <div className="SuccessMain">
          {/* ── What this order covers ─────────────────────────────────────── */}
          <section className="SuccessSection">
            <h2 className="SuccessSectionTitle">Your Order</h2>

            <div className="SuccessOrderList">
              {hasLearning && (
                <article className="SuccessOrderCard">
                  <span className="SuccessOrderIcon" aria-hidden="true">
                    <FaBookOpen />
                  </span>
                  <div className="SuccessOrderBody">
                    <h3 className="SuccessOrderName">Learning Access</h3>
                    <p className="SuccessOrderMeta">
                      Courses and classes in this order are added to your library.
                    </p>
                  </div>
                  <span className={`SuccessBadge ${isConfirmed ? 'success' : 'pending'}`}>
                    {isConfirmed ? 'Confirmed' : 'Pending'}
                  </span>
                </article>
              )}

              {hasPhysical && (
                <article className="SuccessOrderCard">
                  <span className="SuccessOrderIcon" aria-hidden="true">
                    <FaBoxOpen />
                  </span>
                  <div className="SuccessOrderBody">
                    <h3 className="SuccessOrderName">
                      Physical Order
                      {refs.physicalOrderId ? (
                        <span className="SuccessOrderRef">#{refs.physicalOrderId}</span>
                      ) : null}
                    </h3>
                    <p className="SuccessOrderMeta">
                      Sent to the store for fulfilment
                      {humanizeStatus(refs.physicalOrderStatus)
                        ? ` · ${humanizeStatus(refs.physicalOrderStatus)}`
                        : ''}
                      .
                    </p>
                  </div>
                  <span className="SuccessBadge pending">
                    {humanizeStatus(refs.physicalOrderStatus) || 'In Fulfilment'}
                  </span>
                </article>
              )}

              {!hasLearning && !hasPhysical && (
                <article className="SuccessOrderCard">
                  <span className="SuccessOrderIcon" aria-hidden="true">
                    <FaCheckCircle />
                  </span>
                  <div className="SuccessOrderBody">
                    <h3 className="SuccessOrderName">Order received</h3>
                    <p className="SuccessOrderMeta">
                      The details of what this order covers are on the order record.
                    </p>
                  </div>
                  <span className="SuccessBadge success">Confirmed</span>
                </article>
              )}
            </div>
          </section>

          {/* ── What happens next ──────────────────────────────────────────── */}
          {nextSteps.length > 0 && (
            <section className="SuccessSection">
              <h2 className="SuccessSectionTitle">What happens next</h2>
              <ol className="SuccessSteps">
                {nextSteps.map((step) => (
                  <li className="SuccessStep" key={step.key}>
                    <span className="SuccessStepMark" aria-hidden="true">
                      {step.key === 'learning' ? <FaBookOpen /> : <FaTruck />}
                    </span>
                    <div className="SuccessStepBody">
                      <h3 className="SuccessStepTitle">{step.title}</h3>
                      <p className="SuccessStepText">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* ── Receipt ────────────────────────────────────────────────
             Rendered by the shared component, so the same rule governs this
             page as the billing history and the order detail. The document is
             only offered once the server has actually produced it. */}
          {receipt && (
            <section className="SuccessSection">
              <h2 className="SuccessSectionTitle">Your Receipt</h2>
              <div className="SuccessReceipt">
                <ReceiptActions receipt={receipt} label={refs.orderNumber ? `order ${refs.orderNumber}` : null} />
              </div>
            </section>
          )}

          {/* ── Actions: one primary, then clearly lesser options ──────────── */}
          <div className="SuccessActions">
            {hasLearning ? (
              <Link className="ProceedBtn SuccessPrimary" href={CONFIRMATION_ROUTES.myCourses}>
                <FaBookOpen /> Start Learning
              </Link>
            ) : (
              <Link className="ProceedBtn SuccessPrimary" href={CONFIRMATION_ROUTES.continueShopping}>
                <FaArrowRight /> Continue Shopping
              </Link>
            )}

            <Link className="SuccessGhost" href={CONFIRMATION_ROUTES.billing}>
              Billing &amp; Invoices
            </Link>

            {hasLearning && (
              <Link className="SuccessLink" href={CONFIRMATION_ROUTES.continueShopping}>
                Continue shopping <FaArrowRight size={12} />
              </Link>
            )}
          </div>
        </div>

        {/* ── Aside: order summary + payment details ────────────────────────── */}
        <aside className="SuccessAside">
          <section className="SuccessSummaryCard">
            <h2 className="SuccessSummaryTitle">Order Summary</h2>

            {summary.rows.length > 0 ? (
              <>
                {summary.rows.map((row) => (
                  <div
                    className={`SuccessSummaryRow ${row.kind === 'discount' ? 'discount' : ''}`}
                    key={row.key}
                  >
                    <span>{row.label}</span>
                    <span>{formatAmount(row.amount, summary.currency)}</span>
                  </div>
                ))}
                <hr className="SuccessDivider" />
              </>
            ) : null}

            <div className="SuccessSummaryRow total">
              <span>Total Paid</span>
              <span>{formatAmount(summary.total, summary.currency)}</span>
            </div>
          </section>

          <section className="SuccessSummaryCard">
            <h2 className="SuccessSummaryTitle">Payment</h2>

            <div className="SuccessDetailRow">
              <span>Status</span>
              <span className={`SuccessBadge ${isConfirmed ? 'success' : 'pending'}`}>
                {humanizeStatus(refs.paymentStatus) ||
                  (isConfirmed ? 'Paid' : 'Awaiting Confirmation')}
              </span>
            </div>

            {refs.paymentGateway && (
              <div className="SuccessDetailRow">
                <span>Gateway</span>
                <span className="SuccessDetailValue">{refs.paymentGateway}</span>
              </div>
            )}

            {refs.transactionId && (
              <div className="SuccessDetailRow">
                <span>Transaction</span>
                <span className="SuccessDetailValue mono">{refs.transactionId}</span>
              </div>
            )}

            {hasPhysical && courierPartner && (
              <div className="SuccessDetailRow">
                <span>Delivery Partner</span>
                <span className="SuccessDetailValue">{courierPartnerLabel(courierPartner)}</span>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
