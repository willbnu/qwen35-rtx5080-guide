/**
 * Zod Schema Definitions for Documentation Panel
 *
 * This module defines Zod schemas for the documentation panel component,
 * including validation rules for documentation entries, categories,
 * and panel state management.
 *
 * @module schemas/docs
 */

import { z } from 'zod';

// ============================================================================
// Core Documentation Schemas
// ============================================================================

/**
 * Schema for documentation entry ID
 * Unique identifier for each documentation entry.
 */
export const docIdSchema = z
  .string()
  .min(1, 'Document ID is required')
  .max(100, 'Document ID must be 100 characters or less')
  .regex(/^[a-z0-9-]+$/, 'Document ID must be lowercase alphanumeric with hyphens')
  .describe('Unique identifier for the documentation entry');

/**
 * Schema for documentation title
 * Display title for the documentation entry.
 */
export const docTitleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(200, 'Title must be 200 characters or less')
  .describe('Display title of the documentation entry');

/**
 * Schema for documentation category name
 * Category used for organizing documentation.
 */
export const docCategorySchema = z
  .string()
  .min(1, 'Category is required')
  .max(100, 'Category must be 100 characters or less')
  .describe('Category name for organizing documentation');

/**
 * Schema for documentation content
 * Full content of the documentation (supports markdown).
 */
export const docContentSchema = z
  .string()
  .min(1, 'Content is required')
  .max(100000, 'Content must be 100,000 characters or less')
  .describe('Documentation content in markdown format');

/**
 * Schema for external documentation URL
 * Optional URL linking to external documentation.
 */
export const docUrlSchema = z
  .string()
  .url('Must be a valid URL')
  .max(2000, 'URL must be 2000 characters or less')
  .optional()
  .describe('Optional URL to external documentation');

/**
 * Schema for last updated timestamp
 * ISO 8601 timestamp of when the document was last updated.
 */
export const docUpdatedAtSchema = z
  .string()
  .datetime({ message: 'Must be a valid ISO 8601 datetime' })
  .optional()
  .describe('ISO timestamp of when the document was last updated');

/**
 * Schema for documentation tags
 * Optional array of tags for searchability.
 */
export const docTagsSchema = z
  .array(z.string().max(50, 'Tag must be 50 characters or less'))
  .max(20, 'Maximum 20 tags allowed')
  .optional()
  .describe('Optional tags for search and filtering');

/**
 * Schema for documentation sort order
 * Optional numeric order for sorting within category.
 */
export const docSortOrderSchema = z
  .number()
  .int('Sort order must be an integer')
  .min(0, 'Sort order must be non-negative')
  .optional()
  .describe('Sort order within category');

// ============================================================================
// Category Schemas
// ============================================================================

/**
 * Schema for category ID
 * Unique identifier for a documentation category.
 */
export const categoryIdSchema = z
  .string()
  .min(1, 'Category ID is required')
  .max(100, 'Category ID must be 100 characters or less')
  .regex(/^[a-z0-9-]+$/, 'Category ID must be lowercase alphanumeric with hyphens')
  .describe('Unique identifier for the category');

/**
 * Schema for category name
 * Display name for the documentation category.
 */
export const categoryNameSchema = z
  .string()
  .min(1, 'Category name is required')
  .max(100, 'Category name must be 100 characters or less')
  .describe('Display name of the documentation category');

/**
 * Schema for category description
 * Optional description of what the category contains.
 */
export const categoryDescriptionSchema = z
  .string()
  .max(500, 'Description must be 500 characters or less')
  .optional()
  .describe('Optional description of the category');

/**
 * Schema for category icon
 * Optional icon identifier for UI display.
 */
export const categoryIconSchema = z
  .string()
  .max(50, 'Icon name must be 50 characters or less')
  .optional()
  .describe('Optional icon identifier for UI display');

// ============================================================================
// Composite Documentation Schemas
// ============================================================================

/**
 * Schema for a single documentation entry
 * Represents a complete documentation article with metadata.
 */
