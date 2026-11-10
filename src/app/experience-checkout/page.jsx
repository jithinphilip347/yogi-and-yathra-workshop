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
import { ExperienceCheckoutSkeleton } from '@/components/experiences/ExperienceSkeletons';
import { resolveMediaUrl } from '@/utils/mediaUrl';
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
  const [activeStep, setActiveStep] = useState(1);
  const [activeParticipantIndex, setActiveParticipantIndex] = useState(0);

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
      setActiveParticipantIndex(0);
      setActiveStep(2);
    }).catch(() => setError('The saved reservation is no longer available. Please start a new booking.'));
  }, [retryBookingId, record, type]);

  useEffect(() => { setParticipants((current) => Array.from({ length: quantity }, (_, index) => current[index] || participantFrom(index === 0 ? user : null))); }, [quantity, user]);
  useEffect(() => { setActiveParticipantIndex((current) => Math.min(current, Math.max(0, quantity - 1))); }, [quantity]);
  useEffect(() => {
    if (activeStep !== 2) return;
    requestAnimationFrame(() => document.querySelector(`[data-participant-index="${activeParticipantIndex}"] input:not([type="file"])`)?.focus());
  }, [activeParticipantIndex, activeStep]);
  const plan = useMemo(() => (record?.pricing_plans || []).find((option) => String(option.id) === String(planId)), [record, planId]);
  const total = effectivePrice(plan) * quantity;
  const maxQuantity = Math.max(1, Math.min(20, Number(type === 'event' ? record?.available_seats : record?.available_slots) || 20));
  const proofRequired = type === 'travel';

  const updateParticipant = (index, key, value) => setParticipants((current) => current.map((participant, itemIndex) => itemIndex === index ? { ...participant, [key]: value } : participant));
  const validateParticipant = (index) => {
    const fields = document.querySelectorAll(`[data-participant-index="${index}"] input:not([type="file"]), [data-participant-index="${index}"] input[type="file"][required]`);
    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        field.focus();
        return false;
      }
    }
    return true;
  };
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

  if (loading) return <ExperienceCheckoutSkeleton />;
  if (!record) return <main id="ExperienceCheckout"><div className="experienceCheckoutPanel"><h1>Checkout unavailable</h1><p>{error}</p><Link href={type === 'travel' ? '/travel' : '/event'}>Browse {type === 'travel' ? 'travel packages' : 'events'}</Link></div></main>;
  const recordImage = resolveMediaUrl(record.thumbnail || record.image, '');
  const experienceDate = type === 'travel'
    ? [record.travel_start_date, record.travel_end_date].filter(Boolean).join(' – ')
    : [record.event_start_date, record.event_end_date].filter(Boolean).join(' – ');
  return <main id="ExperienceCheckout">
    <nav className="experienceCheckoutStepper" aria-label="Booking progress">
      {[['1', 'Booking details'], ['2', 'Participants']].map(([number, label], index) => <React.Fragment key={number}>
        <div className={`experienceStep ${activeStep === index + 1 ? 'is-active' : ''} ${activeStep > index + 1 ? 'is-complete' : ''}`} aria-current={activeStep === index + 1 ? 'step' : undefined}><span>{number}</span><strong>{label}</strong></div>
        {index === 0 && <span className="experienceStepLine" aria-hidden="true" />}
      </React.Fragment>)}
    </nav>
    <div className="experienceCheckoutGrid">
      <section className="experienceCheckoutPanel">
        <h1>{activeStep === 1 ? 'Review your booking' : 'Participant details'}</h1>
        <p className="experienceCheckoutIntro">{record.title} · {type === 'travel' ? 'Travel package' : 'Offline event'}</p>
        {error && <div className="experienceCheckoutError" role="alert">{error}</div>}
        {paymentError && <div className="experienceCheckoutError" role="alert">{paymentError}</div>}
        <form onSubmit={submit}>
          {activeStep === 1 ? <>
            <div className="experienceBookingPreview">
              {recordImage && <img src={recordImage} alt="" />}
              <div><span className="experienceTypeBadge">{type === 'travel' ? 'Travel package' : 'Offline event'}</span><h2>{record.title}</h2>{experienceDate && <p>{experienceDate}</p>}<p>{type === 'travel' ? record.destination : record.venue_name}</p></div>
            </div>
            <label className="experienceCheckoutField">Pricing plan<select value={planId} onChange={(event) => setPlanId(event.target.value)} required><option value="">Select a plan</option>{(record.pricing_plans || []).map((option) => <option value={option.id} key={option.id}>{option.name} — {formatMoney(effectivePrice(option))} per person{option.is_featured ? ' · Recommended' : ''}</option>)}</select></label>
            <label className="experienceCheckoutField">Number of participants<select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>{Array.from({ length: maxQuantity }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} {index === 0 ? 'person' : 'people'}</option>)}</select></label>
            <button type="button" className="experiencePayButton" disabled={!plan} onClick={() => { setError(''); setActiveStep(2); }}>{!plan ? 'Choose a plan to continue' : 'Continue to participant details'} <span aria-hidden="true">→</span></button>
          </> : <>
            <p className="experienceStepHint">Enter details for each person included in this booking.</p>
            <div className="participantProgress"><span>Participant {activeParticipantIndex + 1} of {quantity}</span><div className="participantProgressTrack" role="progressbar" aria-valuemin="1" aria-valuemax={quantity} aria-valuenow={activeParticipantIndex + 1}><span style={{ width: `${((activeParticipantIndex + 1) / quantity) * 100}%` }} /></div></div>
            {participants.slice(activeParticipantIndex, activeParticipantIndex + 1).map((person, offset) => { const index = activeParticipantIndex + offset; return <section className="participantCard" data-participant-index={index} key={index}><h2>{index === 0 ? 'Primary participant · Purchaser' : `Participant ${index + 1}`}</h2>
              <label className="experienceCheckoutField">Full name<input required maxLength={160} value={person.full_name} onChange={(event) => updateParticipant(index, 'full_name', event.target.value)} autoComplete={index === 0 ? 'name' : 'off'} /></label>
              <label className="experienceCheckoutField">Email (optional)<input type="email" maxLength={255} value={person.email} onChange={(event) => updateParticipant(index, 'email', event.target.value)} autoComplete={index === 0 ? 'email' : 'off'} /></label>
              <label className="experienceCheckoutField">Phone number<input required maxLength={50} value={person.phone} onChange={(event) => updateParticipant(index, 'phone', event.target.value)} autoComplete={index === 0 ? 'tel' : 'off'} /></label>
              {type === 'travel' && <div className="experienceCheckoutField"><span>Travel ID proof {proofRequired ? '(required)' : '(optional)'}</span>{person.has_id_proof && <small>Saved proof will be retained if you do not replace it.</small>}<label className="experienceFileUpload" htmlFor={`travel-id-proof-${index}`}><input id={`travel-id-proof-${index}`} type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" required={proofRequired && !person.has_id_proof} onChange={(event) => updateParticipant(index, 'id_proof', event.target.files?.[0] || null)} /><span className="experienceFileUploadButton">Choose file</span><span className="experienceFileUploadName">{person.id_proof?.name || (person.has_id_proof ? 'Existing proof saved' : 'JPG, PNG, or PDF · up to 5 MB')}</span></label></div>}
            </section>; })}
            <div className="experienceCheckoutActions"><button type="button" className="experienceBackButton" onClick={() => { setError(''); if (activeParticipantIndex > 0) setActiveParticipantIndex((current) => current - 1); else setActiveStep(1); }}>{activeParticipantIndex > 0 ? '← Previous participant' : '← Back to booking'}</button>{activeParticipantIndex < quantity - 1 ? <button type="button" className="experiencePayButton" onClick={() => { if (validateParticipant(activeParticipantIndex)) { setError(''); setActiveParticipantIndex((current) => current + 1); } }}>Next participant →</button> : <button className="experiencePayButton" disabled={submitting || paymentStatus === 'processing' || !plan} type="submit">{submitting || paymentStatus === 'processing' ? 'Preparing secure checkout…' : total === 0 ? 'Confirm free booking' : `Continue to pay ${formatMoney(total)}`}</button>}</div>
          </>}
        </form>
      </section>
      <aside className="experienceSummary"><h2>Booking summary</h2><div className="experienceSummaryExperience">{recordImage && <img src={recordImage} alt="" />}<div><strong>{record.title}</strong><span>{type === 'travel' ? 'Travel package' : 'Offline event'}</span></div></div>
        {plan && <><div className="experienceSummaryRow"><span>{plan.name}</span><strong>{formatMoney(effectivePrice(plan))}</strong></div><div className="experienceSummaryRow"><span>Participants</span><strong>{quantity}</strong></div><div className="experienceSummaryRow"><span>Subtotal</span><strong>{formatMoney(total)}</strong></div><div className="experienceSummaryRow experienceSummaryTotal"><span>Total</span><strong>{formatMoney(total)}</strong></div></>}
        {!plan && <p className="experienceSummaryEmpty">Select a pricing plan to see your total.</p>}
        <p className="experienceSecureNote">Your booking is reserved securely. Payment details are handled in the next step.</p>
      </aside>
    </div>
  </main>;
}

export default function ExperienceCheckoutPage() { return <Suspense fallback={<ExperienceCheckoutSkeleton />}><ExperienceCheckoutContent /></Suspense>; }
