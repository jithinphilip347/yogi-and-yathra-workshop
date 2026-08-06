/**
 * playbackSync.test.js
 *
 * Vitest unit tests for the Course Player synchronization contract (Phases 9, 10, 14):
 * - The local playback session is authoritative; server responses may only persist.
 * - Server positions are applied monotonically — never backwards.
 * - Stale / out-of-order responses can never downgrade playback state.
 * - Completion stays sticky against stale in_progress responses, while the
 *   manual toggle can still force-exact status.
 *
 * Run with: npx vitest run src/__tests__/player/
 */

import { describe, it, expect } from 'vitest';
import {
  createPlaybackSession,
  isStaleServerPosition,
  mergeProgressRecord,
} from '../../libs/playbackSync';

const baseLesson = (overrides = {}) => ({
  id: 1,
  title: 'Lesson 1',
  last_position_seconds: 0,
  percentage_watched: 0,
  watched_seconds: 0,
  status: 'not_started',
  is_completed: false,
  ...overrides,
});

describe('createPlaybackSession', () => {
  it('starts clean for a lesson', () => {
    const s = createPlaybackSession(5, 32);
    expect(s.lessonId).toBe(5);
    expect(s.localPosition).toBe(32);
    expect(s.lastSyncedPosition).toBe(0);
    expect(s.resumed).toBe(false);
    expect(s.version).toBe(0);
  });

  it('never accepts negative positions', () => {
    expect(createPlaybackSession(1, -5).localPosition).toBe(0);
  });
});

describe('isStaleServerPosition', () => {
  it('flags older server positions as stale', () => {
    expect(isStaleServerPosition(120, 32)).toBe(true);
    expect(isStaleServerPosition(120, 119)).toBe(true);
  });

  it('accepts equal or newer positions', () => {
    expect(isStaleServerPosition(120, 120)).toBe(false);
    expect(isStaleServerPosition(120, 121)).toBe(false);
  });
});

describe('mergeProgressRecord', () => {
  it('accepts a newer position and percentage', () => {
    const lesson = baseLesson({ last_position_seconds: 32, percentage_watched: 20, status: 'in_progress' });
    const { merged, isStale, nextAppliedPosition } = mergeProgressRecord(
      lesson,
      { last_position_seconds: 100, percentage_watched: 50, status: 'in_progress' },
      32
    );
    expect(merged.last_position_seconds).toBe(100);
    expect(merged.percentage_watched).toBe(50);
    expect(isStale).toBe(false);
    expect(nextAppliedPosition).toBe(100);
  });

  it('never regresses position or percentage from a stale response', () => {
    const lesson = baseLesson({ last_position_seconds: 100, percentage_watched: 50, status: 'in_progress' });
    const { merged, isStale } = mergeProgressRecord(
      lesson,
      { last_position_seconds: 32, percentage_watched: 20, status: 'in_progress' },
      100
    );
    expect(isStale).toBe(true);
    expect(merged.last_position_seconds).toBe(100);
    expect(merged.percentage_watched).toBe(50);
  });

  it('keeps completion sticky against a stale in_progress response', () => {
    const lesson = baseLesson({ last_position_seconds: 100, percentage_watched: 100, status: 'completed', is_completed: true });
    const { merged } = mergeProgressRecord(
      lesson,
      { last_position_seconds: 32, percentage_watched: 20, status: 'in_progress' },
      100
    );
    expect(merged.is_completed).toBe(true);
    expect(merged.status).toBe('completed');
  });

  it('accepts a backward seek echo from the server (server keeps the max)', () => {
    // Student seeks from 120s back to 10s; the backend echoes its stored max (120).
    const lesson = baseLesson({ last_position_seconds: 120, percentage_watched: 40, status: 'in_progress' });
    const { merged, isStale } = mergeProgressRecord(
      lesson,
      { last_position_seconds: 120, percentage_watched: 40, status: 'in_progress' },
      120
    );
    expect(isStale).toBe(false);
    expect(merged.last_position_seconds).toBe(120);
  });

  it('forceStatus allows the manual toggle to reset completion', () => {
    const lesson = baseLesson({ last_position_seconds: 120, percentage_watched: 100, status: 'completed', is_completed: true });
    const { merged } = mergeProgressRecord(
      lesson,
      { last_position_seconds: 120, percentage_watched: 100, status: 'in_progress' },
      120,
      { forceStatus: true }
    );
    expect(merged.is_completed).toBe(false);
    expect(merged.status).toBe('in_progress');
  });

  it('forceStatus applies an exact completed status', () => {
    const lesson = baseLesson({ last_position_seconds: 10, status: 'in_progress', is_completed: false });
    const { merged } = mergeProgressRecord(
      lesson,
      { last_position_seconds: 10, percentage_watched: 100, status: 'completed' },
      10,
      { forceStatus: true }
    );
    expect(merged.is_completed).toBe(true);
  });

  it('auto-completion status is sticky once achieved', () => {
    const lesson = baseLesson({ last_position_seconds: 120, percentage_watched: 100, status: 'completed', is_completed: true });
    const { merged } = mergeProgressRecord(
      lesson,
      { last_position_seconds: 125, percentage_watched: 100, status: 'completed' },
      120
    );
    expect(merged.is_completed).toBe(true);
    expect(merged.status).toBe('completed');
  });
});
