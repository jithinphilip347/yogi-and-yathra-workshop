/**
 * countdownTimer.js
 *
 * Minimal single-interval countdown used by the auto-next flow.
 *
 * Owning the interval lifecycle in one place guarantees:
 *   - at most ONE countdown interval can ever be active (start() clears any
 *     existing interval before (re)starting),
 *   - every exit path (complete / cancel / restart) clears the interval,
 *   - completion invokes onComplete exactly once and never ticks again.
 *
 * Kept as a plain factory (not a React hook) so the lifecycle is
 * unit-testable without a DOM or a player.
 */

export function createCountdownTimer({ duration = 5, onTick, onComplete }) {
  let interval = null;
  let remaining = 0;

  const clear = () => {
    if (interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  };

  const start = () => {
    // Never allow two concurrent countdowns: clear any existing interval
    // before (re)starting (e.g. `ended` firing again mid-countdown).
    clear();
    remaining = duration;
    if (typeof onTick === 'function') onTick(remaining);

    interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clear();
        if (typeof onComplete === 'function') onComplete();
      } else if (typeof onTick === 'function') {
        onTick(remaining);
      }
    }, 1000);
  };

  const cancel = () => {
    clear();
  };

  const isActive = () => interval !== null;

  return { start, cancel, clear, isActive };
}
