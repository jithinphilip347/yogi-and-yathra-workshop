"use client";
import React, { useState, useEffect } from 'react';
import BlogCard from './BlogCard';
import { blogApi } from '@/services/blogApi';
import '../../assets/css/blog.css';

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const res = await blogApi.getBlogs({ per_page: 50 });
        const list = res.data?.data || [];
        setBlogs(list);
      } catch (err) {
        console.error("Failed to load blog posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 3);
  };

  return (
    <div id='Blog'>
      <div className="container">
        
        <div className="BlogHeader">
          <h2>Articles & news</h2>
          <p>Discover insightful articles, wellness tips, and the latest updates from our yoga community to support your journey of physical and mental harmony.</p>
        </div>

        {loading ? (
          <div className="BlogGrid">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="BlogCard animate-pulse">
                <div className="BlogImage bg-slate-200 h-48 rounded" />
                <div className="BlogContent mt-4 space-y-2">
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : blogs.length > 0 ? (
          <>
            <div className="BlogGrid">
              {blogs.slice(0, visibleCount).map(blog => (
                <BlogCard key={blog.id} {...blog} />
              ))}
            </div>
            
            {visibleCount < blogs.length && (
              <div className="LoadMoreContainer">
                <button className="LoadMoreBtn" onClick={handleLoadMore}>
                  Load more blogs
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="EmptyBlogState">
            <div className="EmptyIcon">📝</div>
            <h3>No Articles Found</h3>
            <p>We are working on bringing you exciting new content. Stay tuned!</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Blog;