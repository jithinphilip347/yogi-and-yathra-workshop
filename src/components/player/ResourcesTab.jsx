"use client";

import React from 'react';
import { FiFileText, FiDownload } from 'react-icons/fi';
import { MEDIA_BASE_URL } from '@/utils/constants';

export default function ResourcesTab({ currentLesson }) {
  if (!currentLesson) return null;

  const attachment = currentLesson.attachment;
  const resources = Array.isArray(currentLesson.resources) ? currentLesson.resources : [];

  const formatDownloadUrl = (path) => {
    if (!path) return '#';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${MEDIA_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  };

  const hasResources = attachment || resources.length > 0;

  return (
    <div className="ResourcesTab">
      {!hasResources ? (
        <div className="EmptyResources">
          <p>No downloadable resources or attachments provided for this lesson.</p>
        </div>
      ) : (
        <>
          {attachment && (
            <div className="ResourceItem">
              <div className="LeftInfo">
                <FiFileText className="FileIcon" />
                <span className="FileName">
                  {attachment.title || attachment.file_name || 'Lesson Resource Document'}
                </span>
              </div>
              <a
                href={formatDownloadUrl(attachment.file_path || attachment.path)}
                target="_blank"
                rel="noopener noreferrer"
                className="DownloadBtn"
                download
              >
                <FiDownload />
                <span>Download</span>
              </a>
            </div>
          )}

          {resources.map((item, idx) => (
            <div className="ResourceItem" key={idx}>
              <div className="LeftInfo">
                <FiFileText className="FileIcon" />
                <span className="FileName">{item.title || item.name || `Attachment ${idx + 1}`}</span>
              </div>
              <a
                href={formatDownloadUrl(item.file_path || item.url || item.path)}
                target="_blank"
                rel="noopener noreferrer"
                className="DownloadBtn"
                download
              >
                <FiDownload />
                <span>Download</span>
              </a>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
