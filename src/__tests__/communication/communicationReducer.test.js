/**
 * communicationReducer.test.js
 *
 * Vitest unit tests for the centralized communication reducer.
 * Run with: npx vitest run src/__tests__/communication/
 */

import { describe, it, expect } from 'vitest';
import {
  communicationReducer,
  initialState,
  COMM_ACTIONS,
} from '../../communication/communicationReducer';

const baseMsg = (overrides = {}) => ({
  id: 1,
  thread_id: 10,
  body: 'Hello',
  user_id: 42,
  author: { id: 42, name: 'Alice', role: 'student' },
  reactions: [],
  created_at: '2026-08-05T08:00:00.000Z',
  ...overrides,
});

describe('THREADS_LOADED', () => {
  it('replaces threads and sets context', () => {
    const threads = [{ id: 1, title: 'Thread 1' }];
    const state = communicationReducer(initialState, {
      type: COMM_ACTIONS.THREADS_LOADED,
      payload: { threads, contextType: 'course', contextId: 5 },
    });
    expect(state.threads).toEqual(threads);
    expect(state.contextType).toBe('course');
    expect(state.contextId).toBe(5);
    expect(state.loading).toBe(false);
  });
});

describe('MESSAGE_CREATED', () => {
  it('appends a new message to the correct thread', () => {
    const msg = baseMsg();
    const state = communicationReducer(initialState, {
      type: COMM_ACTIONS.MESSAGE_CREATED,
      payload: { message: msg },
    });
    expect(state.messagesByThread['10']).toHaveLength(1);
    expect(state.messagesByThread['10'][0].id).toBe(1);
  });

  it('deduplicates: ignores message with same id', () => {
    const msg = baseMsg();
    let state = communicationReducer(initialState, {
      type: COMM_ACTIONS.MESSAGE_CREATED,
      payload: { message: msg },
    });
    state = communicationReducer(state, {
      type: COMM_ACTIONS.MESSAGE_CREATED,
      payload: { message: msg },
    });
    expect(state.messagesByThread['10']).toHaveLength(1);
  });

  it('sorts messages by created_at ASC', () => {
    const msg1 = baseMsg({ id: 1, created_at: '2026-08-05T08:00:00.000Z' });
    const msg2 = baseMsg({ id: 2, created_at: '2026-08-05T07:00:00.000Z' }); // earlier
    let state = communicationReducer(initialState, {
      type: COMM_ACTIONS.MESSAGE_CREATED,
      payload: { message: msg1 },
    });
    state = communicationReducer(state, {
      type: COMM_ACTIONS.MESSAGE_CREATED,
      payload: { message: msg2 },
    });
    expect(state.messagesByThread['10'][0].id).toBe(2); // earlier message first
    expect(state.messagesByThread['10'][1].id).toBe(1);
  });

  it('increments unread count when thread is not active', () => {
    const msg = baseMsg();
    // activeThreadId is null → not active
    const state = communicationReducer(initialState, {
      type: COMM_ACTIONS.MESSAGE_CREATED,
      payload: { message: msg },
    });
    expect(state.unreadByThread['10']).toBe(1);
  });

  it('does NOT increment unread when thread IS active', () => {
    const withActive = { ...initialState, activeThreadId: 10 };
    const state = communicationReducer(withActive, {
      type: COMM_ACTIONS.MESSAGE_CREATED,
      payload: { message: baseMsg() },
    });
    expect(state.unreadByThread['10']).toBe(0);
  });
});

describe('MESSAGE_DELETED', () => {
  it('soft-deletes: replaces body with placeholder', () => {
    const msg = baseMsg();
    let state = communicationReducer(initialState, {
      type: COMM_ACTIONS.MESSAGE_CREATED,
      payload: { message: msg },
    });
    state = communicationReducer(state, {
      type: COMM_ACTIONS.MESSAGE_DELETED,
      payload: { messageId: 1, threadId: 10 },
    });
    expect(state.messagesByThread['10'][0].body).toBe('[Message deleted]');
    expect(state.messagesByThread['10'][0].deleted_at).toBeTruthy();
  });
});

