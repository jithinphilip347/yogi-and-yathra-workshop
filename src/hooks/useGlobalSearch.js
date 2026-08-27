import { useQuery } from "@tanstack/react-query";
import searchApi from "@/services/searchApi";

/**
 * TanStack Query hook for the Global Search API.
 *
 * Query lifecycle:
 *   raw query → trim → useDebounce(350ms) → useGlobalSearch → TanStack Query → searchApi → GET /api/v1/search
 *
 * The query is disabled when the debounced query is empty/whitespace.
 * TanStack Query handles caching, deduplication, and stale-request safety.
 *
 * @param {string} query - The debounced search query.
 * @param {Object} [options]
 * @param {number} [options.page=1] - Page number.
 * @param {number} [options.perPage=20] - Results per page.
 * @returns {{ data, isLoading, isFetching, isError, error }}
 */
export default function useGlobalSearch(query, { page = 1, perPage = 20 } = {}) {
  const trimmedQuery = query?.trim() ?? "";
  const isEnabled = trimmedQuery.length > 0;

  return useQuery({
    queryKey: ["global-search", trimmedQuery, page, perPage],
    queryFn: () =>
      searchApi.search({ q: trimmedQuery, page, per_page: perPage }).then((res) => res.data),
    enabled: isEnabled,
    staleTime: 30_000, // 30s — search results are relatively stable
    retry: 1, // One retry on failure, then show error
    refetchOnWindowFocus: false,
  });
}
