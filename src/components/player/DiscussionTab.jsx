"use client";

import React, { useEffect, useRef, useState } from 'react';
import { 
  FiMessageSquare, FiClock, FiSend, FiThumbsUp, FiSmile, FiUserCheck, FiUsers 
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

/**
 * DiscussionTab
 *
 * Community chat experience for Course Player.
 * ALL realtime state is owned by CommunicationStore (Context + useReducer).
 * This component reads from the store via selectors and writes via actions.
 * No direct Echo/WebSocket usage here.
 */
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

  const feedBottomRef = useRef(null);

  // ─── Selectors ─────────────────────────────────────────────────────────
  const activeThreadId = state.activeThreadId;
  const threads        = state.threads;
  const loading        = state.loading;
  const messages       = selectSortedMessages(state, activeThreadId);
  const activeThread   = selectActiveThread(state);
  const typingUsers    = selectTypingUsers(state, activeThreadId);

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

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div 
      className="CommunityChatExperience" 
      style={{ 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '480px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
      }}
    >
      {/* Compact Chat Header */}
      <div 
        style={{ 
          padding: '12px 20px', 
          borderBottom: '1px solid #f1f5f9', 
          background: '#f8fafc', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ padding: '7px', background: 'rgba(135, 68, 41, 0.1)', color: 'var(--primaryColor, #874429)', borderRadius: '8px', display: 'flex' }}>
            <FiMessageSquare size={16} />
          </span>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {currentLesson?.title ? `${currentLesson.title} — Community` : 'Lesson Community Chat'}
            </h3>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#22c55e', borderRadius: '50%' }} />
              Instructor Online • {messages.length} Messages
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>
          <FiUsers size={13} /> Classmate Feed
        </div>
      </div>

      {/* Conversation Feed Area */}
      <div 
        style={{ 
          flex: 1, 
          padding: '16px 20px', 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px',
          background: '#fafafa' 
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '13px' }}>
            Loading lesson discussion feed...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto', color: '#64748b', padding: '40px 0' }}>
            <FiMessageSquare size={36} style={{ color: '#cbd5e1', marginBottom: '10px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', margin: '0 0 4px 0' }}>Start the Lesson Discussion</h4>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>
              Ask a question, share an insight, or attach a video timestamp below.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isInstructor = msg.is_instructor_answer || msg.author?.role === 'admin' || msg.author?.role === 'instructor';
            const isMe = Number(msg.user_id) === Number(user?.id);
            const alignRight = isInstructor;

            const prevMsg = index > 0 ? messages[index - 1] : null;
            const prevIsInstructor = prevMsg ? (prevMsg.is_instructor_answer || prevMsg.author?.role === 'admin' || prevMsg.author?.role === 'instructor') : false;
            const isSameSenderAsPrev = prevMsg && (
              (isInstructor && prevIsInstructor) ||
              (!isInstructor && !prevIsInstructor && prevMsg.user_id === msg.user_id)
            );

            const likeCount    = msg.reactions?.filter(r => r.reaction === 'like').length || 0;
            const helpfulCount = msg.reactions?.filter(r => r.reaction === 'helpful').length || 0;

            return (
              <div
                key={msg._clientId || msg.id}
                onMouseEnter={() => setHoveredMsgId(msg.id)}
                onMouseLeave={() => setHoveredMsgId(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: alignRight ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  marginTop: isSameSenderAsPrev ? '2px' : '10px',
                  position: 'relative',
                  opacity: msg._isPending ? 0.6 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {/* Sender Header with Avatar */}
                {!isSameSenderAsPrev && (
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      marginBottom: '3px', 
                      fontSize: '11px', 
                      color: '#64748b', 
                      alignSelf: alignRight ? 'flex-end' : 'flex-start',
                      padding: '0 2px'
                    }}
                  >
                    <div 
                      style={{ 
                        width: '18px', 
                        height: '18px', 
                        borderRadius: '50%', 
                        backgroundColor: alignRight ? '#0369a1' : 'var(--primaryColor, #874429)', 
                        color: '#fff', 
                        fontSize: '9.5px', 
                        fontWeight: '700', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      {getInitials(msg.author?.name)}
                    </div>
                    <span style={{ fontWeight: '700', color: '#334155' }}>
                      {msg.author?.name || (isInstructor ? 'Instructor' : 'Student')}
                    </span>
                    {isInstructor && (
                      <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: '700', fontSize: '9.5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <FiUserCheck size={10} /> Verified Instructor
                      </span>
                    )}
                    <span>• {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    {msg._isPending && <span style={{ color: '#94a3b8', fontSize: '10px' }}>Sending...</span>}
                  </div>
                )}

                {/* Chat Bubble */}
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: alignRight ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    backgroundColor: alignRight ? '#e0f2fe' : isMe ? 'var(--primaryColor, #874429)' : '#ffffff',
                    color: alignRight ? '#0369a1' : isMe ? '#ffffff' : '#1e293b',
                    border: alignRight ? '1px solid #bae6fd' : isMe ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                    display: 'inline-block'
                  }}
                >
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                    {msg.body}
                  </p>

                  {/* Timestamp Seek Button */}
                  {msg.video_timestamp_seconds && (
                    <button
                      onClick={() => onSeek && onSeek(msg.video_timestamp_seconds)}
                      style={{
                        marginTop: '6px',
                        padding: '3px 9px',
                        backgroundColor: alignRight ? 'rgba(3, 105, 161, 0.1)' : isMe ? 'rgba(255,255,255,0.2)' : 'rgba(135, 68, 41, 0.1)',
                        color: alignRight ? '#0369a1' : isMe ? '#ffffff' : 'var(--primaryColor, #874429)',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <FiClock size={11} /> Seek to {msg.timestamp_label || formatSeconds(msg.video_timestamp_seconds)}
                    </button>
                  )}
                </div>

                {/* Reaction Bar */}
                {!msg._isPending && (likeCount > 0 || helpfulCount > 0 || hoveredMsgId === msg.id) && (
                  <div style={{ display: 'flex', gap: '5px', marginTop: '3px', alignSelf: alignRight ? 'flex-end' : 'flex-start' }}>
                    {(likeCount > 0 || hoveredMsgId === msg.id) && (
                      <button
                        onClick={() => handleToggleReaction(msg.id, 'like')}
                        style={{
                          padding: '2px 7px',
                          borderRadius: '12px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          fontSize: '10px',
                          color: '#475569',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: '600'
                        }}
                      >
                        <FiThumbsUp size={10} /> {likeCount > 0 ? likeCount : 'Like'}
                      </button>
                    )}

                    {(helpfulCount > 0 || hoveredMsgId === msg.id) && (
                      <button
                        onClick={() => handleToggleReaction(msg.id, 'helpful')}
                        style={{
                          padding: '2px 7px',
                          borderRadius: '12px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          fontSize: '10px',
                          color: '#475569',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: '600'
                        }}
                      >
                        <FiSmile size={10} /> {helpfulCount > 0 ? helpfulCount : 'Helpful'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', padding: '4px 0' }}>
            <span style={{ display: 'flex', gap: '2px' }}>
              <span className="typing-dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94a3b8', animation: 'bounce 1.2s infinite 0s' }} />
              <span className="typing-dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94a3b8', animation: 'bounce 1.2s infinite 0.2s' }} />
              <span className="typing-dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94a3b8', animation: 'bounce 1.2s infinite 0.4s' }} />
            </span>
            {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        <div ref={feedBottomRef} />
      </div>

      {/* Sticky Bottom Composer */}
      <form 
        onSubmit={handlePostConversation} 
        style={{ 
          padding: '12px 16px', 
          borderTop: '1px solid #f1f5f9', 
          background: '#ffffff' 
        }}
      >
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {attachTimestamp && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(135, 68, 41, 0.08)', color: 'var(--primaryColor, #874429)', padding: '3px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600' }}>
              <FiClock size={12} /> Video Timestamp: {formatSeconds(capturedTime)}
              <button type="button" onClick={() => setAttachTimestamp(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#874429', fontWeight: '700', marginLeft: '4px' }}>×</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <textarea
              rows={1}
              placeholder="Share your thoughts, ask a question, or discuss this lesson... (Enter to send, Shift+Enter for newline)"
              value={composerMessage}
              onChange={(e) => setComposerMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePostConversation();
                }
              }}
              disabled={isPosting}
              style={{ 
                flex: 1, 
                padding: '10px 14px', 
                borderRadius: '10px', 
                border: '1px solid #cbd5e1', 
                fontSize: '13px', 
                outline: 'none', 
                background: '#fafafa',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />

            <button
              type="button"
              onClick={handleCaptureTimestamp}
              title="Attach Video Timestamp"
              style={{ padding: '9px 12px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
            >
              <FiClock size={15} /> Timestamp
            </button>

            <button
              type="submit"
              disabled={isPosting || !composerMessage.trim()}
              style={{
                padding: '10px 18px',
                backgroundColor: 'var(--primaryColor, #874429)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isPosting || !composerMessage.trim() ? 0.6 : 1
              }}
            >
              <FiSend size={15} /> Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
