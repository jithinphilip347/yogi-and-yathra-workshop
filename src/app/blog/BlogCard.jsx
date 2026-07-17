import React from 'react';
import Link from 'next/link';

const BlogCard = ({ image, title, category, date }) => {
  return (
    <Link href="/blog/blog-details" className="BlogCard" style={{textDecoration: 'none'}}>
      <div className="BlogImage">
        <img src={image} alt={title} />
      </div>
      <div className="BlogContent">
        <h3>{title}</h3>
        <hr />
        <div className="BlogMeta">
          <span className="Category">{category}</span>
          <span className="Separator">—</span>
          <span className="Date">{date}</span>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
