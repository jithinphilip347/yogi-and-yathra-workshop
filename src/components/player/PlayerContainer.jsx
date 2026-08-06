"use client";

import React from 'react';
import { FiLock } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import VideoEngine from './VideoEngine';

export default React.memo(function PlayerContainer({
  lesson,
  nextLesson,
  previousLesson,
  onNavigate,
  permissions,
  courseSlug,
  onProgressUpdated,
  onRegisterPlayerCallbacks
}) {
  const router = useRouter();

  if (!lesson) {
    return (
      <div className="PlayerContainer">
        <div className="LockedOverlay">
          <h3>No Lesson Selected</h3>
          <p>Please select a lesson from the course sidebar to begin viewing.</p>
        </div>
      </div>
    );
  }

  // Access check
  const hasAccess = permissions?.has_access;

  if (!hasAccess) {
    return (
      <div className="PlayerContainer">
        <div className="LockedOverlay">
          <FiLock className="LockIcon" />
          <h3>Lesson Locked</h3>
          <p>You need an active enrollment to access this lesson. Enroll now to unlock the full course!</p>
          <button
            className="EnrollBtn"
            onClick={() => router.push(`/course/${courseSlug || ''}`)}
          >
            Enroll in Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="PlayerContainer">
      <VideoEngine
        lesson={lesson}
        nextLesson={nextLesson}
        previousLesson={previousLesson}
        onNavigate={onNavigate}
        courseSlug={courseSlug}
        permissions={permissions}
        onProgressUpdated={onProgressUpdated}
        onRegisterPlayerCallbacks={onRegisterPlayerCallbacks}
      />
    </div>
  );
});
