/**
 * Communication Reducer
 * Central event processor for all realtime communication state.
 * Every WebSocket event and user action flows through this reducer.
 */

// ─── Action Types ──────────────────────────────────────────────────────────
export const COMM_ACTIONS = {
  // Thread lifecycle
  THREADS_LOADED:           'THREADS_LOADED',
  THREAD_STATUS_UPDATED:    'THREAD_STATUS_UPDATED',
  THREAD_CREATED:           'THREAD_CREATED',
  THREAD_DELETED:           'THREAD_DELETED',
  SET_ACTIVE_THREAD:        'SET_ACTIVE_THREAD',

  // Message lifecycle
  MESSAGES_LOADED:          'MESSAGES_LOADED',
  MESSAGE_CREATED:          'MESSAGE_CREATED',
  MESSAGE_UPDATED:          'MESSAGE_UPDATED',
  MESSAGE_DELETED:          'MESSAGE_DELETED',

  // Optimistic updates
  OPTIMISTIC_ADD:           'OPTIMISTIC_ADD',
  OPTIMISTIC_CONFIRM:       'OPTIMISTIC_CONFIRM',
  OPTIMISTIC_ROLLBACK:      'OPTIMISTIC_ROLLBACK',

  // Reactions
  REACTION_UPDATED:         'REACTION_UPDATED',

  // Typing
  TYPING_STARTED:           'TYPING_STARTED',
  TYPING_STOPPED:           'TYPING_STOPPED',

  // Presence
  PRESENCE_UPDATED:         'PRESENCE_UPDATED',

  // Read receipts
  MARK_THREAD_READ:         'MARK_THREAD_READ',
  SET_UNREAD_COUNT:         'SET_UNREAD_COUNT',

  // Context management
  CLEAR_CONTEXT:            'CLEAR_CONTEXT',
  SET_LOADING:              'SET_LOADING',
  SET_ERROR:                'SET_ERROR',
};

// ─── Initial State ─────────────────────────────────────────────────────────
export const initialState = {
  // Thread index for current course/lesson context
  threads: [],

  // Message cache: { [threadId]: Message[] }
  messagesByThread: {},

  // Pagination metadata cache: { [threadId]: { current_page, last_page, total } }
  paginationByThread: {},

  // Currently active thread
  activeThreadId: null,

  // Typing: { [threadId]: { userId, userName, expiresAt }[] }
  typingByThread: {},

  // Presence: { online: User[], idle: User[] }
  presence: { online: [], idle: [] },

  // Unread: { [threadId]: number }
  unreadByThread: {},

  // Optimistic messages: { [clientId]: Message }
  optimisticMessages: {},

  // UI state
  loading: false,
  error: null,

  // Context tracking
  contextType: null,   // 'course' | 'lesson'
  contextId: null,     // course.id or lesson.id
};

// ─── Helper: Deduplicate + Sort Messages ──────────────────────────────────
function mergeMessages(existing = [], incoming) {
  const map = new Map();
  for (const m of existing) map.set(String(m.id), m);

  if (Array.isArray(incoming)) {
    for (const m of incoming) map.set(String(m.id), m);
  } else if (incoming) {
    map.set(String(incoming.id), incoming);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
  );
}

// ─── Helper: Apply reaction update to a message ───────────────────────────
function applyReactionUpdate(message, event) {
  if (Number(message.id) !== Number(event.messageId)) return message;

  const reactions = Array.isArray(message.reactions) ? [...message.reactions] : [];
  const existingIdx = reactions.findIndex(
    (r) => Number(r.user_id) === Number(event.userId) && r.reaction === event.reaction
  );

  if (event.action === 'added' && existingIdx === -1) {
    reactions.push({
      user_id: event.userId,
      reaction: event.reaction,
      user: { name: event.userName },
    });
  } else if (event.action === 'removed' && existingIdx !== -1) {
    reactions.splice(existingIdx, 1);
  }

  return { ...message, reactions };
}

