"use client";

import React, { useState } from 'react';
import OverviewTab from './OverviewTab';
import ResourcesTab from './ResourcesTab';

export default function PlayerTabs({ course, currentLesson }) {
  const [activeTab, setActiveTab] = useState('overview');

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
          className={`TabButton ${activeTab === 'resources' ? 'Active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          Resources & Attachments
        </button>
      </div>

      <div className="TabContent">
        {activeTab === 'overview' && (
          <OverviewTab course={course} currentLesson={currentLesson} />
        )}
        {activeTab === 'resources' && (
          <ResourcesTab currentLesson={currentLesson} />
        )}
      </div>
    </div>
  );
}
