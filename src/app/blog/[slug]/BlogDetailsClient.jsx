"use client";
import React, { useState, useEffect } from 'react';
import BlogCard from '../BlogCard';
import { blogApi } from '@/services/blogApi';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import '../../../assets/css/blog.css';

const fallbackHero = "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=1000&auto=format&fit=crop";
const fallbackAuthor = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop";

const BlogDetailsClient = ({ initialData }) => {
  const [blog, setBlog] = useState(initialData || null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);

  const categoryName = typeof blog?.category === 'object' ? blog?.category?.name : (blog?.category || 'Lifestyle');
  const heroImage = resolveMediaUrl(blog?.featuredImage || blog?.featured_image, fallbackHero);
  const authorAvatar = resolveMediaUrl(blog?.author?.avatar, fallbackAuthor);
  const authorName = blog?.author?.name || 'Yogify Team';
  const authorRole = blog?.author?.role ? blog.author.role.toUpperCase() : 'YOGA INSTRUCTOR';
  
  const displayDate = blog?.published_at
    ? new Date(blog.published_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "Mar 11, 2024";

  // Fetch related articles
  useEffect(() => {
    if (blog?.category_id) {
      blogApi.getRelatedBlogs(blog.category_id, blog.id)
        .then((res) => {
          const list = (res.data?.data || []).filter((item) => item.id !== blog.id).slice(0, 3);
          setRelatedBlogs(list);
        })
        .catch((err) => console.warn("Failed to load related blogs:", err));
    }
  }, [blog]);

  if (!blog) {
    return (
      <div id="BlogDetails">
        <div className="container py-20 text-center">
          <h2>Article Not Found</h2>
          <p>The requested blog article could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div id='BlogDetails'>
      
      {/* Hero Section */}
      <div className="BlogDetailsHero container">
         <div className="HeroImage">
            <img src={heroImage} alt={blog.title || "Hero Image"} />
         </div>
         <div className="HeroInfo">
            <div className="Meta">
                <span className="Category">{categoryName}</span>
                <span className="Separator">—</span>
                <span className="Date">{displayDate}</span>
                {blog.reading_time && (
                  <>
                    <span className="Separator">—</span>
                    <span className="Date">{blog.reading_time} min read</span>
                  </>
                )}
            </div>
            <h1>{blog.title}</h1>
            {blog.short_description && (
              <p className="Summary">{blog.short_description}</p>
            )}
            
            <div className="Author">
                <div className="AuthorImg">
                    <img src={authorAvatar} alt={authorName} />
                </div>
                <div className="AuthorInfo">
                    <span className="Name">{authorName}</span>
                    <span className="Role">{authorRole}</span>
                </div>
            </div>
         </div>
      </div>

      {/* Content Section */}
      <div className="BlogContentBody container">
         <div 
           className="ContentInner" 
           dangerouslySetInnerHTML={{ __html: blog.content }} 
         />
      </div>

      {/* Related Articles */}
      {relatedBlogs.length > 0 && (
        <div className="RelatedArticles">
            <div className="container">
                <div className="RelatedHeader">
                    <h2>Latest articles</h2>
                </div>
                <div className="BlogGrid">
                    {relatedBlogs.map((rel) => (
                      <BlogCard key={rel.id} {...rel} />
                    ))}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default BlogDetailsClient;
