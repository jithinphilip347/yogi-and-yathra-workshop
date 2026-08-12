"use client";

import React, { useEffect, useState, useRef } from "react";
import { FiX, FiDownload, FiFileText, FiAward, FiAlertCircle, FiRefreshCw, FiLoader } from "react-icons/fi";
import { ensureFontsLoaded } from "./fontLoader";
import { resolveMediaUrl } from "@/utils/constants";
import apiClient from "@/services/apiClient";
import toast from "react-hot-toast";
import {
  normalizeFieldStyle,
  applyTextTransform,
  buildCanvasFont,
  drawFieldOnCanvas,
  normalizeFontWeight,
  computeRenderScale,
  scaleDimension,
} from "./certificateTypography";

// ─── Development diagnostics (Sprint 4 §8 / §34) ───────────────────────────
// Font problems must be diagnosable without exposing technical detail to end
// users. Each warning is logged once per (template, field, family, status).
const loggedDiagnostics = new Set();

function logFontDiagnostics(template, layoutConfig, report) {
  const failedByFamily = new Set(report.failed || []);
  const fields = Array.isArray(layoutConfig) ? layoutConfig : [];

  fields.forEach((field) => {
    const family = field?.style?.fontFamily;
    if (!family) return;

    if (failedByFamily.has(family)) {
      const key = `${template?.id}:${field.key}:${family}:failed`;
      if (loggedDiagnostics.has(key)) return;
      loggedDiagnostics.add(key);
      console.warn("Certificate typography warning", {
        Template: template?.name,
        Field: field.key,
        "Requested Font": family,
        Status: "FAILED TO LOAD — falling back to the next font in the stack",
      });
    }
  });

  (report.unavailable || []).forEach(({ family, weights }) => {
    fields.forEach((field) => {
      if (field?.style?.fontFamily !== family) return;
      weights.forEach((weight) => {
        const key = `${template?.id}:${field.key}:${family}:weight:${weight}`;
        if (loggedDiagnostics.has(key)) return;
        loggedDiagnostics.add(key);
        console.warn("Certificate typography warning", {
          Template: template?.name,
          Field: field.key,
          "Requested Font": family,
          Weight: weight,
          Status: "WEIGHT NOT AVAILABLE — browser will synthesize/substitute",
        });
      });
    });
  });
}

// ─── Export background loader ────────────────────────────────────────────────
// The on-screen preview shows the background as a plain <img> (no CORS needed
// to DISPLAY it), but a canvas can only be exported (toDataURL) if the image
// it contains was loaded with CORS approval. Under `php artisan serve` (and
// most static-file setups) the /storage/* files are served directly without
// CORS headers, so a crossOrigin <img> silently fails — producing downloads
// with the mapped fields but no artwork.
//
// The reliable source is the authenticated media endpoint
// (GET /api/v1/media/{id}/file), which streams the file with
// `Access-Control-Allow-Origin: *`. Fallbacks cover other deployments.
// Returns an HTMLImageElement, or null when the asset cannot be loaded.
const loadBackgroundImage = async (url, mediaId) => {
  const fromBlob = (blob) =>
    new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(objectUrl); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); };
      img.src = objectUrl;
    });

  // 1) Authenticated media endpoint — always CORS-safe (ACAO *).
  if (mediaId) {
    try {
      const res = await apiClient.get(`media/${mediaId}/file`, {
        responseType: "blob",
        timeout: 30000,
      });
      if (res.data instanceof Blob && res.data.size > 0) {
        const img = await fromBlob(res.data);
        if (img) return img;
      }
    } catch {
      /* fall through to the next attempt */
    }
  }

  // 2) Plain fetch of the direct storage URL (same-origin or CORS-enabled).
  try {
    const res = await fetch(url);
    if (res.ok) {
      const img = await fromBlob(await res.blob());
      if (img) return img;
    }
  } catch {
    /* fall through to the next attempt */
  }

  // 3) crossOrigin <img> — only succeeds when the media origin sends CORS
  //    headers for /storage/*.
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

