import React from 'react';
import Link from 'next/link';
import { resolveMediaUrl } from '@/utils/mediaUrl';

const fallbackImg = "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop";

const BlogCard = ({ id, slug, image, featured_image, title, category, date, published_at }) => {
  const imageUrl = resolveMediaUrl(featured_image || image, fallbackImg);
  const categoryName = typeof category === 'object' ? category?.name : (category || 'Yoga');
  
  const displayDate = published_at
    ? new Date(published_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : (date || "Mar 11, 2024");

  const href = slug ? `/blog/${slug}` : (id ? `/blog/${id}` : '/blog');

  return (
    <Link href={href} className="BlogCard" style={{ textDecoration: 'none' }}>
      <div className="BlogImage">
        <img src={imageUrl} alt={title || 'Blog Post'} loading="lazy" />
      </div>
      <div className="BlogContent">
        <h3>{title}</h3>
        <hr />
        <div className="BlogMeta">
          <span className="Category">{categoryName}</span>
          <span className="Separator">—</span>
          <span className="Date">{displayDate}</span>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
