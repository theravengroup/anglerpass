import fs from 'fs';
import path from 'path';

export interface Post {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  readingTime: string;
  directAnswer: string;
  content: string;
}

const postsDirectory = path.join(process.cwd(), 'posts');

export function getAllPosts(): Post[] {
  if (!fs.existsSync(postsDirectory)) return [];

  const fileNames = fs
    .readdirSync(postsDirectory)
    .filter((name) => name.endsWith('.json'));

  const posts = fileNames.map((fileName) => {
    const filePath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents) as Post;
  });

  return posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getPostBySlug(slug: string): Post | undefined {
  const filePath = path.join(postsDirectory, `${slug}.json`);
  if (!fs.existsSync(filePath)) return undefined;

  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents) as Post;
}

export function getRelatedPosts(currentSlug: string, limit = 3): Post[] {
  const allPosts = getAllPosts();
  const current = allPosts.find((p) => p.slug === currentSlug);
  if (!current) return allPosts.filter((p) => p.slug !== currentSlug).slice(0, limit);

  const currentTags = new Set(current.tags);

  return allPosts
    .filter((p) => p.slug !== currentSlug)
    .map((p) => ({
      post: p,
      overlap: p.tags.filter((t) => currentTags.has(t)).length,
    }))
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((item) => item.post);
}
