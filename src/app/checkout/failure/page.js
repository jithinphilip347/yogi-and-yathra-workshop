"use client";
import React from 'react';
import Link from 'next/link';
import { FaTimesCircle, FaRedo, FaHeadset } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import '@/assets/css/checkout.css';

export default function CheckoutFailurePage() {
  const paymentError = useSelector((state) => state.payment?.paymentError);

  return (
    <div id="Checkout" className="py-12">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-xl border border-gray-100 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl">
          <FaTimesCircle />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Failed</h1>
          <p className="text-sm text-gray-500 mt-2">
            We could not complete your transaction. Your card/account has not been charged.
          </p>
        </div>

        {/* Error Reason */}
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700 text-sm font-medium">
          {paymentError || 'Transaction was declined or cancelled by the user.'}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link
            href="/checkout"
            className="flex-1 bg-primary-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-800 transition flex items-center justify-center gap-2"
          >
            <FaRedo /> Retry Checkout
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <FaHeadset /> Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
