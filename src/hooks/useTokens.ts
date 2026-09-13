import { useState, useEffect, useCallback, useRef } from 'react';
import { DexScreenerPair, FilterState, SortConfig, DEFAULT_FILTERS } from '../types';
import {
  searchPairs,
  getLatestTokenProfiles,
  getRecentTokenUpdates,
  getTokenPairs,
  hasTelegram,
  hasTwitter,
  getPairAge,
} from '../api/dexscreener';

// Popular memecoin search terms for scanning
const SCAN_QUERIES = [
  'pepe', 'dog', 'cat', 'inu', 'frog', 'moon', 'wojak', 'shib',
  'bonk', 'floki', 'meme', 'pump', 'base', 'sol', 'degen',
];

function getAgeMs(ageId: string): number {
  switch (ageId) {
    case '1h': return 3_600_000;
    case '6h': return 21_600_000;
    case '24h': return 86_400_000;
    case '7d': return 604_800_000;
    default: return Infinity;
  }
}

export function applyFilters(
  pairs: DexScreenerPair[],
  filters: FilterState
): DexScreenerPair[] {
  return pairs.filter((pair) => {
    // Chain filter
    if (filters.chains.length > 0 && !filters.chains.includes(pair.chainId)) {
      return false;
    }

    // Telegram filter
    if (filters.hasTelegram && !hasTelegram(pair)) return false;

    // Twitter filter
    if (filters.hasTwitter && !hasTwitter(pair)) return false;

    // Liquidity filter
    const liq = pair.liquidity?.usd ?? 0;
    if (filters.minLiquidity > 0 && liq < filters.minLiquidity) return false;
    if (filters.maxLiquidity > 0 && liq > filters.maxLiquidity) return false;

    // Volume filter
    const vol = pair.volume?.h24 ?? 0;
    if (filters.minVolume24h > 0 && vol < filters.minVolume24h) return false;
    if (filters.maxVolume24h > 0 && vol > filters.maxVolume24h) return false;

    // Market cap filter
    const mcap = pair.marketCap ?? pair.fdv ?? 0;
    if (filters.minMarketCap > 0 && mcap < filters.minMarketCap) return false;
    if (filters.maxMarketCap > 0 && mcap > filters.maxMarketCap) return false;

    // Pair age filter
    if (filters.pairAge !== 'all') {
      const age = getPairAge(pair);
      if (age === null) return false;
      if (age > getAgeMs(filters.pairAge)) return false;
    }

    // Price change filter
    const priceChange = pair.priceChange?.h24 ?? 0;
    if (filters.minPriceChange24h > 0 && priceChange < filters.minPriceChange24h) return false;

    // Transaction count filter
    const buys = pair.txns?.h24?.buys ?? 0;
    const sells = pair.txns?.h24?.sells ?? 0;
    if (filters.minTxnCount24h > 0 && (buys + sells) < filters.minTxnCount24h) return false;

    // Boosts filter
    if (filters.minBoosts > 0 && (pair.boosts?.active ?? 0) < filters.minBoosts) return false;

    // Exclude no liquidity
    if (filters.excludeNoLiquidity && (!pair.liquidity?.usd || pair.liquidity.usd < 100)) {
      return false;
    }

    return true;
  });
}

