/**
 * Certificate Field Typography Adapter (Sprint 4)
 * ----------------------------------------------
 * The Certificate Mapping Builder is the SINGLE source of truth for field
 * typography. It persists one canonical style contract per mapped field:
 *
 *   { fontFamily, fontSize, fontWeight, fontColor, textAlign, letterSpacing }
 *
 * This module is a minimal RENDERING ADAPTER. It does NOT introduce a second
 * typography schema and does NOT rename any stored property — the property
 * names below are exactly the ones the Mapping Builder saves and the backend
 * serializes inside layout_config[].style. It is the only place the Course
 * Player preview (DOM) and the download renderer (Canvas) read those values,
 * so the two renderers cannot drift apart. The 1:1 mapping is documented here:
 *
 *   Stored key       →  DOM preview                          →  Canvas download
 *   ──────────────────────────────────────────────────────────────────────────
 *   fontFamily       →  font-family (same string)           →  ctx.font family
 *   fontSize         →  px in the CANONICAL template space, scaled by
 *                       renderScale (renderedWidth/templateWidth)
 *                                                           →  same, × renderScale
 *   fontWeight       →  font-weight (same value)            →  ctx.font weight
 *   fontColor        →  color                               →  ctx.fillStyle
 *   textAlign        →  text-align                          →  per-line alignment
 *   letterSpacing    →  letter-spacing (px, scaled)         →  manual glyph advance
 *   lineHeight       →  line-height (ratio × scaled size)   →  per-line advance
 *   maxWidth         →  max-width (% of template width)     →  wrap box (same %)
 *   textTransform*   →  applied at render time only (stored data is never
 *                       mutated; the Mapping Builder has no control for it yet)
 *   fontStyle*       →  passthrough (italic)                →  ctx.font style
 *
 *   * Honored as forward-compatible passthrough so any saved value is never
 *     silently dropped.
 *
 * SCALING (Sprint 2 — single authoritative render scale)
 * ────────────────────────────────────────────────────────
 * The canonical coordinate space is the ORIGINAL template (Sprint 3). A stored
 * fontSize of 42 means 42px at the template's full size. Every consumer
 * computes ONE render scale and routes every dimension through it:
 *
 *   renderScale  = computeRenderScale(renderedWidth, templateWidth)
 *   renderedPx   = scaleDimension(storedValue, renderScale)
 *               = storedValue × (renderedWidth / templateWidth)
 *
 * renderScale is computed dynamically — never a hardcoded multiplier. The same
 * factor scales fontSize and letterSpacing. lineHeight is a ratio applied on
 * top of the already-scaled fontSize (so its pixel height scales automatically)
 * and maxWidth is a percentage of the template width (scales with the
 * container). Percentage positions (x/y) are rendered directly and NEVER
 * multiplied by renderScale. Nothing is rewritten in the database.
 */

// Compute the single authoritative render scale used by EVERY consumer
// (Course Player preview DOM, certificate modal, canvas download).
//   renderScale = renderedCertificateWidth / canonicalCertificateWidth
export function computeRenderScale(renderedWidth, canonicalWidth) {
  const r = Number(renderedWidth);
  const c = Number(canonicalWidth);
  if (!Number.isFinite(r) || !Number.isFinite(c) || r <= 0 || c <= 0) return 1;
  return r / c;
}

// Scale one dimension stored in canonical template space to the rendered size.
//   renderedValue = canonicalValue × renderScale
// Guards against non-finite inputs (falls back to a 1:1 render).
export function scaleDimension(canonicalValue, renderScale) {
  const v = Number(canonicalValue);
  if (!Number.isFinite(v)) return 0;
  return v * (Number.isFinite(renderScale) ? renderScale : 1);
}

// Mirrors admin-panel DEFAULT_FIELD_STYLE — the builder's fallback contract.
export const DEFAULT_FIELD_STYLE = {
  fontFamily: "Inter",
  fontSize: 20,
  fontWeight: "normal",
  fontColor: "#1a1a1a",
  textAlign: "center",
  letterSpacing: 0,
};

// Line spacing used when a long value wraps inside the certificate width.
// The Mapping Builder does not store a lineHeight; 1.2 is the renderer's
// constant so the DOM preview and the Canvas download wrap identically.
export const FIELD_LINE_HEIGHT = 1.2;

