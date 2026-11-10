import '@/assets/css/experience-skeletons.scss';

const Pulse = ({ className = '' }) => <span className={`experienceSkeletonPulse ${className}`} aria-hidden="true" />;

export function ExperienceListingSkeleton({ type = 'event', count = 6 }) {
  return <div className={`experienceListingSkeleton ${type === 'travel' ? 'is-travel' : 'is-event'}`} role="status" aria-label={`Loading ${type === 'travel' ? 'travel packages' : 'events'}`}>
    {Array.from({ length: count }, (_, index) => <article className="experienceListingSkeletonCard" key={index}>
      <Pulse className="experienceListingSkeletonImage" />
      <div className="experienceListingSkeletonBody">
        <div className="experienceSkeletonRow"><Pulse className="w-32" /><Pulse className="w-24" /></div>
        <Pulse className="h-6 w-70" />
        <Pulse className="h-4 w-45" />
        <Pulse className="h-4 w-90" />
        <div className="experienceSkeletonRow"><Pulse className="h-5 w-28" /><Pulse className="h-5 w-24" /></div>
        <div className="experienceSkeletonRow experienceSkeletonFooter"><Pulse className="h-9 w-32" /><Pulse className="h-10 w-36" /></div>
      </div>
    </article>)}
  </div>;
}

export function ExperienceDetailsSkeleton({ type = 'event' }) {
  return <main className="experienceDetailsSkeleton" role="status" aria-label={`Loading ${type === 'travel' ? 'travel package' : 'event'} details`}>
    <Pulse className="experienceDetailsSkeletonHero" />
    <div className="experienceDetailsSkeletonGrid">
      <div className="experienceDetailsSkeletonMain">
        <div className="experienceSkeletonRow"><Pulse className="h-5 w-36" /><Pulse className="h-5 w-28" /></div>
        <Pulse className="h-10 w-70" />
        <Pulse className="h-5 w-90" />
        <section className="experienceDetailsSkeletonBlock"><Pulse className="h-7 w-48" /><div className="experienceDetailsSkeletonSpecs">{Array.from({ length: 4 }, (_, i) => <Pulse className="experienceSkeletonSpec" key={i} />)}</div></section>
        <section className="experienceDetailsSkeletonBlock"><Pulse className="h-7 w-44" /><Pulse className="h-28 w-100" /></section>
        <section className="experienceDetailsSkeletonBlock"><Pulse className="h-7 w-52" />{[0, 1, 2].map((i) => <Pulse className="h-16 w-100" key={i} />)}</section>
      </div>
      <aside className="experienceDetailsSkeletonAside"><Pulse className="h-5 w-32" /><Pulse className="h-10 w-60" /><Pulse className="h-14 w-100" /><Pulse className="h-24 w-100" /><Pulse className="h-14 w-100" /></aside>
    </div>
  </main>;
}

export function ExperienceCheckoutSkeleton() {
  return <main id="ExperienceCheckout" className="experienceCheckoutSkeleton" role="status" aria-label="Loading booking checkout">
    <div className="experienceCheckoutSkeletonStepper"><Pulse className="h-12 w-12 circle" /><Pulse className="h-4 w-28" /><Pulse className="h-1 w-24" /><Pulse className="h-12 w-12 circle" /><Pulse className="h-4 w-28" /></div>
    <div className="experienceCheckoutSkeletonGrid">
      <section className="experienceCheckoutSkeletonPanel"><Pulse className="h-8 w-60" /><Pulse className="h-4 w-80" />{Array.from({ length: 4 }, (_, i) => <div className="experienceCheckoutSkeletonField" key={i}><Pulse className="h-4 w-32" /><Pulse className="h-12 w-100" /></div>)}<Pulse className="h-12 w-44" /></section>
      <aside className="experienceCheckoutSkeletonPanel"><Pulse className="h-7 w-44" /><Pulse className="h-20 w-100" /><Pulse className="h-5 w-100" /><Pulse className="h-5 w-80" /><Pulse className="h-px w-100" /><Pulse className="h-7 w-100" /></aside>
    </div>
  </main>;
}
