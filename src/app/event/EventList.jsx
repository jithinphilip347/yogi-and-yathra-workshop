"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Image from "next/image";
import EventCard from "@/components/eventCard/EventCard";
import ElseDesign from "@/components/elseDesign/ElseDesign";
import CustomFilterDropdown from "@/components/filter/CustomFilterDropdown";
import { adaptOfflineEvent, offlineEventApi } from "@/services/offlineEventApi";
import { ExperienceListingSkeleton } from "@/components/experiences/ExperienceSkeletons";
import HeroBgImg from "@/assets/images/courseImg-3.webp";
import {
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiSliders,
  FiChevronDown,
  FiRotateCcw,
  FiCalendar,
} from "react-icons/fi";
import "@/assets/css/EventList.scss";

const EventList = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
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
    queryKey: ["public-offline-events-catalog", sortBy],
    queryFn: ({ pageParam, signal }) => offlineEventApi.listPage(
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
  const allEvents = useMemo(
    () => (data?.pages || []).flatMap((page) => page.data).map(adaptOfflineEvent).filter(Boolean),
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
  const categories = useMemo(() => ["All", ...new Set(allEvents.map((event) => event.category).filter(Boolean))], [allEvents]);

  // Locations derived from card data
  const locationOptions = useMemo(() => {
    const locSet = new Set();
    allEvents.forEach((e) => {
      if (e.location) {
        const city = e.location.split(",")[0].trim();
        if (city) locSet.add(city);
      }
    });
    return [
      { value: "All", label: "All Locations" },
      ...Array.from(locSet).map((city) => ({ value: city, label: city })),
    ];
  }, [allEvents]);

  // Durations derived from card data
  const durationOptions = useMemo(() => {
    const durSet = new Set();
    allEvents.forEach((e) => {
      if (e.duration) durSet.add(e.duration.trim());
    });
    return [
      { value: "All", label: "All Durations" },
      ...Array.from(durSet).map((dur) => ({ value: dur, label: dur })),
    ];
  }, [allEvents]);

  // Status options
  const statusOptions = [
    { value: "All", label: "All Status" },
    { value: "Booking Open", label: "Booking Open" },
    { value: "Almost Full", label: "Almost Full" },
    { value: "Fully Booked", label: "Fully Booked" },
    { value: "Registration Upcoming", label: "Registration Upcoming" },
    { value: "Registration Closed", label: "Registration Closed" },
  ];

  // Sort options
  const sortOptions = [
    { value: "default", label: "Recommended" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
  ];

  // Filter and Sort Events
  const filteredEvents = useMemo(() => {
    let result = allEvents.filter((item) => {
      // Category match
      const catMatch =
        selectedCategory === "All" ||
        (item.category &&
          item.category.toLowerCase().includes(
            selectedCategory.toLowerCase().replace("offline ", "").trim()
          ));

      // Location match
      const locMatch =
        selectedLocation === "All" ||
        (item.location &&
          item.location.toLowerCase().includes(selectedLocation.toLowerCase())) ||
        (item.venue &&
          item.venue.toLowerCase().includes(selectedLocation.toLowerCase()));

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

      return catMatch && locMatch && statusMatch && durMatch;
    });

    // Sorting
    if (sortBy === "price-asc") {
      result = [...result].sort(
        (a, b) =>
        Number(a.ticket_price || 0) - Number(b.ticket_price || 0)
      );
    } else if (sortBy === "price-desc") {
      result = [...result].sort(
        (a, b) =>
        Number(b.ticket_price || 0) - Number(a.ticket_price || 0)
      );
    }

    return result;
  }, [allEvents, selectedCategory, selectedLocation, selectedStatus, selectedDuration, sortBy]);

  // Check if any non-default filter is active
  const hasActiveFilters =
    selectedCategory !== "All" ||
    selectedLocation !== "All" ||
    selectedStatus !== "All" ||
    selectedDuration !== "All" ||
    sortBy !== "default";

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSelectedLocation("All");
    setSelectedStatus("All");
    setSelectedDuration("All");
    setSortBy("default");
  };
  const visibleEvents = filteredEvents;
  const hasMore = Boolean(hasNextPage);

  const loadMoreContent = hasMore ? (
    <div className="loadMoreContainer">
      <div ref={loadMoreRef} className="infiniteScrollSentinel" aria-hidden="true" />
      <button
        type="button"
        onClick={() => fetchNextPage()}
        className="loadMoreBtn"
        aria-label="Load more events"
        disabled={isFetching}
      >
        <span>{isFetchingNextPage ? "Loading events…" : isFetchNextPageError ? "Retry loading events" : "Load More Events"}</span>
        {!isFetchingNextPage && <FiChevronDown />}
      </button>
      <span className="loadMoreCount" role="status">
        {isFetchNextPageError ? "Could not load the next page. Try again." : `${allEvents.length} events loaded · scroll to see more`}
      </span>
    </div>
  ) : null;

  return (
    <div id="EventListPage">
      {/* ── Full-Width Hero Banner Section (100% Screen Width) ── */}
      <section className="eventHeroBanner">
        {/* Background Image with Black Overlay */}
        <div className="heroBgWrapper">
          <Image
            src={HeroBgImg}
            alt="Offline Events & Workshops"
            fill
            priority
            sizes="100vw"
            className="heroBgImage"
          />
          <div className="heroBlackOverlay" />
        </div>

        <div className="container">
          <div className="eventHeroContent">
            <h1>
              Offline <span>Events</span> & Workshops
            </h1>

            <p className="heroSubtitle">
              Immerse yourself in authentic physical yoga workshops, restorative sound baths, and nature meditation retreats guided by certified yoga masters across Kerala.
            </p>
          </div>
        </div>
      </section>

      {/* ── Main Content Container (Filters + Grid) ── */}
      <section className="eventListingContent">
        <div className="container">
          {/* Card-Based Filter Section */}
          <div className="eventFilterSection">
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
                {/* Custom Location Dropdown */}
                <CustomFilterDropdown
                  icon={<FiMapPin />}
                  value={selectedLocation}
                  options={locationOptions}
                  onChange={(val) => {
                    setSelectedLocation(val);
                  }}
                  searchPlaceholder="Search locations..."
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
          {filteredEvents.length > 0 && (
            <div className="eventResultStats">
              <span>
                Showing <strong>{visibleEvents.length}</strong> of{" "}
                <strong>{filteredEvents.length}</strong> events
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
                  {selectedLocation !== "All" && (
                    <span className="chip">
                      📍 {selectedLocation}
                      <span
                        className="removeChip"
                        onClick={() => {
                          setSelectedLocation("All");
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

          {/* Event Cards Grid OR ElseDesign */}
          {isLoading ? (
            <ExperienceListingSkeleton type="event" />
          ) : isError && !data?.pages?.length ? (
            <div className="eventLoadingState" role="alert"><p>We could not load events right now. Please try again.</p><button type="button" onClick={() => refetch()}>Retry</button></div>
          ) : filteredEvents.length > 0 ? (
            <>
              <div className="eventListingGrid">
                {visibleEvents.map((evt, i) => (
                  <EventCard
                    key={evt.id || i}
                    event={{
                      ...evt,
                      link: evt.link || `/event/${encodeURIComponent(evt.slug || evt.id)}`,
                    }}
                  />
                ))}
              </div>

              {loadMoreContent}
            </>
          ) : hasMore ? (
            <>
              <div className="eventLoadingState" role="status">No matching events on the loaded pages. Load more to check the remaining events.</div>
              {loadMoreContent}
            </>
          ) : (
            <ElseDesign
              icon={
                <FiCalendar
                  style={{
                    fontSize: "32px",
                    color: "var(--primaryColor, #874429)",
                  }}
                />
              }
              title="No Events Found"
              message="No offline events match your selected filters. Please adjust your criteria or reset filters to see all available workshops."
              actionText="Reset All Filters"
              onAction={handleResetFilters}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default EventList;