export const docEntrySchema = z.object({
  /** Unique identifier for the document */
  id: docIdSchema,
  /** Display title of the document */
  title: docTitleSchema,
  /** Category for organization */
  category: docCategorySchema,
  /** Document content in markdown format */
  content: docContentSchema,
  /** Optional URL to external documentation */
  url: docUrlSchema,
  /** Last updated timestamp */
  updated_at: docUpdatedAtSchema,
  /** Optional tags for search/filtering */
  tags: docTagsSchema,
  /** Sort order within category */
  sort_order: docSortOrderSchema,
});

/**
 * Schema for documentation entry props with camelCase naming
 * Used by React components with idiomatic JavaScript naming.
 */
export const docEntryPropsSchema = z.object({
  /** Unique identifier for the document */
  id: docIdSchema,
  /** Display title of the document */
  title: docTitleSchema,
  /** Category for organization */
  category: docCategorySchema,
  /** Document content in markdown format */
  content: docContentSchema,
  /** Optional URL to external documentation */
  url: docUrlSchema,
  /** Last updated timestamp */
  updatedAt: docUpdatedAtSchema,
  /** Optional tags for search/filtering */
  tags: docTagsSchema,
  /** Sort order within category */
  sortOrder: docSortOrderSchema,
});

/**
 * Schema for a documentation category with entries
 * Represents a category containing multiple documentation entries.
 */
export const docCategorySchemaFull = z.object({
  /** Unique identifier for the category */
  id: categoryIdSchema,
  /** Display name of the category */
  name: categoryNameSchema,
  /** Optional description of the category */
  description: categoryDescriptionSchema,
  /** Optional icon identifier */
  icon: categoryIconSchema,
  /** Documents in this category */
  entries: z.array(docEntryPropsSchema).describe('Documentation entries in this category'),
});

/**
 * Schema for documentation category props with camelCase naming
 * Used by React components with idiomatic JavaScript naming.
 */
export const docCategoryPropsSchema = z.object({
  /** Unique identifier for the category */
  id: categoryIdSchema,
  /** Display name of the category */
  name: categoryNameSchema,
  /** Optional description of the category */
  description: categoryDescriptionSchema,
  /** Optional icon identifier */
  icon: categoryIconSchema,
  /** Documents in this category */
  entries: z.array(docEntryPropsSchema).describe('Documentation entries in this category'),
});

/**
 * Schema for documentation panel state
 * Includes categories, search state, and selection state.
 */
export const docsPanelSchema = z.object({
  // Categories and entries (snake_case for API compatibility)
  /** All documentation categories with their entries */
  categories: z.array(docCategoryPropsSchema).describe('All documentation categories'),

  // Search and filter state
  /** Current search query for filtering documents */
  search_query: z.string().optional().describe('Current search query'),
  /** Currently selected category ID */
  selected_category_id: categoryIdSchema.optional().describe('Currently selected category'),
  /** Currently expanded/viewed document ID */
  expanded_doc_id: docIdSchema.optional().describe('Currently expanded document'),

  // UI state
  /** Whether the panel is in loading state */
  is_loading: z.boolean().default(false).describe('Loading state indicator'),
  /** Error message if any */
  error_message: z.string().optional().describe('Error message if present'),
});

/**
 * Schema for documentation panel props with camelCase naming
 * Used by React components with idiomatic JavaScript naming.
 */
export const docsPanelPropsSchema = z.object({
  // Categories and entries
  /** All documentation categories with their entries */
  categories: z.array(docCategoryPropsSchema).describe('All documentation categories'),

  // Search and filter state
  /** Current search query for filtering documents */
  searchQuery: z.string().optional().describe('Current search query'),
  /** Currently selected category ID */
  selectedCategoryId: categoryIdSchema.optional().describe('Currently selected category'),
  /** Currently expanded/viewed document ID */
  expandedDocId: docIdSchema.optional().describe('Currently expanded document'),

  // UI state
  /** Whether the panel is in loading state */
  isLoading: z.boolean().default(false).describe('Loading state indicator'),
  /** Error message if any */
  errorMessage: z.string().optional().describe('Error message if present'),
});

/**
 * Schema for documentation list view state
 * Simplified state for just listing and filtering docs.
 */
