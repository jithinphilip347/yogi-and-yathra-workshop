"use client";
import React, { useState, useMemo } from "react";
import Breadcrumbs from "@/components/breadcrumbs/Breadcrumbs";
import EventCard from "@/components/eventCard/EventCard";
import ElseDesign from "@/components/elseDesign/ElseDesign";
import { DEFAULT_OFFLINE_EVENTS } from "@/components/home/HomeOfflineEvent";
import { FiSearch, FiX, FiChevronDown, FiCalendar } from "react-icons/fi";
import "@/assets/css/EventList.scss";

const EventList = ({ initialEvents }) => {
  const allEvents = initialEvents || DEFAULT_OFFLINE_EVENTS;

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(4); // 2 rows of 2 cards initially

  const categories = [
    "All",
    "Offline Workshop",
    "Wellness Retreat",
    "Masterclass",
    "Nature Retreat",
    "Therapy Workshop",
  ];

  // Filter events by Category and Search
  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => {
      const catMatch =
        activeCategory === "All" ||
        (e.category &&
          e.category.toLowerCase().includes(
            activeCategory.toLowerCase().replace("offline ", "").trim()
          ));

      const query = searchQuery.trim().toLowerCase();
      const searchMatch =
        !query ||
        (e.title && e.title.toLowerCase().includes(query)) ||
        (e.location && e.location.toLowerCase().includes(query)) ||
        (e.venue && e.venue.toLowerCase().includes(query)) ||
        (e.description && e.description.toLowerCase().includes(query));

      return catMatch && searchMatch;
    });
  }, [allEvents, activeCategory, searchQuery]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setVisibleCount(4); // Reset pagination on category change
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setVisibleCount(4); // Reset pagination on search change
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setVisibleCount(4);
  };

  const handleResetFilters = () => {
    setActiveCategory("All");
    setSearchQuery("");
    setVisibleCount(4);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 2); // Load next row (2 cards)
  };

  // Slice for current display
  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEvents.length;

  return (
    <div id="EventListPage">
      <div className="container">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: "Offline Events", path: "/event" }]} />

        {/* Page Header */}
        <div className="eventListHeader">
          <span className="headerBadge">In-Person Experiences</span>
          <h1>
            Upcoming <span>Offline Events</span> & Workshops
          </h1>
          <p>
            Immerse yourself in authentic physical yoga workshops, restorative sound baths, and nature meditation retreats guided by certified yoga masters across Kerala.
          </p>
        </div>

        {/* Search & Category Filter Row */}
        <div className="eventControlRow">
          {/* Category Filter Pills */}
          <div className="eventFilterBar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filterPill ${activeCategory === cat ? "active" : ""}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="eventSearchBar">
            <FiSearch className="searchIcon" />
            <input
              type="text"
              placeholder="Search events, locations..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button
                type="button"
                className="clearBtn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

        {/* Stats Line */}
        {filteredEvents.length > 0 && (
          <div className="eventResultStats">
            Showing <strong>{visibleEvents.length}</strong> of <strong>{filteredEvents.length}</strong> events
            {activeCategory !== "All" && <span> in "{activeCategory}"</span>}
            {searchQuery && <span> matching "{searchQuery}"</span>}
          </div>
        )}

        {/* Event Cards Grid OR ElseDesign */}
        {filteredEvents.length > 0 ? (
          <>
            <div className="eventListingGrid">
              {visibleEvents.map((evt, i) => (
                <EventCard
                  key={evt.id || i}
                  event={{
                    ...evt,
                    link: "/event/event-details",
                  }}
                />
              ))}
            </div>

            {/* Bottom Center Load More Button */}
            {hasMore && (
              <div className="loadMoreContainer">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="loadMoreBtn"
                  aria-label="Load more events"
                >
                  <span>Load More Events</span>
                  <FiChevronDown />
                </button>
                <span className="loadMoreCount">
                  Showing {visibleEvents.length} of {filteredEvents.length}
                </span>
              </div>
            )}
          </>
        ) : (
          <ElseDesign
            icon={<FiCalendar style={{ fontSize: "32px", color: "var(--primaryColor, #874429)" }} />}
            title="No Offline Events Found"
            message={`We couldn't find any offline events matching your search${
              activeCategory !== "All" ? ` in category "${activeCategory}"` : ""
            }${searchQuery ? ` with query "${searchQuery}"` : ""}. Please try different keywords or reset filters.`}
            actionText="Reset All Filters"
            onAction={handleResetFilters}
          />
        )}
      </div>
    </div>
  );
};

export default EventList;
