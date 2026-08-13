"use client";

import React, { useState } from 'react';
import { 
  FiFileText, 
  FiDownload, 
  FiEye, 
  FiFolder, 
  FiImage, 
  FiMusic, 
  FiArchive, 
  FiLink,
  FiExternalLink
} from 'react-icons/fi';
import { resolveMediaUrl } from '@/utils/mediaUrl';

export default function ResourcesTab({ currentLesson }) {
  const [previewItem, setPreviewItem] = useState(null);

  if (!currentLesson) return null;

  const attachment = currentLesson.attachment;
  const rawResources = Array.isArray(currentLesson.resources) ? currentLesson.resources : [];

  // Normalize resources array including main attachment if present
  const allItems = [];
  if (attachment) {
    allItems.push({
      id: 'att-' + (attachment.id || 0),
      title: attachment.title || attachment.file_name || 'Lesson Resource Attachment',
      url: attachment.file_path || attachment.path,
      mime: attachment.mime_type || attachment.mime || 'application/pdf',
      size: attachment.file_size || attachment.size,
      isAttachment: true,
    });
  }

  rawResources.forEach((res, idx) => {
    allItems.push({
      id: res.id || idx,
      title: res.title || res.name || `Learning Resource ${idx + 1}`,
      url: res.url || res.file_path || res.path,
      mime: res.mime || 'application/octet-stream',
      size: res.size,
      isAttachment: false,
    });
  });

  const formatDownloadUrl = (path) => {
    if (!path) return '#';
    return resolveMediaUrl(path);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return 'File';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${Math.round(kb)} KB`;
  };

  const getResourceIcon = (mime = '') => {
    const m = mime.toLowerCase();
    if (m.includes('image')) return <FiImage style={{ color: '#ec4899' }} />;
    if (m.includes('audio')) return <FiMusic style={{ color: '#8b5cf6' }} />;
    if (m.includes('zip') || m.includes('rar') || m.includes('tar')) return <FiArchive style={{ color: '#f59e0b' }} />;
    if (m.includes('pdf')) return <FiFileText style={{ color: '#ef4444' }} />;
    if (m.includes('word') || m.includes('document')) return <FiFileText style={{ color: '#3b82f6' }} />;
    return <FiFileText style={{ color: 'var(--primaryColor, #874429)' }} />;
  };

  const getMimeBadge = (mime = '') => {
    const m = mime.toLowerCase();
    if (m.includes('pdf')) return 'PDF';
    if (m.includes('word') || m.includes('document')) return 'DOCX';
    if (m.includes('presentation') || m.includes('powerpoint')) return 'PPTX';
    if (m.includes('spreadsheet') || m.includes('excel')) return 'XLSX';
    if (m.includes('zip')) return 'ZIP';
    if (m.includes('image')) return 'IMAGE';
    if (m.includes('audio')) return 'AUDIO';
    return 'FILE';
  };

  return (
    <div className="ResourcesTabContainer" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {allItems.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px border-dashed #cbd5e1',
          color: '#64748b'
        }}>
          <FiFolder style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '8px' }} />
          <p style={{ fontSize: '14px', fontWeight: '500' }}>No downloadable resources for this lesson</p>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Check back later or ask your instructor for reference materials.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {allItems.map((item) => {
            const finalUrl = formatDownloadUrl(item.url);
            const isPdf = item.mime?.toLowerCase().includes('pdf');
            const isImage = item.mime?.toLowerCase().includes('image');

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '22px', display: 'flex', alignItems: 'center' }}>
                    {getResourceIcon(item.mime)}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                    <span style={{
                      fontSize: '13.5px',
                      fontWeight: '600',
                      color: '#1e293b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.title}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        textTransform: 'uppercase'
                      }}>
                        {getMimeBadge(item.mime)}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {formatFileSize(item.size)}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {(isPdf || isImage) && (
                    <button
                      onClick={() => setPreviewItem(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      <FiEye />
                      <span>Preview</span>
                    </button>
                  )}

                  <a
                    href={finalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 14px',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'var(--primaryColor, #874429)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(135, 68, 41, 0.15)'
                    }}
                  >
                    <FiDownload />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal for PDFs & Images */}
      {previewItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '900px',
            height: '80vh',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>
                Preview: {previewItem.title}
              </span>
              <button
                onClick={() => setPreviewItem(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            <div style={{ flex: 1, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewItem.mime?.toLowerCase().includes('image') ? (
                <img
                  src={formatDownloadUrl(previewItem.url)}
                  alt={previewItem.title}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <iframe
                  src={formatDownloadUrl(previewItem.url)}
                  title={previewItem.title}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
