"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Image from "next/image";
import TravelCard from "@/components/travelCard/TravelCard";
import ElseDesign from "@/components/elseDesign/ElseDesign";
import CustomFilterDropdown from "@/components/filter/CustomFilterDropdown";
import { adaptTravelPackage, travelPackageApi } from "@/services/travelPackageApi";
import HeroBgImg from "@/assets/images/travel.jpg";
import {
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiSliders,
  FiChevronDown,
  FiRotateCcw,
  FiCompass,
} from "react-icons/fi";
import "@/assets/css/TravelList.scss";

const TravelList = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDestination, setSelectedDestination] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedDuration, setSelectedDuration] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const pageSize = 12;
  const loadMoreRef = useRef(null);
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery({
    queryKey: ["public-yoga-travel-packages-catalog", sortBy],
    queryFn: ({ pageParam, signal }) => travelPackageApi.listPage(
      {
        page: pageParam,
        per_page: pageSize,
        ...(sortBy !== "default" ? { sort: sortBy.replace("-", "_") } : {}),
      },
      { signal }
    ),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const currentPage = Number(lastPage.meta?.current_page);
      const lastPageNumber = Number(lastPage.meta?.last_page);
      if (Number.isFinite(currentPage) && Number.isFinite(lastPageNumber)) {
        return currentPage < lastPageNumber ? currentPage + 1 : undefined;
      }
      return lastPage.data.length === pageSize ? lastPageParam + 1 : undefined;
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });
  const allTravels = useMemo(
    () => (data?.pages || []).flatMap((page) => page.data).map(adaptTravelPackage).filter(Boolean),
    [data]
  );

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (typeof IntersectionObserver === "undefined" || !sentinel || !hasNextPage || isFetching || isFetchNextPageError) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage();
      },
      { rootMargin: "500px 0px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchNextPageError, isFetching]);

  // Categories
  const categories = useMemo(() => ["All", ...new Set(allTravels.map((travel) => travel.categoryLabel).filter(Boolean))], [allTravels]);

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
    { value: "Fully Booked", label: "Fully Booked" },
    { value: "Upcoming", label: "Upcoming" },
    { value: "Registration Closed", label: "Registration Closed" },
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
        (item.categoryLabel && item.categoryLabel.toLowerCase() === selectedCategory.toLowerCase().trim());

      // Destination match
      const destMatch =
        selectedDestination === "All" ||
        (item.destination &&
          item.destination.toLowerCase().includes(selectedDestination.toLowerCase()));

      // Status match
      const statusMatch =
        selectedStatus === "All" ||
        (item.statusLabel && item.statusLabel.toLowerCase() === selectedStatus.toLowerCase());

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
          Number(a.effectivePrice || 0) - Number(b.effectivePrice || 0)
      );
    } else if (sortBy === "price-desc") {
      result = [...result].sort(
        (a, b) =>
          Number(b.effectivePrice || 0) - Number(a.effectivePrice || 0)
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
  };
  const visibleTravels = filteredTravels;
  const hasMore = Boolean(hasNextPage);

  const loadMoreContent = hasMore ? (
    <div className="loadMoreContainer">
      <div ref={loadMoreRef} className="infiniteScrollSentinel" aria-hidden="true" />
      <button
        type="button"
        onClick={() => fetchNextPage()}
        className="loadMoreBtn"
        aria-label="Load more travel packages"
        disabled={isFetching}
      >
        <span>{isFetchingNextPage ? "Loading retreats…" : isFetchNextPageError ? "Retry loading retreats" : "Load More Retreats"}</span>
        {!isFetchingNextPage && <FiChevronDown />}
      </button>
      <span className="loadMoreCount" role="status">
        {isFetchNextPageError ? "Could not load the next page. Try again." : `${allTravels.length} retreats loaded · scroll to see more`}
      </span>
    </div>
  ) : null;

  return (
    <div id="TravelListPage">
      {/* ── Full-Width Hero Banner Section (100% Screen Width) ── */}
      <section className="travelHeroBanner">
        {/* Background Image with Black Overlay */}
        <div className="heroBgWrapper">
          <Image
            src={HeroBgImg}
            alt="Curated Travel & Yoga Retreats"
            fill
            priority
            sizes="100vw"
            className="heroBgImage"
          />
          <div className="heroBlackOverlay" />
        </div>

        <div className="container">
          <div className="travelHeroContent">
            <h1>
              Curated <span>Travel</span> & Yoga Retreats
            </h1>

            <p className="heroSubtitle">
              Escape the ordinary and embark on guided spiritual journeys, coastal yoga camps, and Himalayan wellness immersions. Handcrafted experiences with certified masters.
            </p>
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
          {isLoading ? <div className="travelContentState" role="status">Loading travel packages…</div> : isError && !data?.pages?.length ? (
            <div className="travelContentState" role="alert">
              <p>We could not load travel packages. Please try again.</p>
              <button type="button" onClick={() => refetch()}>Retry</button>
            </div>
          ) : filteredTravels.length > 0 ? (
            <>
              <div className="travelListingGrid">
                {visibleTravels.map((travel, i) => (
                  <TravelCard key={travel.id || i} travel={travel} />
                ))}
              </div>
              {loadMoreContent}
            </>
          ) : hasMore ? (
            <>
              <div className="travelContentState" role="status">No matching retreats on the loaded pages. Load more to check the remaining retreats.</div>
              {loadMoreContent}
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
