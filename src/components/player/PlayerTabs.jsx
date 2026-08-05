"use client";

import React, { useState } from 'react';
import OverviewTab from './OverviewTab';
import NotesTab from './NotesTab';
import ResourcesTab from './ResourcesTab';
import DiscussionTab from './DiscussionTab';

export default function PlayerTabs({ course, currentLesson, getCurrentTime, onSeek }) {
  const [activeTab, setActiveTab] = useState('overview');

  const resourceCount = (currentLesson?.attachment ? 1 : 0) + (Array.isArray(currentLesson?.resources) ? currentLesson.resources.length : 0);

  return (
    <div className="PlayerTabsSection">
      <div className="TabsNav">
        <button
          className={`TabButton ${activeTab === 'overview' ? 'Active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>

        <button
          className={`TabButton ${activeTab === 'notes' ? 'Active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>

        <button
          className={`TabButton ${activeTab === 'resources' ? 'Active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          Resources {resourceCount > 0 ? `(${resourceCount})` : ''}
        </button>

        <button
          className={`TabButton ${activeTab === 'discussion' ? 'Active' : ''}`}
          onClick={() => setActiveTab('discussion')}
        >
          Discussion
        </button>
      </div>

      <div className="TabContent" style={{ marginTop: '16px' }}>
        {activeTab === 'overview' && (
          <OverviewTab course={course} currentLesson={currentLesson} />
        )}

        {activeTab === 'notes' && (
          <NotesTab
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
      </div>
    </div>
  );
}
