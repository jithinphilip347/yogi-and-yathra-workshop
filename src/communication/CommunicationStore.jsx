'use client';

/**
 * Communication Store
 *
 * React Context + useReducer providing the single source of truth
 * for all realtime communication state across the Learning Player.
 *
 * Architecture:
 *   CommunicationProvider
 *     → initializes commEventBus with dispatch
 *     → subscribes to course/lesson channels via Event Bus
 *     → provides state + dispatch via Context
 *
 * Usage:
 *   Wrap the Course Player with:
 *   <CommunicationProvider courseId={course.id} lessonId={currentLesson?.id}>
 *     ...
 *   </CommunicationProvider>
 *
 *   Inside any child component:
 *   const { state, dispatch } = useCommunication();
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
} from 'react';
import { communicationReducer, initialState, COMM_ACTIONS } from './communicationReducer';
import { commEventBus } from './commEventBus';
import commLog from './commLogger';

// ─── Context ───────────────────────────────────────────────────────────────
const CommunicationContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────
export function CommunicationProvider({ children, courseId, lessonId, liveSectionId }) {
  const [state, dispatch] = useReducer(communicationReducer, initialState);

  // Initialize the Event Bus with dispatch on mount
  useEffect(() => {
    commEventBus.init(dispatch);
    commLog('CONNECT', 'CommunicationProvider mounted — Event Bus ready');
  }, []);

  // React to course / lesson / liveSection context changes and manage channel subscription lifecycle
  useEffect(() => {
    if (!courseId && !liveSectionId) return;

    commLog('SUBSCRIBE', { courseId, lessonId, liveSectionId });

    if (liveSectionId) {
      commEventBus.subscribeToLiveSection(liveSectionId);
    } else {
      commEventBus.subscribeToCourse(courseId);
      if (lessonId) {
        commEventBus.subscribeToLesson(lessonId);
      }
    }

    // Cleanup: cleanly leave course, lesson or live-session channels on context change or unmount
    return () => {
      commLog('LEAVE', { courseId, lessonId, liveSectionId });
      if (liveSectionId) {
        commEventBus.leaveChannel(`live-session.${liveSectionId}`);
      } else {
        commEventBus.leaveChannel(`course.${courseId}`);
        if (lessonId) {
          commEventBus.leaveChannel(`lesson.${lessonId}`);
        }
      }
    };
  }, [courseId, lessonId, liveSectionId]);

  // Stable context value: memoize to prevent unnecessary renders
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <CommunicationContext.Provider value={value}>
      {children}
    </CommunicationContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useCommunication() {
  const ctx = useContext(CommunicationContext);
  if (!ctx) {
    throw new Error('useCommunication must be used inside <CommunicationProvider>');
  }
  return ctx;
}

export default CommunicationProvider;
