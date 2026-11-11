"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { FiArrowRight, FiBookmark, FiX, FiCheck } from 'react-icons/fi';
import '@/assets/css/experience-pricing-plans.scss';

const money = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(amount) || 0);
const effectivePrice = (plan) => plan.discount_price != null && Number(plan.discount_price) >= 0 && Number(plan.discount_price) < Number(plan.price) ? Number(plan.discount_price) : Number(plan.price);

export default function ExperiencePricingPlans({ plans = [], value, onChange, triggerLabel = 'View plan details', checkoutHrefForPlan = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedPlan = plans.find((plan) => String(plan.id) === String(value)) || plans.find((plan) => plan.is_featured) || plans[0];
  const isPrimaryTrigger = triggerLabel === 'Explore Journey' || Boolean(checkoutHrefForPlan);

  useEffect(() => {
    if (!isOpen) return undefined;
    const scrollY = window.scrollY;
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    if (scrollbarWidth) body.style.paddingRight = `${scrollbarWidth}px`;
    const onKeyDown = (event) => { if (event.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyStyles.overflow;
      body.style.position = previousBodyStyles.position;
      body.style.top = previousBodyStyles.top;
      body.style.width = previousBodyStyles.width;
      body.style.paddingRight = previousBodyStyles.paddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  if (!plans.length) return <div className="experiencePlansUnavailable" role="status">Booking is unavailable because no active pricing options are configured.</div>;

  return <section className="experiencePricingPlans" aria-label="Pricing options">
    <div className="experienceCurrentPlan">
      <div className="experienceCurrentPlanCopy">
        <span className="experienceCurrentPlanName">{selectedPlan?.name || 'Selected plan'}</span>
      </div>
      <button type="button" className={`experienceOpenPlans${isPrimaryTrigger ? ' is-primary' : ''}`} onClick={() => setIsOpen(true)}>
        {isPrimaryTrigger ? null : <FiBookmark aria-hidden="true" />} {triggerLabel} {isPrimaryTrigger && <FiArrowRight aria-hidden="true" />}
      </button>
    </div>

    {isOpen && typeof document !== 'undefined' && createPortal(<div className="experiencePlanModalBackdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
      <section
        className="experiencePlanModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="experiencePlanModalTitle"
        onWheel={(event) => {
          const list = event.currentTarget.querySelector('.experiencePlanModalList');
          if (!list || list.scrollHeight <= list.clientHeight) return;
          event.preventDefault();
          list.scrollTop += event.deltaY;
        }}
      >
        <header className="experiencePlanModalHeader">
          <div><h2 id="experiencePlanModalTitle">Choose your plan</h2><p>Compare full plan details and per-person pricing.</p></div>
          <button type="button" className="experiencePlanModalClose" onClick={() => setIsOpen(false)} aria-label="Close pricing plans"><FiX /></button>
        </header>
        <div className="experiencePlanModalList">
          {plans.map((plan) => {
            const selected = String(value || selectedPlan?.id) === String(plan.id);
            const price = effectivePrice(plan);
            return <article key={plan.id} className={`experiencePlanOption${selected ? ' selected' : ''}${plan.is_featured ? ' recommended' : ''}`}>
              <div className="experiencePlanHeading"><strong>{plan.name}</strong>{plan.is_featured && <span className="experienceRecommendedBadge">Recommended</span>}</div>
              <div className="experiencePlanPrice">{money(price)} <small>/ person</small>{price < Number(plan.price) && <del>{money(plan.price)}</del>}</div>
              {plan.description && <p className="experiencePlanDescription">{plan.description}</p>}
              {Array.isArray(plan.included_features) && plan.included_features.length > 0 && <ul>{plan.included_features.map((feature, index) => <li key={`${plan.id}-${index}`}>{feature}</li>)}</ul>}
              {checkoutHrefForPlan ? <Link className="experienceSelectPlan" href={checkoutHrefForPlan(plan)} onClick={() => { onChange(String(plan.id)); setIsOpen(false); }}>
                Book now <FiArrowRight aria-hidden="true" />
              </Link> : <button type="button" className="experienceSelectPlan" aria-pressed={selected} onClick={() => { onChange(String(plan.id)); setIsOpen(false); }}>
                {selected ? <><FiCheck aria-hidden="true" /> Selected</> : 'Select this plan'}
              </button>}
            </article>;
          })}
        </div>
      </section>
    </div>, document.body)}
  </section>;
}
