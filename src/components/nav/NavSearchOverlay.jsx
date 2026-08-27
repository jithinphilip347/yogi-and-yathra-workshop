"use client";
import React, { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { BiSearch } from "react-icons/bi";
import { MdClose } from "react-icons/md";
import { FiAlertCircle, FiSearch, FiUser } from "react-icons/fi";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import useDebounce from "@/hooks/useDebounce";
import useGlobalSearch from "@/hooks/useGlobalSearch";
import courseImg1 from "../../assets/images/courseImg-1.webp";

/**
 * Map a search result type to its route.
 *
 * Uses existing application routes:
 *   course       → /course/${slug}/${id}
 *   live_section → /live-section/${id}/${slug}
 *   daily_class  → /daily-class/${id}/${slug}
 */
function getResultRoute(result) {
  switch (result.type) {
    case "course":
      return `/course/${result.slug || ""}/${result.id}`;
    case "live_section":
      return `/live-section/${result.id}/${result.slug || ""}`;
    case "daily_class":
      return `/daily-class/${result.id}/${result.slug || ""}`;
    default:
      return "#";
  }
}

/**
 * Friendly label for each entity type.
 */
function getTypeLabel(type) {
  switch (type) {
    case "course":
      return "Course";
    case "live_section":
      return "Live Section";
    case "daily_class":
      return "Daily Class";
    default:
      return "";
  }
}

/**
 * Fallback image for results without thumbnails.
 */
const FALLBACK_IMAGE = courseImg1;

const NavSearchOverlay = ({ isOpen, onClose, searchQuery, setSearchQuery }) => {
  const [localQuery, setLocalQuery] = useState(searchQuery || "");
  const debouncedQuery = useDebounce(localQuery, 350);

  // Sync debounced query back to parent when it changes
  // (so Nav.jsx stays in sync if needed)
  React.useEffect(() => {
    setSearchQuery(debouncedQuery);
  }, [debouncedQuery, setSearchQuery]);

  const { data, isLoading, isFetching, isError, error } = useGlobalSearch(debouncedQuery);

  const results = data?.data || [];
  const meta = data?.meta || {};

  // Determine UI state
  const trimmedLocal = localQuery.trim();
  const isIdle = !trimmedLocal;
  const isEmpty = !isIdle && !isLoading && !isError && results.length === 0;
  const showResults = !isIdle && !isLoading && !isError && results.length > 0;

  const handleResultClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleRetry = useCallback(() => {
    // TanStack Query will refetch with the same debounced query
    window.location.reload();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="NavSearchOverlay">
      <div className="SearchHeader">
        <div className="SearchInputWrapper">
          <BiSearch className="mainSearchIcon" />
          <input
            type="text"
            placeholder="Search for courses, live sections, or daily classes..."
            autoFocus
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            aria-label="Search"
          />
        </div>
        <button className="CloseBtn" onClick={onClose} aria-label="Close search">
          <MdClose />
        </button>
      </div>

      <div className="SearchContent container">
        {/* IDLE STATE — Show when no query entered */}
        {isIdle && (
          <div className="SuggestionSection">
            <p className="searchHint">Type to search across courses, live sections, and daily classes</p>
          </div>
        )}

        {/* LOADING STATE */}
        {(isLoading || (isFetching && !isIdle)) && (
          <div className="SuggestionSection">
            <div className="SearchLoading">
              <div className="spinner"></div>
              <p>Searching...</p>
            </div>
          </div>
        )}

        {/* RESULTS STATE */}
        {showResults && (
          <div className="RecommendedSection">
            <h4>
              {meta.total > 0
                ? `${meta.total} result${meta.total !== 1 ? "s" : ""} found`
                : "Results"}
            </h4>
            <div className="CourseList">
              {results.map((result, index) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={getResultRoute(result)}
                  className="SearchCourseBox"
                  onClick={handleResultClick}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="CourseImg">
                    <Image
                      src={result.thumbnail ? resolveMediaUrl(result.thumbnail) : FALLBACK_IMAGE}
                      alt={result.title || "Search result"}
                      width={80}
                      height={60}
                      className="ThumbImg"
                      unoptimized={Boolean(result.thumbnail)}
                    />
                  </div>
                  <div className="CourseDetails">
                    <div className="TypeAndCategory">
                      <span className={`TypeBadge TypeBadge--${result.type}`}>
                        {getTypeLabel(result.type)}
                      </span>
                      {result.category_name && (
                        <span className="CategoryTag">{result.category_name}</span>
                      )}
                    </div>
                    <h5 className="ItemTitle">{result.title}</h5>
                    <div className="ItemMetaRow">
                      {result.instructor_name && (
                        <span className="InstructorName">
                          <FiUser className="MetaIcon" /> {result.instructor_name}
                        </span>
                      )}
                      {result.price ? (
                        <span className="PriceTag">
                          ₹{result.discount_price || result.price}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {isEmpty && (
          <div className="SuggestionSection">
            <div className="SearchEmpty">
              <FiSearch size={32} color="#999" />
              <p>No results found for &ldquo;{localQuery}&rdquo;</p>
              <p className="searchHint">
                Try a different search term or check your spelling
              </p>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {isError && (
          <div className="SuggestionSection">
            <div className="SearchError">
              <FiAlertCircle size={32} color="#e74c3c" />
              <p>Something went wrong while searching</p>
              <p className="searchHint">
                {error?.message || "Please try again later"}
              </p>
              <button
                className="retryBtn"
                onClick={handleRetry}
                style={{
                  marginTop: "8px",
                  padding: "6px 16px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavSearchOverlay;
