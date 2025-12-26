/**
 * Utility functions for generating and parsing SEO-friendly slugs
 * Using slugify library for robust Unicode and transliteration support
 */

import slugify from 'slugify'

/**
 * Generate a URL-friendly slug from a title
 * @param title - The post title
 * @param id - The post UUID
 * @returns A slug in format: "title-words-uuid"
 */
export function generateSlug(title: string | null | undefined, id: string): string {
  if (!title || !title.trim()) {
    return id
  }

  // Use slugify with options for better Unicode/transliteration support
  const slug = slugify(title, {
    lower: true,           // Convert to lowercase
    strict: true,          // Remove special characters
    trim: true,            // Trim leading/trailing replacement chars
    locale: 'hi',          // Use Hindi locale for better transliteration
    remove: /[*+~.()'"!:@]/g // Remove specific characters
  })
    .substring(0, 60)      // Limit length to 60 characters
    .replace(/-+$/g, '')   // Remove trailing hyphens

  // If slug is empty after processing, just return the ID
  if (!slug || slug.length === 0) {
    return id
  }

  // Append the UUID at the end for uniqueness
  return `${slug}-${id}`
}

/**
 * Extract UUID from a slug
 * @param slug - The slug string (e.g., "my-post-title-uuid")
 * @returns The UUID or the original slug if no UUID found
 */
export function extractIdFromSlug(slug: string): string {
  // UUID pattern: 8-4-4-4-12 characters
  const uuidRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i
  const match = slug.match(uuidRegex)
  
  if (match) {
    return match[1]
  }
  
  // If no UUID found, assume the entire slug is the ID (backward compatibility)
  return slug
}

/**
 * Validate if a string is a valid UUID
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}
