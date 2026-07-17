"use client";
import React, { useState } from 'react';
import BlogCard from './BlogCard';
import '../../assets/css/blog.css';

const blogData = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop',
    title: '7 Yoga poses to keep your body fit',
    category: 'Yoga',
    date: 'Mar 11, 2024'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=1000&auto=format&fit=crop',
    title: 'How to introduce yoga into the family routine',
    category: 'Lifestyle',
    date: 'Mar 11, 2024'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?q=80&w=1000&auto=format&fit=crop',
    title: 'Playlists to accompany your yoga practice',
    category: 'Resources',
    date: 'Mar 11, 2024'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?q=80&w=1000&auto=format&fit=crop',
    title: 'Yoga as a tool for self-care and introspection',
    category: 'Yoga',
    date: 'Mar 11, 2024'
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop',
    title: 'Tips, postures and advice for beginners',
    category: 'Lifestyle',
    date: 'Mar 11, 2024'
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1510894347713-fc3ed6fdf539?q=80&w=1000&auto=format&fit=crop',
    title: 'The best yoga tools to practice at any time',
    category: 'Resources',
    date: 'Mar 11, 2024'
  },
  {
    id: 7,
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop',
    title: 'Morning routines to start your day right',
    category: 'Lifestyle',
    date: 'Mar 12, 2024'
  }
];

const Blog = () => {
  const [blogs, setBlogs] = useState(blogData);
  const [visibleCount, setVisibleCount] = useState(6);
  
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

        {blogs.length > 0 ? (
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
  )
}

export default Blog