// ─── Certificate artwork display (Sprint 2) ────────────────────────────────
// Keyed by template + asset so its loading/error state resets whenever the
// modal opens or a different certificate template is selected. Only renders the
// ACTUAL Media Library artwork — no fake borders, no blank-white substitute.
//
// Sprint 4: typography is synchronized with the Mapping Builder via
// certificateTypography.js. Field positions stay in the Sprint 3 canonical
// coordinate space (x/y = % of the ORIGINAL template). Font size / letter
// spacing are stored in the SAME canonical space, so the renderer scales them
// by (renderedContainerWidth / templateWidth) — the visual type scales
// proportionally with the certificate at any display size.
function CertificateArtwork({ resolvedBgUrl, template, layoutConfig, variableValues, isFontsLoaded }) {
  const [imageError, setImageError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  // Real template dimensions come from the Media Library record and drive the
  // certificate viewport ratio. imgAspect is a fallback from the loaded image.
  const [imgAspect, setImgAspect] = useState(null);
  // Rendered container width (px) — drives proportional typography scaling.
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef(null);

  const rawBgUrl = template?.background_image || template?.background_media?.url;
  const hasAsset = Boolean(resolvedBgUrl);

  // Certificate44 is 1000×783 (~1.277:1) — never force A4 (1.414:1). Prefer the
  // Media Library dimensions; fall back to the loaded image's natural size;
  // only use a neutral placeholder while the asset is still loading.
  const mediaWidth = template?.background_media?.width;
  const mediaHeight = template?.background_media?.height;
  const mediaAspect = mediaWidth && mediaHeight ? mediaWidth / mediaHeight : null;
  // 1.277 is only a transient pre-load placeholder — once the image loads
  // (or media metadata is present) the real ratio takes over.
  const containerAspect = mediaAspect || imgAspect || 1.277;

  // Track the rendered certificate width so typography can scale exactly with
  // the template (Sprint 4 §9 / §23). Re-measures on window/resize changes.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;
    const measure = () => setContainerWidth(node.getBoundingClientRect().width || 0);
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(node);
    return () => ro && ro.disconnect();
  }, []);

  // Sprint 2 diagnostic: surface missing assets instead of rendering a blank.
  useEffect(() => {
    if (!hasAsset && template) {
      console.error("Certificate template has no renderable asset", {
        templateId: template?.id,
        templateName: template?.name,
        rawBgUrl,
      });
    }
  }, [hasAsset, template, rawBgUrl]);

  // Canonical scale: the stored fontSize/letterSpacing live in the ORIGINAL
  // template's coordinate space (Sprint 3). At any display size:
  //   renderedPx = storedValue × (renderedContainerWidth / templateWidth)
  const templateWidth = Number(template?.background_media?.width) || 1000;
  // Sprint 2: ONE authoritative render scale, shared with the canvas download.
  //   renderScale = renderedCertificateWidth / canonicalCertificateWidth
  const renderScale = computeRenderScale(containerWidth, templateWidth);
  // Fields only render once the required fonts are actually available and the
  // container width is known — never show a partially-typed certificate and
  // then swap the typeface after the user sees it (§33).
  const fieldsReady = isFontsLoaded && containerWidth > 0;

  const showLoader = !isFontsLoaded || (hasAsset && !isImageLoaded && !imageError);

  return (
    <>
      {showLoader && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          backgroundColor: "rgba(248, 250, 252, 0.9)",
          zIndex: 20,
        }}>
          <FiLoader style={{ fontSize: "32px", color: "var(--primaryColor, #874429)", animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
            Loading certificate...
          </span>
        </div>
      )}

      {/* Certificate Container sized to the template's real aspect ratio */}
      <div
        ref={containerRef}          style={{
            position: "relative",
            width: "100%",
            maxWidth: "600px",
            aspectRatio: String(containerAspect),
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
          border: "1px solid #cbd5e1",
          backgroundColor: "#ffffff",
          userSelect: "none",
        }}
      >
        {/* Background Template Artwork */}
        {resolvedBgUrl && !imageError ? (
          <img
            src={resolvedBgUrl}
            alt={template?.name || "Certificate Background"}
            onLoad={(e) => {
              setIsImageLoaded(true);
              if (!mediaAspect && e.currentTarget.naturalWidth && e.currentTarget.naturalHeight) {
                setImgAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight);
              }
            }}
            onError={(e) => {
              console.error("Certificate template asset failed to load:", {
                templateId: template?.id,
                templateName: template?.name,
                fileType: template?.background_media?.mime_type || "unknown",
                resolvedBgUrl,
                rawBgUrl,
                error: e,
              });
              setImageError(true);
            }}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: "none",
            }}
            draggable={false}
          />
        ) : (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
          }}>
            <FiAlertCircle style={{ fontSize: "36px", marginBottom: "8px" }} />
            <h4 style={{ fontSize: "14px", fontWeight: "700", margin: 0 }}>
              Certificate template could not be loaded
            </h4>
            <p style={{ fontSize: "12px", color: "#7f1d1d", maxWidth: "360px", marginTop: "4px" }}>
              {hasAsset
                ? "The certificate artwork could not be accessed. Please try again."
                : "The certificate template is not available for this course yet."}
            </p>
            <button
              onClick={() => setImageError(false)}
              style={{
                marginTop: "12px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: "600",
                borderRadius: "6px",
                border: "1px solid #fca5a5",
                backgroundColor: "#ffffff",
                color: "#991b1b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FiRefreshCw />
              <span>Retry Loading</span>
            </button>
          </div>
        )}

        {/* ── Dynamic mapped fields (Sprint 3 + Sprint 4) ─────────────
             Canonical contract: stored x/y are NORMALIZED PERCENTAGES of the
             ORIGINAL template dimensions, origin top-left, anchor = top-left of
             the field text — exactly how the Mapping Builder interprets them.
             The container keeps the template's real aspect ratio, so a field
             placed at 24.8% / 21.4% in the admin lands at the same relative
             spot here at ANY display size.

             Typography (Sprint 2/4): fontFamily, fontSize, fontWeight, fontColor,
             textAlign, letterSpacing, lineHeight and maxWidth come straight from
             the Mapping Builder style contract (certificateTypography.js).
             fontSize/letterSpacing are scaled by `renderScale` (the single
             authoritative scale shared with the canvas download) so they stay
             proportional to the template. Long values wrap inside the
             certificate width instead of destroying the layout (§16-18) —
             single-line values render identically to the builder's nowrap
             behavior. */}
        {fieldsReady &&
          layoutConfig.map((field) => {
            const varKey = field.key || field.id;
            const rawValue = variableValues[varKey] ?? field.label ?? varKey;
            if (rawValue === undefined || rawValue === null || rawValue === "") return null;

            const style = normalizeFieldStyle(field.style);
            const displayText = applyTextTransform(String(rawValue), style.textTransform);

            // Percentages the builder saved; x% is the TOP-LEFT of the field.
            const xPct = Number(field.x) || 0;
            const yPct = Number(field.y) || 0;
            // Keep the field's right edge inside the certificate (a max-width of
            // (100 − x)% of the template width — same box the canvas download
            // uses), so long values cannot overflow the artwork.
            const availablePct = Math.max(0, 100 - xPct);

            return (
              <div
                key={varKey}
                style={{
                  position: "absolute",
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  maxWidth: `${availablePct}%`,
                  fontFamily: style.fontFamily,
                  fontSize: scaleDimension(style.fontSize, renderScale),
                  fontWeight: style.fontWeight,
                  color: style.fontColor,
                  textAlign: style.textAlign,
                  letterSpacing: `${scaleDimension(style.letterSpacing, renderScale)}px`,
                  // lineHeight is a ratio over the already-scaled fontSize;
                  // a stored canonical maxWidth (%) is honoured (clamped to the
                  // certificate's right edge), else the box derives from x.
                  lineHeight: style.lineHeight,
                  maxWidth: `${style.maxWidth ? Math.min(style.maxWidth, availablePct) : availablePct}%`,
                  whiteSpace: "normal",
                  overflowWrap: "break-word",
                  pointerEvents: "none",
                  zIndex: 30,
                }}
              >
                {displayText}
              </div>
            );
          })}
      </div>
    </>
  );
}

