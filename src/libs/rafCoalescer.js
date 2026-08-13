/**
 * rafCoalescer.js
 *
 * Coalesces high-frequency callers (e.g. media `timeupdate` events) into at
 * most ONE pending requestAnimationFrame callback:
 *
 *   timeupdate → schedule(fn)          // pending frame scheduled
 *   timeupdate → schedule(fn)          // pending frame exists — only the
 *                                      // latest fn is kept, NO second frame
 *   frame fires → run latest fn        // pending cleared
 *
 * cancel() guarantees a pending callback can never run after cleanup (unmount
 * or lesson change). The browser rAF functions are resolved lazily so the
 * factory is safe to construct during server-side rendering; callers may
 * inject fake schedule/cancel functions in tests.
 */

export function createRafCoalescer({ schedule, cancel } = {}) {
  const raf =
    schedule ||
    (typeof globalThis.requestAnimationFrame === 'function'
      ? globalThis.requestAnimationFrame.bind(globalThis)
      : null);
  const caf =
    cancel ||
    (typeof globalThis.cancelAnimationFrame === 'function'
      ? globalThis.cancelAnimationFrame.bind(globalThis)
      : null);

  let pending = null;
  let scheduledFn = null;

  const scheduleOnce = (fn) => {
    scheduledFn = fn;
    if (pending !== null) return false; // frame already pending — latest fn wins

    if (raf === null) {
      // No animation-frame support (SSR / non-browser) — run immediately.
      scheduledFn = null;
      fn();
      return true;
    }

    pending = raf(() => {
      pending = null;
      const run = scheduledFn;
      scheduledFn = null;
      if (run) run();
    });
    return true;
  };

  const cancelPending = () => {
    if (pending !== null && caf !== null) {
      caf(pending);
    }
    pending = null;
    scheduledFn = null;
  };

  const isPending = () => pending !== null;

  return { schedule: scheduleOnce, cancel: cancelPending, isPending };
}
