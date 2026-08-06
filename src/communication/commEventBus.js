'use client';

/**
 * Communication Event Bus
 *
 * The ONLY file in the frontend that is allowed to communicate with Laravel Echo.
 * All WebSocket events are received here, deduplicated, and dispatched to the
 * Communication Store via the `dispatch` function provided on initialization.
 *
 * No React component may import echo.js or subscribe to Laravel Echo directly.
 */

import { getEcho } from '@/libs/echo';
import { COMM_ACTIONS } from './communicationReducer';
import commLog from './commLogger';

// Rolling deduplication set (keeps last 200 event fingerprints)
const DEDUP_SIZE = 200;
const seenEventIds = new Set();
const seenEventQueue = [];

function markSeen(fingerprint) {
  if (seenEventIds.has(fingerprint)) return false;
  seenEventIds.add(fingerprint);
  seenEventQueue.push(fingerprint);
  if (seenEventQueue.length > DEDUP_SIZE) {
    seenEventIds.delete(seenEventQueue.shift());
  }
  return true;
}

function buildFingerprint(eventType, data) {
  const id = data?.messageData?.id || data?.messageId || data?.threadId || 'noid';
  const ts = data?.messageData?.created_at || data?.timestamp || Date.now();
  return `${eventType}:${id}:${ts}`;
}

// Typing timeout map: { `${threadId}:${userId}` → timeoutId }
const typingTimers = new Map();

class CommunicationEventBus {
  constructor() {
    this.dispatch = null;
    this.subscribedChannels = new Map(); // channelName → Echo channel ref
    this.isInitialized = false;
  }

  /**
   * Initialize the bus with the store dispatch function.
   * Called once by CommunicationProvider on mount.
   */
  init(dispatch) {
    this.dispatch = dispatch;
    this.isInitialized = true;
    commLog('CONNECT', 'Communication Event Bus initialized');
  }

  /**
   * Subscribe to a course-level private channel.
   * Safe to call multiple times — skips if already subscribed.
   */
  subscribeToCourse(courseId) {
    const name = `course.${courseId}`;
    if (this.subscribedChannels.has(name)) return;

    const echo = getEcho();
    if (!echo) {
      commLog('ERROR', 'Echo not available — cannot subscribe to course channel');
      return;
    }

    commLog('SUBSCRIBE', { channel: name });
    const channel = echo.private(name);

    channel.listen('.message.created', (event) => this._onMessageCreated(event));
    channel.listen('.message.updated', (event) => this._onMessageUpdated(event));
    channel.listen('.message.deleted', (event) => this._onMessageDeleted(event));
    channel.listen('.thread.status_updated', (event) => this._onThreadStatusUpdated(event));
    channel.listen('.reaction.updated', (event) => this._onReactionUpdated(event));

    this.subscribedChannels.set(name, channel);
  }

  /**
   * Subscribe to a lesson-level private channel.
   */
  subscribeToLesson(lessonId) {
    const name = `lesson.${lessonId}`;
    if (this.subscribedChannels.has(name)) return;

    const echo = getEcho();
    if (!echo) {
      commLog('ERROR', 'Echo not available — cannot subscribe to lesson channel');
      return;
    }

    commLog('SUBSCRIBE', { channel: name });
    const channel = echo.private(name);

    channel.listen('.message.created', (event) => this._onMessageCreated(event));
    channel.listen('.message.updated', (event) => this._onMessageUpdated(event));
    channel.listen('.message.deleted', (event) => this._onMessageDeleted(event));
    channel.listen('.thread.status_updated', (event) => this._onThreadStatusUpdated(event));
    channel.listen('.reaction.updated', (event) => this._onReactionUpdated(event));

    this.subscribedChannels.set(name, channel);
  }

  /**
   * Leave a specific channel.
   */
  leaveChannel(channelName) {
    if (!this.subscribedChannels.has(channelName)) return;

    const echo = getEcho();
    if (echo) {
      commLog('LEAVE', { channel: channelName });
      echo.leave(channelName);
    }
    this.subscribedChannels.delete(channelName);
  }

