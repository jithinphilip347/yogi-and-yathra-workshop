"use client";
import { useState } from 'react';
import '@/assets/css/experience-pricing-plans.scss';

const money = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(amount) || 0);

export default function ExperiencePricingPlans({ plans = [], value, onChange }) {
  const [expanded, setExpanded] = useState(false);
  if (!plans.length) return <div className="experiencePlansUnavailable" role="status">Booking is unavailable because no active pricing options are configured.</div>;
  const featured = plans.find((plan) => plan.is_featured) || plans[0];
  const others = plans.filter((plan) => String(plan.id) !== String(featured.id));
  const renderPlan = (plan, isFeatured = false) => {
    const selected = String(value) === String(plan.id);
    const effective = plan.discount_price != null && Number(plan.discount_price) >= 0 && Number(plan.discount_price) < Number(plan.price) ? Number(plan.discount_price) : Number(plan.price);
    return <button type="button" key={plan.id} className={`experiencePlanOption${selected ? ' selected' : ''}${isFeatured ? ' recommended' : ''}`} onClick={() => onChange(String(plan.id))} aria-pressed={selected}>
      <span className="experiencePlanHeading"><strong>{plan.name}</strong>{isFeatured && <span className="experienceRecommendedBadge">Recommended</span>}</span>
      <span className="experiencePlanPrice">{money(effective)} <small>/ person</small>{effective < Number(plan.price) && <del>{money(plan.price)}</del>}</span>
      {plan.description && <span className="experiencePlanDescription">{plan.description}</span>}
      {Array.isArray(plan.included_features) && plan.included_features.length > 0 && <ul>{plan.included_features.map((feature, index) => <li key={`${plan.id}-${index}`}>{feature}</li>)}</ul>}
    </button>;
  };
  return <section className="experiencePricingPlans" aria-label="Pricing options">
    <h2>Choose your plan</h2>
    {renderPlan(featured, true)}
    {others.length > 0 && <>
      <button className="experienceExplorePlans" type="button" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>{expanded ? 'Hide other plans' : 'Explore other plans'}</button>
      {expanded && <div className="experienceOtherPlans">{others.map((plan) => renderPlan(plan))}</div>}
    </>}
  </section>;
}