describe('OPTIMISTIC_ADD → OPTIMISTIC_CONFIRM', () => {
  it('adds optimistic message, then replaces it with server message', () => {
    const clientId = 'opt_123';
    const optimistic = baseMsg({ id: clientId, _clientId: clientId, _isPending: true });
    const serverMsg  = baseMsg({ id: 99, body: 'Confirmed' });

    let state = communicationReducer(initialState, {
      type: COMM_ACTIONS.OPTIMISTIC_ADD,
      payload: { clientId, message: optimistic, threadId: 10 },
    });

    expect(state.messagesByThread['10']).toHaveLength(1);
    expect(state.messagesByThread['10'][0]._isPending).toBe(true);
    expect(state.optimisticMessages[clientId]).toBeTruthy();

    state = communicationReducer(state, {
      type: COMM_ACTIONS.OPTIMISTIC_CONFIRM,
      payload: { clientId, message: serverMsg },
    });

    // Optimistic message removed, server message added
    expect(state.messagesByThread['10'].some((m) => m._clientId === clientId)).toBe(false);
    expect(state.messagesByThread['10'].some((m) => m.id === 99)).toBe(true);
    expect(state.optimisticMessages[clientId]).toBeUndefined();
  });
});

describe('OPTIMISTIC_ROLLBACK', () => {
  it('removes the optimistic message on failure', () => {
    const clientId = 'opt_fail';
    const optimistic = baseMsg({ id: clientId, _clientId: clientId, _isPending: true });

    let state = communicationReducer(initialState, {
      type: COMM_ACTIONS.OPTIMISTIC_ADD,
      payload: { clientId, message: optimistic, threadId: 10 },
    });

    state = communicationReducer(state, {
      type: COMM_ACTIONS.OPTIMISTIC_ROLLBACK,
      payload: { clientId, threadId: 10 },
    });

    expect(state.messagesByThread['10']).toHaveLength(0);
    expect(state.optimisticMessages[clientId]).toBeUndefined();
  });
});

describe('REACTION_UPDATED', () => {
  it('adds a reaction to the correct message', () => {
    const msg = baseMsg({ id: 5, thread_id: 10 });
    let state = communicationReducer(initialState, {
      type: COMM_ACTIONS.MESSAGE_CREATED,
      payload: { message: msg },
    });
    state = communicationReducer(state, {
      type: COMM_ACTIONS.REACTION_UPDATED,
      payload: { messageId: 5, threadId: 10, action: 'added', reaction: 'like', userId: 42, userName: 'Alice' },
    });
    expect(state.messagesByThread['10'][0].reactions).toHaveLength(1);
    expect(state.messagesByThread['10'][0].reactions[0].reaction).toBe('like');
  });

  it('removes a reaction on action=removed', () => {
    const msg = baseMsg({
      id: 5,
      thread_id: 10,
      reactions: [{ user_id: 42, reaction: 'like', user: { name: 'Alice' } }],
    });
    let state = communicationReducer(initialState, {
      type: COMM_ACTIONS.MESSAGE_CREATED,
      payload: { message: msg },
    });
    state = communicationReducer(state, {
      type: COMM_ACTIONS.REACTION_UPDATED,
      payload: { messageId: 5, threadId: 10, action: 'removed', reaction: 'like', userId: 42, userName: 'Alice' },
    });
    expect(state.messagesByThread['10'][0].reactions).toHaveLength(0);
  });
});

describe('THREAD_STATUS_UPDATED', () => {
  it('updates is_pinned on the correct thread', () => {
    const threads = [{ id: 1, is_pinned: false, is_locked: false, is_resolved: false }];
    let state = communicationReducer(
      { ...initialState, threads },
      {
        type: COMM_ACTIONS.THREAD_STATUS_UPDATED,
        payload: { threadId: 1, isPinned: true },
      }
    );
    expect(state.threads[0].is_pinned).toBe(true);
  });
});

describe('CLEAR_CONTEXT', () => {
  it('resets all message cache and thread data', () => {
    const msg = baseMsg();
    let state = communicationReducer(initialState, {
      type: COMM_ACTIONS.MESSAGE_CREATED,
      payload: { message: msg },
    });
    state = communicationReducer(state, {
      type: COMM_ACTIONS.CLEAR_CONTEXT,
      payload: { contextType: 'lesson', contextId: 7 },
    });
    expect(state.messagesByThread).toEqual({});
    expect(state.threads).toEqual([]);
    expect(state.contextType).toBe('lesson');
    expect(state.contextId).toBe(7);
  });
});

describe('TYPING', () => {
  it('adds and removes typing users per thread', () => {
    let state = communicationReducer(initialState, {
      type: COMM_ACTIONS.TYPING_STARTED,
      payload: { threadId: 10, userId: 42, userName: 'Alice' },
    });
    expect(state.typingByThread['10']).toHaveLength(1);

    state = communicationReducer(state, {
      type: COMM_ACTIONS.TYPING_STOPPED,
      payload: { threadId: 10, userId: 42 },
    });
    expect(state.typingByThread['10']).toHaveLength(0);
  });
});
