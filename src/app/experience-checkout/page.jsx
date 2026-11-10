"use client";
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { createOrderSuccess } from '@/features/commerce/slices/checkoutSlice';
import { paymentSuccess } from '@/features/commerce/slices/paymentSlice';
import { usePayment } from '@/features/commerce/hooks/usePayment';
import { offlineEventApi } from '@/services/offlineEventApi';
import { travelPackageApi } from '@/services/travelPackageApi';
import { experienceBookingApi } from '@/services/experienceBookingApi';
import '@/assets/css/experience-checkout.scss';

const formatMoney = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value) || 0);
const effectivePrice = (plan) => Number(plan?.discount_price) >= 0 && Number(plan?.discount_price) < Number(plan?.price) ? Number(plan.discount_price) : Number(plan?.price) || 0;
const participantFrom = (user) => ({ full_name: user?.name || '', email: user?.email || '', phone: user?.phone || '', id_proof: null });

function ExperienceCheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);
  const { executeRazorpay, status: paymentStatus, paymentError } = usePayment();
  const type = params.get('type') === 'travel' ? 'travel' : 'event';
  const id = params.get('id');
  const initialPlanId = params.get('pricing_plan_id');
  const retryBookingId = params.get('booking');
  const [record, setRecord] = useState(null);
  const [planId, setPlanId] = useState(initialPlanId || '');
  const [quantity, setQuantity] = useState(1);
  const [participants, setParticipants] = useState([participantFrom(user)]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setParticipants((current) => current.map((item, index) => index === 0 && !retryBookingId ? { ...item, ...participantFrom(user) } : item)); }, [user, retryBookingId]);
  useEffect(() => {
    let active = true;
    if (!id) { setError('Choose an event or travel package before checkout.'); setLoading(false); return () => { active = false; }; }
    (type === 'event' ? offlineEventApi.get(id) : travelPackageApi.get(id))
      .then((result) => { if (!active) return; setRecord(result); setPlanId((current) => current || String(result?.pricing_plans?.find((plan) => plan.is_featured)?.id || result?.pricing_plans?.[0]?.id || '')); })
      .catch(() => { if (active) setError('We could not load this experience. Please return to its details page and try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, type]);

  useEffect(() => {
    if (!retryBookingId) return;
    experienceBookingApi.getBooking(retryBookingId).then((booking) => {
      if (String(booking?.bookable_id) !== String(record?.id) || booking?.experience_type !== type || booking?.status !== 'pending_payment') return;
      setPlanId(String(booking.pricing_plan_id));
      setQuantity(Number(booking.participant_count) || 1);
      setParticipants((booking.participants || []).map((person) => ({ full_name: person.full_name || '', email: person.email || '', phone: person.phone || '', id_proof: null, has_id_proof: person.has_id_proof })));
    }).catch(() => setError('The saved reservation is no longer available. Please start a new booking.'));
  }, [retryBookingId, record, type]);

  useEffect(() => { setParticipants((current) => Array.from({ length: quantity }, (_, index) => current[index] || participantFrom(index === 0 ? user : null))); }, [quantity, user]);
  const plan = useMemo(() => (record?.pricing_plans || []).find((option) => String(option.id) === String(planId)), [record, planId]);
  const total = effectivePrice(plan) * quantity;
  const maxQuantity = Math.max(1, Math.min(20, Number(type === 'event' ? record?.available_seats : record?.available_slots) || 20));
  const proofRequired = type === 'travel' && Boolean(record?.id_proof_required);

  const updateParticipant = (index, key, value) => setParticipants((current) => current.map((participant, itemIndex) => itemIndex === index ? { ...participant, [key]: value } : participant));
  const submit = async (event) => {
    event.preventDefault();
    if (!user) { router.push(`/auth/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`); return; }
    if (!plan) { setError('Select an available pricing plan.'); return; }
    setSubmitting(true); setError('');
    try {
      const form = new FormData();
      form.append('type', type); form.append('experience_id', String(record.id)); form.append('pricing_plan_id', String(plan.id));
      form.append('quantity', String(quantity)); form.append('idempotency_key', crypto.randomUUID());
      if (retryBookingId) form.append('booking_id', retryBookingId);
      participants.forEach((person, index) => {
        form.append(`participants[${index}][full_name]`, person.full_name);
        if (person.email) form.append(`participants[${index}][email]`, person.email);
        form.append(`participants[${index}][phone]`, person.phone);
        if (person.id_proof) form.append(`participants[${index}][id_proof]`, person.id_proof);
      });
      const response = await experienceBookingApi.create(form);
      if (response?.is_free || response?.already_confirmed) {
        dispatch(createOrderSuccess({ domain: 'experience', order: { ...response.order, subtotal: Number(response.order?.amount) || 0, status: 'completed' }, experience: { booking_reference: response.booking_reference, title: record.title, experience_type: type, status: 'confirmed', participant_count: quantity } }));
        dispatch(paymentSuccess({ status: 'completed' }));
        router.replace('/checkout/success'); return;
      }
      dispatch(createOrderSuccess({ domain: 'experience', order: response.order, experience: { booking_reference: response.booking_reference, title: record.title, experience_type: type, status: 'pending_payment', participant_count: quantity } }));
      await executeRazorpay(response, user, { successUrl: '/checkout/success', failureUrl: `/experience-checkout?type=${type}&id=${record.slug || record.id}&pricing_plan_id=${plan.id}&booking=${response.booking_id}&payment=retry` });
    } catch (cause) {
      const messages = cause?.response?.data?.errors;
      setError(Object.values(messages || {}).flat().join(' ') || cause?.response?.data?.message || cause?.message || 'We could not start checkout. Your participant details are still on this page.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <main id="ExperienceCheckout"><p role="status">Loading checkout…</p></main>;
  if (!record) return <main id="ExperienceCheckout"><div className="experienceCheckoutPanel"><h1>Checkout unavailable</h1><p>{error}</p><Link href={type === 'travel' ? '/travel' : '/event'}>Browse {type === 'travel' ? 'travel packages' : 'events'}</Link></div></main>;
  return <main id="ExperienceCheckout"><div className="experienceCheckoutPanel"><h1>Complete your booking</h1><p className="experienceCheckoutIntro">{record.title} · {type === 'travel' ? 'Travel package' : 'Offline event'}</p>
    <form onSubmit={submit}>
      {error && <div className="experienceCheckoutError" role="alert">{error}</div>}
      {paymentError && <div className="experienceCheckoutError" role="alert">{paymentError}</div>}
      <label className="experienceCheckoutField">Pricing plan<select value={planId} onChange={(event) => setPlanId(event.target.value)} required><option value="">Select a plan</option>{(record.pricing_plans || []).map((option) => <option value={option.id} key={option.id}>{option.name} — {formatMoney(effectivePrice(option))} per person{option.is_featured ? ' · Recommended' : ''}</option>)}</select></label>
      <label className="experienceCheckoutField">Number of participants<select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>{Array.from({ length: maxQuantity }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} {index === 0 ? 'person' : 'people'}</option>)}</select></label>
      <h2>Participant details</h2>
      {participants.map((person, index) => <section className="participantCard" key={index}><h3>{index === 0 ? 'Primary participant · Purchaser' : `Participant ${index + 1}`}</h3>
        <label className="experienceCheckoutField">Full name<input required maxLength={160} value={person.full_name} onChange={(event) => updateParticipant(index, 'full_name', event.target.value)} autoComplete={index === 0 ? 'name' : 'off'} /></label>
        <label className="experienceCheckoutField">Email (optional)<input type="email" maxLength={255} value={person.email} onChange={(event) => updateParticipant(index, 'email', event.target.value)} autoComplete={index === 0 ? 'email' : 'off'} /></label>
        <label className="experienceCheckoutField">Phone number<input required maxLength={50} value={person.phone} onChange={(event) => updateParticipant(index, 'phone', event.target.value)} autoComplete={index === 0 ? 'tel' : 'off'} /></label>
        {type === 'travel' && <label className="experienceCheckoutField">Travel ID proof {proofRequired ? '(required)' : '(optional)'}{person.has_id_proof && <small>Saved proof will be retained if you do not replace it.</small>}<input type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" required={proofRequired && !person.has_id_proof} onChange={(event) => updateParticipant(index, 'id_proof', event.target.files?.[0] || null)} /></label>}
      </section>)}
      <button className="experiencePayButton" disabled={submitting || paymentStatus === 'processing' || !plan} type="submit">{submitting || paymentStatus === 'processing' ? 'Preparing secure checkout…' : total === 0 ? 'Confirm free booking' : `Continue to pay ${formatMoney(total)}`}</button>
    </form>
  </div></main>;
}

export default function ExperienceCheckoutPage() { return <Suspense fallback={<main id="ExperienceCheckout"><p>Loading checkout…</p></main>}><ExperienceCheckoutContent /></Suspense>; }