export const docsListStateSchema = z.object({
  /** All documentation entries (flattened) */
  entries: z.array(docEntryPropsSchema).describe('All documentation entries'),
  /** Current search query */
  searchQuery: z.string().optional(),
  /** Filter by category */
  categoryFilter: z.string().optional(),
  /** Sort by field */
  sortBy: z.enum(['title', 'category', 'updatedAt']).default('title'),
  /** Sort direction */
  sortDirection: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Schema for documentation search result
 * Used for highlighting matches in search results.
 */
export const docSearchResultSchema = z.object({
  /** Matched document entry */
  entry: docEntryPropsSchema,
  /** Snippet of content with match highlighted */
  snippet: z.string().describe('Content snippet showing the match'),
  /** Relevance score (0-1) */
  score: z.number().min(0).max(1).describe('Search relevance score'),
  /** Matched field names */
  matchedFields: z.array(z.string()).describe('Fields that matched the search'),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates that a document ID follows the correct format
 * Must be lowercase alphanumeric with hyphens
 */
export const isValidDocId = (value: string): boolean =>
  /^[a-z0-9-]+$/.test(value) && value.length >= 1 && value.length <= 100;

/**
 * Validates that a category ID follows the correct format
 * Must be lowercase alphanumeric with hyphens
 */
export const isValidCategoryId = (value: string): boolean =>
  /^[a-z0-9-]+$/.test(value) && value.length >= 1 && value.length <= 100;

/**
 * Validates that content is valid markdown (basic check)
 * Checks for reasonable content length and structure
 */
export const isValidMarkdownContent = (content: string): boolean =>
  content.length >= 1 && content.length <= 100000;

/**
 * Truncates content for display in list views
 * Returns a preview snippet of the content
 */
export const truncateContent = (content: string, maxLength: number = 150): string => {
  if (content.length <= maxLength) return content;

  // Try to break at a word boundary
  const truncated = content.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
};

/**
 * Extracts plain text from markdown content
 * Strips markdown formatting for search indexing
 */
export const extractPlainText = (markdown: string): string => {
  return markdown
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images
    .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
    .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
};

/**
 * Formats the last updated timestamp for display
 * Returns a human-readable relative time or formatted date
 */
export const formatUpdatedTime = (isoString: string | undefined): string => {
  if (!isoString) return 'Unknown';

  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
};

/**
 * Searches documentation entries for a query
 * Returns entries sorted by relevance
 */
export const searchDocuments = (
  entries: z.infer<typeof docEntryPropsSchema>[],
  query: string
): z.infer<typeof docSearchResultSchema>[] => {
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const results: z.infer<typeof docSearchResultSchema>[] = [];

  for (const entry of entries) {
    const titleMatch = entry.title.toLowerCase().includes(normalizedQuery);
    const categoryMatch = entry.category.toLowerCase().includes(normalizedQuery);
    const contentMatch = entry.content.toLowerCase().includes(normalizedQuery);
    const tagsMatch = entry.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ?? false;

    if (titleMatch || categoryMatch || contentMatch || tagsMatch) {
      // Calculate relevance score
      let score = 0;
      const matchedFields: string[] = [];

      if (titleMatch) {
        score += 0.4;
        matchedFields.push('title');
      }
      if (categoryMatch) {
        score += 0.2;
        matchedFields.push('category');
      }
      if (tagsMatch) {
        score += 0.2;
        matchedFields.push('tags');
      }
      if (contentMatch) {
        score += 0.2;
        matchedFields.push('content');
      }

      // Find snippet around the match
      let snippet = '';
      const contentLower = entry.content.toLowerCase();
      const matchIndex = contentLower.indexOf(normalizedQuery);

      if (matchIndex !== -1) {
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(entry.content.length, matchIndex + query.length + 50);
        snippet = (start > 0 ? '...' : '') +
          entry.content.slice(start, end) +
          (end < entry.content.length ? '...' : '');
      } else {
        snippet = truncateContent(entry.content, 100);
      }

      results.push({
        entry,
        snippet,
        score,
        matchedFields,
      });
    }
  }

  // Sort by relevance score descending
  return results.sort((a, b) => b.score - a.score);
};

/**
 * Custom refinement for validating documentation panel data
 */
export const docsPanelRefinement = z
  .object({
    categories: z.array(docCategoryPropsSchema),
    selectedCategoryId: categoryIdSchema.optional(),
    expandedDocId: docIdSchema.optional(),
  })
  .refine(
    (data) => {
      // If selectedCategoryId is set, it must exist in categories
      if (data.selectedCategoryId) {
        return data.categories.some((c) => c.id === data.selectedCategoryId);
      }
      return true;
    },
    {
      message: 'Selected category ID must exist in the categories list',
    }
  )
  .refine(
    (data) => {
      // If expandedDocId is set, it must exist in one of the categories
      if (data.expandedDocId) {
        return data.categories.some((c) =>
          c.entries.some((e) => e.id === data.expandedDocId)
        );
      }
      return true;
    },
    {
      message: 'Expanded document ID must exist in one of the categories',
    }
  );

// ============================================================================
// Documentation Presets
// ============================================================================

/**
 * Common documentation categories for the LLM dashboard
 * These are typical categories used for organizing documentation.
 */
export const docCategoryPresets = {
  /** Overview category for general information */
  overview: {
    id: 'overview',
    name: 'Overview',
    description: 'General information and quick start guides',
    icon: 'book-open',
  },
  /** Technical documentation */
  technical: {
    id: 'technical',
    name: 'Technical',
    description: 'API reference and configuration guides',
    icon: 'code',
  },
  /** Testing and benchmarking */
  testing: {
    id: 'testing',
    name: 'Testing',
    description: 'Benchmarking and testing guides',
    icon: 'flask',
  },
  /** Best practices and tips */
  bestPractices: {
    id: 'best-practices',
    name: 'Best Practices',
    description: 'Tips and recommendations',
    icon: 'lightbulb',
  },
  /** Troubleshooting guides */
  troubleshooting: {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Common issues and solutions',
    icon: 'alert-triangle',
  },
} as const;

/**
 * Type for documentation category preset keys
 */
export type DocCategoryPresetKey = keyof typeof docCategoryPresets;

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Type for documentation entry (snake_case)
 */
export type DocEntry = z.infer<typeof docEntrySchema>;

/**
 * Type for documentation entry props (camelCase)
 */
export type DocEntryProps = z.infer<typeof docEntryPropsSchema>;

/**
 * Type for documentation category with entries
 */
export type DocCategoryFull = z.infer<typeof docCategorySchemaFull>;

/**
 * Type for documentation category props (camelCase)
 */
export type DocCategoryProps = z.infer<typeof docCategoryPropsSchema>;

/**
 * Type for documentation panel data (snake_case)
 */
export type DocsPanelData = z.infer<typeof docsPanelSchema>;

/**
 * Type for documentation panel props (camelCase)
 */
export type DocsPanelProps = z.infer<typeof docsPanelPropsSchema>;

/**
 * Type for documentation list state
 */
export type DocsListState = z.infer<typeof docsListStateSchema>;

/**
 * Type for documentation search result
 */
export type DocSearchResult = z.infer<typeof docSearchResultSchema>;

// Default export for convenience
export default {
  // Core schemas
  docIdSchema,
  docTitleSchema,
  docCategorySchema,
  docContentSchema,
  docUrlSchema,
  docUpdatedAtSchema,
  docTagsSchema,
  docSortOrderSchema,

  // Category schemas
  categoryIdSchema,
  categoryNameSchema,
  categoryDescriptionSchema,
  categoryIconSchema,

  // Composite schemas
  docEntrySchema,
  docEntryPropsSchema,
  docCategorySchemaFull,
  docCategoryPropsSchema,
  docsPanelSchema,
  docsPanelPropsSchema,
  docsListStateSchema,
  docSearchResultSchema,

  // Validation helpers
  isValidDocId,
  isValidCategoryId,
  isValidMarkdownContent,
  truncateContent,
  extractPlainText,
  formatUpdatedTime,
  searchDocuments,
  docsPanelRefinement,

  // Presets
  docCategoryPresets,
};
