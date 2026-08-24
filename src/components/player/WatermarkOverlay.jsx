"use client";

import React, { useMemo } from "react";
import { useSelector } from "react-redux";

/**
 * WatermarkOverlay
 *
 * Renders a subtle, repeating diagonal watermark on top of the video player
 * area. Displays the authenticated user's name and/or email to deter screen
 * recording and screenshots.
 *
 * Design:
 * - Low-opacity text (0.08) — barely visible during playback but captured by
 *   screen recording / screenshots.
 * - Diagonal rotation — hard to crop out.
 * - Repeated across the player surface — no single crop removes all instances.
 * - Pointer-events: none — does not interfere with playback controls.
 * - z-index: 5 — above video, below controls (z-index: 10+).
 *
 * Limitations (documented honestly):
 * - This is a DETERRENT, not DRM. A determined user can:
 *   - Use browser DevTools to hide the overlay before recording
 *   - Use external screen recording software
 *   - Use an external camera
 *   - Edit the video post-capture
 * - The watermark exists to make casual sharing traceable and to raise the
 *   effort required to strip identification from recorded content.
 */
export default function WatermarkOverlay({ visible = true }) {
  const user = useSelector((state) => state.auth?.user);

  const watermarkText = useMemo(() => {
    if (!user) return "";
    // Use name if available, otherwise fall back to email
    const name = user.name || user.email || "";
    // Truncate long names to keep the overlay subtle
    return name.length > 30 ? name.substring(0, 27) + "..." : name;
  }, [user]);

  if (!visible || !watermarkText) return null;

  // Generate a stable pattern of watermark positions
  const gridItems = useMemo(() => {
    const items = [];
    // 5 rows × 4 columns = 20 watermark instances
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 4; col++) {
        items.push({
          key: `${row}-${col}`,
          top: `${row * 22 + 5}%`,
          left: `${col * 28 - 5}%`,
          // Alternate rotation for visual variety
          rotate: (row + col) % 2 === 0 ? "-25deg" : "-30deg",
        });
      }
    }
    return items;
  }, []);

  return (
    <div
      className="WatermarkOverlay"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 5,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {gridItems.map((item) => (
        <span
          key={item.key}
          style={{
            position: "absolute",
            top: item.top,
            left: item.left,
            transform: `rotate(${item.rotate})`,
            whiteSpace: "nowrap",
            fontSize: "13px",
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.08)",
            letterSpacing: "0.5px",
            pointerEvents: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            textShadow: "none",
          }}
        >
          {watermarkText}
        </span>
      ))}
    </div>
  );
}
