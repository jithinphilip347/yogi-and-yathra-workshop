"use client";

import React from "react";

/**
 * Section — a full-bleed band, the Workshop's page-level vertical rhythm
 * (WORKSHOP-DS-03).
 *
 * The Workshop has two vertical rhythms, and this primitive encodes the band
 * one. It exists because the same band padding was written out ~30 times across
 * the source (`padding: 100px 0` 14 times, `60px 0` 18 times) with no name.
 *
 * Measured pattern this encodes — Home's `#HomeBanner` is a full-width
 * <section> with band padding and a PageContainer nested inside for content
 * width:
 *
 *     <Section surface="muted">
 *       <PageContainer>…</PageContainer>
 *     </Section>
 *
 * IMPORTANT: nothing in the existing app is restyled by this component. Content
 * pages (Course Detail and friends) do NOT use band padding — they stack cards
 * (see SectionStack). Applying `Section` to a page that already has its own
 * rhythm WILL add spacing, so migrate deliberately.
 *
 * @param {"default"|"sm"|"flush"} size
 *        default → --section-y (100px), the major band
 *        sm      → --section-y-sm (60px), the inner band (Home's measured value)
 *        flush   → 0, for a band that only carries a surface
 * @param {string} surface  one of: "surface" | "muted" | "subtle" | "warm" |
 *                          "tinted" | "inverse". Omit for a transparent band.
 *                          Every value maps to an existing semantic token.
 * @param {React.ElementType} as  element to render (default "section")
 */
const Section = ({
  children,
  size = "default",
  surface,
  as: Tag = "section",
  className = "",
  ...rest
}) => {
  const classes = ["Section"];
  if (size === "sm") classes.push("Section--sm");
  if (size === "flush") classes.push("Section--flush");
  if (surface) classes.push(`Section--${surface}`);
  if (className) classes.push(className);

  return (
    <Tag className={classes.join(" ")} {...rest}>
      {children}
    </Tag>
  );
};

/**
 * SectionStack — the Workshop's OTHER vertical rhythm: the stacked-card gap
 * used by content pages, as opposed to band padding.
 *
 * Course Detail stacks its `.HighlightBox` cards `margin-bottom: 30px` apart.
 * `30px` appears 95 times as a margin/padding/gap in the source and had no
 * DS-02 token, so it is now `--section-gap`.
 *
 * Applies the gap between children only (`> * + *`), so the parent owns the
 * rhythm and no child needs a margin of its own.
 */
export const SectionStack = ({ children, as: Tag = "div", className = "", ...rest }) => (
  <Tag className={`SectionStack${className ? ` ${className}` : ""}`} {...rest}>
    {children}
  </Tag>
);

export default Section;
