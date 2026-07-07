import prisma from '../config/db';

/**
 * Convert a string into a URL-safe slug.
 * e.g. "Oxford Academy" → "oxford-academy"
 */
export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/**
 * Generate a unique slug for an institute.
 * If "oxford-academy" already exists, tries "oxford-academy-2", "oxford-academy-3", etc.
 */
export const generateUniqueSlug = async (name: string): Promise<string> => {
  const baseSlug = slugify(name);
  if (!baseSlug) {
    throw new Error('Institute name must contain at least one alphanumeric character.');
  }

  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.institute.findUnique({ where: { slug } });
    if (!existing) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }
};
