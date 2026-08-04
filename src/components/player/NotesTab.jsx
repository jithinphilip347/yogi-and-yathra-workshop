"use client";

import React, { useState, useEffect } from 'react';
import { 
  FiClock, 
  FiPlus, 
  FiTrash2, 
  FiEdit2, 
  FiSearch, 
  FiCheck, 
  FiX,
  FiFileText,
  FiPlayCircle
} from 'react-icons/fi';
import courseApi from '@/libs/courseApi';
import toast from 'react-hot-toast';

export default function NotesTab({ currentLesson, getCurrentTime, onSeek }) {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('timestamp'); // 'timestamp' or 'date'

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
      const res = await courseApi.getLessonNotes(currentLesson.id, {
        search: searchQuery,
        sort: sortBy,
      });
      const data = res.data?.data || res.data || [];
      setNotes(data);
    } catch (err) {
      console.warn("Failed to fetch notes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [currentLesson?.id, searchQuery, sortBy]);

  const formatSeconds = (secs) => {
    if (secs === null || secs === undefined || isNaN(secs)) return null;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCaptureTime = () => {
    if (typeof getCurrentTime === 'function') {
      const time = getCurrentTime();
      setCapturedTime(Math.floor(time || 0));
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) {
      toast.error("Please enter note text");
      return;
    }

    try {
      const res = await courseApi.createLessonNote(
        currentLesson.id,
        newContent,
        capturedTime
      );
      const created = res.data?.data || res.data;
      toast.success("Note saved");
      setNewContent('');
      setCapturedTime(null);
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

  return (
    <div className="NotesTabContainer" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Create Note Input Box */}
      <div className="CreateNoteCard" style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <form onSubmit={handleCreateNote} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiFileText style={{ color: 'var(--primaryColor, #874429)' }} />
              <span>Add Personal Note</span>
            </span>

            <button
              type="button"
              onClick={handleCaptureTime}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: capturedTime !== null ? '#fff7ed' : '#f8fafc',
                color: capturedTime !== null ? 'var(--primaryColor, #874429)' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <FiClock />
              <span>{capturedTime !== null ? `Timestamp: ${formatSeconds(capturedTime)}` : 'Capture Current Time'}</span>
            </button>
          </div>

          <textarea
            rows={3}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Type your notes here... (e.g., Key takeaway, pose alignment cue, or reminder)"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '13.5px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            {capturedTime !== null && (
              <button
                type="button"
                onClick={() => setCapturedTime(null)}
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Clear Timestamp
              </button>
            )}
            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primaryColor, #874429)',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(135, 68, 41, 0.2)'
              }}
            >
              <FiPlus />
              <span>Save Note</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="NotesToolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '12.5px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <option value="timestamp">Video Timestamp</option>
            <option value="date">Date Created</option>
          </select>
        </div>
      </div>

      {/* Notes List */}
      <div className="NotesList" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
            Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px border-dashed #cbd5e1',
            color: '#64748b'
          }}>
            <FiFileText style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '8px' }} />
            <p style={{ fontSize: '14px', fontWeight: '500' }}>No notes taken yet for this lesson</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Use the box above to capture timestamped notes while watching!
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="NoteItemCard"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {note.timestamp_seconds !== null && (
                  <button
                    onClick={() => onSeek && onSeek(note.timestamp_seconds)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: '600',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(135, 68, 41, 0.08)',
                      color: 'var(--primaryColor, #874429)',
                      border: '1px solid rgba(135, 68, 41, 0.2)',
                      cursor: 'pointer'
                    }}
                    title="Click to seek video to this timestamp"
                  >
                    <FiPlayCircle style={{ fontSize: '13px' }} />
                    <span>{formatSeconds(note.timestamp_seconds)}</span>
                  </button>
                )}

                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>
                  {new Date(note.created_at).toLocaleDateString()} {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
                  <button
                    onClick={() => {
                      setEditingNoteId(note.id);
                      setEditContent(note.content);
                    }}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}
                    title="Edit Note"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                    title="Delete Note"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              {editingNoteId === note.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  <textarea
                    rows={2}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setEditingNoteId(null)}
                      style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateNote(note.id)}
                      style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--primaryColor, #874429)', color: '#ffffff' }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.5', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {note.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
