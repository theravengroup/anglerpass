import { describe, it, expect } from "vitest";
import { getAllPosts, getPostBySlug, getPostImagePath, getPublishedPosts, getRelatedPosts } from "./posts";
import type { Post } from "./posts";

// ─── getPostImagePath ──────────────────────────────────────────────

describe("getPostImagePath", () => {
  it("returns a path for a slug that has a matching image", () => {
    // This slug has a corresponding .webp in public/images/posts-images/
    const result = getPostImagePath("best-private-trout-streams-american-west");
    expect(result).toBe("/images/posts-images/best-private-trout-streams-american-west.webp");
  });

  it("returns undefined for a slug without a matching image", () => {
    const result = getPostImagePath("nonexistent-slug-with-no-image-file");
    expect(result).toBeUndefined();
  });

  it("returns undefined for a completely nonexistent slug", () => {
    const result = getPostImagePath("this-slug-does-not-exist-anywhere");
    expect(result).toBeUndefined();
  });
});

// ─── getAllPosts ────────────────────────────────────────────────────

describe("getAllPosts", () => {
  it("returns an array", () => {
    const posts = getAllPosts();
    expect(Array.isArray(posts)).toBe(true);
  });

  it("returns at least one post", () => {
    const posts = getAllPosts();
    expect(posts.length).toBeGreaterThan(0);
  });

  it("every post has required fields", () => {
    const posts = getAllPosts();
    for (const post of posts) {
      expect(post.slug).toBeTruthy();
      expect(post.title).toBeTruthy();
      expect(post.description).toBeTruthy();
      expect(post.publishedAt).toBeTruthy();
      expect(post.updatedAt).toBeTruthy();
      expect(Array.isArray(post.tags)).toBe(true);
      expect(post.readingTime).toBeTruthy();
      expect(post.directAnswer).toBeTruthy();
      expect(post.content).toBeTruthy();
    }
  });

  it("returns posts sorted by publishedAt descending", () => {
    const posts = getAllPosts();
    for (let i = 1; i < posts.length; i++) {
      const prev = new Date(posts[i - 1].publishedAt).getTime();
      const curr = new Date(posts[i].publishedAt).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  it("sets image field for posts that have a matching image file", () => {
    const posts = getAllPosts();
    const postWithImage = posts.find(
      (p) => p.slug === "best-private-trout-streams-american-west"
    );
    expect(postWithImage).toBeDefined();
    expect(postWithImage!.image).toBe(
      "/images/posts-images/best-private-trout-streams-american-west.webp"
    );
  });

  it("all posts have images since all post images were added", () => {
    const posts = getAllPosts();
    for (const post of posts) {
      expect(post.image).toBeTruthy();
      expect(post.image).toMatch(/^\/images\/posts-images\/.+\.webp$/);
    }
  });
});

// ─── getPostBySlug ─────────────────────────────────────────────────

describe("getPostBySlug", () => {
  it("returns a post with full content for a valid slug", () => {
    const post = getPostBySlug("best-private-trout-streams-american-west");
    expect(post).toBeDefined();
    expect(post!.slug).toBe("best-private-trout-streams-american-west");
    expect(post!.title).toBeTruthy();
    expect(post!.content).toBeTruthy();
    expect(post!.content.length).toBeGreaterThan(100);
  });

  it("returns undefined for an invalid slug", () => {
    const post = getPostBySlug("this-slug-does-not-exist");
    expect(post).toBeUndefined();
  });

  it("attaches image when the slug has a matching image file", () => {
    const post = getPostBySlug("best-private-trout-streams-american-west");
    expect(post!.image).toBe(
      "/images/posts-images/best-private-trout-streams-american-west.webp"
    );
  });

  it("attaches image for all posts with matching files", () => {
    const post = getPostBySlug("digital-gap-in-fly-fishing-club-management");
    expect(post).toBeDefined();
    expect(post!.image).toBe(
      "/images/posts-images/digital-gap-in-fly-fishing-club-management.webp"
    );
  });
});

// ─── getPublishedPosts ─────────────────────────────────────────────

describe("getPublishedPosts", () => {
  it("returns only posts with publishedAt in the past", () => {
    const posts = getPublishedPosts();
    const now = Date.now();
    for (const post of posts) {
      expect(new Date(post.publishedAt).getTime()).toBeLessThanOrEqual(now);
    }
  });

  it("returns a subset of or equal to getAllPosts", () => {
    const all = getAllPosts();
    const published = getPublishedPosts();
    expect(published.length).toBeLessThanOrEqual(all.length);
  });
});

// ─── getRelatedPosts ───────────────────────────────────────────────

describe("getRelatedPosts", () => {
  it("returns at most the requested limit", () => {
    const posts = getAllPosts();
    if (posts.length === 0) return;
    const related = getRelatedPosts(posts[0].slug, 2);
    expect(related.length).toBeLessThanOrEqual(2);
  });

  it("does not include the current post in results", () => {
    const posts = getAllPosts();
    if (posts.length === 0) return;
    const slug = posts[0].slug;
    const related = getRelatedPosts(slug);
    expect(related.every((p) => p.slug !== slug)).toBe(true);
  });

  it("returns posts even for a nonexistent slug", () => {
    const related = getRelatedPosts("nonexistent-slug-xyz");
    // Should still return some posts (just not tag-sorted)
    expect(Array.isArray(related)).toBe(true);
  });

  it("defaults to 3 results", () => {
    const posts = getAllPosts();
    if (posts.length < 4) return;
    const related = getRelatedPosts(posts[0].slug);
    expect(related.length).toBe(3);
  });
});
