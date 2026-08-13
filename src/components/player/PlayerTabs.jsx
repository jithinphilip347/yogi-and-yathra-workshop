"use client";

import React, { useState } from 'react';
import OverviewTab from './OverviewTab';
import NotesTab from './NotesTab';
import ResourcesTab from './ResourcesTab';
import DiscussionTab from './DiscussionTab';
import ReviewsTab from './ReviewsTab';

export default React.memo(function PlayerTabs({ course, sections, currentLesson, getCurrentTime, onSeek, completionSummary, certificateEligibility, onEligibilityUpdate, activeTab: activeTabProp, onTabChange }) {
  // Tabs can be controlled externally (e.g. the header "Leave a review" button
  // switches straight to the Reviews tab); fall back to internal state otherwise.
  const [localActiveTab, setLocalActiveTab] = useState('overview');
  const isControlled = activeTabProp !== undefined;
  const activeTab = isControlled ? activeTabProp : localActiveTab;
  const selectTab = (tab) => {
    if (isControlled) {
      onTabChange?.(tab);
    } else {
      setLocalActiveTab(tab);
    }
  };

  const resourceCount = (currentLesson?.attachment ? 1 : 0) + (Array.isArray(currentLesson?.resources) ? currentLesson.resources.length : 0);

  return (
    <div className="PlayerTabsSection">
      <div className="TabsNav">
        <button
          className={`TabButton ${activeTab === 'overview' ? 'Active' : ''}`}
          onClick={() => selectTab('overview')}
        >
          Overview
        </button>

        <button
          className={`TabButton ${activeTab === 'notes' ? 'Active' : ''}`}
          onClick={() => selectTab('notes')}
        >
          Notes
        </button>

        <button
          className={`TabButton ${activeTab === 'resources' ? 'Active' : ''}`}
          onClick={() => selectTab('resources')}
        >
          Resources {resourceCount > 0 ? `(${resourceCount})` : ''}
        </button>

        <button
          className={`TabButton ${activeTab === 'discussion' ? 'Active' : ''}`}
          onClick={() => selectTab('discussion')}
        >
          Questions & Discussion
        </button>

        <button
          className={`TabButton ${activeTab === 'reviews' ? 'Active' : ''}`}
          onClick={() => selectTab('reviews')}
        >
          Reviews
        </button>
      </div>

      <div className="TabContent" style={{ marginTop: '16px' }}>
        {activeTab === 'overview' && (
          <OverviewTab
            course={course}
            currentLesson={currentLesson}
            completionSummary={completionSummary}
            certificateEligibility={certificateEligibility}
            onEligibilityUpdate={onEligibilityUpdate}
          />
        )}

        {activeTab === 'notes' && (
          <NotesTab
            sections={sections}
            currentLesson={currentLesson}
            getCurrentTime={getCurrentTime}
            onSeek={onSeek}
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesTab currentLesson={currentLesson} />
        )}

        {activeTab === 'discussion' && (
          <DiscussionTab
            course={course}
            currentLesson={currentLesson}
            getCurrentTime={getCurrentTime}
            onSeek={onSeek}
          />
        )}

        {activeTab === 'reviews' && (
          <ReviewsTab course={course} />
        )}
      </div>
    </div>
  );
});
