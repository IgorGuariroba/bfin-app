import readingTime from "reading-time";

export const POST_CATEGORIES = [
  "Educação Financeira",
  "Produto",
  "Mercado",
  "Dicas",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export const POST_STATUSES = ["draft", "published", "archived"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const COMMENT_STATUSES = ["pending", "approved", "rejected"] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function categorySlug(category: PostCategory): string {
  return slugify(category);
}

export function findCategoryBySlug(slug: string): PostCategory | null {
  return POST_CATEGORIES.find((c) => categorySlug(c) === slug) ?? null;
}

export function readingMinutes(markdown: string): number {
  return Math.max(1, Math.ceil(readingTime(markdown).minutes));
}

export function postExcerpt(post: { excerpt: string | null; content: string }): string {
  if (post.excerpt) return post.excerpt;
  const plain = post.content.replace(/[#>*_`\[\]()!-]/g, "").replace(/\s+/g, " ").trim();
  return plain.length > 180 ? plain.slice(0, 177) + "..." : plain;
}
