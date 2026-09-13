import { FilterState, CHAIN_OPTIONS, PAIR_AGE_OPTIONS } from '../types';
import { Search, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { useState, KeyboardEvent } from 'react';

interface FilterPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  onSearch?: () => void;
}

export default function FilterPanel({
  filters,
  setFilters,
  collapsed,
  setCollapsed,
  onSearch,
}: FilterPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (partial: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const toggleChain = (chainId: string) => {
    setFilters((prev) => ({
      ...prev,
      chains: prev.chains.includes(chainId)
        ? prev.chains.filter((c) => c !== chainId)
        : [...prev.chains, chainId],
    }));
  };

  const resetFilters = () => {
    setFilters({
      chains: [],
      hasTelegram: true,
      hasTwitter: false,
      minLiquidity: 0,
      maxLiquidity: 0,
      minVolume24h: 0,
      maxVolume24h: 0,
      minMarketCap: 0,
      maxMarketCap: 0,
      pairAge: 'all',
      minPriceChange24h: 0,
      minTxnCount24h: 0,
      minBoosts: 0,
      excludeNoLiquidity: true,
      searchQuery: filters.searchQuery,
    });
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors border border-gray-700"
      >
        <SlidersHorizontal size={16} />
        Filters
        {filters.chains.length > 0 && (
          <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-xs">
            {filters.chains.length}
          </span>
        )}
        {filters.hasTelegram && (
          <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-xs">
            TG
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
          <SlidersHorizontal size={16} />
          Filters
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            <RotateCcw size={12} />
            Reset
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Search query */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Search Query <span className="text-gray-600">(press Enter to search)</span>
        </label>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => update({ searchQuery: e.target.value })}
            onKeyDown={handleSearchKeyDown}
            placeholder="Token name, symbol, or address..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Chain selector */}
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Chains</label>
        <div className="flex flex-wrap gap-1.5">
          {CHAIN_OPTIONS.map((chain) => (
            <button
              key={chain.id}
              onClick={() => toggleChain(chain.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filters.chains.includes(chain.id)
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
              }`}
            >
              {chain.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles row */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasTelegram}
            onChange={(e) => update({ hasTelegram: e.target.checked })}
            className="rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500/50 w-4 h-4"
          />
          <span className="text-xs text-gray-300">Has Telegram</span>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-blue-400">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.132.001-.236-.138-.165-3.617 1.828-7.595 3.837-11.172 5.634-.266.106-.282.354-.02.448l2.526.832.077.024 1.896-1.536c.136-.11.29-.052.166.066l-3.428 3.28c-.12.116-.088.292.058.372l1.722.966c.16.09.378.024.446-.142l1.968-4.82c.066-.162.238-.242.398-.14l4.038 2.62c.2.13.412.042.49-.188.228-.732.612-2.012.816-2.704.066-.222-.042-.358-.142-.228z" />
          </svg>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasTwitter}
            onChange={(e) => update({ hasTwitter: e.target.checked })}
            className="rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500/50 w-4 h-4"
          />
          <span className="text-xs text-gray-300">Has X/Twitter</span>
          <span className="text-gray-400 text-xs">𝕏</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.excludeNoLiquidity}
            onChange={(e) => update({ excludeNoLiquidity: e.target.checked })}
            className="rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500/50 w-4 h-4"
          />
          <span className="text-xs text-gray-300">Rug Filter (min $100 liq)</span>
        </label>
      </div>

      {/* Pair age */}
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Pair Age</label>
        <div className="flex flex-wrap gap-1.5">
          {PAIR_AGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => update({ pairAge: opt.id })}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filters.pairAge === opt.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Numeric filters row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Min Liquidity ($)</label>
          <input
            type="number"
            value={filters.minLiquidity || ''}
            onChange={(e) => update({ minLiquidity: Number(e.target.value) || 0 })}
            placeholder="0"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Max Liquidity ($)</label>
          <input
            type="number"
            value={filters.maxLiquidity || ''}
            onChange={(e) => update({ maxLiquidity: Number(e.target.value) || 0 })}
            placeholder="∞"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Min 24h Vol ($)</label>
          <input
            type="number"
            value={filters.minVolume24h || ''}
            onChange={(e) => update({ minVolume24h: Number(e.target.value) || 0 })}
            placeholder="0"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Min Market Cap ($)</label>
          <input
            type="number"
            value={filters.minMarketCap || ''}
            onChange={(e) => update({ minMarketCap: Number(e.target.value) || 0 })}
            placeholder="0"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
      >
        {showAdvanced ? '▲ Hide Advanced' : '▼ Show Advanced'}
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-800">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Min 24h Price Change %</label>
            <input
              type="number"
              value={filters.minPriceChange24h || ''}
              onChange={(e) => update({ minPriceChange24h: Number(e.target.value) || 0 })}
              placeholder="0"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Min 24h Txns</label>
            <input
              type="number"
              value={filters.minTxnCount24h || ''}
              onChange={(e) => update({ minTxnCount24h: Number(e.target.value) || 0 })}
              placeholder="0"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Min Active Boosts</label>
            <input
              type="number"
              value={filters.minBoosts || ''}
              onChange={(e) => update({ minBoosts: Number(e.target.value) || 0 })}
              placeholder="0"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Max 24h Vol ($)</label>
            <input
              type="number"
              value={filters.maxVolume24h || ''}
              onChange={(e) => update({ maxVolume24h: Number(e.target.value) || 0 })}
              placeholder="∞"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Max Market Cap ($)</label>
            <input
              type="number"
              value={filters.maxMarketCap || ''}
              onChange={(e) => update({ maxMarketCap: Number(e.target.value) || 0 })}
              placeholder="∞"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>
      )}
    </div>
  );
}
