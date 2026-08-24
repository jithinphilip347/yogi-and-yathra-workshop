"use client";

import { useEffect, useCallback, useRef } from "react";

/**
 * useContentProtection
 *
 * Client-side deterrents for protected course content. These are NOT real
 * security measures — they discourage casual downloading of right-click-save,
 * image dragging, and accidental text selection.
 *
 * Applied ONLY within the course player scope (never globally).
 *
 * Restrictions:
 * - Right-click context menu is suppressed on media and lesson content
 * - Image dragging is prevented on protected images
 * - Text selection is disabled on video/audio/PDF overlays only
 *   (not on lesson text notes, forms, or accessible content)
 */
export default function useContentProtection(containerRef, { enabled = true } = {}) {
  const isActiveRef = useRef(false);

  // ── Right-click suppression ──────────────────────────────────────────
  const handleContextMenu = useCallback(
    (e) => {
      if (!enabled || !isActiveRef.current) return;

      const target = e.target;

      // Allow right-click on: inputs, textareas, selects (forms & accessibility)
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      // Allow right-click on: links and buttons (navigation / playback controls)
      if (tag === "a" || tag === "button") return;

      // Allow right-click on: contenteditable elements (notes, text fields)
      if (target?.contentEditable === "true") return;

      // Allow right-click inside the lesson sidebar and header
      const isUIArea =
        target?.closest?.(".LessonSidebar") ||
        target?.closest?.(".LearningHeader") ||
        target?.closest?.(".PlayerTabs") ||
        target?.closest?.(".NotesTabContainer");
      if (isUIArea) return;

      // Block right-click on: video, images, PDF embeds, and the video engine area
      const isProtectedContent =
        tag === "video" ||
        tag === "audio" ||
        tag === "img" ||
        tag === "embed" ||
        tag === "object" ||
        tag === "iframe" ||
        target?.closest?.("video") ||
        target?.closest?.("audio") ||
        target?.closest?.(".VideoEngineRoot") ||
        target?.closest?.(".ProtectedMediaArea");

      if (isProtectedContent) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    [enabled]
  );

  // ── Image drag prevention ────────────────────────────────────────────
  const handleDragStart = useCallback(
    (e) => {
      if (!enabled || !isActiveRef.current) return;

      const target = e.target;
      const tag = target?.tagName?.toLowerCase();

      // Prevent dragging images inside the player
      if (tag === "img" || target?.closest?.("img")) {
        // Allow dragging in: notes tab, forms, editable areas
        if (
          target?.closest?.(".NotesTabContainer") ||
          target?.closest?.(".PlayerTabs") ||
          target?.contentEditable === "true"
        ) {
          return;
        }
        e.preventDefault();
        return false;
      }
    },
    [enabled]
  );

  // ── Selection prevention on media overlays ───────────────────────────
  const handleSelectStart = useCallback(
    (e) => {
      if (!enabled || !isActiveRef.current) return;

      const target = e.target;

      // Allow selection in: inputs, textareas, notes, editable content, lesson text
      const tag = target?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.contentEditable === "true" ||
        target?.closest?.(".NotesTabContainer") ||
        target?.closest?.(".PlayerTabs") ||
        target?.closest?.(".LessonSidebar") ||
        target?.closest?.(".LearningHeader")
      ) {
        return;
      }

      // Block selection on: video/audio elements and overlays
      if (
        tag === "video" ||
        tag === "audio" ||
        target?.closest?.("video") ||
        target?.closest?.("audio") ||
        target?.closest?.(".VideoEngineRoot")
      ) {
        e.preventDefault();
        return false;
      }
    },
    [enabled]
  );

  // ── Lifecycle: attach / detach ──────────────────────────────────────
  useEffect(() => {
    isActiveRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const el = containerRef?.current || document;
    el.addEventListener("contextmenu", handleContextMenu, true);
    el.addEventListener("dragstart", handleDragStart, true);
    el.addEventListener("selectstart", handleSelectStart, true);

    return () => {
      el.removeEventListener("contextmenu", handleContextMenu, true);
      el.removeEventListener("dragstart", handleDragStart, true);
      el.removeEventListener("selectstart", handleSelectStart, true);
    };
  }, [enabled, handleContextMenu, handleDragStart, handleSelectStart, containerRef]);
}