// ─── Reducer ───────────────────────────────────────────────────────────────
export function communicationReducer(state, action) {
  switch (action.type) {

    // ── Threads ────────────────────────────────────────────────────────────
    case COMM_ACTIONS.THREADS_LOADED: {
      return {
        ...state,
        threads: action.payload.threads || [],
        contextType: action.payload.contextType,
        contextId: action.payload.contextId,
        loading: false,
        error: null,
      };
    }

    case COMM_ACTIONS.THREAD_CREATED: {
      const exists = state.threads.some((t) => Number(t.id) === Number(action.payload.thread.id));
      if (exists) return state;
      return {
        ...state,
        threads: [action.payload.thread, ...state.threads],
      };
    }

    case COMM_ACTIONS.THREAD_STATUS_UPDATED: {
      const { threadId, isPinned, isLocked, isResolved, action: statusAction } = action.payload;
      return {
        ...state,
        threads: state.threads.map((t) =>
          Number(t.id) === Number(threadId)
            ? {
                ...t,
                is_pinned: isPinned ?? t.is_pinned,
                is_locked: isLocked ?? t.is_locked,
                is_resolved: isResolved ?? t.is_resolved,
              }
            : t
        ),
      };
    }

    case COMM_ACTIONS.THREAD_DELETED: {
      const { threadId } = action.payload;
      const newThreads = state.threads.filter((t) => Number(t.id) !== Number(threadId));
      const newActiveId =
        Number(state.activeThreadId) === Number(threadId)
          ? (newThreads[0]?.id ?? null)
          : state.activeThreadId;
      const newMessagesByThread = { ...state.messagesByThread };
      delete newMessagesByThread[String(threadId)];
      return {
        ...state,
        threads: newThreads,
        activeThreadId: newActiveId,
        messagesByThread: newMessagesByThread,
      };
    }

    case COMM_ACTIONS.SET_ACTIVE_THREAD: {
      const { threadId } = action.payload;
      return {
        ...state,
        activeThreadId: threadId,
        unreadByThread: { ...state.unreadByThread, [String(threadId)]: 0 },
      };
    }

    // ── Messages ───────────────────────────────────────────────────────────
    case COMM_ACTIONS.MESSAGES_LOADED: {
      const { threadId, messages, meta } = action.payload;
      const existing = state.messagesByThread[String(threadId)] || [];
      return {
        ...state,
        messagesByThread: {
          ...state.messagesByThread,
          [String(threadId)]: mergeMessages(existing, messages),
        },
        paginationByThread: {
          ...state.paginationByThread,
          [String(threadId)]: meta || null
        }
      };
    }

    case COMM_ACTIONS.MESSAGE_CREATED: {
      const msg = action.payload.message;
      const tid = String(msg.thread_id);
      const existing = state.messagesByThread[tid] || [];

      // Deduplicate: ignore if already present
      if (existing.some((m) => Number(m.id) === Number(msg.id))) return state;

      // Also check if an optimistic message with matching clientId exists → confirm it
      const optKey = Object.keys(state.optimisticMessages).find(
        (k) => state.optimisticMessages[k]._serverId === msg.id
      );
      const newOptimistic = { ...state.optimisticMessages };
      if (optKey) delete newOptimistic[optKey];

      // Unread: increment if not the active thread
      const isActive = Number(state.activeThreadId) === Number(msg.thread_id);
      const prevUnread = state.unreadByThread[tid] || 0;

      return {
        ...state,
        messagesByThread: {
          ...state.messagesByThread,
          [tid]: mergeMessages(existing, msg),
        },
        optimisticMessages: newOptimistic,
        unreadByThread: {
          ...state.unreadByThread,
          [tid]: isActive ? 0 : prevUnread + 1,
        },
        // Update thread's last message timestamp
        threads: state.threads.map((t) =>
          Number(t.id) === Number(msg.thread_id)
            ? { ...t, last_activity_at: msg.created_at, messages_count: (t.messages_count || 0) + 1 }
            : t
        ),
      };
    }

    case COMM_ACTIONS.MESSAGE_UPDATED: {
      const msg = action.payload.message;
      const tid = String(msg.thread_id);
      const existing = state.messagesByThread[tid] || [];
      return {
        ...state,
        messagesByThread: {
          ...state.messagesByThread,
          [tid]: existing.map((m) => (Number(m.id) === Number(msg.id) ? { ...m, ...msg } : m)),
        },
      };
    }

    case COMM_ACTIONS.MESSAGE_DELETED: {
      const { messageId, threadId } = action.payload;
      const tid = String(threadId);
      const existing = state.messagesByThread[tid] || [];
      return {
        ...state,
        messagesByThread: {
          ...state.messagesByThread,
          [tid]: existing.map((m) =>
            Number(m.id) === Number(messageId)
              ? { ...m, body: '[Message deleted]', deleted_at: new Date().toISOString() }
              : m
          ),
        },
      };
    }

    // ── Optimistic Updates ─────────────────────────────────────────────────
    case COMM_ACTIONS.OPTIMISTIC_ADD: {
      const { clientId, message, threadId } = action.payload;
      const tid = String(threadId);
      const existing = state.messagesByThread[tid] || [];
      return {
        ...state,
        messagesByThread: {
          ...state.messagesByThread,
          [tid]: [...existing, { ...message, _clientId: clientId, _isPending: true }],
        },
        optimisticMessages: {
          ...state.optimisticMessages,
          [clientId]: message,
        },
      };
    }

    case COMM_ACTIONS.OPTIMISTIC_CONFIRM: {
      const { clientId, message } = action.payload;
      const tid = String(message.thread_id);
      const existing = state.messagesByThread[tid] || [];
      const newOptimistic = { ...state.optimisticMessages };
      delete newOptimistic[clientId];

      return {
        ...state,
        messagesByThread: {
          ...state.messagesByThread,
          [tid]: mergeMessages(
            existing.filter((m) => m._clientId !== clientId),
            message
          ),
        },
        optimisticMessages: newOptimistic,
      };
    }

    case COMM_ACTIONS.OPTIMISTIC_ROLLBACK: {
      const { clientId, threadId } = action.payload;
      const tid = String(threadId);
      const existing = state.messagesByThread[tid] || [];
      const newOptimistic = { ...state.optimisticMessages };
      delete newOptimistic[clientId];
      return {
        ...state,
        messagesByThread: {
          ...state.messagesByThread,
          [tid]: existing.filter((m) => m._clientId !== clientId),
        },
        optimisticMessages: newOptimistic,
      };
    }

    // ── Reactions ──────────────────────────────────────────────────────────
    case COMM_ACTIONS.REACTION_UPDATED: {
      const event = action.payload;
      const tid = String(event.threadId);
      const existing = state.messagesByThread[tid] || [];
      return {
        ...state,
        messagesByThread: {
          ...state.messagesByThread,
          [tid]: existing.map((m) => applyReactionUpdate(m, event)),
        },
      };
    }

    // ── Typing ─────────────────────────────────────────────────────────────
    case COMM_ACTIONS.TYPING_STARTED: {
      const { threadId, userId, userName } = action.payload;
      const tid = String(threadId);
      const existing = state.typingByThread[tid] || [];
      const withoutUser = existing.filter((u) => u.userId !== userId);
      return {
        ...state,
        typingByThread: {
          ...state.typingByThread,
          [tid]: [...withoutUser, { userId, userName, startedAt: Date.now() }],
        },
      };
    }

    case COMM_ACTIONS.TYPING_STOPPED: {
      const { threadId, userId } = action.payload;
      const tid = String(threadId);
      return {
        ...state,
        typingByThread: {
          ...state.typingByThread,
          [tid]: (state.typingByThread[tid] || []).filter((u) => u.userId !== userId),
        },
      };
    }

    // ── Presence ───────────────────────────────────────────────────────────
    case COMM_ACTIONS.PRESENCE_UPDATED: {
      return { ...state, presence: action.payload };
    }

    // ── Read receipts ──────────────────────────────────────────────────────
    case COMM_ACTIONS.MARK_THREAD_READ: {
      return {
        ...state,
        unreadByThread: { ...state.unreadByThread, [String(action.payload.threadId)]: 0 },
      };
    }

    case COMM_ACTIONS.SET_UNREAD_COUNT: {
      return {
        ...state,
        unreadByThread: {
          ...state.unreadByThread,
          [String(action.payload.threadId)]: action.payload.count,
        },
      };
    }

    // ── Context ────────────────────────────────────────────────────────────
    case COMM_ACTIONS.CLEAR_CONTEXT: {
      return {
        ...initialState,
        contextType: action.payload?.contextType ?? null,
        contextId: action.payload?.contextId ?? null,
      };
    }

    case COMM_ACTIONS.SET_LOADING: {
      return { ...state, loading: action.payload };
    }

    case COMM_ACTIONS.SET_ERROR: {
      return { ...state, error: action.payload, loading: false };
    }

    default:
      return state;
  }
}
