"use client";

import React from "react";

/**
 * SectionHeading — the Workshop's one canonical card/section heading
 * (WORKSHOP-DS-03).
 *
 * Every value is the measured reference scale from Course Detail, not an
 * invention. `.HighlightBox h3` computes to 24px / 600 / #1a1a1a with a 25px
 * bottom margin, and responsively 20px @1024 and 18px @768 — confirmed by
 * rendering the page, because `.HighlightBox` is defined twice in style.scss
 * (35px padding with a 24px heading, and 30px padding with a 22px heading) and
 * only measurement settles which one wins.
 *
 * The scale had no token before DS-03, despite 39 declarations of 24px in the
 * source, so `--text-card-title` now carries it.
 *
 * ── THE ACCENT BAR IS OPT-IN, NOT THE DEFAULT ──────────────────────────────
 * The audit described the 4px brown bar as a "section-heading motif in 5
 * locations". Measured, that is too broad: it is a panel/callout left-accent
 * used at 6 sites, and as a heading accent at exactly one (`main.scss:452`, an
 * h4 inside the product popup). Course Detail's own section headings have NO
 * accent — border-left-width computes to 0px. So enabling it by default would
 * restyle every content heading and take Course Detail away from its own
 * reference look. Use `accent` where a heading genuinely is a callout.
 *
 * When enabled it stays visually distinct from a normal border by construction:
 * 4px brand (--border-accent-width / --color-border-accent) against 1px
 * --color-border everywhere else. The green/red 4px accents in live-stream.scss
 * are semantic status colours and are deliberately NOT folded into the brand
 * accent token.
 *
 * @param {boolean} accent  render the 4px brand left-accent variant
 * @param {React.ElementType} as  heading level (default "h3", matching the
 *                                reference page's card headings)
 */
const SectionHeading = ({
  children,
  accent = false,
  as: Tag = "h3",
  className = "",
  ...rest
}) => {
  const classes = ["SectionHeading"];
  if (accent) classes.push("SectionHeading--accent");
  if (className) classes.push(className);

  return (
    <Tag className={classes.join(" ")} {...rest}>
      {children}
    </Tag>
  );
};

export default SectionHeading;