export function sortPairs(
  pairs: DexScreenerPair[],
  sort: SortConfig
): DexScreenerPair[] {
  return [...pairs].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sort.column) {
      case 'liquidity':
        aVal = a.liquidity?.usd ?? 0;
        bVal = b.liquidity?.usd ?? 0;
        break;
      case 'volume24h':
        aVal = a.volume?.h24 ?? 0;
        bVal = b.volume?.h24 ?? 0;
        break;
      case 'age':
        aVal = a.pairCreatedAt ?? 0;
        bVal = b.pairCreatedAt ?? 0;
        break;
      case 'priceChange24h':
        aVal = a.priceChange?.h24 ?? 0;
        bVal = b.priceChange?.h24 ?? 0;
        break;
      case 'marketCap':
        aVal = a.marketCap ?? a.fdv ?? 0;
        bVal = b.marketCap ?? b.fdv ?? 0;
        break;
      case 'txns24h':
        aVal = (a.txns?.h24?.buys ?? 0) + (a.txns?.h24?.sells ?? 0);
        bVal = (b.txns?.h24?.buys ?? 0) + (b.txns?.h24?.sells ?? 0);
        break;
      case 'name':
        aVal = a.baseToken.symbol.toLowerCase();
        bVal = b.baseToken.symbol.toLowerCase();
        break;
      case 'chain':
        aVal = a.chainId;
        bVal = b.chainId;
        break;
    }

    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function useTokens() {
  const [allPairs, setAllPairs] = useState<DexScreenerPair[]>([]);
  const [filteredPairs, setFilteredPairs] = useState<DexScreenerPair[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortConfig>({
    column: 'volume24h',
    direction: 'desc',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(60);
  const [scanMode, setScanMode] = useState<'search' | 'latest'>('latest');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const abortRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch tokens based on mode
  const fetchTokens = useCallback(async () => {
    if (abortRef.current) return;
    setLoading(true);
    setError(null);

    try {
      let pairs: DexScreenerPair[] = [];

      if (scanMode === 'search' && filters.searchQuery.trim()) {
        // Search mode: use the search endpoint
        pairs = await searchPairs(filters.searchQuery.trim());
      } else if (scanMode === 'latest') {
        // Latest mode: combine token profiles + recent updates
        const [profiles, recentUpdates] = await Promise.allSettled([
          getLatestTokenProfiles(),
          getRecentTokenUpdates(),
        ]);

        const allProfiles = [
          ...(profiles.status === 'fulfilled' ? profiles.value : []),
          ...(recentUpdates.status === 'fulfilled' ? recentUpdates.value : []),
        ];

        // Deduplicate by token address + chain
        const seen = new Set<string>();
        const uniqueProfiles = allProfiles.filter((p) => {
          const key = `${p.chainId}:${p.tokenAddress}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Fetch pairs for top profiles (limit to avoid rate limits)
        const topProfiles = uniqueProfiles.slice(0, 20);
        const pairPromises = topProfiles.map((profile) =>
          getTokenPairs(profile.tokenAddress).catch(() => [] as DexScreenerPair[])
        );

        const pairResults = await Promise.allSettled(pairPromises);
        for (const result of pairResults) {
          if (result.status === 'fulfilled') {
            pairs.push(...result.value);
          }
        }
      } else if (scanMode === 'search') {
        // No search query - scan with popular terms
        const queries = SCAN_QUERIES.slice(0, 5);
        const searchPromises = queries.map((q) =>
          searchPairs(q).catch(() => [] as DexScreenerPair[])
        );
        const results = await Promise.allSettled(searchPromises);
        for (const result of results) {
          if (result.status === 'fulfilled') {
            pairs.push(...result.value);
          }
        }
      }

      // Deduplicate by pair address
      const seen = new Set<string>();
      const uniquePairs = pairs.filter((p) => {
        if (seen.has(p.pairAddress)) return false;
        seen.add(p.pairAddress);
        return true;
      });

      setAllPairs(uniquePairs);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  }, [scanMode, filters.searchQuery]);

  // Debounced search trigger - fetch when searchTrigger changes or scanMode changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // For search mode with a query, debounce
    if (scanMode === 'search' && filters.searchQuery.trim()) {
      debounceRef.current = setTimeout(() => {
        fetchTokens();
      }, 500);
    } else {
      // For latest mode or empty search, fetch immediately
      fetchTokens();
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [scanMode, filters.searchQuery, searchTrigger]);

  // Apply filters and sort whenever they change
  useEffect(() => {
    const filtered = applyFilters(allPairs, filters);
    const sorted = sortPairs(filtered, sort);
    setFilteredPairs(sorted);
  }, [allPairs, filters, sort]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchTokens();
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchTokens]);

  const toggleSort = useCallback(
    (column: SortConfig['column']) => {
      setSort((prev) => ({
        column,
        direction:
          prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc',
      }));
    },
    []
  );

  return {
    allPairs,
    filteredPairs,
    filters,
    setFilters,
    sort,
    toggleSort,
    loading,
    error,
    lastRefresh,
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    scanMode,
    setScanMode,
    fetchTokens,
    triggerSearch: () => setSearchTrigger((t) => t + 1),
  };
}
