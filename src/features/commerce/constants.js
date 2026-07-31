/**
 * Commerce Constants & Supported Product Types
 */

export const PRODUCT_TYPES = {
  COURSE: 'Course',
  LIVE_SECTION: 'LiveSection',
  DAILY_CLASS: 'DailyClass',
  FEE_COLLECTION: 'FeeCollection',
  MEMBERSHIP: 'Membership',
  WORKSHOP: 'Workshop',
};

export const PAYMENT_GATEWAYS = {
  RAZORPAY: 'razorpay',
  OFFLINE: 'manual',
};

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};