  /**
   * Leave all subscribed channels (called on context clear / unmount).
   */
  leaveAll() {
    const echo = getEcho();
    for (const name of this.subscribedChannels.keys()) {
      if (echo) {
        commLog('LEAVE', { channel: name });
        echo.leave(name);
      }
    }
    this.subscribedChannels.clear();
  }

  // ─── Private Event Handlers ──────────────────────────────────────────────

  _onMessageCreated(event) {
    const fingerprint = buildFingerprint('message.created', event);
    if (!markSeen(fingerprint)) {
      commLog('DEDUPLICATE', { event: 'message.created', fingerprint });
      return;
    }

    commLog('EVENT_RECEIVED', { type: 'message.created', event });

    if (!event?.messageData) return;

    commLog('DISPATCH', { action: COMM_ACTIONS.MESSAGE_CREATED, messageId: event.messageData.id });
    this.dispatch({
      type: COMM_ACTIONS.MESSAGE_CREATED,
      payload: { message: event.messageData },
    });
  }

  _onMessageUpdated(event) {
    const fingerprint = buildFingerprint('message.updated', event);
    if (!markSeen(fingerprint)) return;

    commLog('EVENT_RECEIVED', { type: 'message.updated', event });
    if (!event?.messageData) return;

    this.dispatch({
      type: COMM_ACTIONS.MESSAGE_UPDATED,
      payload: { message: event.messageData },
    });
  }

  _onMessageDeleted(event) {
    const fingerprint = buildFingerprint('message.deleted', event);
    if (!markSeen(fingerprint)) return;

    commLog('EVENT_RECEIVED', { type: 'message.deleted', event });

    this.dispatch({
      type: COMM_ACTIONS.MESSAGE_DELETED,
      payload: { messageId: event.messageId, threadId: event.threadId },
    });
  }

  _onThreadStatusUpdated(event) {
    const fingerprint = buildFingerprint('thread.status_updated', event);
    if (!markSeen(fingerprint)) return;

    commLog('EVENT_RECEIVED', { type: 'thread.status_updated', event });

    this.dispatch({
      type: COMM_ACTIONS.THREAD_STATUS_UPDATED,
      payload: {
        threadId: event.threadId,
        isPinned: event.isPinned,
        isLocked: event.isLocked,
        isResolved: event.isResolved,
        action: event.action,
      },
    });
  }

  _onReactionUpdated(event) {
    const fingerprint = buildFingerprint('reaction.updated', event);
    if (!markSeen(fingerprint)) return;

    commLog('EVENT_RECEIVED', { type: 'reaction.updated', event });

    this.dispatch({
      type: COMM_ACTIONS.REACTION_UPDATED,
      payload: {
        messageId: event.messageId,
        threadId: event.threadId,
        action: event.action,
        reaction: event.reaction,
        userId: event.userId,
        userName: event.userName,
      },
    });
  }

  // ─── Typing helpers (called from useCommunicationActions) ─────────────────

  emitTypingStarted(dispatch, threadId, userId, userName) {
    dispatch({
      type: COMM_ACTIONS.TYPING_STARTED,
      payload: { threadId, userId, userName },
    });

    // Auto-stop after 4s
    const key = `${threadId}:${userId}`;
    if (typingTimers.has(key)) clearTimeout(typingTimers.get(key));
    typingTimers.set(
      key,
      setTimeout(() => {
        dispatch({ type: COMM_ACTIONS.TYPING_STOPPED, payload: { threadId, userId } });
        typingTimers.delete(key);
      }, 4000)
    );
  }

  emitTypingStopped(dispatch, threadId, userId) {
    const key = `${threadId}:${userId}`;
    if (typingTimers.has(key)) {
      clearTimeout(typingTimers.get(key));
      typingTimers.delete(key);
    }
    dispatch({ type: COMM_ACTIONS.TYPING_STOPPED, payload: { threadId, userId } });
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────
export const commEventBus = new CommunicationEventBus();
export default commEventBus;
