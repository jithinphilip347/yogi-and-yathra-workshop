"use client";
import React from 'react';
import Link from 'next/link';
import { FaCheckCircle, FaBookOpen, FaDownload, FaArrowRight } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import '@/assets/css/checkout.css';

export default function CheckoutSuccessPage() {
  const paymentState = useSelector((state) => state.payment || {});
  const activeOrder = useSelector((state) => state.checkout?.activeOrder);

  const transactionId = paymentState.activeTransactionId || 'TXN-9982341';
  const orderNumber = activeOrder?.order?.order_number || activeOrder?.order_number || activeOrder?.id || 'ORD-10294';

  return (
    <div id="Checkout" className="py-12">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
          <FaCheckCircle />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Successful!</h1>
          <p className="text-sm text-gray-500 mt-2">
            Thank you for your purchase. Your enrollment has been confirmed.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-left text-sm space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-gray-500">Order Reference:</span>
            <span className="font-bold text-gray-900">#{orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Txn ID:</span>
            <span className="text-gray-800">{transactionId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Status:</span>
            <span className="text-emerald-600 font-bold uppercase">PAID & VERIFIED</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link
            href="/auth/profile"
            className="flex-1 bg-primary-700 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-800 transition flex items-center justify-center gap-2"
          >
            <FaBookOpen /> Go to My Enrolled Courses
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            Browse More <FaArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
