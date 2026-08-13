"use client";
import React, { useState, useEffect, useCallback } from "react";
import TeacherBox from "../../components/teachersBox/TeacherBox";
import { fetchInstructors } from "@/libs/course";

const Page = () => {
  const [instructors, setInstructors] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadInstructors = useCallback(async (pageNum, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await fetchInstructors({ page: pageNum, perPage: 12 });
      const data = res?.data || [];
      const meta = res?.meta || {};

      const mapped = data.map((inst) => ({
        id: inst.id,
        name: inst.name,
        role: inst.professional_title || "Instructor",
        img: inst.avatar_url
          ?  inst.avatar_url
          : "/images/placeholder-avatar.jpg",
        twitter: inst.linkdin ? "#" : undefined,
        instagram: inst.instagram ? "#" : undefined,
        link: `/teacher-list/${inst.slug || inst.id}`,
      }));

      if (append) {
        setInstructors((prev) => [...prev, ...mapped]);
      } else {
        setInstructors(mapped);
      }

      setHasMore(pageNum < (meta.last_page || 1));
    } catch (err) {
      console.error("Failed to load instructors:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadInstructors(1);
  }, [loadInstructors]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadInstructors(nextPage, true);
  };

  const renderGridContent = () => {
    if (loading) {
      return Array(8)
        .fill(0)
        .map((_, i) => <TeacherBox key={i} loading={true} />);
    }

    if (instructors.length === 0) {
      return (
        <div
          className="empty-state"
          style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 20px',
            color: '#888',
          }}
        >
          <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>No Instructors Found</h3>
          <p>There are no instructors available at the moment. Please check back later.</p>
        </div>
      );
    }

    return instructors.map((member) => (
      <TeacherBox
        key={member.id}
        image={member.img}
        name={member.name}
        position={member.role}
        twitter={member.twitter}
        instagram={member.instagram}
        profileLink={member.link}
      />
    ));
  };

  return (
    <div id="TeacherList">
      <div className="container">
        <div className="TeacherListHeader">
          <h2>Our Instructors</h2>
          <p>
            Discover our team of experienced and dedicated professionals
            committed to your success. <br /> Learn from the best in the
            industry.
          </p>
        </div>

        <div className="TeacherListMain">
          <div className="TeacherGrid">
            {renderGridContent()}
          </div>

          {hasMore && !loading && (
            <div className="loadMoreContainer">
              <button
                onClick={handleLoadMore}
                className="loadMoreBtn"
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load More Teachers"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
