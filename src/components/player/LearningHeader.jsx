"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiSidebar, FiChevronLeft, FiChevronRight, FiBookmark, FiCheckCircle, FiShare2, FiStar, FiMoreVertical } from 'react-icons/fi';

export default React.memo(function LearningHeader({
  courseTitle,
  lessonTitle,
  courseSlug,
  previousLesson,
  nextLesson,
  onNavigate,
  completionSummary,
  onToggleSidebar,
  sidebarOpen,
  isBookmarked,
  onToggleBookmark,
  isLessonCompleted,
  onToggleCompletion,
  completionMode = 'auto_and_manual',
  onLeaveReview
}) {
  const router = useRouter();

  const handleBack = () => {
    if (courseSlug) {
      router.push(`/course/${courseSlug}`);
    } else {
      router.push('/auth/profile');
    }
  };

  const percentage = completionSummary?.percentage ?? 0;
  const completedCount = completionSummary?.completed_count ?? 0;
  const totalLessons = completionSummary?.total_lessons ?? 0;

  const showManualButton = onToggleCompletion && completionMode !== 'auto_only';

  return (
    <header className="LearningHeader">
      <div className="HeaderLeft">
        <div className="Branding" onClick={handleBack} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="LogoText" style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px', color: '#ffffff' }}>Yogify</span>
        </div>
        <div className="Divider" style={{ width: '1px', height: '24px', backgroundColor: '#3e4143', margin: '0 8px' }} />
        <h1 className="CourseTitleHeader" style={{ fontSize: '15px', fontWeight: '500', color: '#ffffff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
          {courseTitle}
        </h1>
      </div>

      <div className="HeaderRight">
        {/* Leave a Review — opens the Reviews tab inside the player */}
        <button
          className="HeaderLinkBtn"
          onClick={() =>
            onLeaveReview
              ? onLeaveReview()
              : router.push(`/course/${courseSlug || ''}#reviews`)
          }
          title="Leave a review for this course"
        >
          <FiStar style={{ marginRight: '6px' }} />
          <span>Leave a review</span>
        </button>

        {/* Your Progress circular/percentage widget */}
        <div className="ProgressIndicator">
          <div className="ProgressCircle">
            <svg width="32" height="32" viewBox="0 0 36 36">
              <path
                className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#3e4143"
                strokeWidth="3"
              />
              <path
                className="circle"
                strokeDasharray={`${percentage}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--primaryColor, #874429)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="ProgressText">
            <span className="ProgressLabel">Your progress</span>
            <span className="ProgressPercent">{completedCount}/{totalLessons} ({percentage}%)</span>
          </div>
        </div>

        {/* Share Button */}
        <button className="ShareBtn" title="Share Course">
          <FiShare2 />
          <span>Share</span>
        </button>

        {/* Bookmark Toggle Button */}
        <button
          onClick={onToggleBookmark}
          title={isBookmarked ? "Remove Bookmark" : "Bookmark Lesson"}
          className={`BookmarkBtn ${isBookmarked ? 'Active' : ''}`}
        >
          <FiBookmark style={{ fill: isBookmarked ? 'currentColor' : 'none' }} />
        </button>

        {/* Mark Complete Button */}
        {showManualButton && (
          <button
            onClick={onToggleCompletion}
            title={isLessonCompleted ? "Lesson Completed" : "Mark as Complete"}
            className={`CompleteBtn ${isLessonCompleted ? 'Completed' : ''}`}
          >
            <FiCheckCircle />
            <span>{isLessonCompleted ? "Completed" : "Complete"}</span>
          </button>
        )}

        {/* Previous & Next Icon Navigation */}
        <div className="HeaderLessonNav">
          <button
            className="NavIconHeaderBtn"
            disabled={!previousLesson}
            onClick={() => onNavigate && onNavigate(previousLesson)}
            title={previousLesson ? `Previous: ${previousLesson.title}` : 'No Previous Lesson'}
          >
            <FiChevronLeft />
          </button>

          <button
            className="NavIconHeaderBtn"
            disabled={!nextLesson}
            onClick={() => onNavigate && onNavigate(nextLesson)}
            title={nextLesson ? `Next: ${nextLesson.title}` : 'No Next Lesson'}
          >
            <FiChevronRight />
          </button>
        </div>

        {/* Sidebar Toggle Toggle */}
        <button
          className={`SidebarToggleBtn ${sidebarOpen ? 'Open' : ''}`}
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Close Course Content" : "Open Course Content"}
        >
          <FiSidebar />
        </button>

        {/* Options Menu */}
        <button className="HeaderMoreBtn">
          <FiMoreVertical />
        </button>
      </div>
    </header>
  );
});
