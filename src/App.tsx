import { useState, useCallback, useMemo, useEffect } from 'react';
import { DexScreenerPair } from './types';
import { useTokens } from './hooks/useTokens';
import { useWatchlist } from './hooks/useWatchlist';
import { hasTelegram, hasTwitter, getTelegramLink, getTwitterLink } from './api/dexscreener';
import FilterPanel from './components/FilterPanel';
import TokenTable from './components/TokenTable';
import DetailModal from './components/DetailModal';
import WatchlistPanel from './components/WatchlistPanel';
import {
  RefreshCw,
  Download,
  Star,
  Search,
  Zap,
  Clock,
  ToggleLeft,
  ToggleRight,
  Activity,
  Radio,
  Loader2,
  AlertTriangle,
  Info,
} from 'lucide-react';

export default function App() {
  const {
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
    triggerSearch,
    allPairs,
  } = useTokens();

  const { items, toggleItem, isInWatchlist, removeItem, clearAll } = useWatchlist();
  const [selectedPair, setSelectedPair] = useState<DexScreenerPair | null>(null);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'watchlist'>('scan');
  const [showInfo, setShowInfo] = useState(true);

  const watchlistSet = useMemo(
    () => new Set(items.map((i) => i.pairAddress)),
    [items]
  );

  const handleToggleWatchlist = useCallback(
    (pair: DexScreenerPair) => {
      toggleItem(pair);
    },
    [toggleItem]
  );

  // CSV Export
  const exportCSV = useCallback(() => {
    const pairs = filteredPairs;
    const headers = [
      'Token Symbol',
      'Token Name',
      'Chain',
      'DEX',
      'Pair Address',
      'Price USD',
      'Liquidity USD',
      '24h Volume',
      '24h Price Change %',
      'Market Cap',
      'FDV',
      '24h Buys',
      '24h Sells',
      'Pair Age',
      'Has Telegram',
      'Telegram Handle',
      'Telegram URL',
      'Has Twitter',
      'Twitter Handle',
      'DexScreener URL',
    ];

    const rows = pairs.map((pair) => {
      const telegram = getTelegramLink(pair);
      const twitter = getTwitterLink(pair);
      const dexUrl = `https://dexscreener.com/${pair.chainId}/${pair.pairAddress}`;
      const age = pair.pairCreatedAt
        ? new Date(pair.pairCreatedAt).toISOString()
        : '';

      return [
        pair.baseToken.symbol,
        pair.baseToken.name,
        pair.chainId,
        pair.dexId,
        pair.pairAddress,
        pair.priceUsd ?? '',
        pair.liquidity?.usd ?? '',
        pair.volume?.h24 ?? '',
        pair.priceChange?.h24 ?? '',
        pair.marketCap ?? '',
        pair.fdv ?? '',
        pair.txns?.h24?.buys ?? '',
        pair.txns?.h24?.sells ?? '',
        age,
        hasTelegram(pair) ? 'Yes' : 'No',
        telegram?.handle ?? '',
        telegram?.url ?? '',
        hasTwitter(pair) ? 'Yes' : 'No',
        twitter?.handle ?? '',
        dexUrl,
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memecoin-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredPairs]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPair) {
        setSelectedPair(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedPair]);

  const timeSinceRefresh = useMemo(() => {
    const diff = Date.now() - lastRefresh.getTime();
    if (diff < 1000) return 'just now';
    if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
    return `${Math.floor(diff / 60_000)}m ago`;
  }, [lastRefresh]);

  // Update time since refresh display every second
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const telegramCount = filteredPairs.filter(hasTelegram).length;
  const totalResults = filteredPairs.length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Header */}
      <header className="bg-gray-900/80 border-b border-gray-800 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Zap size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-gray-100 leading-tight">
                    DexFinder
                  </h1>
                  <p className="text-[10px] text-gray-500 leading-tight">
                    Memecoin + Telegram Scanner
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Scan mode toggle */}
              <div className="flex bg-gray-800 rounded-lg p-0.5 border border-gray-700">
                <button
                  onClick={() => setScanMode('latest')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    scanMode === 'latest'
                      ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Radio size={12} />
                    Latest
                  </span>
                </button>
                <button
                  onClick={() => setScanMode('search')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    scanMode === 'search'
                      ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Search size={12} />
                    Search
                  </span>
                </button>
              </div>

              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  autoRefresh
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                }`}
              >
                {autoRefresh ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                Auto
                {autoRefresh && (
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-inherit border-none text-xs cursor-pointer appearance-none"
                  >
                    <option value={30}>30s</option>
                    <option value={60}>60s</option>
                    <option value={120}>2m</option>
                  </select>
                )}
              </button>

              {/* Manual refresh */}
              <button
                onClick={() => fetchTokens()}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={loading ? 'animate-spin' : ''}
                />
                <span className="hidden sm:inline">{loading ? 'Scanning...' : 'Refresh'}</span>
              </button>

              {/* CSV Export */}
              <button
                onClick={exportCSV}
                disabled={filteredPairs.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600 transition-colors disabled:opacity-50"
              >
                <Download size={14} />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* Info banner */}
        {showInfo && (
          <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm">
            <Info size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-emerald-300 font-medium">Community Management Lead Sourcing Tool</p>
              <p className="text-gray-400 text-xs mt-1">
                Find newly launched memecoin projects with active Telegram communities. 
                Use filters to narrow results — the "Has Telegram" filter is on by default. 
                Switch between <strong className="text-gray-300">Latest</strong> mode (newest token profiles) and <strong className="text-gray-300">Search</strong> mode (keyword search). 
                Export filtered results as CSV for your outreach lead list.
              </p>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
            >
              ×
            </button>
          </div>
        )}

        {/* Filter panel */}
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          collapsed={filterCollapsed}
          setCollapsed={setFilterCollapsed}
          onSearch={triggerSearch}
        />

        {/* Stats bar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex bg-gray-900 rounded-lg p-0.5 border border-gray-800">
              <button
                onClick={() => setActiveTab('scan')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'scan'
                    ? 'bg-gray-800 text-gray-200 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Activity size={14} />
                  Scan Results
                  <span className="text-xs text-gray-500">
                    ({totalResults})
                  </span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('watchlist')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'watchlist'
                    ? 'bg-gray-800 text-gray-200 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Star size={14} />
                  Watchlist
                  <span className="text-xs text-gray-500">
                    ({items.length})
                  </span>
                </span>
              </button>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                {telegramCount} with Telegram
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                Updated {timeSinceRefresh}
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 px-3 py-1.5 rounded-lg">
              <AlertTriangle size={12} />
              {error.includes('Failed to fetch') || error.includes('NetworkError')
                ? 'CORS/Network error — try refreshing or check your connection'
                : error}
            </div>
          )}
        </div>

        {/* Loading indicator */}
        {loading && activeTab === 'scan' && (
          <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 px-4 py-2.5 rounded-lg">
            <Loader2 size={16} className="animate-spin" />
            {scanMode === 'latest'
              ? 'Fetching latest token profiles and pair data...'
              : 'Searching for matching tokens...'}
          </div>
        )}

        {/* Main content */}
        {activeTab === 'scan' ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            <TokenTable
              pairs={filteredPairs}
              sort={sort}
              toggleSort={toggleSort}
              watchlist={watchlistSet}
              onToggleWatchlist={handleToggleWatchlist}
              onSelectPair={setSelectedPair}
            />
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <WatchlistPanel
              items={items}
              onRemove={removeItem}
              onClearAll={clearAll}
              pairs={allPairs}
              onSelectPair={setSelectedPair}
            />
          </div>
        )}

        {/* Results summary footer */}
        {activeTab === 'scan' && filteredPairs.length > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800/50 pt-3">
            <span>
              Showing {filteredPairs.length} of {allPairs.length} pairs
              {telegramCount > 0 && ` — ${telegramCount} with Telegram`}
            </span>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Download size={12} />
              Export as CSV
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-gray-600 pt-6 pb-4 border-t border-gray-800/30">
          <p>
            Data from{' '}
            <a
              href="https://dexscreener.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-400 underline"
            >
              DexScreener
            </a>{' '}
            • Free API, no key required •{' '}
            <span className="text-gray-500">For community management lead sourcing only</span>
          </p>
        </footer>
      </main>

      {/* Detail modal */}
      {selectedPair && (
        <DetailModal
          pair={selectedPair}
          onClose={() => setSelectedPair(null)}
          isWatched={isInWatchlist(selectedPair.pairAddress)}
          onToggleWatchlist={handleToggleWatchlist}
        />
      )}
    </div>
  );
}
