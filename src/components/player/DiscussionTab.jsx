"use client";

import React, { useEffect, useRef, useState } from 'react';
import { 
  FiMessageSquare, FiClock, FiSend, FiThumbsUp, FiSmile, FiUserCheck, FiUsers, FiX, 
  FiArrowDown, FiSearch, FiPlus, FiCheck, FiLock, FiUnlock, FiBookmark, FiTrash2 
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

  // Local UI & Composer States
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [composerMessage, setComposerMessage] = useState('');
  const [attachTimestamp, setAttachTimestamp] = useState(false);
  const [capturedTime, setCapturedTime] = useState(0);
  const [isPosting, setIsPosting] = useState(false);

  // Search filter for left sidebar threads
  const [searchQuery, setSearchQuery] = useState('');

  // Creation state for starting a new thread (WhatsApp-like new inbox)
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadBody, setNewThreadBody] = useState('');

  // Progressive Loading Limits
  const [visibleLimit, setVisibleLimit] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showNewMsgBanner, setShowNewMsgBanner] = useState(false);

  // Refs
  const feedContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // ─── Selectors ─────────────────────────────────────────────────────────
  const activeThreadId = state.activeThreadId;
  const threads        = state.threads;
  const loading        = state.loading;
  const messages       = selectSortedMessages(state, activeThreadId);
  const activeThread   = selectActiveThread(state);
  const typingUsers    = selectTypingUsers(state, activeThreadId);
  const pagination     = state.paginationByThread?.[String(activeThreadId)] || null;

  // Filtered threads list (by search query)
  const filteredThreads = threads.filter(t => 
    (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.author?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── 1. Composer Draft Caching ─────────────────────────────────────────
  useEffect(() => {
    if (!activeThreadId) return;
    const cachedDraft = localStorage.getItem(`discussion_draft_${activeThreadId}`);
    setComposerMessage(cachedDraft || '');
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeThreadId]);

  const handleComposerChange = (e) => {
    const val = e.target.value;
    setComposerMessage(val);
    if (activeThreadId) {
      localStorage.setItem(`discussion_draft_${activeThreadId}`, val);
    }
  };

  // ─── 2. Scroll Anchoring and Auto-Scroll ──────────────────────────────
  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    const container = feedContainerRef.current;
    if (!container) return;

    const isNewMessageAdded = messages.length > prevMessagesLength.current;
    if (isNewMessageAdded) {
      const lastMessage = messages[messages.length - 1];
      const isLastMsgMe = Number(lastMessage?.user_id) === Number(user?.id);
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 180;

      const addedCount = messages.length - prevMessagesLength.current;
      setVisibleLimit((prev) => prev + addedCount);

      if (isLastMsgMe || isNearBottom) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 50);
        setShowNewMsgBanner(false);
      } else {
        setShowNewMsgBanner(true);
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, user?.id]);

  // Reset states on active thread change
  useEffect(() => {
    setVisibleLimit(5);
    setShowNewMsgBanner(false);
    setIsCreatingThread(false);
  }, [activeThreadId]);

  // ─── 3. Load threads on course/lesson context change ──────────────────────
  useEffect(() => {
    const entityType = currentLesson?.id ? 'lesson' : 'course';
    const entityId   = currentLesson?.id  ? currentLesson.id : course?.id;
    if (entityId) {
      actions.loadThreads(entityType, entityId);
    }
  }, [course?.id, currentLesson?.id]);

  // ─── 4. Progressive Loading / View Earlier Messages ────────────────────
  const handleViewEarlierMessages = async () => {
    const container = feedContainerRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;
    const prevScrollTop = container ? container.scrollTop : 0;

    if (messages.length > visibleLimit) {
      setVisibleLimit((prev) => prev + 5);
      
      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
        }
      }, 50);
    } else if (pagination && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true);
      try {
        const nextPage = pagination.current_page + 1;
        await actions.loadMessages(activeThreadId, { page: nextPage, per_page: 15 });
        setVisibleLimit((prev) => prev + 5);

        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
          }
        }, 50);
      } catch (err) {
        toast.error("Failed to load older messages");
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const handleScroll = () => {
    const container = feedContainerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isAtBottom) {
      setShowNewMsgBanner(false);
    }
  };

  const handleScrollToBottom = () => {
    const container = feedContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
    setShowNewMsgBanner(false);
  };

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleCaptureTimestamp = () => {
    const time = getCurrentTime ? Math.floor(getCurrentTime()) : 0;
    setCapturedTime(time);
    setAttachTimestamp(true);
    toast.success(`Captured video timestamp ${formatSeconds(time)}`);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handlePostConversation = async (e) => {
    if (e) e.preventDefault();
    if (!composerMessage.trim()) return;

    setIsPosting(true);
    try {
      const result = await actions.sendMessage({
        threadId: activeThreadId,
        body: composerMessage.trim(),
        videoTimestampSeconds: attachTimestamp && capturedTime > 0 ? capturedTime : null,
        timestampLabel: attachTimestamp && capturedTime > 0 ? formatSeconds(capturedTime) : null,
        currentUser: user,
      });
      if (result.success) {
        setComposerMessage('');
        setAttachTimestamp(false);
        localStorage.removeItem(`discussion_draft_${activeThreadId}`);
      } else {
        toast.error('Failed to send message');
      }
    } catch {
      toast.error('Failed to send message');
    } finally {
      setIsPosting(false);
    }
  };

  const handleCreateNewThread = async (e) => {
    if (e) e.preventDefault();
    if (!newThreadBody.trim()) {
      toast.error("Please enter discussion details");
      return;
    }

    setIsPosting(true);
    try {
      const payload = {
        entity_type: currentLesson ? 'lesson' : 'course',
        entity_id:   currentLesson ? currentLesson.id : course.id,
        title:       newThreadTitle.trim() || newThreadBody.trim().substring(0, 45) + '...',
        body:        newThreadBody.trim(),
        ...(attachTimestamp && capturedTime > 0 ? {
          video_timestamp_seconds: capturedTime,
          timestamp_label: formatSeconds(capturedTime),
        } : {})
      };
      
      const result = await actions.createThread(payload);
      if (result.success) {
        toast.success("Discussion started!");
        setNewThreadTitle('');
        setNewThreadBody('');
        setAttachTimestamp(false);
        setIsCreatingThread(false);
      } else {
        toast.error("Failed to create thread");
      }
    } catch {
      toast.error("Failed to create thread");
    } finally {
      setIsPosting(false);
    }
  };

  const handleToggleReaction = (messageId, reaction) => {
    actions.toggleReaction(messageId, reaction, activeThreadId, user);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (attachTimestamp) {
        setAttachTimestamp(false);
        toast('Cleared timestamp attachment');
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostConversation();
    }
  };

  const formatSeconds = (sec) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : 'S');

  // Group consecutive messages from same author (within 2 minutes)
  const visibleMessages = messages.slice(-visibleLimit);
  const groupedMessages = [];

  visibleMessages.forEach((msg, idx) => {
    const isInstructor = msg.is_instructor_answer || msg.author?.role === 'admin' || msg.author?.role === 'instructor';
    const prevMsg = idx > 0 ? visibleMessages[idx - 1] : null;
    const timeDiff = prevMsg 
      ? (new Date(msg.created_at) - new Date(prevMsg.created_at)) / 1000 / 60 
      : 999;
    
    const isSameSender = prevMsg && String(prevMsg.user_id) === String(msg.user_id);
    const isGrouped = isSameSender && timeDiff < 2;

    if (isGrouped && groupedMessages.length > 0) {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    } else {
      groupedMessages.push({
        id: msg.id || msg._clientId,
        author: msg.author,
        userId: msg.user_id,
        isInstructor,
        created_at: msg.created_at,
        messages: [msg]
      });
    }
  });

  const hasMore = messages.length > visibleLimit || (pagination && pagination.current_page < pagination.last_page);

  return (
    <div className="DiscussionInboxLayout" role="region" aria-label="Community WhatsApp inbox">
      
      {/* ─── LEFT PANEL: Thread Index Sidebar (WhatsApp style) ─────── */}
      <div className="ThreadInboxSidebar">
        {/* Search and Action Header */}
        <div className="SidebarHeaderRow">
          <div className="SearchBoxWrapper">
            <FiSearch className="SearchIcon" />
            <input 
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search threads"
            />
          </div>
          <button 
            onClick={() => {
              setIsCreatingThread(true);
              actions.switchThread(null); // Deselect active thread
            }}
            className={`NewThreadFabBtn ${isCreatingThread ? 'active' : ''}`}
            title="Start a new discussion"
            aria-label="Start new discussion thread"
          >
            <FiPlus />
          </button>
        </div>

        {/* Thread Index List */}
        <div className="ThreadsListScrollContainer">
          {filteredThreads.length === 0 ? (
            <div className="NoThreadsText">No discussions found.</div>
          ) : (
            filteredThreads.map((t) => {
              const isSelected = Number(activeThreadId) === Number(t.id);
              const unreadCount = state.unreadByThread?.[String(t.id)] || 0;
              const isInstructorThread = t.author?.role === 'admin' || t.author?.role === 'instructor';
              
              return (
                <div 
                  key={t.id}
                  onClick={() => {
                    setIsCreatingThread(false);
                    actions.switchThread(t.id);
                  }}
                  className={`ThreadItemCard ${isSelected ? 'Active' : ''}`}
                >
                  {/* Left Avatar circle */}
                  <div className={`Avatar ${isInstructorThread ? 'Instructor' : ''}`}>
                    {getInitials(t.author?.name)}
                  </div>

                  {/* Middle Info Column */}
                  <div className="ThreadCardMiddle">
                    <div className="TitleRow">
                      <h4>{t.title || 'Discussion Thread'}</h4>
                      <span className="TimeBadge">
                        {t.last_activity_at 
                          ? new Date(t.last_activity_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) 
                          : ''}
                      </span>
                    </div>
                    
                    <p className="Snippet">
                      {t.messages_count > 0 
                        ? `Last reply: ${t.messages_count} messages` 
                        : 'No replies yet'}
                    </p>

                    <div className="MetaBadgesRow">
                      {t.is_pinned && <span className="PinPill"><FiBookmark /> Pinned</span>}
                      {t.is_resolved && <span className="ResolvedPill"><FiCheck /> Resolved</span>}
                      {t.is_locked && <span className="LockPill"><FiLock /> Locked</span>}
                    </div>
                  </div>

                  {/* Right Unread Indicator dot */}
                  {unreadCount > 0 && (
                    <div className="UnreadDotBadge">
                      {unreadCount}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── RIGHT PANEL: Conversation Pane / New Thread Pane ───────── */}
      <div className="ChatConversationPane">

        {/* CASE A: Starting a New Discussion Thread */}
        {isCreatingThread && (
          <div className="NewThreadPaneContainer">
            <div className="NewThreadHeader">
              <h3>Start a New Discussion</h3>
              <button 
                type="button" 
                onClick={() => setIsCreatingThread(false)} 
                className="CloseBtn"
                aria-label="Cancel thread creation"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateNewThread} className="NewThreadForm">
              <div className="FormGroup">
                <label htmlFor="thread-title">Topic Title</label>
                <input 
                  id="thread-title"
                  type="text" 
                  placeholder="e.g. Question about alignment technique..."
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                />
              </div>

              <div className="FormGroup">
                <label htmlFor="thread-body">Details / Message</label>
                <textarea 
                  id="thread-body"
                  rows={6}
                  placeholder="Describe your question or share your thoughts here..."
                  value={newThreadBody}
                  onChange={(e) => setNewThreadBody(e.target.value)}
                  required
                />
              </div>

              <div className="CreationActionsRow">
                <button 
                  type="button"
                  onClick={handleCaptureTimestamp}
                  className="TimestampCapsuleBtn"
                >
                  <FiClock />
                  <span>{attachTimestamp ? `Timestamp: ${formatSeconds(capturedTime)}` : "Attach Timestamp"}</span>
                </button>

                <div className="RightActions">
                  <button 
                    type="button" 
                    onClick={() => setIsCreatingThread(false)}
                    className="CancelBtn"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isPosting || !newThreadBody.trim()}
                    className="SubmitBtn"
                  >
                    Post Topic
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* CASE B: Empty State (No Active Thread Selected) */}
        {!isCreatingThread && !activeThreadId && (
          <div className="EmptyChatPane">
            <FiMessageSquare className="PaneIcon" />
            <h3>Select a Conversation</h3>
            <p>Choose an ongoing discussion thread from the sidebar list, or click the plus icon to start a new Q&A thread.</p>
          </div>
        )}

        {/* CASE C: Active Conversation Thread */}
        {!isCreatingThread && activeThreadId && activeThread && (
          <>
            {/* Conversation Header banner */}
            <div className="ChatPaneHeaderRow">
              <div className="HeaderLeft">
                <h3 className="ChatTitle">{activeThread.title}</h3>
                <p className="MetaAuthor">
                  Started by <strong>{activeThread.author?.name || 'Classmate'}</strong>
                </p>
              </div>

              {/* Status Action Badges */}
              <div className="HeaderRightBadges">
                {activeThread.is_pinned && <span className="PinPill"><FiBookmark /> Pinned</span>}
                {activeThread.is_resolved && <span className="ResolvedPill"><FiCheck /> Solved</span>}
                {activeThread.is_locked && <span className="LockPill"><FiLock /> Locked</span>}
              </div>
            </div>

            {/* Conversation Feed */}
            <div 
              ref={feedContainerRef} 
              onScroll={handleScroll}
              className="ChatFeedContainer"
              role="log"
              aria-live="polite"
            >
              {/* Floating Alert Indicator banner */}
              {showNewMsgBanner && (
                <button 
                  type="button" 
                  onClick={handleScrollToBottom} 
                  className="NewMessagesBanner"
                  aria-label="Scroll to bottom for new messages"
                >
                  <FiArrowDown /> New replies below
                </button>
              )}

              {/* Progressive loadingView Earlier button */}
              {hasMore && (
                <button 
                  type="button"
                  onClick={handleViewEarlierMessages}
                  disabled={isLoadingMore}
                  className="ShowOlderMessagesBtn"
                  aria-label="Load older messages"
                >
                  {isLoadingMore ? "Loading..." : "View Earlier Messages"}
                </button>
              )}

              {groupedMessages.map((group) => {
                const isMe = Number(group.userId) === Number(user?.id);
                
                return (
                  <div 
                    key={group.id} 
                    className={`MessageGroup ${group.isInstructor ? 'InstructorGroup' : ''} ${isMe ? 'MyGroup' : ''}`}
                  >
                    {/* Left Timestamp block (only if first message in group has it) */}
                    <div className="GroupLeftCol">
                      {group.messages[0].video_timestamp_seconds && (
                        <button
                          onClick={() => onSeek && onSeek(group.messages[0].video_timestamp_seconds)}
                          className="TimestampCapsuleBtn"
                          title="Seek video"
                          aria-label={`Seek to ${formatSeconds(group.messages[0].video_timestamp_seconds)}`}
                        >
                          <FiClock />
                          <span>{formatSeconds(group.messages[0].video_timestamp_seconds)}</span>
                        </button>
                      )}
                    </div>

                    {/* Conversational bubble pane */}
                    <div className="MessageContentCol">
                      {/* Sender details (once per group) */}
                      <div className="MessageHeaderRow">
                        <div className="AuthorBlock">
                          <div className={`Avatar ${group.isInstructor ? 'Instructor' : ''} ${isMe ? 'MeAvatar' : ''}`}>
                            {getInitials(group.author?.name)}
                          </div>
                          <span className="AuthorName">
                            {group.author?.name || (group.isInstructor ? 'Instructor' : 'Student')}
                          </span>
                          {group.isInstructor && (
                            <span className="InstructorBadge">
                              <FiUserCheck /> Instructor
                            </span>
                          )}
                          <span className="TimeLabel">
                            {group.created_at ? new Date(group.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </div>

                      {/* Stacking conversation message list */}
                      <div className="GroupMessagesList">
                        {group.messages.map((msg) => {
                          const likeCount    = msg.reactions?.filter(r => r.reaction === 'like').length || 0;
                          const helpfulCount = msg.reactions?.filter(r => r.reaction === 'helpful').length || 0;
                          
                          return (
                            <div 
                              key={msg.id || msg._clientId}
                              onMouseEnter={() => setHoveredMsgId(msg.id)}
                              onMouseLeave={() => setHoveredMsgId(null)}
                              className="GroupedBubbleRow"
                            >
                              <div className="BubbleBody">
                                <p>{msg.body}</p>
                              </div>

                              {/* Reactions rows */}
                              {!msg._isPending && (likeCount > 0 || helpfulCount > 0 || hoveredMsgId === msg.id) && (
                                <div className="ReactionsRow">
                                  <button 
                                    onClick={() => handleToggleReaction(msg.id, 'like')} 
                                    className="ReactionBtn"
                                    aria-label="Like reply"
                                  >
                                    <FiThumbsUp /> <span>{likeCount > 0 ? likeCount : 'Like'}</span>
                                  </button>
                                  <button 
                                    onClick={() => handleToggleReaction(msg.id, 'helpful')} 
                                    className="ReactionBtn"
                                    aria-label="Mark helpful"
                                  >
                                    <FiSmile /> <span>{helpfulCount > 0 ? helpfulCount : 'Helpful'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                );
              })}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="TypingIndicator" aria-live="polite">
                  <span className="TypingDots">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </span>
                  <span>{typingUsers.map(u => u.userName).join(', ')} typing...</span>
                </div>
              )}
            </div>

            {/* Conversation Composer Footer */}
            <div className="ChatComposerFooter">
              <div className="InputComposerRow">
                <button 
                  className="TimestampCapsuleBtn"
                  onClick={handleCaptureTimestamp}
                  title="Capture current video timestamp"
                  aria-label="Capture timestamp"
                >
                  <FiClock />
                  <span>{formatSeconds(capturedTime)}</span>
                </button>

                <div className="ComposerBox flex-1">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder="Type a reply... (Enter to send, Shift+Enter for newline, Esc to clear timestamp)"
                    value={composerMessage}
                    onChange={handleComposerChange}
                    onKeyDown={handleKeyDown}
                    disabled={isPosting}
                    aria-label="Write chat reply"
                  />
                </div>

                {attachTimestamp && (
                  <span className="AttachedBadge">
                    <FiClock />
                    <span>{formatSeconds(capturedTime)}</span>
                    <button type="button" onClick={() => setAttachTimestamp(false)} className="ClearBtn">
                      <FiX />
                    </button>
                  </span>
                )}

                <button
                  onClick={handlePostConversation}
                  disabled={isPosting || !composerMessage.trim()}
                  className="SendBtn"
                  aria-label="Send reply"
                >
                  <FiSend />
                </button>
              </div>
            </div>
          </>
        )}

      </div>

    </div>
  );
}
