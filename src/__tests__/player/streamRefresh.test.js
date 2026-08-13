/**
 * streamRefresh.test.js
 *
 * Vitest unit tests for the Sprint 7 bounded stream-refresh flow
 * (src/libs/streamRefresh.js):
 *   - the refresh budget is bounded (no infinite retry loops),
 *   - media URLs are compared by pathname+search so a refreshed signed URL is
 *     detected as a real change while origin differences are ignored.
 *
 * Run with: npx vitest run src/__tests__/player/streamRefresh.test.js
 */

import { describe, it, expect } from 'vitest';
import { shouldRefreshStream, extractUrlKey, MAX_STREAM_REFRESH_ATTEMPTS } from '../../libs/streamRefresh';

describe('shouldRefreshStream (bounded refresh budget)', () => {
  it('allows refreshes for every attempt below the bound', () => {
    // A budget of N means N automatic refreshes may run (attempts 0..N-1).
    expect(shouldRefreshStream(0)).toBe(true);
    expect(shouldRefreshStream(1)).toBe(true);
  });

  it('stops refreshing once the bound is reached (no infinite loop)', () => {
    expect(shouldRefreshStream(MAX_STREAM_REFRESH_ATTEMPTS)).toBe(false);
    expect(shouldRefreshStream(MAX_STREAM_REFRESH_ATTEMPTS + 1)).toBe(false);
    expect(shouldRefreshStream(99)).toBe(false);
  });

  it('respects a custom bound', () => {
    expect(shouldRefreshStream(0, 3)).toBe(true);
    expect(shouldRefreshStream(2, 3)).toBe(true);
    expect(shouldRefreshStream(3, 3)).toBe(false);
  });

  it('maps attempt count 0..max-1 to exactly max refreshes', () => {
    const max = 2;
    let refreshes = 0;
    let attempts = 0;
    // Simulate the VideoEngine loop: refresh while allowed, increment on refresh.
    while (shouldRefreshStream(attempts, max)) {
      attempts += 1;
      refreshes += 1;
    }
    expect(refreshes).toBe(max);
    expect(shouldRefreshStream(attempts, max)).toBe(false);
  });

  it('never refreshes below zero attempts', () => {
    expect(shouldRefreshStream(-1)).toBe(true); // defensive: treat as "no attempts yet"
  });
});

describe('extractUrlKey (media URL identity)', () => {
  it('treats different origins with the same path+search as the same media', () => {
    const a = extractUrlKey('http://localhost:3000/api/v1/video-stream/videos/a.mp4?user=1&expires=100&signature=x');
    const b = extractUrlKey('http://localhost:8000/api/v1/video-stream/videos/a.mp4?user=1&expires=100&signature=x');
    expect(a).toBe(b);
  });

  it('detects a refreshed signed URL (new expiry/signature) as a real change', () => {
    const oldKey = extractUrlKey('http://localhost/api/v1/video-stream/videos/a.mp4?user=1&expires=100&signature=old');
    const newKey = extractUrlKey('http://localhost/api/v1/video-stream/videos/a.mp4?user=1&expires=200&signature=new');
    expect(oldKey).not.toBe(newKey);
  });

  it('detects a genuine path change', () => {
    const a = extractUrlKey('http://localhost/api/v1/video-stream/videos/a.mp4');
    const b = extractUrlKey('http://localhost/api/v1/video-stream/videos/b.mp4');
    expect(a).not.toBe(b);
  });

  it('is stable across absolute and relative forms of the same file', () => {
    expect(extractUrlKey('/api/v1/video-stream/videos/a.mp4?x=1')).toBe(
      extractUrlKey('http://localhost/api/v1/video-stream/videos/a.mp4?x=1')
    );
  });

  it('returns the raw string for unparseable URLs', () => {
    expect(extractUrlKey('not a url at all')).toBe('not a url at all');
    expect(extractUrlKey('')).toBe('');
    expect(extractUrlKey(undefined)).toBe('');
  });
});
