import { describe, it, expect, beforeEach, vi } from 'vitest';
import checkoutReducer, {
  createCheckout,
  setBillingAddress,
  setShippingAddress,
  setSameAsBilling,
  setEcommerceCustomer,
  delegateOrderStart,
  delegateOrderSuccess,
  delegateOrderFailure,
  resetCheckout,
} from '@/features/commerce/slices/checkoutSlice';
import { classifyCartItems } from '@/features/commerce/utils/cartClassification';
import { commerceApi } from '@/features/commerce/services/commerceApi';
import axios from 'axios';

vi.mock('axios');

describe('Sprint 6 — Customer Matching & Delegated Physical Order Creation', () => {
  let initialState;

  beforeEach(() => {
    vi.clearAllMocks();
    initialState = {
      sessionId: null,
      items: [],
      activeStep: 1,
      billingAddress: {
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'India',
      },
      shippingAddress: {
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'India',
      },
      sameAsBilling: true,
      paymentMethod: 'razorpay',
      activeOrder: null,
      delegatedPhysicalOrder: null,
      ecommerceCustomer: {
        id: null,
        email: '',
        name: '',
        status: null,
      },
      isDelegating: false,
      delegationError: null,
      isProcessing: false,
      error: null,
    };
  });

  describe('checkoutSlice Reducers & Customer Matching State', () => {
    it('creates checkout session and resets delegated order and customer state', () => {
      const items = [{ id: 1, type: 'course', price: 1000 }];
      const state = checkoutReducer(initialState, createCheckout(items));

      expect(state.items).toHaveLength(1);
      expect(state.sessionId).toMatch(/^cs_/);
      expect(state.activeStep).toBe(1);
      expect(state.delegatedPhysicalOrder).toBeNull();
      expect(state.ecommerceCustomer.id).toBeNull();
      expect(state.isDelegating).toBe(false);
    });

    it('updates billing address and syncs shipping address when sameAsBilling is true', () => {
      let state = checkoutReducer(initialState, setBillingAddress({
        name: 'Rohan Sharma',
        city: 'Kochi',
      }));

      expect(state.billingAddress.name).toBe('Rohan Sharma');
      expect(state.shippingAddress.name).toBe('Rohan Sharma');
      expect(state.shippingAddress.city).toBe('Kochi');
    });

    it('updates shipping address independently when sameAsBilling is false', () => {
      let state = checkoutReducer(initialState, setSameAsBilling(false));
      state = checkoutReducer(state, setShippingAddress({
        name: 'Recipient Name',
        city: 'Bangalore',
      }));

      expect(state.shippingAddress.name).toBe('Recipient Name');
      expect(state.shippingAddress.city).toBe('Bangalore');
      expect(state.billingAddress.name).toBe('');
    });

    it('tracks delegation lifecycle and resolves ecommerce customer state', () => {
      let state = checkoutReducer(initialState, delegateOrderStart());
      expect(state.isDelegating).toBe(true);
      expect(state.delegationError).toBeNull();

      const mockResponse = {
        success: true,
        customer_account_status: 'created',
        customer: {
          id: 501,
          email: 'newuser@example.com',
          name: 'New User',
        },
        order: {
          id: 101,
          external_source: 'workshop',
          status: 'pending',
          total: 1500,
        },
      };

      state = checkoutReducer(state, delegateOrderSuccess(mockResponse));
      expect(state.isDelegating).toBe(false);
      expect(state.delegatedPhysicalOrder).toEqual(mockResponse.order);
      expect(state.ecommerceCustomer.id).toBe(501);
      expect(state.ecommerceCustomer.status).toBe('created');
      expect(state.ecommerceCustomer.email).toBe('newuser@example.com');

      state = checkoutReducer(state, delegateOrderFailure('Stock depleted'));
      expect(state.isDelegating).toBe(false);
      expect(state.delegationError).toBe('Stock depleted');
    });

    it('resets checkout and ecommerceCustomer state completely', () => {
      let state = checkoutReducer(initialState, delegateOrderSuccess({
        customer: { id: 99, email: 'a@b.com' },
        customer_account_status: 'existing',
        order: { id: 88 },
      }));
      state = checkoutReducer(state, resetCheckout());

      expect(state.sessionId).toBeNull();
      expect(state.items).toHaveLength(0);
      expect(state.delegatedPhysicalOrder).toBeNull();
      expect(state.ecommerceCustomer.id).toBeNull();
      expect(state.delegationError).toBeNull();
    });
  });

  describe('Cart Shipping Requirements Classification', () => {
    it('detects no shipping required for course-only cart', () => {
      const items = [
        { id: 1, type: 'course', domain: 'workshop', price: 999 },
        { id: 2, type: 'daily_class', domain: 'workshop', price: 499 },
      ];

      const classified = classifyCartItems(items);
      expect(classified.hasPhysicalItems).toBe(false);
      expect(classified.hasLearningItems).toBe(true);
      expect(classified.isMixedCart).toBe(false);
    });

    it('detects shipping required for physical items and mixed carts', () => {
      const items = [
        { id: 1, type: 'course', domain: 'workshop', price: 999 },
        { id: 45, type: 'product', domain: 'ecommerce', price: 1200 },
      ];

      const classified = classifyCartItems(items);
      expect(classified.hasPhysicalItems).toBe(true);
      expect(classified.hasLearningItems).toBe(true);
      expect(classified.isMixedCart).toBe(true);
    });
  });

  describe('commerceApi.delegatePhysicalOrder', () => {
    it('sends POST request to /checkout/delegate-physical-order with payload', async () => {
      const mockResponse = {
        data: {
          success: true,
          delegated: true,
          customer_account_status: 'created',
          customer: { id: 400, email: 'pooja@test.com' },
          order: { id: 777, total: 1200 },
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      const payload = {
        checkout_session_id: 'cs_test_123',
        customer: { name: 'Pooja', email: 'pooja@test.com', phone: '9876543210' },
        shipping_address: { address: '123 Test St', city: 'Kochi', state: 'KL', pincode: '682001' },
        items: [{ id: 10, type: 'product', quantity: 1, price: 1200 }],
      };

      const result = await commerceApi.delegatePhysicalOrder(payload);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/checkout/delegate-physical-order'),
        payload,
        expect.any(Object)
      );
      expect(result.success).toBe(true);
      expect(result.order.id).toBe(777);
      expect(result.customer.id).toBe(400);
    });
  });
});
