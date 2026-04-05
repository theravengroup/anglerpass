"use client";

import { useState } from "react";
import Link from "next/link";

interface PostSummary {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
  readingTime: string;
}

const PAGE_SIZE = 6;

export default function LearnPostGrid({ posts }: { posts: PostSummary[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = posts.slice(0, visible);
  const hasMore = visible < posts.length;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shown.map((post) => (
          <Link
            key={post.slug}
            href={`/learn/${post.slug}`}
            className="group bg-white border border-parchment rounded-[14px] px-7 py-8 no-underline transition-all duration-300 hover:border-bronze/30 hover:shadow-sm"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[10px] uppercase tracking-[0.15em] text-bronze bg-bronze/8 px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="font-heading text-[22px] font-semibold text-forest mb-2 tracking-[-0.2px] group-hover:text-forest-deep transition-colors">
              {post.title}
            </h2>
            <p className="text-[14px] leading-[1.65] text-text-secondary mb-4">
              {post.description}
            </p>
            <div className="flex items-center gap-3 text-[12px] text-text-light">
              <span>{post.readingTime}</span>
              <span>&middot;</span>
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-md text-sm font-medium tracking-[0.3px] border border-forest/20 text-forest bg-white transition-all duration-300 hover:border-forest/40 hover:bg-forest/5"
          >
            Load More Articles
          </button>
        </div>
      )}
    </>
  );
}
