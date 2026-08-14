/**
 * useSubscription
 *
 * Daily Class subscription flow (Razorpay AutoPay / mandate):
 *
 *   Select plan → POST /subscriptions/create (server creates Razorpay plan +
 *   subscription, returns authoritative payload) → Razorpay subscription
 *   checkout (subscription_id mode) → user authorizes mandate → callback →
 *   POST /subscriptions/activate (server re-verifies Razorpay state) →
 *   subscription active → Daily Class enrollment active.
 *
 * The frontend never constructs the payment payload and never treats its own
 * callback as the source of truth — the server verifies the Razorpay state.
 * On page load / return from checkout, fetchStatus() renders the ACTUAL
 * server state, and resuming a pending subscription re-opens the same
 * Razorpay AutoPay window instead of creating a duplicate subscription.
 */

import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { commerceApi } from '../services/commerceApi';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export function useSubscription() {
  const { user, isAuthenticated } = useSelector((state) => state.auth || {});

  // 'idle' | 'creating' | 'authorizing' | 'verifying' | 'active' |
  // 'pending' | 'failed' | 'cancelled' | 'loading'
  const [status, setStatus] = useState('idle');
  const [subscription, setSubscription] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [accessLevel, setAccessLevel] = useState('none');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const applyStatusPayload = useCallback((data) => {
    setSubscription(data?.subscription || null);
    setEnrollment(data?.enrollment || null);
    setAccessLevel(data?.access_level || 'none');

    const subStatus = data?.subscription?.status;
    if (!data?.subscription) {
      setStatus('idle');
    } else if (subStatus === 'active' || subStatus === 'trial') {
      setStatus('active');
    } else if (
      subStatus === 'pending_activation' ||
      subStatus === 'draft' ||
      subStatus === 'past_due' ||
      subStatus === 'paused'
    ) {
      setStatus('pending');
    } else if (subStatus === 'cancelled') {
      setStatus('cancelled');
    } else {
      setStatus(subStatus || 'idle');
    }
  }, []);

  /**
   * Open the Razorpay subscription (AutoPay mandate) checkout using the
   * authoritative payload returned by the server.
   *
   * @returns {Promise<boolean>} true when the checkout opened.
   */
  const openRazorpayCheckout = useCallback(
    (sub, razorpay, keyId) =>
      new Promise((resolve) => {
        if (!razorpay?.id || !keyId || !sub?.id) {
          resolve(false);
          return;
        }

        setStatus('authorizing');

        const options = {
          key: keyId,
          subscription_id: razorpay.id,
          name: 'Yogify Workshop',
          description: `Subscription #${sub.id}`,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          theme: {
            color: '#1a56db',
          },
          handler: async (response) => {
            setStatus('verifying');
            try {
              // Server re-verifies the Razorpay subscription state — the
              // frontend callback alone is never trusted.
              const actRes = await commerceApi.activateSubscription({
                subscription_id: sub.id,
                razorpay_subscription_id: response.razorpay_subscription_id,
              });

              if (actRes.success) {
                const actData = actRes.data || {};
                setSubscription(actData.subscription || sub);
                if (actData.status === 'active') {
                  setStatus('active');
                } else if (actData.gateway_status === 'authenticated') {
                  setStatus('pending'); // mandate done, first charge pending
                } else {
                  setStatus(actData.status || 'pending');
                }
                setError(null);
              } else {
                throw new Error(actRes.message || 'Subscription activation is pending confirmation.');
              }
            } catch (err) {
              const msg = err.response?.data?.message || err.message || 'Activation verification failed';
              setError(msg);
              setStatus('pending'); // webhook will finalize; UI shows pending
            }
          },
          modal: {
            ondismiss: () => {
              // User closed the AutoPay window without completing → stay pending
              setStatus('pending');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          const description = response?.error?.description || 'Payment failed. Please try again.';
          setError(description);
          setStatus('failed');
        });
        rzp.open();
        resolve(true);
      }),
    [user?.name, user?.email, user?.phone]
  );

  /**
   * Fetch the current subscription state from the server for a Daily Class.
   * Safe to call on mount and after returning from the Razorpay checkout.
   */
  const fetchStatus = useCallback(
    async (dailyClassId) => {
      if (!dailyClassId || !isAuthenticated || !user?.id) {
        return null;
      }
      setLoading(true);
      try {
        const res = await commerceApi.getSubscriptionStatus(dailyClassId);
        if (res.success && res.data) {
          applyStatusPayload(res.data);
          return res.data;
        }
        return null;
      } catch {
        // Not authenticated / network error — treat as no subscription
        setSubscription(null);
        setStatus('idle');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, user?.id, applyStatusPayload]
  );

  /**
   * Start (or resume) the subscription + Razorpay AutoPay flow.
   *
   * @param {object} opts  { dailyClassId, planId }
   */
  const startSubscription = useCallback(
    async ({ dailyClassId, planId }) => {
      if (!dailyClassId || !planId) {
        setError('Please select a pricing plan first.');
        setStatus('failed');
        return;
      }

      setLoading(true);
      setError(null);
      setStatus('creating');

      try {
        const res = await commerceApi.createSubscription({
          daily_class_id: dailyClassId,
          pricing_plan_id: planId,
          user_id: user?.id,
        });

        if (!res.success) {
          throw new Error(res.message || 'Failed to create subscription');
        }

        const data = res.data || {};
        const sub = data.subscription;
        const razorpay = data.razorpay;
        const keyId = data.key_id;

        // Duplicate-subscription response → resume the existing subscription's
        // AutoPay checkout (same Razorpay subscription) instead of creating a
        // duplicate. Otherwise just surface the existing server state.
        if (data.existing) {
          if (razorpay?.id && keyId && sub) {
            const opened = await loadRazorpayScript();
            if (opened) {
              await openRazorpayCheckout(sub, razorpay, keyId);
              setLoading(false);
              return;
            }
          }
          setSubscription(sub);
          applyStatusPayload({ subscription: sub });
          setStatus(sub?.status === 'active' ? 'active' : 'pending');
          setLoading(false);
          return;
        }

        setSubscription(sub);

        if (!razorpay?.id || !keyId) {
          throw new Error('Missing Razorpay subscription details. Please retry.');
        }

        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
        }

        await openRazorpayCheckout(sub, razorpay, keyId);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to start subscription';
        setError(msg);
        setStatus('failed');
      } finally {
        setLoading(false);
      }
    },
    [user?.id, openRazorpayCheckout, applyStatusPayload]
  );

  /**
   * Cancel the subscription (server verifies ownership).
   */
  const cancelSubscription = useCallback(async (subscriptionId, reason = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await commerceApi.cancelSubscription(subscriptionId, reason);
      if (res.success) {
        const cancelled = res.data?.subscription || res.data;
        setSubscription(cancelled);
        setStatus('cancelled');
        return { success: true };
      }
      throw new Error(res.message || 'Cancellation failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Cancellation failed';
      setError(msg);
      setStatus('failed');
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setSubscription(null);
    setEnrollment(null);
    setAccessLevel('none');
    setError(null);
    setLoading(false);
  }, []);

  return {
    status,
    subscription,
    enrollment,
    accessLevel,
    error,
    loading,
    isAuthenticated,
    startSubscription,
    fetchStatus,
    cancelSubscription,
    reset,
  };
}
