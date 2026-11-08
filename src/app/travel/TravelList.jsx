"use client";
import React, { useState, useMemo } from "react";
import TravelCard from "@/components/travelCard/TravelCard";
import ElseDesign from "@/components/elseDesign/ElseDesign";
import CustomFilterDropdown from "@/components/filter/CustomFilterDropdown";
import { DEFAULT_TRAVEL_RETREATS } from "@/components/home/HomeTravel";
import {
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiSliders,
  FiChevronDown,
  FiRotateCcw,
  FiCompass,
  FiHeart,
  FiHome,
  FiShield,
} from "react-icons/fi";
import "@/assets/css/TravelList.scss";

const TravelList = ({ initialTravels }) => {
  const allTravels = initialTravels || DEFAULT_TRAVEL_RETREATS;

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDestination, setSelectedDestination] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedDuration, setSelectedDuration] = useState("All");
  const [sortBy, setSortBy] = useState("default");

  // Pagination (1 row of 3 cards = 3)
  const [visibleCount, setVisibleCount] = useState(3);

  // Categories
  const categories = ["All", "Spiritual Journey", "Wellness Tour", "Yoga Retreat"];

  // Destinations derived from card data
  const destinationOptions = useMemo(() => {
    const destSet = new Set();
    allTravels.forEach((t) => {
      if (t.destination) {
        const place = t.destination.split(",")[0].trim();
        if (place) destSet.add(place);
      }
    });
    return [
      { value: "All", label: "All Destinations" },
      ...Array.from(destSet).map((place) => ({ value: place, label: place })),
    ];
  }, [allTravels]);

  // Durations derived from card data
  const durationOptions = useMemo(() => {
    const durSet = new Set();
    allTravels.forEach((t) => {
      if (t.duration) durSet.add(t.duration.trim());
    });
    return [
      { value: "All", label: "All Durations" },
      ...Array.from(durSet).map((dur) => ({ value: dur, label: dur })),
    ];
  }, [allTravels]);

  // Status options
  const statusOptions = [
    { value: "All", label: "All Status" },
    { value: "Booking Open", label: "Booking Open" },
    { value: "Almost Full", label: "Almost Full" },
    { value: "Upcoming", label: "Upcoming" },
  ];

  // Sort options
  const sortOptions = [
    { value: "default", label: "Recommended" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
  ];

  // Filter and Sort Travels
  const filteredTravels = useMemo(() => {
    let result = allTravels.filter((item) => {
      // Category match
      const catMatch =
        selectedCategory === "All" ||
        (item.category &&
          item.category.toLowerCase().includes(selectedCategory.toLowerCase().trim()));

      // Destination match
      const destMatch =
        selectedDestination === "All" ||
        (item.destination &&
          item.destination.toLowerCase().includes(selectedDestination.toLowerCase()));

      // Status match
      const statusMatch =
        selectedStatus === "All" ||
        (item.status &&
          item.status.toLowerCase().includes(selectedStatus.toLowerCase()));

      // Duration match
      const durMatch =
        selectedDuration === "All" ||
        (item.duration &&
          item.duration.toLowerCase() === selectedDuration.toLowerCase());

      return catMatch && destMatch && statusMatch && durMatch;
    });

    // Sorting
    if (sortBy === "price-asc") {
      result = [...result].sort(
        (a, b) =>
          Number(String(a.price).replace(/[^0-9]/g, "")) -
          Number(String(b.price).replace(/[^0-9]/g, ""))
      );
    } else if (sortBy === "price-desc") {
      result = [...result].sort(
        (a, b) =>
          Number(String(b.price).replace(/[^0-9]/g, "")) -
          Number(String(a.price).replace(/[^0-9]/g, ""))
      );
    }

    return result;
  }, [allTravels, selectedCategory, selectedDestination, selectedStatus, selectedDuration, sortBy]);

  // Check if any non-default filter is active
  const hasActiveFilters =
    selectedCategory !== "All" ||
    selectedDestination !== "All" ||
    selectedStatus !== "All" ||
    selectedDuration !== "All" ||
    sortBy !== "default";

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSelectedDestination("All");
    setSelectedStatus("All");
    setSelectedDuration("All");
    setSortBy("default");
    setVisibleCount(3);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 3); // Load next row (3 cards)
  };

  const visibleTravels = filteredTravels.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTravels.length;

  return (
    <div id="TravelListPage">
      {/* ── Full-Width Hero Banner Section (100% Screen Width) ── */}
      <section className="travelHeroBanner">
        <div className="container">
          <div className="travelHeroContent">
            <div className="heroDotBadge">
              <span className="dot" />
              <span>Transformational Journeys</span>
            </div>

            <h1>
              Curated <span>Travel</span> & Yoga Retreats
            </h1>

            <p className="heroSubtitle">
              Escape the ordinary and embark on guided spiritual journeys, coastal yoga camps, and Himalayan wellness immersions. Handcrafted experiences with certified masters.
            </p>

            {/* Feature Highlight Pills with Icons */}
            <div className="heroFeaturePills">
              <span className="featurePill">
                <FiCompass />
                <span>Guided Himalayan & Coastal Tours</span>
              </span>
              <span className="featurePill">
                <FiHeart />
                <span>Organic Sattvic Meals Included</span>
              </span>
              <span className="featurePill">
                <FiHome />
                <span>Luxury Ashram & Resort Stays</span>
              </span>
              <span className="featurePill">
                <FiShield />
                <span>100% Guaranteed Safe Departure</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Container (Filters + Grid) ── */}
      <section className="travelListingContent">
        <div className="container">
          {/* Card-Based Filter Section */}
          <div className="travelFilterSection">
            {/* Row 1: Primary Category Pills */}
            <div className="filterCategoryRow">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`categoryPill ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setVisibleCount(3);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Row 2: Custom Dropdowns (with internal search bar and scrollable ul/li) */}
            <div className="filterDropdownRow">
              <div className="dropdownGroup">
                {/* Custom Destination Dropdown */}
                <CustomFilterDropdown
                  icon={<FiMapPin />}
                  value={selectedDestination}
                  options={destinationOptions}
                  onChange={(val) => {
                    setSelectedDestination(val);
                    setVisibleCount(3);
                  }}
                  searchPlaceholder="Search destinations..."
                />

                {/* Custom Status Dropdown */}
                <CustomFilterDropdown
                  icon={<FiCheckCircle />}
                  value={selectedStatus}
                  options={statusOptions}
                  onChange={(val) => {
                    setSelectedStatus(val);
                    setVisibleCount(3);
                  }}
                  searchPlaceholder="Search status..."
                  showSearch={false}
                />

                {/* Custom Duration Dropdown */}
                <CustomFilterDropdown
                  icon={<FiClock />}
                  value={selectedDuration}
                  options={durationOptions}
                  onChange={(val) => {
                    setSelectedDuration(val);
                    setVisibleCount(3);
                  }}
                  searchPlaceholder="Search duration..."
                  showSearch={false}
                />

                {/* Custom Sort Dropdown */}
                <CustomFilterDropdown
                  icon={<FiSliders />}
                  labelPrefix="Sort"
                  value={sortBy}
                  options={sortOptions}
                  onChange={(val) => {
                    setSortBy(val);
                    setVisibleCount(3);
                  }}
                  searchPlaceholder="Search sort..."
                  showSearch={false}
                />
              </div>

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  className="resetFiltersBtn"
                  onClick={handleResetFilters}
                  aria-label="Reset all filters"
                >
                  <FiRotateCcw />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Stats */}
          {filteredTravels.length > 0 && (
            <div className="travelResultStats">
              <span>
                Showing <strong>{visibleTravels.length}</strong> of{" "}
                <strong>{filteredTravels.length}</strong> retreats
              </span>

              {/* Active Filter Chips */}
              {hasActiveFilters && (
                <div className="activeFilterChips">
                  {selectedCategory !== "All" && (
                    <span className="chip">
                      {selectedCategory}
                      <span
                        className="removeChip"
                        onClick={() => {
                          setSelectedCategory("All");
                          setVisibleCount(3);
                        }}
                      >
                        ×
                      </span>
                    </span>
                  )}
                  {selectedDestination !== "All" && (
                    <span className="chip">
                      📍 {selectedDestination}
                      <span
                        className="removeChip"
                        onClick={() => {
                          setSelectedDestination("All");
                          setVisibleCount(3);
                        }}
                      >
                        ×
                      </span>
                    </span>
                  )}
                  {selectedStatus !== "All" && (
                    <span className="chip">
                      ● {selectedStatus}
                      <span
                        className="removeChip"
                        onClick={() => {
                          setSelectedStatus("All");
                          setVisibleCount(3);
                        }}
                      >
                        ×
                      </span>
                    </span>
                  )}
                  {selectedDuration !== "All" && (
                    <span className="chip">
                      ⏱️ {selectedDuration}
                      <span
                        className="removeChip"
                        onClick={() => {
                          setSelectedDuration("All");
                          setVisibleCount(3);
                        }}
                      >
                        ×
                      </span>
                    </span>
                  )}
                </div>
              )}
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
              icon={
                <FiCompass
                  style={{
                    fontSize: "32px",
                    color: "var(--primaryColor, #874429)",
                  }}
                />
              }
              title="No Retreats Found"
              message="No travel retreats match your selected filters. Please adjust your criteria or reset filters to see all available journeys."
              actionText="Reset All Filters"
              onAction={handleResetFilters}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default TravelList;
