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
  image?: string;
}

/** Returns the image path for a post if it exists, or undefined. */
export function getPostImagePath(slug: string): string | undefined {
  const imagePath = `/images/posts-images/${slug}.webp`;
  const fsPath = path.join(process.cwd(), 'public', imagePath);
  return fs.existsSync(fsPath) ? imagePath : undefined;
}

const postsDirectory = path.join(process.cwd(), 'posts');

export function getAllPosts(): Post[] {
  if (!fs.existsSync(postsDirectory)) return [];

  const fileNames = fs
    .readdirSync(postsDirectory)
    .filter((name) => name.endsWith('.json'));

  const posts = fileNames.reduce<Post[]>((acc, fileName) => {
    const filePath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    try {
      const post = JSON.parse(fileContents) as Post;
      post.image = getPostImagePath(post.slug);
      acc.push(post);
    } catch {
      console.error(`[posts] Failed to parse ${fileName}, skipping`);
    }
    return acc;
  }, []);

  return posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** Returns only posts whose publishedAt date is in the past. */
export function getPublishedPosts(): Post[] {
  const now = Date.now();
  return getAllPosts().filter(
    (p) => new Date(p.publishedAt).getTime() <= now
  );
}

export function getPostBySlug(slug: string): Post | undefined {
  const filePath = path.join(postsDirectory, `${slug}.json`);
  if (!fs.existsSync(filePath)) return undefined;

  const fileContents = fs.readFileSync(filePath, 'utf8');
  try {
    const post = JSON.parse(fileContents) as Post;
    post.image = getPostImagePath(post.slug);
    return post;
  } catch {
    console.error(`[posts] Failed to parse ${slug}.json`);
    return undefined;
  }
}

export function getRelatedPosts(currentSlug: string, limit = 3): Post[] {
  const allPosts = getPublishedPosts();
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