// Native fonts — always available, never fetched from a CDN (mirrors the
// admin builder's fontLibrary SYSTEM_FONTS).
export const SYSTEM_FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Georgia",
  "Times New Roman",
  "Garamond",
  "Palatino Linotype",
  "Book Antiqua",
  "Courier New",
  "Arial Black",
  "Impact",
  "Comic Sans MS",
  "Segoe UI",
  "system-ui",
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
];

const SYSTEM_FONT_SET = new Set(SYSTEM_FONT_FAMILIES.map((f) => f.toLowerCase()));

export function isSystemFontFamily(family) {
  const f = String(family || "").trim().toLowerCase();
  if (!f) return true;
  return SYSTEM_FONT_SET.has(f);
}

/**
 * Normalize a stored field.style into the canonical renderer contract.
 * Unknown/missing keys fall back to the Mapping Builder defaults (NOT to
 * renderer-specific values), so an empty style renders exactly like the
 * builder would.
 *
 * The normalized object always contains the Sprint 2 property contract:
 * fontFamily, fontSize, fontWeight, fontColor, textAlign, letterSpacing,
 * lineHeight and maxWidth — so every consumer reads the SAME names.
 */
export function normalizeFieldStyle(style) {
  const s = style && typeof style === "object" ? style : {};

  const fontSize = Number(s.fontSize);
  const letterSpacing = Number(s.letterSpacing);
  const textAlign = ["left", "center", "right"].includes(s.textAlign) ? s.textAlign : null;
  const lineHeight = Number(s.lineHeight);
  const maxWidth = Number(s.maxWidth);

  return {
    fontFamily: s.fontFamily || DEFAULT_FIELD_STYLE.fontFamily,
    fontSize: Number.isFinite(fontSize) && fontSize > 0 ? fontSize : DEFAULT_FIELD_STYLE.fontSize,
    fontWeight: s.fontWeight || DEFAULT_FIELD_STYLE.fontWeight,
    // fontColor is the canonical stored key (Mapping Builder). `color` is a
    // legacy fallback kept for pre-Sprint-4 data — fontColor always wins.
    fontColor: s.fontColor || s.color || DEFAULT_FIELD_STYLE.fontColor,
    textAlign: textAlign || DEFAULT_FIELD_STYLE.textAlign,
    letterSpacing: Number.isFinite(letterSpacing) ? letterSpacing : DEFAULT_FIELD_STYLE.letterSpacing,
    // lineHeight is a ratio (e.g. 1.2) applied on top of the already-scaled
    // fontSize, so its pixel height scales automatically with renderScale.
    // Values below 0.5 would crush line spacing — clamp to the default.
    lineHeight: Number.isFinite(lineHeight) && lineHeight >= 0.5 ? lineHeight : FIELD_LINE_HEIGHT,
    // maxWidth, when stored, is a canonical % of the template width (0–100).
    // Consumers clamp it to (100 − x)% so a field can never overflow the
    // certificate's right edge. null ⇒ derive the box from the position.
    maxWidth: Number.isFinite(maxWidth) && maxWidth > 0 ? Math.min(maxWidth, 100) : null,
    textTransform: s.textTransform || "none",
    fontStyle: s.fontStyle === "italic" ? "italic" : "normal",
  };
}

/**
 * Apply the mapping's textTransform at render time only — the underlying
 * student/course value is never modified.
 */
export function applyTextTransform(text, transform) {
  if (!transform || transform === "none") return text;
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  if (transform === "capitalize") return text.replace(/\b\w/g, (l) => l.toUpperCase());
  return text;
}

/**
 * Map a stored fontWeight ("normal", "bold", "100"…"900") to a numeric value
 * usable in Google Fonts weight requests.
 */
export function normalizeFontWeight(weight) {
  const w = String(weight ?? "").toLowerCase();
  if (w === "normal") return 400;
  if (w === "bold") return 700;
  const num = parseInt(w, 10);
  return Number.isFinite(num) && num >= 1 && num <= 1000 ? num : 400;
}

/**
 * Build a canvas font shorthand from the canonical style + the FINAL pixel
 * size (already scaled). Quoting the family protects multi-word families.
 */
