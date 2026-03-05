/**
 * DocsPanel Component
 *
 * Displays organized documentation with categories and search functionality.
 * Supports filtering by category and expanding documents to view content.
 *
 * @module components/dashboard/DocsPanel
 */

import { useState, useMemo } from 'react';
import type { DocsPanelProps, DocCategory, DocEntry } from '../../catalog';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats the last updated timestamp for display
 * @param isoString - ISO timestamp string
 * @returns Human-readable relative time or formatted date
 */
const formatUpdatedTime = (isoString: string | null | undefined): string => {
  if (!isoString) return '';

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
    return '';
  }
};

/**
 * Filters documentation entries by search query
 * @param entries - Array of doc entries to filter
 * @param query - Search query string
 * @returns Filtered array of entries
 */
const filterEntriesByQuery = (entries: DocEntry[], query: string): DocEntry[] => {
  if (!query.trim()) return entries;

  const normalizedQuery = query.toLowerCase().trim();

  return entries.filter((entry) => {
    const titleMatch = entry.title.toLowerCase().includes(normalizedQuery);
    const categoryMatch = entry.category.toLowerCase().includes(normalizedQuery);
    const contentMatch = entry.content.toLowerCase().includes(normalizedQuery);

    return titleMatch || categoryMatch || contentMatch;
  });
};

// ============================================================================
// Component Types
// ============================================================================

