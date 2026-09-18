import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { commerceApi } from '@/features/commerce/services/commerceApi';
import {
  createInventoryHoldReleaser,
  RELEASE_REASON_CHECKOUT_CANCELLED,
  RELEASE_REASON_PAYMENT_FAILED,
} from '@/features/commerce/utils/inventoryHold';

vi.mock('axios');

describe('Sprint 8 — Inventory reservation coordination (frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axios.post.mockResolvedValue({ data: { success: true, data: { inventory: { status: 'released' } } } });
  });

  describe('commerceApi.releaseInventory — server-decided, browser never authoritative', () => {
    it('asks the Workshop backend to release the hold for the checkout session', async () => {
      await commerceApi.releaseInventory('cs_abandoned_1', RELEASE_REASON_CHECKOUT_CANCELLED);

      expect(axios.post).toHaveBeenCalledTimes(1);
      const [url, body] = axios.post.mock.calls[0];

      expect(url).toContain('/payments/release-inventory');
      expect(body).toEqual({
        checkout_session_id: 'cs_abandoned_1',
        reason: 'checkout_cancelled',
      });
    });

    it('defaults to a checkout-cancellation reason', async () => {
      await commerceApi.releaseInventory('cs_abandoned_2');

      expect(axios.post.mock.calls[0][1]).toEqual({
        checkout_session_id: 'cs_abandoned_2',
        reason: 'checkout_cancelled',
      });
    });

    it('never sends stock quantities or product ids — the server owns inventory', async () => {
      await commerceApi.releaseInventory('cs_abandoned_3', RELEASE_REASON_PAYMENT_FAILED);

      const body = axios.post.mock.calls[0][1];
      expect(Object.keys(body).sort()).toEqual(['checkout_session_id', 'reason']);
      expect(body).not.toHaveProperty('quantity');
      expect(body).not.toHaveProperty('product_id');
      expect(body).not.toHaveProperty('stock');
    });
  });

  describe('createInventoryHoldReleaser — fire-and-forget, at most one request', () => {
    it('issues exactly one release for repeated dismissals of the same checkout', async () => {
      const transport = vi.fn().mockResolvedValue({ success: true });
      const releaser = createInventoryHoldReleaser(transport);

      // Simulate a re-fired Razorpay ondismiss / payment.failed burst.
      const calls = [
        releaser.release('cs_once_1'),
        releaser.release('cs_once_1'),
        releaser.release('cs_once_1'),
      ];

      await Promise.all(calls);

      expect(transport).toHaveBeenCalledTimes(1);
      expect(transport).toHaveBeenCalledWith('cs_once_1', RELEASE_REASON_CHECKOUT_CANCELLED);
      expect(releaser.alreadyReleased()).toBe(true);
    });

    it('never rejects when the backend refuses or the network fails', async () => {
      const refusing = vi.fn().mockRejectedValue(new Error('409 already paid'));
      const timingOut = createInventoryHoldReleaser(refusing);

      await expect(timingOut.release('cs_paid_1')).resolves.toBeNull();
      expect(refusing).toHaveBeenCalledTimes(1);
    });

    it('swallows a synchronous transport failure without throwing', async () => {
      const throwing = vi.fn(() => {
        throw new Error('boom');
      });
      const releaser = createInventoryHoldReleaser(throwing);

      await expect(releaser.release('cs_sync_fail_1')).resolves.toBeNull();
    });

    it('does nothing for a learning-only checkout with no bound physical session', async () => {
      const transport = vi.fn();
      const releaser = createInventoryHoldReleaser(transport);

      await expect(releaser.release(null)).resolves.toBeNull();
      await expect(releaser.release('')).resolves.toBeNull();

      expect(transport).not.toHaveBeenCalled();
      // Nothing was released, so a later legitimate release is still allowed.
      expect(releaser.alreadyReleased()).toBe(false);
    });

    it('forwards the failure reason when a payment is declined', async () => {
      const transport = vi.fn().mockResolvedValue({ success: true });
      const releaser = createInventoryHoldReleaser(transport);

      await releaser.release('cs_declined_1', RELEASE_REASON_PAYMENT_FAILED);

      expect(transport).toHaveBeenCalledWith('cs_declined_1', 'payment_failed');
    });

    it('treats the backend response as informational only', async () => {
      // The server may report a no-op (nothing held / already released). That is
      // not an error and must not become UI state.
      const transport = vi.fn().mockResolvedValue({
        success: true,
        data: { inventory: { required: false, status: 'not_applicable' } },
      });
      const releaser = createInventoryHoldReleaser(transport);

      await expect(releaser.release('cs_noop_1')).resolves.toEqual({
        success: true,
        data: { inventory: { required: false, status: 'not_applicable' } },
      });
    });

    it('allows a fresh attempt after a reset (new checkout attempt)', async () => {
      const transport = vi.fn().mockResolvedValue({ success: true });
      const releaser = createInventoryHoldReleaser(transport);

      await releaser.release('cs_attempt_1');
      releaser.reset();
      await releaser.release('cs_attempt_1');

      expect(transport).toHaveBeenCalledTimes(2);
    });
  });
});
