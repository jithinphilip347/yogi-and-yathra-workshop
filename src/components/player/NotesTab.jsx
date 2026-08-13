"use client";

import React, { useState, useEffect } from 'react';
import { 
  FiClock, 
  FiTrash2, 
  FiEdit2, 
  FiChevronDown,
  FiBold,
  FiItalic,
  FiList,
  FiCode,
  FiImage
} from 'react-icons/fi';
import courseApi from '@/libs/courseApi';
import toast from 'react-hot-toast';
import PlayerTabState from './PlayerTabState';

export default function NotesTab({ sections = [], currentLesson, getCurrentTime, onSeek }) {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [sortBy, setSortBy] = useState('timestamp'); // 'timestamp' or 'date'
  const [filterLecture, setFilterLecture] = useState('current'); // 'current' or 'all'

  // New Note Form State
  const [newContent, setNewContent] = useState('');
  const [capturedTime, setCapturedTime] = useState(null);

  // Edit Note State
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const fetchNotes = async () => {
    if (!currentLesson?.id) return;
    try {
      setIsLoading(true);
      setHasError(false);
      const res = await courseApi.getLessonNotes(currentLesson.id, {
        sort: sortBy,
      });
      const data = res.data?.data || res.data || [];
      setNotes(data);
    } catch (err) {
      // A failed load is an ERROR state with retry — never a misleading
      // "no notes yet" empty state. 429 is shown as a controlled retry hint.
      console.warn("Failed to fetch notes:", err);
      setHasError(true);
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    // Capture time automatically when tab opens
    if (typeof getCurrentTime === 'function') {
      const time = getCurrentTime();
      setCapturedTime(Math.floor(time || 0));
    }
  }, [currentLesson?.id, sortBy]);

  const formatSeconds = (secs) => {
    if (secs === null || secs === undefined || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCreateNote = async (e) => {
    if (e) e.preventDefault();
    if (!newContent.trim()) {
      toast.error("Please enter note text");
      return;
    }

    try {
      await courseApi.createLessonNote(
        currentLesson.id,
        newContent,
        capturedTime
      );
      toast.success("Note saved");
      setNewContent('');
      // Reset captured time to current playback position
      if (typeof getCurrentTime === 'function') {
        setCapturedTime(Math.floor(getCurrentTime() || 0));
      } else {
        setCapturedTime(null);
      }
      fetchNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save note");
    }
  };

  const handleUpdateNote = async (noteId) => {
    if (!editContent.trim()) return;
    try {
      await courseApi.updateLessonNote(noteId, editContent, capturedTime);
      toast.success("Note updated");
      setEditingNoteId(null);
      setEditContent('');
      fetchNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update note");
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await courseApi.deleteLessonNote(noteId);
      toast.success("Note deleted");
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      toast.error("Failed to delete note");
    }
  };

  // Find Section Title for the current lesson from the sections list
  const getSectionTitle = () => {
    if (!sections || !currentLesson) return '';
    const section = sections.find(s => s.id === currentLesson.section_id);
    return section ? section.title : 'Course content';
  };

  const currentSectionTitle = getSectionTitle();
  const charsLeft = 1000 - newContent.length;

  return (
    <div className="NotesTabContainer" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ─── 1. Create Note Input Area (Udemy Style) ────────────────────── */}
      <div className="CreateNoteArea" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        
        {/* Left Timestamp Capsule */}
        <button 
          className="TimestampCapsuleBtn"
          onClick={() => {
            if (typeof getCurrentTime === 'function') {
              setCapturedTime(Math.floor(getCurrentTime() || 0));
            }
          }}
          title="Click to capture current playback time"
          style={{
            backgroundColor: '#1c1d1f',
            color: '#ffffff',
            border: 'none',
            borderRadius: '16px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0
          }}
        >
          <FiClock style={{ fontSize: '11px' }} />
          <span>{formatSeconds(capturedTime)}</span>
        </button>

        {/* Note input container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div className="EditorBox" style={{
            border: '1px solid #d1d7dc',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            transition: 'border-color 0.2s'
          }}>
            {/* Editor Text Toolbar */}
            <div className="EditorToolbar" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              borderBottom: '1px solid #d1d7dc',
              backgroundColor: '#f7f9fa'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#6a6f73' }}>
                <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  Styles <FiChevronDown />
                </span>
                <FiBold style={{ cursor: 'pointer' }} />
                <FiItalic style={{ cursor: 'pointer' }} />
                <FiList style={{ cursor: 'pointer' }} />
                <FiCode style={{ cursor: 'pointer' }} />
                <FiImage style={{ cursor: 'pointer' }} />
              </div>
              <span style={{ fontSize: '12px', color: '#6a6f73', fontWeight: '500' }}>
                {charsLeft}
              </span>
            </div>

            <textarea
              rows={3}
              value={newContent}
              onChange={(e) => {
                if (e.target.value.length <= 1000) {
                  setNewContent(e.target.value);
                }
              }}
              placeholder="Type your note here..."
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                color: '#1c1d1f',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={() => {
                setNewContent('');
                setCapturedTime(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#1c1d1f',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateNote}
              style={{
                backgroundColor: 'var(--primaryColor, #874429)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Save note
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. Filter & Sort Row (Udemy Style) ───────────────────────── */}
      <div className="NotesFiltersRow" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
        
        {/* All Lectures Filter Dropdown */}
        <div style={{ position: 'relative' }}>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: '1px solid var(--primaryColor, #874429)',
            color: 'var(--primaryColor, #874429)',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer'
          }}>
            <span>All lectures</span>
            <FiChevronDown />
          </button>
        </div>

        {/* Sort by Dropdown */}
        <div style={{ position: 'relative' }}>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: '1px solid var(--primaryColor, #874429)',
            color: 'var(--primaryColor, #874429)',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer'
          }}>
            <span>Sort by most recent</span>
            <FiChevronDown />
          </button>
        </div>
      </div>

      {/* ─── 3. Notes Listing ─────────────────────────────────────────── */}
      <div className="NotesList" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '8px' }}>
        {isLoading ? (
          <PlayerTabState state="loading" loadingLabel="Loading notes..." />
        ) : hasError ? (
          <PlayerTabState
            state="error"
            errorTitle="Unable to load notes."
            errorHint="Please check your network connection and try again."
            onRetry={fetchNotes}
          />
        ) : notes.length === 0 ? (
          <PlayerTabState
            state="empty"
            emptyTitle="No notes taken yet for this lesson"
            emptyHint={'Click "Capture Current Time" to save timestamped notes while watching!'}
          />
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="NoteItemContainer"
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start'
              }}
            >
              {/* Left Timestamp Capsule */}
              {note.timestamp_seconds !== null && (
                <button
                  onClick={() => onSeek && onSeek(note.timestamp_seconds)}
                  style={{
                    backgroundColor: '#1c1d1f',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0
                  }}
                  title="Click to seek video"
                >
                  <FiClock style={{ fontSize: '11px' }} />
                  <span>{formatSeconds(note.timestamp_seconds)}</span>
                </button>
              )}

              {/* Note Content Column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                
                {/* Header row with titles & icons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1c1d1f' }}>
                      {currentSectionTitle}
                    </span>
                    <span style={{ fontSize: '13px', color: '#6a6f73' }}>
                      {currentLesson?.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', color: '#1c1d1f', fontSize: '16px' }}>
                    <FiEdit2
                      style={{ cursor: 'pointer' }}
                      title="Edit note"
                      onClick={() => {
                        setEditingNoteId(note.id);
                        setEditContent(note.content);
                      }}
                    />
                    <FiTrash2
                      style={{ cursor: 'pointer' }}
                      title="Delete note"
                      onClick={() => handleDeleteNote(note.id)}
                    />
                  </div>
                </div>

                {/* Note content wrapper */}
                {editingNoteId === note.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <textarea
                      rows={2}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '14px',
                        borderRadius: '4px',
                        border: '1px solid #d1d7dc',
                        outline: 'none'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setEditingNoteId(null)}
                        style={{ padding: '6px 12px', fontSize: '13px', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateNote(note.id)}
                        style={{
                          padding: '6px 14px',
                          fontSize: '13px',
                          fontWeight: '700',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'var(--primaryColor, #874429)',
                          color: '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="NoteBodyWrapper" style={{
                    backgroundColor: '#f7f9fa',
                    border: '1px solid #f1f5f9',
                    borderRadius: '4px',
                    padding: '16px 20px',
                    marginTop: '4px'
                  }}>
                    <p style={{ fontSize: '14px', color: '#1c1d1f', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {note.content}
                    </p>
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
