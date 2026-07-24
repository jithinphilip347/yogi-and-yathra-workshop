import React from 'react';
import { notFound } from 'next/navigation';
import BlogDetailsClient from './BlogDetailsClient';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { API_BASE_URL } from '@/utils/constants';

const API_BASE = API_BASE_URL;

// Revalidate static blog detail pages every 60 seconds (ISR)
export const revalidate = 60;

// Pre-render static pages for existing published blog slugs at build time
export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE}blogs?per_page=50`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const blogs = data?.data || [];
    return blogs.map((blog) => ({
      slug: blog.slug,
    }));
  } catch (err) {
    console.error("Error generating static params for blogs:", err);
    return [];
  }
}

async function getBlogPost(slug) {
  try {
    const res = await fetch(`${API_BASE}blogs/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data || null;
  } catch (err) {
    console.error("Error fetching blog post:", err);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await getBlogPost(slug);

  if (!blog) {
    return {
      title: "Article Not Found — Yogify",
      description: "The requested article could not be found.",
    };
  }

  const title = blog.seo_title || blog.title || "Yogify Blog";
  const description = blog.meta_description || blog.short_description || "Discover insightful yoga articles and wellness tips.";
  const canonicalUrl = blog.canonical_url || `http://localhost:3000/blog/${blog.slug}`;
  const ogImage = resolveMediaUrl(blog.featuredImage || blog.featured_image, "");

  return {
    title: `${title} | Yogify Studio`,
    description,
    keywords: blog.meta_keywords ? blog.meta_keywords.split(",") : ["Yoga", "Wellness", "Mindfulness"],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: blog.robots || "index, follow",
    openGraph: {
      title: blog.og_title || title,
      description: blog.og_description || description,
      url: canonicalUrl,
      siteName: "Yogify Studio",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: title }] : [],
      type: "article",
      publishedTime: blog.published_at,
      authors: [blog.author?.name || "Yogify Studio"],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.twitter_title || title,
      description: blog.twitter_description || description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const blog = await getBlogPost(slug);

  if (!blog) {
    notFound();
  }

  const canonicalUrl = blog.canonical_url || `http://localhost:3000/blog/${blog.slug}`;
  const ogImage = resolveMediaUrl(blog.featuredImage || blog.featured_image, "");

  // JSON-LD Article Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "description": blog.short_description || blog.meta_description,
    "image": ogImage ? [ogImage] : [],
    "datePublished": blog.published_at || blog.created_at,
    "dateModified": blog.updated_at || blog.published_at,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "author": {
      "@type": "Person",
      "name": blog.author?.name || "Yogify Studio"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Yogify Studio",
      "logo": {
        "@type": "ImageObject",
        "url": "http://localhost:3000/logo-01.png"
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogDetailsClient initialData={blog} />
    </>
  );
}
