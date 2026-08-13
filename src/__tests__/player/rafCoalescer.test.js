/**
 * rafCoalescer.test.js
 *
 * Vitest unit tests for the timeupdate UI-throttling coalescer
 * (src/libs/rafCoalescer.js):
 *   - repeated schedule() calls never create multiple pending animation frames
 *   - the latest scheduled callback is the one that runs
 *   - a pending frame can be cancelled and then never runs
 *   - after a frame fires the coalescer is ready for the next one
 *
 * Run with: npx vitest run src/__tests__/player/rafCoalescer.test.js
 */

import { describe, it, expect, vi } from 'vitest';
import { createRafCoalescer } from '../../libs/rafCoalescer';

describe('createRafCoalescer (timeupdate UI throttling)', () => {
  it('never schedules more than one pending frame across repeated calls', () => {
    const schedule = vi.fn();
    const coalescer = createRafCoalescer({ schedule, cancel: vi.fn() });

    coalescer.schedule(() => {});
    coalescer.schedule(() => {});
    coalescer.schedule(() => {});

    // 3 timeupdate events while playing → only ONE animation frame pending.
    expect(schedule).toHaveBeenCalledTimes(1);
    expect(coalescer.isPending()).toBe(true);
  });

  it('runs only the latest scheduled callback when the frame fires', () => {
    const frames = [];
    const schedule = vi.fn((cb) => {
      frames.push(cb);
      return frames.length;
    });
    const coalescer = createRafCoalescer({ schedule, cancel: vi.fn() });

    const first = vi.fn();
    const latest = vi.fn();
    coalescer.schedule(first);
    coalescer.schedule(latest);

    frames[0](); // the animation frame fires

    expect(latest).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    expect(coalescer.isPending()).toBe(false);
  });

  it('is ready to schedule again after the frame fires', () => {
    const frames = [];
    const schedule = vi.fn((cb) => {
      frames.push(cb);
      return frames.length;
    });
    const coalescer = createRafCoalescer({ schedule, cancel: vi.fn() });

    coalescer.schedule(() => {});
    frames[0]();
    expect(coalescer.isPending()).toBe(false);

    coalescer.schedule(() => {});
    expect(schedule).toHaveBeenCalledTimes(2);
  });

  it('cancels the pending frame so its callback never runs (unmount/lesson change)', () => {
    const frames = [];
    const cancel = vi.fn();
    const schedule = vi.fn((cb) => {
      frames.push(cb);
      return 42;
    });
    const coalescer = createRafCoalescer({ schedule, cancel });

    const fn = vi.fn();
    coalescer.schedule(fn);
    expect(coalescer.isPending()).toBe(true);

    coalescer.cancel();
    expect(cancel).toHaveBeenCalledWith(42);
    expect(coalescer.isPending()).toBe(false);

    // Even if the browser were to invoke the (cancelled) frame, nothing runs.
    frames[0]();
    expect(fn).not.toHaveBeenCalled();
  });

  it('isPending tracks whether a frame is scheduled', () => {
    const schedule = vi.fn();
    const coalescer = createRafCoalescer({ schedule, cancel: vi.fn() });

    expect(coalescer.isPending()).toBe(false);
    coalescer.schedule(() => {});
    expect(coalescer.isPending()).toBe(true);
    coalescer.cancel();
    expect(coalescer.isPending()).toBe(false);
  });
});
