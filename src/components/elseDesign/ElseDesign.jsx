"use client";
import React from "react";
import Link from "next/link";
import { FiInbox, FiArrowRight } from "react-icons/fi";
import "./ElseDesign.css";

const ElseDesign = ({
  title = "No Items Available",
  message = "There are currently no items available in this section. Please check back later.",
  icon = <FiInbox />,
  actionText = null,
  actionLink = null,
  onAction,
  compact = false,
  lightText = false,
  className = "",
}) => {
  const hasAction = Boolean(onAction || (actionLink && actionText));

  return (
    <div
      className={`ElseDesign ${compact ? "compact" : ""} ${lightText ? "lightText" : ""} ${className}`.trim()}
    >
      <div className="ElseDesignIconWrap">{icon}</div>
      {title && <h3 className="ElseDesignTitle">{title}</h3>}
      {message && (
        <p className={`ElseDesignMessage ${hasAction ? "hasAction" : ""}`}>
          {message}
        </p>
      )}

      {onAction && actionText ? (
        <button type="button" onClick={onAction} className="ElseDesignBtn">
          <span>{actionText}</span>
          <FiArrowRight />
        </button>
      ) : actionLink && actionText ? (
        <Link href={actionLink} className="ElseDesignBtn">
          <span>{actionText}</span>
          <FiArrowRight />
        </Link>
      ) : null}
    </div>
  );
};

export default ElseDesign;
