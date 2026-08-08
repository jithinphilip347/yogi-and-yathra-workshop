/**
 * Communication Selectors
 * Memoized selectors for reading communication state.
 * Components should ONLY read state through these selectors.
 */

/**
 * Get messages for a thread, sorted by created_at ASC.
 * Already sorted by the reducer, but this ensures safety.
 */
export const selectSortedMessages = (state, threadId) => {
  if (!threadId) return [];
  const messages = state.messagesByThread[String(threadId)] || [];
  // Include optimistic (pending) messages appended at end
  return messages;
};

/**
 * Get the currently active thread object.
 */
export const selectActiveThread = (state) => {
  if (!state.activeThreadId) return null;
  return state.threads.find((t) => Number(t.id) === Number(state.activeThreadId)) || null;
};

/**
 * Get typing users for a thread (excluding stale entries > 5s old).
 */
export const selectTypingUsers = (state, threadId) => {
  if (!threadId) return [];
  const now = Date.now();
  return (state.typingByThread[String(threadId)] || []).filter(
    (u) => now - u.startedAt < 5000
  );
};

/**
 * Get unread count for a thread.
 */
export const selectUnreadCount = (state, threadId) => {
  if (!threadId) return 0;
  return state.unreadByThread[String(threadId)] || 0;
};

/**
 * Get total unread count across all threads.
 */
export const selectTotalUnread = (state) => {
  return Object.values(state.unreadByThread).reduce((sum, n) => sum + (n || 0), 0);
};

/**
 * Get online presence list.
 */
export const selectPresence = (state) => state.presence;

/**
 * Get all threads, sorted by pinned first, then last_activity_at DESC.
 */
export const selectSortedThreads = (state) => {
  return [...state.threads].sort((a, b) => {
    return new Date(b.last_activity_at || b.created_at || 0) - new Date(a.last_activity_at || a.created_at || 0);
  });
};

/**
 * Check if a specific thread has any pending optimistic messages.
 */
export const selectHasPendingMessages = (state, threadId) => {
  const messages = state.messagesByThread[String(threadId)] || [];
  return messages.some((m) => m._isPending);
};
