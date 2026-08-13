/**
 * playerSessionCache.test.js
 *
 * Vitest unit tests for the Course Player session cache lifecycle (Sprint 5):
 * - Cache miss performs a fresh session (returns null for unset keys).
 * - Cache hits reuse the session only for the same course AND user.
 * - Course A can never consume Course B's cached session.
 * - User A's cached session is never returned to User B (logout/user switch).
 * - clear() drops the session (logout / 401 invalidation).
 * - Invalid/partial payloads are never cached.
 * - mergeLightSession correctly merges a light navigation response into the
 *   cached full session without stale neighbors or lost course structure.
 *
 * Run with: npx vitest run src/__tests__/player/
 */

import { describe, it, expect, beforeEach } from 'vitest';
import playerSessionCache, { mergeLightSession } from '../../libs/playerSessionCache';

const sessionFor = (slug, overrides = {}) => ({
  course: { id: 1, slug, title: `${slug} course` },
  sections: [{ id: 10, title: 'Ch 1', lessons: [{ id: 101, title: 'Lesson A' }] }],
  enrollment: { is_enrolled: true, status: 'active' },
  permissions: { is_enrolled: true, has_access: true, is_preview: false },
  completion_summary: { completed_count: 0, total_lessons: 1, percentage: 0 },
  certificate_eligibility: { eligible: false, is_claimed: false },
  current_lesson: { id: 101, title: 'Lesson A' },
  next_lesson: { id: 102, title: 'Lesson B' },
  previous_lesson: null,
  ...overrides,
});

describe('playerSessionCache', () => {
  beforeEach(() => {
    playerSessionCache.clear();
  });

  it('returns null on cache miss (no session stored)', () => {
    expect(playerSessionCache.get('course-a', 7)).toBeNull();
  });

  it('stores and returns a session for the same course + user', () => {
    const session = sessionFor('course-a');
    playerSessionCache.set('course-a', session, 7);
    expect(playerSessionCache.get('course-a', 7)).toBe(session);
  });

  it('course A can never consume course B cached data', () => {
    playerSessionCache.set('course-a', sessionFor('course-a'), 7);
    // Same user, different course → cache miss (different cache key).
    expect(playerSessionCache.get('course-b', 7)).toBeNull();
  });

  it('user A session is never returned to user B', () => {
    playerSessionCache.set('course-a', sessionFor('course-a'), 7);
    // Same course, different user → cache miss (user-scoped key).
    expect(playerSessionCache.get('course-a', 99)).toBeNull();
  });

  it('anonymous and authenticated sessions do not collide', () => {
    playerSessionCache.set('course-a', sessionFor('course-a'), null);
    expect(playerSessionCache.get('course-a', 7)).toBeNull();
    expect(playerSessionCache.get('course-a', null)).not.toBeNull();
  });

  it('clear() drops the cached session (logout / 401)', () => {
    playerSessionCache.set('course-a', sessionFor('course-a'), 7);
    playerSessionCache.clear();
    expect(playerSessionCache.get('course-a', 7)).toBeNull();
  });

  it('never caches invalid / partial payloads without a course', () => {
    playerSessionCache.set('course-a', undefined, 7);
    playerSessionCache.set('course-a', null, 7);
    playerSessionCache.set('course-a', { current_lesson: { id: 1 } }, 7);
    playerSessionCache.set('course-a', { error: 'partial error payload' }, 7);
    expect(playerSessionCache.get('course-a', 7)).toBeNull();
  });

  it('navigating to another course replaces (not accumulates) the session', () => {
    playerSessionCache.set('course-a', sessionFor('course-a'), 7);
    playerSessionCache.set('course-b', sessionFor('course-b'), 7);
    // Only one session is held at a time — course A is discarded.
    expect(playerSessionCache.get('course-a', 7)).toBeNull();
    expect(playerSessionCache.get('course-b', 7)).not.toBeNull();
  });
});

describe('mergeLightSession', () => {
  it('replaces current_lesson and merges permissions + completion summary', () => {
    const cached = sessionFor('course-a', {
      permissions: { is_enrolled: true, has_access: true, is_preview: false },
      completion_summary: { completed_count: 0, total_lessons: 1, percentage: 0 },
    });
    const merged = mergeLightSession(cached, {
      current_lesson: { id: 102, title: 'Lesson B' },
      next_lesson: null,
      previous_lesson: { id: 101, title: 'Lesson A' },
      permissions: { has_access: true, is_preview: false },
      completion_summary: { completed_count: 1, total_lessons: 1, percentage: 100 },
    });

    expect(merged.current_lesson.id).toBe(102);
    // Course structure is preserved from the cached session.
    expect(merged.course.slug).toBe('course-a');
    expect(merged.sections).toEqual(cached.sections);
    expect(merged.enrollment).toEqual(cached.enrollment);
    expect(merged.certificate_eligibility).toEqual(cached.certificate_eligibility);
    // Light values win while extra permission keys survive.
    expect(merged.permissions).toEqual({ is_enrolled: true, has_access: true, is_preview: false });
    expect(merged.completion_summary.percentage).toBe(100);
  });

  it('clears a stale next_lesson when the light response reports none', () => {
    const cached = sessionFor('course-a', { next_lesson: { id: 102, title: 'Lesson B' } });
    const merged = mergeLightSession(cached, {
      current_lesson: { id: 102, title: 'Lesson B' },
      next_lesson: null,
      previous_lesson: { id: 101, title: 'Lesson A' },
    });

    // Moving to the last lesson must NOT retain lesson B as next.
    expect(merged.next_lesson).toBeNull();
  });

  it('clears a stale previous_lesson when the light response reports none', () => {
    const cached = sessionFor('course-a', { previous_lesson: { id: 100, title: 'Lesson 0' } });
    const merged = mergeLightSession(cached, {
      current_lesson: { id: 101, title: 'Lesson A' },
      next_lesson: { id: 102, title: 'Lesson B' },
      previous_lesson: null,
    });

    expect(merged.previous_lesson).toBeNull();
  });

  it('does not mutate the cached session object', () => {
    const cached = sessionFor('course-a', { next_lesson: { id: 102, title: 'Lesson B' } });
    const snapshot = JSON.stringify(cached);
    mergeLightSession(cached, { current_lesson: { id: 999 }, next_lesson: null, previous_lesson: null });

    expect(JSON.stringify(cached)).toBe(snapshot);
    expect(cached.current_lesson.id).toBe(101);
  });

  it('returns the cached session unchanged when light data is absent', () => {
    const cached = sessionFor('course-a');
    expect(mergeLightSession(cached, null)).toBe(cached);
    expect(mergeLightSession(null, { current_lesson: {} })).toBeNull();
  });
});
