'use client';

/**
 * useCommunicationActions
 *
 * All user-triggered communication operations.
 * Handles REST API calls, optimistic updates, and Store dispatches.
 * Components call these actions — they never call APIs or dispatch directly.
 */

import { useCallback, useRef } from 'react';
import { useCommunication } from './CommunicationStore';
import { COMM_ACTIONS } from './communicationReducer';
import communicationApi from '@/libs/communicationApi';
import commLog from './commLogger';

let clientIdCounter = 0;
const nextClientId = () => `opt_${Date.now()}_${++clientIdCounter}`;

export function useCommunicationActions() {
  const { state, dispatch } = useCommunication();

  // ─── Load Threads ────────────────────────────────────────────────────────
  const loadThreads = useCallback(async (entityType, entityId) => {
    if (!entityId) return;

    dispatch({ type: COMM_ACTIONS.SET_LOADING, payload: true });
    try {
      commLog('DISPATCH', { action: 'loadThreads', entityType, entityId });
      const res = await communicationApi.getThreads({ entity_type: entityType, entity_id: entityId });
      const threads = res?.data || [];

      dispatch({
        type: COMM_ACTIONS.THREADS_LOADED,
        payload: { threads, contextType: entityType, contextId: entityId },
      });

      // Auto-select first thread and load its messages
      if (threads.length > 0) {
        await switchThread(threads[0].id);
      }
    } catch (err) {
      commLog('ERROR', { action: 'loadThreads', err });
      dispatch({ type: COMM_ACTIONS.SET_ERROR, payload: 'Failed to load discussions' });
    }
  }, [dispatch]);

  // ─── Switch Active Thread ────────────────────────────────────────────────
  const switchThread = useCallback(async (threadId) => {
    if (!threadId) return;

    dispatch({ type: COMM_ACTIONS.SET_ACTIVE_THREAD, payload: { threadId } });

    // Only fetch if not already cached
    if (!state.messagesByThread[String(threadId)]) {
      await loadMessages(threadId);
    }
  }, [dispatch, state.messagesByThread]);

  // ─── Load Messages for Thread ────────────────────────────────────────────
  const loadMessages = useCallback(async (threadId) => {
    if (!threadId) return;
    try {
      const res = await communicationApi.getThreadMessages(threadId);
      dispatch({
        type: COMM_ACTIONS.MESSAGES_LOADED,
        payload: { threadId, messages: res?.data || [] },
      });
    } catch (err) {
      commLog('ERROR', { action: 'loadMessages', threadId, err });
    }
  }, [dispatch]);

  // ─── Send Message (optimistic) ────────────────────────────────────────────
  const sendMessage = useCallback(async ({ threadId, body, videoTimestampSeconds, timestampLabel, currentUser }) => {
    if (!body?.trim()) return;

    const clientId = nextClientId();
    const now = new Date().toISOString();

    // Optimistic placeholder
    const optimisticMsg = {
      id: `${clientId}`,
      body,
      thread_id: threadId,
      user_id: currentUser?.id,
      author: { id: currentUser?.id, name: currentUser?.name, role: currentUser?.role },
      reactions: [],
      attachments: [],
      created_at: now,
      video_timestamp_seconds: videoTimestampSeconds || null,
      timestamp_label: timestampLabel || null,
      _clientId: clientId,
      _isPending: true,
    };

    commLog('OPTIMISTIC_ADD', { clientId, threadId, body });
    dispatch({
      type: COMM_ACTIONS.OPTIMISTIC_ADD,
      payload: { clientId, message: optimisticMsg, threadId },
    });

    try {
      const res = await communicationApi.createReply(threadId, {
        body,
        ...(videoTimestampSeconds > 0 ? {
          video_timestamp_seconds: videoTimestampSeconds,
          timestamp_label: timestampLabel,
        } : {}),
      });

      const serverMsg = res?.data;
      if (serverMsg) {
        commLog('OPTIMISTIC_CONFIRM', { clientId, serverId: serverMsg.id });
        dispatch({
          type: COMM_ACTIONS.OPTIMISTIC_CONFIRM,
          payload: { clientId, message: serverMsg },
        });
      }

      return { success: true };
    } catch (err) {
      commLog('OPTIMISTIC_ROLLBACK', { clientId, err });
      dispatch({
        type: COMM_ACTIONS.OPTIMISTIC_ROLLBACK,
        payload: { clientId, threadId },
      });
      return { success: false, error: err };
    }
  }, [dispatch]);

  // ─── Create New Thread ────────────────────────────────────────────────────
  const createThread = useCallback(async (payload) => {
    try {
      const res = await communicationApi.createThread(payload);
      const thread = res?.data;
      if (thread) {
        dispatch({ type: COMM_ACTIONS.THREAD_CREATED, payload: { thread } });
        dispatch({ type: COMM_ACTIONS.SET_ACTIVE_THREAD, payload: { threadId: thread.id } });
        dispatch({ type: COMM_ACTIONS.MESSAGES_LOADED, payload: { threadId: thread.id, messages: [] } });
      }
      return { success: true, thread };
    } catch (err) {
      commLog('ERROR', { action: 'createThread', err });
      return { success: false, error: err };
    }
  }, [dispatch]);

  // ─── Toggle Reaction ──────────────────────────────────────────────────────
  const toggleReaction = useCallback(async (messageId, reaction, threadId, currentUser) => {
    // Optimistic reaction toggle
    const existingMessages = state.messagesByThread[String(threadId)] || [];
    const msg = existingMessages.find((m) => Number(m.id) === Number(messageId));
    if (!msg) return;

    const alreadyReacted = (msg.reactions || []).some(
      (r) => Number(r.user_id) === Number(currentUser?.id) && r.reaction === reaction
    );

    dispatch({
      type: COMM_ACTIONS.REACTION_UPDATED,
      payload: {
        messageId,
        threadId,
        action: alreadyReacted ? 'removed' : 'added',
        reaction,
        userId: currentUser?.id,
        userName: currentUser?.name,
      },
    });

    try {
      await communicationApi.toggleReaction(messageId, reaction);
    } catch (err) {
      // Rollback: re-apply opposite reaction toggle
      dispatch({
        type: COMM_ACTIONS.REACTION_UPDATED,
        payload: {
          messageId,
          threadId,
          action: alreadyReacted ? 'added' : 'removed',
          reaction,
          userId: currentUser?.id,
          userName: currentUser?.name,
        },
      });
      commLog('ERROR', { action: 'toggleReaction', err });
    }
  }, [dispatch, state.messagesByThread]);

  // ─── Delete Thread ─────────────────────────────────────────────────────────
  const deleteThread = useCallback(async (threadId) => {
    dispatch({ type: COMM_ACTIONS.THREAD_DELETED, payload: { threadId } });
    try {
      await communicationApi.deleteThread(threadId);
      return { success: true };
    } catch (err) {
      commLog('ERROR', { action: 'deleteThread', err });
      return { success: false, error: err };
    }
  }, [dispatch]);

  return {
    loadThreads,
    switchThread,
    loadMessages,
    sendMessage,
    createThread,
    toggleReaction,
    deleteThread,
  };
}

export default useCommunicationActions;
