"use client";

import React, { useEffect, useRef, useState } from 'react';
import { 
  FiMessageSquare, FiClock, FiSend, FiThumbsUp, FiSmile, FiUserCheck, FiUsers, FiX 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useCommunication } from '@/communication/CommunicationStore';
import { useCommunicationActions } from '@/communication/useCommunicationActions';
import {
  selectSortedMessages,
  selectActiveThread,
  selectTypingUsers,
} from '@/communication/selectors';

export default function DiscussionTab({ course, currentLesson, getCurrentTime, onSeek }) {
  const { user } = useSelector((state) => state.auth);
  const { state } = useCommunication();
  const actions = useCommunicationActions();

  // Local UI-only state (not communication state)
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [composerMessage, setComposerMessage] = useState('');
  const [attachTimestamp, setAttachTimestamp] = useState(false);
  const [capturedTime, setCapturedTime] = useState(0);
  const [isPosting, setIsPosting] = useState(false);

  // Pagination count for showing older messages
  const [visibleCount, setVisibleCount] = useState(4);

  const feedBottomRef = useRef(null);

  // ─── Selectors ─────────────────────────────────────────────────────────
  const activeThreadId = state.activeThreadId;
  const threads        = state.threads;
  const loading        = state.loading;
  const messages       = selectSortedMessages(state, activeThreadId);
  const activeThread   = selectActiveThread(state);
  const typingUsers    = selectTypingUsers(state, activeThreadId);

  // slice to show only the last N messages
  const visibleMessages = messages.slice(-visibleCount);

  // Increase visibleCount when new messages are added (so they don't push older ones out of view)
  const prevMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      const addedCount = messages.length - prevMessagesLength.current;
      setVisibleCount(prev => prev + addedCount);
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  // Reset pagination count when active thread or lesson changes
  useEffect(() => {
    setVisibleCount(4);
  }, [activeThreadId, currentLesson?.id]);

  // ─── Load threads on course/lesson context change ──────────────────────
  useEffect(() => {
    const entityType = currentLesson?.id ? 'lesson' : 'course';
    const entityId   = currentLesson?.id  ? currentLesson.id : course?.id;
    if (entityId) {
      actions.loadThreads(entityType, entityId);
    }
  }, [course?.id, currentLesson?.id]);

  // ─── Auto-scroll when new messages arrive ─────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        feedBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  }, [messages.length]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleCaptureTimestamp = () => {
    const time = getCurrentTime ? Math.floor(getCurrentTime()) : 0;
    setCapturedTime(time);
    setAttachTimestamp(true);
    toast.success(`Captured video timestamp ${formatSeconds(time)}`);
  };

  const handlePostConversation = async (e) => {
    if (e) e.preventDefault();
    if (!composerMessage.trim()) return;

    setIsPosting(true);
    try {
      if (activeThreadId && threads.length > 0) {
        // Reply to existing thread
        const result = await actions.sendMessage({
          threadId: activeThreadId,
          body: composerMessage,
          videoTimestampSeconds: attachTimestamp && capturedTime > 0 ? capturedTime : null,
          timestampLabel: attachTimestamp && capturedTime > 0 ? formatSeconds(capturedTime) : null,
          currentUser: user,
        });
        if (!result.success) toast.error('Failed to send message');
      } else {
        // Create new thread
        const result = await actions.createThread({
          entity_type: currentLesson ? 'lesson' : 'course',
          entity_id:   currentLesson ? currentLesson.id : course.id,
          body:        composerMessage,
          ...(attachTimestamp && capturedTime > 0 ? {
            video_timestamp_seconds: capturedTime,
            timestamp_label: formatSeconds(capturedTime),
          } : {}),
        });
        if (!result.success) toast.error('Failed to start discussion');
      }

      setComposerMessage('');
      setAttachTimestamp(false);
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setIsPosting(false);
    }
  };

  const handleToggleReaction = (messageId, reaction) => {
    actions.toggleReaction(messageId, reaction, activeThreadId, user);
  };

  const formatSeconds = (sec) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : 'S');

  return (
    <div className="DiscussionTabContainer">
      
      {/* ─── 1. Composer area (Consistent with Notes tab) ─────────────── */}
      <div className="CreateDiscussionArea">
        {/* Left Timestamp Capsule */}
        <button 
          className="TimestampCapsuleBtn"
          onClick={handleCaptureTimestamp}
          title="Click to capture video timestamp"
        >
          <FiClock />
          <span>{formatSeconds(capturedTime)}</span>
        </button>

        {/* Input form */}
        <div className="ComposerBox">
          <div className="EditorBox">
            <textarea
              rows={3}
              placeholder="Ask a question, share an insight, or start a discussion..."
              value={composerMessage}
              onChange={(e) => setComposerMessage(e.target.value)}
              disabled={isPosting}
            />
          </div>

          <div className="ActionsRow">
            {attachTimestamp && (
              <span className="AttachedBadge">
                <FiClock />
                <span>Timestamp: {formatSeconds(capturedTime)}</span>
                <button type="button" onClick={() => setAttachTimestamp(false)} className="ClearBtn">
                  <FiX />
                </button>
              </span>
            )}
            
            <button
              onClick={handlePostConversation}
              disabled={isPosting || !composerMessage.trim()}
              className="PostBtn"
            >
              <FiSend />
              <span>Send message</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. Header & Stats ─────────────────────────────────────────── */}
      <div className="DiscussionHeader">
        <h3 className="Title">
          {currentLesson?.title ? `${currentLesson.title} — Community` : 'Lesson Community Chat'}
        </h3>
        <span className="Stats">
          <FiUsers />
          <span>{messages.length} Messages</span>
        </span>
      </div>

      {/* ─── 3. Message Thread Listing ─────────────────────────────────── */}
      <div className="DiscussionFeed">
        {/* Pagination Trigger: Show older messages */}
        {messages.length > visibleCount && (
          <button 
            type="button"
            onClick={() => setVisibleCount(prev => prev + 5)}
            className="ShowOlderMessagesBtn"
          >
            Show older messages
          </button>
        )}

        {loading ? (
          <div className="LoadingText">Loading discussion feed...</div>
        ) : messages.length === 0 ? (
          <div className="EmptyState">
            <FiMessageSquare className="EmptyIcon" />
            <h4>Start the discussion</h4>
            <p>Ask a question, share an insight, or attach a video timestamp above.</p>
          </div>
        ) : (
          visibleMessages.map((msg, index) => {
            const isInstructor = msg.is_instructor_answer || msg.author?.role === 'admin' || msg.author?.role === 'instructor';
            const likeCount    = msg.reactions?.filter(r => r.reaction === 'like').length || 0;
            const helpfulCount = msg.reactions?.filter(r => r.reaction === 'helpful').length || 0;

            return (
              <div
                key={msg._clientId || msg.id}
                onMouseEnter={() => setHoveredMsgId(msg.id)}
                onMouseLeave={() => setHoveredMsgId(null)}
                className="DiscussionItem"
              >
                {/* Left Timestamp Capsule (aligned exactly like Notes listing) */}
                {msg.video_timestamp_seconds && (
                  <button
                    onClick={() => onSeek && onSeek(msg.video_timestamp_seconds)}
                    className="TimestampCapsuleBtn"
                    title="Click to seek video"
                  >
                    <FiClock />
                    <span>{formatSeconds(msg.video_timestamp_seconds)}</span>
                  </button>
                )}

                {/* Right message detail block */}
                <div className="MessageContentCol">
                  
                  {/* Header metadata row */}
                  <div className="MessageHeaderRow">
                    <div className="AuthorBlock">
                      <div className={`Avatar ${isInstructor ? 'Instructor' : ''}`}>
                        {getInitials(msg.author?.name)}
                      </div>
                      <span className="AuthorName">
                        {msg.author?.name || (isInstructor ? 'Instructor' : 'Student')}
                      </span>
                      {isInstructor && (
                        <span className="InstructorBadge">
                          <FiUserCheck /> Instructor
                        </span>
                      )}
                      <span className="TimeLabel">
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    {/* Reactions controls */}
                    {!msg._isPending && (likeCount > 0 || helpfulCount > 0 || hoveredMsgId === msg.id) && (
                      <div className="ReactionsRow">
                        <button onClick={() => handleToggleReaction(msg.id, 'like')} className="ReactionBtn">
                          <FiThumbsUp /> <span>{likeCount > 0 ? likeCount : 'Like'}</span>
                        </button>
                        <button onClick={() => handleToggleReaction(msg.id, 'helpful')} className="ReactionBtn">
                          <FiSmile /> <span>{helpfulCount > 0 ? helpfulCount : 'Helpful'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Message body box (Styled identically to saved notes) */}
                  <div className="MessageBodyWrapper">
                    <p>{msg.body}</p>
                  </div>
                </div>

              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="TypingIndicator">
            <span className="TypingDots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </span>
            <span>{typingUsers.map(u => u.userName).join(', ')} typing...</span>
          </div>
        )}
      </div>

    </div>
  );
}
