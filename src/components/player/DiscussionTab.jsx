"use client";

import React, { useEffect, useRef, useState } from 'react';
import { 
  FiMessageSquare, FiClock, FiSend, FiThumbsUp, FiSmile, FiUserCheck, FiUsers, FiX, 
  FiSearch, FiFilter, FiCheckCircle, FiHeart, FiAward, FiTrash2, FiBookmark, FiPlus, FiChevronDown, FiChevronUp 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useCommunication } from '@/communication/CommunicationStore';
import { useCommunicationActions } from '@/communication/useCommunicationActions';
import {
  selectSortedThreads,
  selectSortedMessages,
  selectUnreadCount,
} from '@/communication/selectors';

export default function DiscussionTab({ course, currentLesson, entityType: propEntityType, getCurrentTime, onSeek }) {
  const { user } = useSelector((state) => state.auth);
  const { state } = useCommunication();
  const actions = useCommunicationActions();

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  // Debounced copy of the search input (~300ms) so typing does not fire one
  // threads request per keystroke — the API is only hit after the student
  // pauses typing.
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('recent'); // recent, pinned, solved, instructor, popular

  // Main Composer State
  const [composerMessage, setComposerMessage] = useState('');
  const [attachTimestamp, setAttachTimestamp] = useState(false);
  const [capturedTime, setCapturedTime] = useState(0);
  const [isPostingQuestion, setIsPostingQuestion] = useState(false);

  // Progressive thread loading limit
  const [threadsLimit, setThreadsLimit] = useState(5);

  // Inline expanded threads tracking
  const [expandedThreads, setExpandedThreads] = useState(new Set());

  // Reply composers state: { [threadId]: string }
  const [replyInputs, setReplyInputs] = useState({});

  // Refs
  const mainComposerRef = useRef(null);
  // Tracks the current discussion context so first-thread messages are only
  // auto-loaded when switching course/lesson — never on search/filter changes.
  const discussionContextRef = useRef('');

  // ─── Selectors ─────────────────────────────────────────────────────────
  const threads = selectSortedThreads(state);
  const loading = state.loading;

  // ─── 0. Debounce the search input (~300ms) ──────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── 1. Fetch threads on Context, Search, or Filter change ─────────────
  useEffect(() => {
    const entityType = propEntityType || (currentLesson?.id ? 'lesson' : 'course');
    const entityId   = currentLesson?.id  ? currentLesson.id : course?.id;
    if (entityId) {
      const contextKey = `${entityType}:${entityId}`;
      const contextChanged = discussionContextRef.current !== contextKey;
      discussionContextRef.current = contextKey;

      actions.loadThreads(entityType, entityId, {
        search: debouncedSearchQuery || undefined,
        filter: filterType !== 'recent' ? filterType : undefined,
        // Auto-load the first thread's messages only when the discussion
        // context changed (course/lesson change) — not on search/filter
        // changes where the student has not opened any thread yet.
        loadFirstThread: contextChanged,
      });
    }
  }, [course?.id, currentLesson?.id, debouncedSearchQuery, filterType, propEntityType]);

  // Reset pagination and expansions when lesson changes
  useEffect(() => {
    setThreadsLimit(5);
    setExpandedThreads(new Set());
  }, [currentLesson?.id]);

  // ─── 2. Question Creation ──────────────────────────────────────────────
  const handleCaptureTimestamp = () => {
    const time = getCurrentTime ? Math.floor(getCurrentTime()) : 0;
    setCapturedTime(time);
    setAttachTimestamp(true);
    toast.success(`Attached playback time ${formatSeconds(time)}`);
  };

  const handlePostQuestion = async (e) => {
    e.preventDefault();
    if (!composerMessage.trim()) return;

    setIsPostingQuestion(true);
    try {
      const result = await actions.createThread({
        entity_type: propEntityType || (currentLesson ? 'lesson' : 'course'),
        entity_id:   currentLesson ? currentLesson.id : course.id,
        body:        composerMessage.trim(),
        ...(attachTimestamp && capturedTime > 0 ? {
          video_timestamp_seconds: capturedTime,
          timestamp_label: formatSeconds(capturedTime),
        } : {}),
      });

      if (result.success) {
        toast.success('Question posted successfully!');
        setComposerMessage('');
        setAttachTimestamp(false);
      } else {
        toast.error('Failed to post question');
      }
    } catch {
      toast.error('Failed to post question');
    } finally {
      setIsPostingQuestion(false);
    }
  };

  // ─── 3. Expand Inline Replies & Load Messages ─────────────────────────
  const handleToggleReplies = async (threadId) => {
    const nextExp = new Set(expandedThreads);
    if (nextExp.has(threadId)) {
      nextExp.delete(threadId);
    } else {
      nextExp.add(threadId);
      // Fetch replies from API if not already cached
      actions.loadMessages(threadId);
    }
    setExpandedThreads(nextExp);
  };

  // ─── 4. Post Reply Inline ──────────────────────────────────────────────
  const handlePostReply = async (threadId) => {
    const replyBody = replyInputs[threadId] || '';
    if (!replyBody.trim()) return;

    try {
      const result = await actions.sendMessage({
        threadId,
        body: replyBody.trim(),
        currentUser: user,
      });

      if (result.success) {
        setReplyInputs(prev => ({ ...prev, [threadId]: '' }));
        toast.success('Reply posted!');
      } else {
        toast.error('Failed to post reply');
      }
    } catch {
      toast.error('Failed to post reply');
    }
  };

  // ─── Helper Functions ──────────────────────────────────────────────────
  const formatSeconds = (sec) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : 'U');

  const visibleThreads = threads.slice(0, threadsLimit);
  const hasMoreThreads = threads.length > threadsLimit;

  return (
    <div className="QuestionsDiscussionContainer" role="region" aria-label="Questions and Discussions Q&A">
      
      {/* ─── A. Main Composer (YT/Udemy style Q&A prompt) ────────────────── */}
      <div className="MainComposerBlock">
        <div className="ComposerHeader">
          <span className="PromptText">Ask a question about this lesson...</span>
        </div>
        <form onSubmit={handlePostQuestion} className="QuestionForm">
          <div className="InputWrapper">
            <textarea
              ref={mainComposerRef}
              rows={3}
              value={composerMessage}
              onChange={(e) => setComposerMessage(e.target.value)}
              placeholder="What are you stuck on? Share details so instructors or classmates can help..."
              aria-label="Write a question"
            />
          </div>
          <div className="ComposerControlBar">
            <button
              type="button"
              onClick={handleCaptureTimestamp}
              className="TimestampCaptureBtn"
              title="Tag current video timestamp"
            >
              <FiClock />
              <span>Comment at {formatSeconds(getCurrentTime ? getCurrentTime() : 0)}</span>
            </button>

            {attachTimestamp && (
              <span className="TimestampBadge">
                <FiClock />
                <span>Tagged: {formatSeconds(capturedTime)}</span>
                <button type="button" onClick={() => setAttachTimestamp(false)} className="ClearBadgeBtn">
                  <FiX />
                </button>
              </span>
            )}

            <button
              type="submit"
              disabled={isPostingQuestion || !composerMessage.trim()}
              className="PostQuestionBtn"
            >
              <FiSend />
              <span>{isPostingQuestion ? 'Posting...' : 'Post Question'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ─── B. Search & Sorting Control Header ────────────────────────── */}
      <div className="SearchFilterHeader">
        <div className="SearchBox">
          <FiSearch className="Icon" />
          <input
            type="text"
            placeholder="Search questions, replies, or instructors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search questions"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="ClearSearchBtn">
              <FiX />
            </button>
          )}
        </div>

        <div className="FilterDropdown">
          <FiFilter className="Icon" />
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Sort and filter questions"
          >
            <option value="recent">Newest Questions</option>
            <option value="popular">Most Replied</option>
            <option value="pinned">Pinned Questions</option>
            <option value="solved">Solved Q&A</option>
            <option value="instructor">Instructor Answered</option>
          </select>
        </div>
      </div>

      {/* ─── C. Questions Listing Feed ─────────────────────────────────── */}
      <div className="QuestionsFeed">
        {loading && threads.length === 0 ? (
          <div className="FeedLoadingText">Loading questions feed...</div>
        ) : threads.length === 0 ? (
          <div className="EmptyStateBlock">
            <FiMessageSquare className="EmptyIcon" />
            <p className="TitleText">No questions have been asked for this lesson yet.</p>
            <p className="SubText">Be the first to spark a conversation or ask for help!</p>
          </div>
        ) : (
          visibleThreads.map((thread) => {
            const isExpanded = expandedThreads.has(thread.id);
            const messagesList = state.messagesByThread[String(thread.id)] || [];
            
            // The first message is the actual question content (body, reactions, timestamp)
            const mainQuestion = messagesList[0] || null;
            const replies = messagesList.slice(1);

            const isInstructor = thread.author?.role === 'admin' || thread.author?.role === 'instructor';
            const isMe = Number(thread.user_id) === Number(user?.id);

            // Reactions counts from main message
            const likesCount = mainQuestion?.reactions?.filter(r => r.reaction === 'like').length || 0;
            const helpfulCount = mainQuestion?.reactions?.filter(r => r.reaction === 'helpful').length || 0;
            const loveCount = mainQuestion?.reactions?.filter(r => r.reaction === 'love').length || 0;
            const insightCount = mainQuestion?.reactions?.filter(r => r.reaction === 'insightful').length || 0;

             const hasInstructorReply = replies.some(r => r.is_instructor_answer || r.author?.role === 'admin' || r.author?.role === 'instructor');
             const unreadCount = selectUnreadCount(state, thread.id) || thread.unread_count || 0;
 
             return (
               <div 
                 key={thread.id} 
                 className={`QuestionCard ${thread.is_pinned ? 'PinnedQuestion' : ''} ${thread.is_resolved ? 'SolvedQuestion' : ''} ${unreadCount > 0 ? 'UnreadQuestion' : ''}`}
               >
                 {/* 1. Header author details */}
                 <div className="CardHeader">
                   <div className="AuthorBlock">
                     <div className={`Avatar ${isInstructor ? 'Instructor' : ''} ${isMe ? 'MeAvatar' : ''}`}>
                       {getInitials(thread.author?.name)}
                     </div>
                     <div className="AuthorMeta">
                       <span className="AuthorName">
                         {thread.author?.name || 'Classmate'}
                       </span>
                       <span className="TimeLabel">
                         {thread.created_at ? new Date(thread.created_at).toLocaleDateString() : ''}
                       </span>
                     </div>
                   </div>
 
                   <div className="CardBadges">
                     {unreadCount > 0 && (
                       <span className="Badge UnreadBadge" style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}>
                         New
                       </span>
                     )}
                     {thread.is_pinned && (
                       <span className="Badge PinnedBadge">
                         <FiBookmark /> Pinned
                       </span>
                     )}
                     {thread.is_resolved && (
                       <span className="Badge SolvedBadge">
                         <FiCheckCircle /> Solved
                       </span>
                     )}
                     {hasInstructorReply && (
                       <span className="Badge InstructorBadge">
                         <FiUserCheck /> Instructor Reply
                       </span>
                     )}
                   </div>
                </div>

                {/* 2. Question Text Body */}
                <div className="CardBody">
                  <p className="QuestionText">
                    {isExpanded && mainQuestion ? mainQuestion.body : thread.title}
                  </p>

                  {/* Video Seeking Capsule */}
                  {((isExpanded && mainQuestion?.video_timestamp_seconds) || (!isExpanded && thread.latest_message?.video_timestamp_seconds)) && (
                    <button
                      onClick={() => onSeek && onSeek(isExpanded ? mainQuestion.video_timestamp_seconds : thread.latest_message.video_timestamp_seconds)}
                      className="VideoSeekCapsule"
                      title="Seek player to timestamp"
                    >
                      <FiClock />
                      <span>Seek to {formatSeconds(isExpanded ? mainQuestion.video_timestamp_seconds : thread.latest_message.video_timestamp_seconds)}</span>
                    </button>
                  )}
                </div>

                {/* 3. Footer actions row (Reactions & Replies togglers) */}
                <div className="CardFooterActions">
                  <div className="ReactionChipsList">
                    <button 
                      onClick={() => mainQuestion && actions.toggleReaction(mainQuestion.id, 'like', thread.id, user)} 
                      className={`ReactionChip ${mainQuestion?.reactions?.some(r => r.user_id === user?.id && r.reaction === 'like') ? 'active' : ''}`}
                    >
                      <FiThumbsUp />
                      <span>{likesCount}</span>
                    </button>
                    
                    <button 
                      onClick={() => mainQuestion && actions.toggleReaction(mainQuestion.id, 'helpful', thread.id, user)}
                      className={`ReactionChip ${mainQuestion?.reactions?.some(r => r.user_id === user?.id && r.reaction === 'helpful') ? 'active' : ''}`}
                    >
                      <FiSmile />
                      <span>{helpfulCount}</span>
                    </button>

                    <button 
                      onClick={() => mainQuestion && actions.toggleReaction(mainQuestion.id, 'love', thread.id, user)}
                      className={`ReactionChip ${mainQuestion?.reactions?.some(r => r.user_id === user?.id && r.reaction === 'love') ? 'active' : ''}`}
                    >
                      <FiHeart />
                      <span>{loveCount}</span>
                    </button>

                    <button 
                      onClick={() => mainQuestion && actions.toggleReaction(mainQuestion.id, 'insightful', thread.id, user)}
                      className={`ReactionChip ${mainQuestion?.reactions?.some(r => r.user_id === user?.id && r.reaction === 'insightful') ? 'active' : ''}`}
                    >
                      <FiAward />
                      <span>{insightCount}</span>
                    </button>
                  </div>

                  <div className="RightActions">
                    {/* Instructor Moderation Triggers */}
                    {(user?.role === 'admin' || user?.role === 'instructor') && (
                      <>
                        <button 
                          onClick={() => actions.deleteThread(thread.id)}
                          className="ModeratorActionBtn delete"
                          title="Delete thread"
                        >
                          <FiTrash2 />
                        </button>
                      </>
                    )}

                    <button 
                      onClick={() => handleToggleReplies(thread.id)}
                      className="RepliesToggleBtn"
                    >
                      <span>{isExpanded ? 'Hide Replies' : `Show Replies (${thread.messages_count - 1})`}</span>
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>
                </div>

                {/* 4. Collapsible Inline Replies Section */}
                {isExpanded && (
                  <div className="InlineRepliesContainer">
                    <div className="RepliesHeader">
                      <span>Replies ({replies.length})</span>
                    </div>

                    <div className="RepliesList">
                      {replies.map((reply) => {
                        const isReplyInstructor = reply.is_instructor_answer || reply.author?.role === 'admin' || reply.author?.role === 'instructor';
                        const isReplyMe = Number(reply.user_id) === Number(user?.id);
                        
                        return (
                          <div 
                            key={reply.id} 
                            className={`ReplyCard ${isReplyInstructor ? 'InstructorReply' : ''} ${isReplyMe ? 'MyReply' : ''}`}
                          >
                            <div className="ReplyHeader">
                              <div className="AuthorBlock">
                                <div className={`Avatar ${isReplyInstructor ? 'Instructor' : ''} ${isReplyMe ? 'MeAvatar' : ''}`}>
                                  {getInitials(reply.author?.name)}
                                </div>
                                <div className="AuthorMeta">
                                  <span className="AuthorName">{reply.author?.name}</span>
                                  {isReplyInstructor && (
                                    <span className="InstructorBadge">
                                      <FiUserCheck /> Instructor
                                    </span>
                                  )}
                                  <span className="TimeLabel">
                                    {reply.created_at ? new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="ReplyBody">
                              <p>{reply.body}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Inline Reply Composer */}
                    <div className="InlineReplyComposer">
                      <div className="Avatar">
                        {getInitials(user?.name)}
                      </div>
                      <div className="ReplyInputWrapper">
                        <textarea
                          rows={1}
                          placeholder="Write a reply..."
                          value={replyInputs[thread.id] || ''}
                          onChange={(e) => setReplyInputs({ ...replyInputs, [thread.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handlePostReply(thread.id);
                            }
                          }}
                          aria-label="Write a reply"
                        />
                        <button
                          onClick={() => handlePostReply(thread.id)}
                          disabled={!(replyInputs[thread.id] || '').trim()}
                          className="SendReplyBtn"
                          aria-label="Submit reply"
                        >
                          <FiSend />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}

        {/* Load Earlier Questions progressive list button */}
        {hasMoreThreads && (
          <button 
            type="button" 
            onClick={() => setThreadsLimit(prev => prev + 5)}
            className="LoadEarlierQuestionsBtn"
            aria-label="Load earlier questions"
          >
            <FiPlus /> Load Earlier Questions
          </button>
        )}
      </div>

    </div>
  );
}