interface DocsPanelComponentProps {
  /** All documentation categories */
  categories: DocsPanelProps['categories'];
  /** Search query for filtering (optional) */
  searchQuery?: string | null;
  /** Currently selected category ID (optional) */
  selectedCategoryId?: string | null;
  /** Currently expanded document ID (optional) */
  expandedDocId?: string | null;
  /** Optional className for additional styling */
  className?: string;
  /** Callback when a category is selected */
  onCategorySelect?: (categoryId: string | null) => void;
  /** Callback when a document is expanded */
  onDocExpand?: (docId: string | null) => void;
  /** Callback when search query changes */
  onSearch?: (query: string) => void;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Category badge component
 */
interface CategoryBadgeProps {
  name: string;
  isActive: boolean;
  count: number;
  onClick: () => void;
}

const CategoryBadge = ({ name, isActive, count, onClick }: CategoryBadgeProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground hover:bg-muted/80'
    }`}
  >
    <span>{name}</span>
    <span
      className={`rounded-full px-1.5 text-xs ${
        isActive ? 'bg-primary-foreground/20' : 'bg-background'
      }`}
    >
      {count}
    </span>
  </button>
);

/**
 * Document entry item component
 */
interface DocItemProps {
  entry: DocEntry;
  isExpanded: boolean;
  onToggle: () => void;
}

const DocItem = ({ entry, isExpanded, onToggle }: DocItemProps) => {
  const updatedAt = formatUpdatedTime(entry.updatedAt);

  return (
    <div className="rounded-md border border-border bg-background">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{entry.title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {entry.category}
            {updatedAt && ` • ${updatedAt}`}
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-muted-foreground transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-border p-3">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">
              {entry.content}
            </p>
          </div>
          {entry.url && (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-sm text-primary hover:underline"
            >
              View documentation
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * DocsPanel Component
 *
 * Renders a card displaying organized documentation with categories and search.
 * Supports filtering by category and expanding documents to view full content.
 *
 * @example
 * ```tsx
 * <DocsPanel
 *   categories={[
 *     {
 *       id: 'getting-started',
 *       name: 'Getting Started',
 *       description: 'Quick start guides',
 *       entries: [
 *         {
 *           id: 'installation',
 *           title: 'Installation',
 *           category: 'getting-started',
 *           content: '## Installation\n\nFollow these steps...',
 *         },
 *       ],
 *     },
 *   ]}
 *   searchQuery=""
 *   selectedCategoryId={null}
 *   expandedDocId={null}
 * />
 * ```
 */
export function DocsPanel({
  categories,
  searchQuery: externalSearchQuery,
  selectedCategoryId: externalSelectedCategoryId,
  expandedDocId: externalExpandedDocId,
  className = '',
  onCategorySelect,
  onDocExpand,
  onSearch,
}: DocsPanelComponentProps) {
  // Internal state for uncontrolled usage
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [internalSelectedCategoryId, setInternalSelectedCategoryId] = useState<string | null>(null);
  const [internalExpandedDocId, setInternalExpandedDocId] = useState<string | null>(null);

  // Use external props if provided, otherwise use internal state
  const searchQuery = externalSearchQuery ?? internalSearchQuery;
  const selectedCategoryId = externalSelectedCategoryId ?? internalSelectedCategoryId;
  const expandedDocId = externalExpandedDocId ?? internalExpandedDocId;

  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    setInternalSelectedCategoryId(categoryId);
    onCategorySelect?.(categoryId);
  };

  // Handle document expand/collapse
  const handleDocExpand = (docId: string) => {
    const newExpandedDocId = expandedDocId === docId ? null : docId;
    setInternalExpandedDocId(newExpandedDocId);
    onDocExpand?.(newExpandedDocId);
  };

  // Handle search query change
  const handleSearchChange = (query: string) => {
    setInternalSearchQuery(query);
    onSearch?.(query);
  };

  // Get all entries flattened for search
  const allEntries = useMemo(() => {
    return categories.flatMap((cat) => cat.entries);
  }, [categories]);

  // Filter categories and entries based on search and selection
  const filteredCategories = useMemo(() => {
    // If there's a search query, search across all entries
    if (searchQuery.trim()) {
      const filteredEntries = filterEntriesByQuery(allEntries, searchQuery);
      return [
        {
          id: 'search-results',
          name: 'Search Results',
          description: `Found ${filteredEntries.length} document(s)`,
          entries: filteredEntries,
        },
      ] as DocCategory[];
    }

    // If a category is selected, show only that category
    if (selectedCategoryId) {
      const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);
      return selectedCategory ? [selectedCategory] : [];
    }

    // Otherwise show all categories
    return categories;
  }, [categories, allEntries, searchQuery, selectedCategoryId]);

  // Count total documents
  const totalDocs = allEntries.length;

  return (
    <div className={`rounded-lg border border-border bg-card p-6 shadow-sm ${className}`}>
      {/* Header */}
      <h3 className="mb-4 text-lg font-semibold text-card-foreground">Documentation</h3>

      {/* Search Input */}
      <div className="mb-4 relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        />
      </div>

      {/* Category Filters */}
      {!searchQuery.trim() && (
        <div className="mb-4 flex flex-wrap gap-2">
          <CategoryBadge
            name="All"
            isActive={selectedCategoryId === null}
            count={totalDocs}
            onClick={() => handleCategorySelect(null)}
          />
          {categories.map((category) => (
            <CategoryBadge
              key={category.id}
              name={category.name}
              isActive={selectedCategoryId === category.id}
              count={category.entries.length}
              onClick={() => handleCategorySelect(category.id)}
            />
          ))}
        </div>
      )}

      {/* Documentation List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">No documentation available</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.id}>
              {/* Category Header (show if multiple categories or searching) */}
              {(filteredCategories.length > 1 || searchQuery.trim()) && (
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{category.name}</h4>
                  {category.description && (
                    <p className="text-xs text-muted-foreground/70">{category.description}</p>
                  )}
                </div>
              )}

              {/* Category Entries */}
              <div className="space-y-2">
                {category.entries.map((entry) => (
                  <DocItem
                    key={entry.id}
                    entry={entry}
                    isExpanded={expandedDocId === entry.id}
                    onToggle={() => handleDocExpand(entry.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer with count */}
      <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
        {searchQuery.trim() ? (
          <span>
            Found {filteredCategories[0]?.entries.length ?? 0} of {totalDocs} documents
          </span>
        ) : (
          <span>
            {totalDocs} document{totalDocs !== 1 ? 's' : ''} in {categories.length}{' '}
            categor{categories.length !== 1 ? 'ies' : 'y'}
          </span>
        )}
      </div>
    </div>
  );
}

export default DocsPanel;