export function buildCanvasFont(style, fontSizePx) {
  const w = String(style.fontWeight).toLowerCase();
  const weight = /^\d+$/.test(w) ? w : w === "bold" ? "700" : w === "normal" ? "400" : w;
  const styleToken = style.fontStyle === "italic" ? "italic" : "normal";
  return `${styleToken} ${weight} ${Math.round(fontSizePx)}px "${style.fontFamily}", sans-serif`;
}

// ─── Canvas text layout helpers (letter-spacing + wrapping + alignment) ─────

function charWidth(ctx, ch, letterSpacingPx) {
  return ctx.measureText(ch).width + letterSpacingPx;
}

/**
 * Measure a string's width in px at the current ctx font, honouring the
 * letter-spacing (one gap per character pair — the trailing gap is not drawn,
 * matching the DOM letter-spacing advance).
 */
export function textWidth(ctx, text, letterSpacingPx) {
  if (!text) return 0;
  let w = 0;
  for (const ch of text) w += charWidth(ctx, ch, letterSpacingPx);
  return w - letterSpacingPx;
}

/**
 * Wrap text into lines that fit within maxWidthPx, honouring letter-spacing
 * in the measurement (same wrap behaviour as the DOM preview's
 * white-space:normal + max-width). Words longer than the available width are
 * hard-broken (equivalent to CSS overflow-wrap: break-word).
 */
export function wrapTextToLines(ctx, text, maxWidthPx, letterSpacingPx = 0) {
  if (maxWidthPx <= 0) return [text];
  const words = String(text).split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return [];

  const lines = [];
  let line = "";

  const fits = (candidate) => textWidth(ctx, candidate, letterSpacingPx) <= maxWidthPx;

  const flush = () => {
    if (line) {
      lines.push(line);
      line = "";
    }
  };

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && !fits(candidate)) {
      flush();
    }
    if (!fits(word)) {
      // Single word wider than the box — hard-break by characters.
      let chunk = "";
      for (const ch of word) {
        if (chunk && !fits(chunk + ch)) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      if (chunk) line = chunk;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  flush();
  return lines.length > 0 ? lines : [text];
}

/**
 * Draw one mapped text field on a canvas, replicating the DOM preview:
 * top-left anchor, canonical scaling already applied via fontSizePx /
 * letterSpacingPx, wrapping inside maxWidthPx and per-line textAlign.
 *
 * ALIGNMENT PARITY WITH THE DOM PREVIEW: the preview's field box is an
 * absolutely-positioned div with shrink-to-fit width. When the value fits on
 * a single line the box is exactly as wide as the text, so text-align has NO
 * visible effect and the text starts at the top-left anchor x. Only when the
 * value wraps (box width = maxWidth) does textAlign shift lines. The canvas
 * mirrors that rule — alignment applies only when the text actually wraps.
 */
export function drawFieldOnCanvas(ctx, { text, x, y, style, fontSizePx, letterSpacingPx = 0, maxWidthPx, lineHeight = FIELD_LINE_HEIGHT }) {
  if (maxWidthPx <= 0 || !text) return;

  ctx.save();
  ctx.font = buildCanvasFont(style, fontSizePx);
  ctx.fillStyle = style.fontColor;
  ctx.textBaseline = "top";

  // Single-line text that fits stays at the anchor (shrink-to-fit box, like
  // the DOM preview and the Mapping Builder's nowrap overlay).
  const fitsSingleLine = textWidth(ctx, text, letterSpacingPx) <= maxWidthPx;
  const lines = fitsSingleLine ? [text] : wrapTextToLines(ctx, text, maxWidthPx, letterSpacingPx);
  const lineHeightPx = fontSizePx * lineHeight;

  lines.forEach((line, index) => {
    const lineWidth = textWidth(ctx, line, letterSpacingPx);
    let startX = x;
    if (!fitsSingleLine) {
      if (style.textAlign === "center") startX = x + (maxWidthPx - lineWidth) / 2;
      else if (style.textAlign === "right") startX = x + Math.max(0, maxWidthPx - lineWidth);
    }

    let cursorX = startX;
    const cursorY = y + index * lineHeightPx;
    for (const ch of line) {
      ctx.fillText(ch, cursorX, cursorY);
      cursorX += charWidth(ctx, ch, letterSpacingPx);
    }
  });

  ctx.restore();
}
