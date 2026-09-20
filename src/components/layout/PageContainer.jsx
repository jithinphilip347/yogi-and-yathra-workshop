"use client";

import React from "react";

/**
 * PageContainer — the canonical Workshop page shell (WORKSHOP-DS-03).
 *
 * Renders `className="container"`, which is the Workshop's existing global
 * container (main.scss:61). That rule is defined by GUTTERS, not by a
 * max-width — it has none:
 *
 *     100px gutter  >=1800px viewports
 *      50px         <=1800px
 *      30px         <=1024px
 *      16px         <=480px
 *
 * Verified rendered at 1440px: 1340px wide, identical on Course Detail, About
 * and Contact. Because this component emits the same class the page already
 * used, migrating a page to it is a zero-pixel change.
 *
 * Deliberately NOT redefined anywhere in layout.scss — `.container` keeps a
 * single owner, so there is exactly one canonical container in the Workshop.
 *
 * @param {"default"|"full"|"narrow"} variant
 *        default → the standard gutter container (1340px @1440)
 *        full    → 100% width, no gutter (full-bleed content inside a band)
 *        narrow  → capped at --container-narrow (860px) for single-column prose
 * @param {React.ElementType} as  element to render (default "div")
 */
const PageContainer = ({
  children,
  variant = "default",
  as: Tag = "div",
  className = "",
  ...rest
}) => {
  const classes = ["container"];
  if (variant === "full") classes.push("container--full");
  if (variant === "narrow") classes.push("container--narrow");
  if (className) classes.push(className);

  return (
    <Tag className={classes.join(" ")} {...rest}>
      {children}
    </Tag>
  );
};

export default PageContainer;