export default function CertificateViewerModal({ isOpen, onClose, certificate, course }) {
  // Font readiness is tracked as the signature of the (template, families)
  // config that has finished loading — derived, never reset synchronously in
  // an effect, so a reopened modal with a different template does not show a
  // partially-typed certificate with a late typeface swap (§33).
  const [fontsReadyKey, setFontsReadyKey] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  // Which export is currently running — "png" | "pdf" | null (drives the
  // per-button Downloading… label so both buttons stay in sync).
  const [exportFormat, setExportFormat] = useState(null);

  const template = certificate?.template || course?.certificate_template;
  const layoutConfig = React.useMemo(
    () => (Array.isArray(template?.layout_config) ? template.layout_config : []),
    [template]
  );

  const rawBgUrl = template?.background_image || template?.background_media?.url;
  const resolvedBgUrl = resolveMediaUrl(rawBgUrl);

  // Extract variable values
  const studentName = certificate?.student_name || certificate?.student?.name || "Achu Sivadasan";
  const courseTitle = certificate?.course_title || course?.title || "Surya Namaskaram Workshop";
  const instructorName = certificate?.instructor_name || course?.instructor?.name || template?.instructor_name || "Yogify Instructor";
  const certNumber = certificate?.certificate_number || "CERT-2026-98432";
  const issueDate = certificate?.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const variableValues = {
    student_name: studentName,
    course_name: courseTitle,
    course_title: courseTitle,
    instructor_name: instructorName,
    issue_date: issueDate,
    completion_date: issueDate,
    certificate_number: certNumber,
    verification_code: certificate?.verification_code || "VERIFIED",
  };

  // ── Font loading (Sprint 4 §7 / §33) ─────────────────────────────────
  // Correct sequence: template loaded → mapping loaded → required fonts
  // identified (family + the exact weights the mapped fields use) → fonts
  // loaded → fields rendered. The certificate body is gated on isFontsLoaded,
  // so no partially-typed certificate with a late typeface swap is shown.
  const fontSignature = React.useMemo(() => {
    const families = layoutConfig.map((f) => f?.style?.fontFamily || "").filter(Boolean);
    return `${template?.id || "none"}:${families.join("|")}`;
  }, [template, layoutConfig]);

  const isFontsLoaded = fontsReadyKey === fontSignature;

  useEffect(() => {
    if (!isOpen) return undefined;
    if (fontsReadyKey === fontSignature) return undefined;

    const families = [...new Set(
      layoutConfig.map((f) => f?.style?.fontFamily).filter(Boolean)
    )];

    const weightsByFamily = {};
    layoutConfig.forEach((f) => {
      const fam = f?.style?.fontFamily;
      if (!fam) return;
      if (!weightsByFamily[fam]) weightsByFamily[fam] = [];
      weightsByFamily[fam].push(normalizeFontWeight(f?.style?.fontWeight));
    });

    let cancelled = false;
    ensureFontsLoaded(families, weightsByFamily).then((report) => {
      if (cancelled) return;
      logFontDiagnostics(template, layoutConfig, report);
      setFontsReadyKey(fontSignature);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, template, layoutConfig, fontSignature, fontsReadyKey]);

  if (!isOpen) return null;

  // ── Export / Download Certificate (Sprint 4 §24-26 + PDF) ─────────────
  // Canvas download uses the ORIGINAL template aspect ratio (Certificate44 =
  // 1000×783) — never a hardcoded A4 (2000×1414) which distorts the artwork
  // and breaks the coordinate contract. Typography reads the SAME canonical
  // style contract as the DOM preview, scaled by renderScale, so the download
  // matches the preview: same family, size, weight, color, alignment and
  // letter spacing.
  //
  // ONE render, TWO formats: renderCertificate() draws the certificate once
  // onto an offscreen canvas using the identical rules as the preview; the
  // PNG exporter saves that canvas directly and the PDF exporter embeds the
  // same bitmap into a page matching the certificate's aspect ratio. PNG and
  // PDF therefore cannot drift apart.
  const renderCertificate = () =>
    new Promise((resolve, reject) => {
      try {
        const templateWidth = Number(template?.background_media?.width) || 1000;
        const templateHeight = Number(template?.background_media?.height) || 783;
        const canvasWidth = 2000;
        const canvasHeight = Math.max(1, Math.round((canvasWidth / templateWidth) * templateHeight));
        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext("2d");
        // Sprint 2: same authoritative render scale as the DOM preview —
        // preview and download cannot drift apart.
        const renderScale = computeRenderScale(canvasWidth, templateWidth);

        const drawTextOverlays = async () => {
          // §25: never draw before the configured font is available — loading the
          // stylesheet <link> is not enough, the actual face must be in the
          // FontFaceSet before text is painted.
          const uniqueFontStrings = [...new Set(
            layoutConfig.map((field) => {
              const style = normalizeFieldStyle(field?.style);
              return buildCanvasFont(style, scaleDimension(style.fontSize, renderScale));
            })
          )];
          if (document.fonts && typeof document.fonts.load === "function") {
            await Promise.allSettled(uniqueFontStrings.map((fs) => document.fonts.load(fs)));
          }

          layoutConfig.forEach((field) => {
            const varKey = field.key || field.id;
            const textValue = variableValues[varKey] ?? field.label ?? varKey;
            if (!textValue) return;

            const style = normalizeFieldStyle(field.style);
            const fontSizePx = scaleDimension(style.fontSize, renderScale);
            const letterSpacingPx = scaleDimension(style.letterSpacing, renderScale);
            const displayText = applyTextTransform(String(textValue), style.textTransform);

            // Canonical contract: x/y are percentages of the ORIGINAL template.
            // Anchor = top-left of the field text, exactly like the Mapping
            // Builder and the on-screen preview (Sprint 3 coordinate engine).
            const posX = (Number(field.x) / 100) * canvasWidth;
            const posY = (Number(field.y) / 100) * canvasHeight;
            // Same wrap box as the preview's (100 − x)% max-width — a stored
            // canonical maxWidth (%) is honoured, clamped to the certificate's
            // right edge (identical math to the DOM preview, just in px).
            const availablePct = Math.max(0, 100 - Number(field.x));
            const maxWidthPct = style.maxWidth ? Math.min(style.maxWidth, availablePct) : availablePct;
            const maxWidthPx = (maxWidthPct / 100) * canvasWidth;

            drawFieldOnCanvas(ctx, {
              text: displayText,
              x: posX,
              y: posY,
              style,
              fontSizePx,
              letterSpacingPx,
              maxWidthPx,
              lineHeight: style.lineHeight,
            });
          });

          const safeCourse = courseTitle.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-");
          const safeStudent = studentName.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-");
          resolve({
            dataUrl: canvas.toDataURL("image/png"),
            filename: `${safeCourse}-${safeStudent}-Certificate`,
            canvasWidth,
            canvasHeight,
          });
        };

        const finish = () => drawTextOverlays().catch(reject);

        const drawBackground = async () => {
          if (!resolvedBgUrl) {
            // Template has no artwork — export on a plain white page.
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            return finish();
          }

          const bg = await loadBackgroundImage(resolvedBgUrl, template?.background_media_id);
          if (!bg) {
            // Never silently export a certificate without its artwork.
            reject(new Error(
              "The certificate background could not be loaded for export. " +
              "The media server is blocking cross-origin access (CORS) — " +
              "enable CORS for the storage origin or run the app on the same domain."
            ));
            return;
          }

          ctx.drawImage(bg, 0, 0, canvasWidth, canvasHeight);
          finish();
        };

        drawBackground();
      } catch (err) {
        reject(err);
      }
    });

  // Export the shared certificate render as PNG (image) or PDF (print-ready
  // page sized to the certificate's aspect ratio — image fills the page
  // exactly, no margins, no distortion).
  const exportCertificate = async (format) => {
    if (isDownloading) return;
    setIsDownloading(true);
    setExportFormat(format);
    try {
      const { dataUrl, filename, canvasWidth, canvasHeight } = await renderCertificate();
      if (format === "pdf") {
        const { jsPDF } = await import("jspdf");
        const pageW = 200; // mm — print-friendly fixed width
        const pageH = (canvasHeight / canvasWidth) * pageW;
        const pdf = new jsPDF({
          orientation: canvasWidth >= canvasHeight ? "landscape" : "portrait",
          unit: "mm",
          format: [pageW, pageH],
        });
        pdf.addImage(dataUrl, "PNG", 0, 0, pageW, pageH);
        pdf.save(`${filename}.pdf`);
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error(`Certificate ${format.toUpperCase()} download failed:`, err);
      toast.error(err?.message || `Failed to download the certificate (${format.toUpperCase()}).`);
    } finally {
      setIsDownloading(false);
      setExportFormat(null);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.88)",
      backdropFilter: "blur(8px)",
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
    }}>
      {/* Compact modal sizing — the certificate render scale (Sprint 2) is
          dynamic, so a smaller modal keeps typography proportionally correct. */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        maxWidth: "680px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              backgroundColor: "rgba(135, 68, 41, 0.1)",
              color: "var(--primaryColor, #874429)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}>
              <FiAward />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Course Completion Certificate
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                {courseTitle} · Issued to {studentName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: "8px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "transparent",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "20px",
            }}
          >
            <FiX />
          </button>
        </div>

        {/* Certificate Preview Body – renders the ACTUAL template artwork */}
        <div style={{
          padding: "16px",
          backgroundColor: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          minHeight: "300px",
        }}>
          <CertificateArtwork
            key={`${template?.id || "none"}-${resolvedBgUrl || "no-asset"}`}
            resolvedBgUrl={resolvedBgUrl}
            template={template}
            layoutConfig={layoutConfig}
            variableValues={variableValues}
            isFontsLoaded={isFontsLoaded}
          />
        </div>

        {/* Footer Controls */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          backgroundColor: "#ffffff",
        }}>
          <div style={{ fontSize: "12px", color: "#64748b", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Certificate ID: <strong style={{ color: "#0f172a" }}>{certNumber}</strong>
          </div>

          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: "600",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#334155",
                cursor: "pointer",
              }}
            >
              Close
            </button>

            <button
              onClick={() => exportCertificate("pdf")}
              disabled={isDownloading || !isFontsLoaded}
              title="Download the certificate as a print-ready PDF"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: "600",
                borderRadius: "8px",
                border: "1px solid var(--primaryColor, #874429)",
                backgroundColor: "#ffffff",
                color: "var(--primaryColor, #874429)",
                cursor: "pointer",
                opacity: isDownloading || !isFontsLoaded ? 0.6 : 1,
              }}
            >
              <FiFileText />
              <span>{isDownloading && exportFormat === "pdf" ? "Downloading..." : "Download PDF"}</span>
            </button>

            <button
              onClick={() => exportCertificate("png")}
              disabled={isDownloading || !isFontsLoaded}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "var(--primaryColor, #874429)",
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(135, 68, 41, 0.25)",
                opacity: isDownloading || !isFontsLoaded ? 0.6 : 1,
              }}
            >
              <FiDownload />
              <span>{isDownloading && exportFormat === "png" ? "Downloading..." : "Download Certificate"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
