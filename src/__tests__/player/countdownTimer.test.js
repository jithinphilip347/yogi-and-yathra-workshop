/**
 * countdownTimer.test.js
 *
 * Vitest unit tests for the auto-next countdown lifecycle
 * (src/libs/countdownTimer.js):
 *   - timer starts and ticks 5 → 4 → 3 → 2 → 1
 *   - timer completes after the full duration and clears the interval
 *   - timer is cleared on cancel and never fires again
 *   - multiple countdown intervals cannot coexist
 *
 * Run with: npx vitest run src/__tests__/player/countdownTimer.test.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCountdownTimer } from '../../libs/countdownTimer';

describe('createCountdownTimer (auto-next countdown lifecycle)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts the countdown and ticks from duration down to 1', () => {
    const ticks = [];
    const timer = createCountdownTimer({
      duration: 5,
      onTick: (v) => ticks.push(v),
      onComplete: vi.fn(),
    });

    timer.start();
    // The starting value is reported immediately, then one tick per second.
    expect(ticks).toEqual([5]);
    expect(timer.isActive()).toBe(true);

    vi.advanceTimersByTime(1000);
    expect(ticks).toEqual([5, 4]);

    vi.advanceTimersByTime(3000);
    expect(ticks).toEqual([5, 4, 3, 2, 1]);
  });

  it('completes after the full duration and clears the interval', () => {
    const onComplete = vi.fn();
    const timer = createCountdownTimer({ duration: 5, onTick: vi.fn(), onComplete });

    timer.start();
    vi.advanceTimersByTime(5000);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(timer.isActive()).toBe(false);
    // No interval left behind after completion.
    expect(vi.getTimerCount()).toBe(0);
  });

  it('never fires callbacks again after completion', () => {
    const onTick = vi.fn();
    const onComplete = vi.fn();
    const timer = createCountdownTimer({ duration: 2, onTick, onComplete });

    timer.start();
    vi.advanceTimersByTime(2000);
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Advance far beyond the countdown — nothing may fire.
    vi.advanceTimersByTime(10000);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('is cleared on cancel and never fires again (cancel exit path)', () => {
    const onTick = vi.fn();
    const onComplete = vi.fn();
    const timer = createCountdownTimer({ duration: 5, onTick, onComplete });

    timer.start();
    expect(vi.getTimerCount()).toBe(1);

    timer.cancel();
    expect(timer.isActive()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);

    vi.advanceTimersByTime(10000);
    // Only the immediate start tick may have occurred; no navigation callback.
    expect(onTick).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('never runs two concurrent countdown intervals (restart exit path)', () => {
    const timer = createCountdownTimer({ duration: 5, onTick: vi.fn(), onComplete: vi.fn() });

    timer.start();
    // `ended` firing again mid-countdown restarts the countdown.
    timer.start();

    expect(timer.isActive()).toBe(true);
    // Exactly one interval exists, never two.
    expect(vi.getTimerCount()).toBe(1);
  });

  it('restarting cancels the previous countdown (no stale completion)', () => {
    const ticks = [];
    const onComplete = vi.fn();
    const timer = createCountdownTimer({ duration: 5, onTick: (v) => ticks.push(v), onComplete });

    timer.start();
    vi.advanceTimersByTime(2000); // ticks: 5, 4, 3
    timer.start();                // restart resets to 5
    vi.advanceTimersByTime(1000); // ticks: 5, 4 (new countdown)

    expect(ticks).toEqual([5, 4, 3, 5, 4]);
    vi.advanceTimersByTime(5000);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
