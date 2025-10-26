/**
 * Generate a URL-friendly slug from a task title
 * Includes the task ID to ensure uniqueness
 */
export function generateTaskSlug(title: string, id: string): string {
  // Convert title to lowercase and replace spaces/special chars with hyphens
  const titleSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 50); // Limit length

  // Extract first 8 characters of ID for uniqueness
  const idPrefix = id.substring(0, 8);

  return `${titleSlug}-${idPrefix}`;
}

/**
 * Extract the task ID from a slug
 */
export function getTaskIdFromSlug(slug: string): string {
  // ID is the last segment after the final hyphen
  const parts = slug.split('-');
  return parts[parts.length - 1];
}
