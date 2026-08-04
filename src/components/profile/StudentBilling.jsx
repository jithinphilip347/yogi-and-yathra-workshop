"use client";

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaReceipt, FaDownload, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { API_BASE_URL } from '@/utils/constants';
import apiClient from '@/services/apiClient';

export default function StudentBilling() {
  const { token, user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBillingHistory = async () => {
      try {
        setLoading(true);

        // Fetch User Orders & Invoices in parallel using apiClient
        const [ordersRes, invoicesRes] = await Promise.all([
          apiClient.get(`billing/orders?user_id=${user?.id}`),
          apiClient.get(`billing/invoices?user_id=${user?.id}`),
        ]);

        setOrders(ordersRes.data?.data?.data || ordersRes.data?.data || []);
        setInvoices(invoicesRes.data?.data?.data || invoicesRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load billing history:', err);
        setError('Could not retrieve billing and order history.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchBillingHistory();
    }
  }, [user]);

  const handleDownloadInvoice = (invoiceId, invoiceNumber) => {
    const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    window.open(`${cleanBaseUrl}/billing/invoices/${invoiceId}/download`, '_blank');
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Loading your purchase & billing history...</div>;
  }

  return (
    <div className="StudentBillingTab">
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#fff' }}>
        Billing & Order History
      </h2>

      {error && <div className="ErrorMessage" style={{ color: '#ef4444', marginBottom: '15px' }}>{error}</div>}

      {orders.length === 0 ? (
        <div className="EmptyState" style={{ padding: '30px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
          <p style={{ color: '#aaa' }}>No past purchases or orders found.</p>
        </div>
      ) : (
        <div className="OrdersTableWrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ddd', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', textTransform: 'uppercase', fontSize: '12px', color: '#888' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Order #</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Invoice / Receipt</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const matchingInvoice = invoices.find((inv) => inv.order_id === order.id);
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>#{order.order_number || order.id}</td>
                    <td style={{ padding: '12px' }}>{order.orderable?.title || order.metadata?.product_type || 'Course Purchase'}</td>
                    <td style={{ padding: '12px' }}>₹{Number(order.total_amount || 0).toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: order.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: order.status === 'completed' ? '#10B981' : '#EF4444',
                      }}>
                        {order.status?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {matchingInvoice ? (
                        <button
                          onClick={() => handleDownloadInvoice(matchingInvoice.id, matchingInvoice.invoice_number)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: '#4F46E5',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          <FaDownload /> Receipt PDF
                        </button>
                      ) : (
                        <span style={{ color: '#666', fontSize: '12px' }}>N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
