"use client";
import React, { useState, useMemo } from "react";
import Breadcrumbs from "@/components/breadcrumbs/Breadcrumbs";
import TravelCard from "@/components/travelCard/TravelCard";
import ElseDesign from "@/components/elseDesign/ElseDesign";
import { DEFAULT_TRAVEL_RETREATS } from "@/components/home/HomeTravel";
import { FiSearch, FiX, FiChevronDown, FiCompass } from "react-icons/fi";
import "@/assets/css/TravelList.scss";

const TravelList = ({ initialTravels }) => {
  const allTravels = initialTravels || DEFAULT_TRAVEL_RETREATS;

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(3); // 1 row of 3 cards initially

  const categories = ["All", "Spiritual Journey", "Wellness Tour", "Yoga Retreat"];

  // Filter retreats by Category and Search Query
  const filteredTravels = useMemo(() => {
    return allTravels.filter((t) => {
      const catMatch =
        activeCategory === "All" ||
        (t.category && t.category.toLowerCase().includes(activeCategory.toLowerCase().trim()));

      const query = searchQuery.trim().toLowerCase();
      const searchMatch =
        !query ||
        (t.title && t.title.toLowerCase().includes(query)) ||
        (t.destination && t.destination.toLowerCase().includes(query)) ||
        (t.description && t.description.toLowerCase().includes(query));

      return catMatch && searchMatch;
    });
  }, [allTravels, activeCategory, searchQuery]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setVisibleCount(3); // Reset pagination on category change
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setVisibleCount(3); // Reset pagination on search change
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setVisibleCount(3);
  };

  const handleResetFilters = () => {
    setActiveCategory("All");
    setSearchQuery("");
    setVisibleCount(3);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 3); // Load next row (3 cards)
  };

  // Slice for current display
  const visibleTravels = filteredTravels.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTravels.length;

  return (
    <div id="TravelListPage">
      <div className="container">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: "Travel & Retreats", path: "/travel" }]} />

        {/* Page Header */}
        <div className="travelListHeader">
          <span className="headerBadge">Transformational Journeys</span>
          <h1>
            Curated <span>Travel</span> & Yoga Retreats
          </h1>
          <p>
            Escape the ordinary and embark on guided spiritual journeys, coastal yoga camps, and Himalayan wellness immersions. Handcrafted experiences with certified masters.
          </p>
        </div>

        {/* Search & Category Filter Row */}
        <div className="travelControlRow">
          {/* Category Filter Pills */}
          <div className="travelFilterBar">
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
          <div className="travelSearchBar">
            <FiSearch className="searchIcon" />
            <input
              type="text"
              placeholder="Search retreats, destinations..."
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
        {filteredTravels.length > 0 && (
          <div className="travelResultStats">
            Showing <strong>{visibleTravels.length}</strong> of <strong>{filteredTravels.length}</strong> retreats
            {activeCategory !== "All" && <span> in "{activeCategory}"</span>}
            {searchQuery && <span> matching "{searchQuery}"</span>}
          </div>
        )}

        {/* Retreats Cards Grid OR ElseDesign */}
        {filteredTravels.length > 0 ? (
          <>
            <div className="travelListingGrid">
              {visibleTravels.map((travel, i) => (
                <TravelCard
                  key={travel.id || i}
                  travel={{
                    ...travel,
                    link: "/travel/travel-details",
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
                  aria-label="Load more retreats"
                >
                  <span>Load More Retreats</span>
                  <FiChevronDown />
                </button>
                <span className="loadMoreCount">
                  Showing {visibleTravels.length} of {filteredTravels.length}
                </span>
              </div>
            )}
          </>
        ) : (
          <ElseDesign
            icon={<FiCompass style={{ fontSize: "32px", color: "var(--primaryColor, #874429)" }} />}
            title="No Travel Retreats Found"
            message={`We couldn't find any travel retreats matching your criteria${
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

export default TravelList;
