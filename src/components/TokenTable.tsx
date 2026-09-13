import { DexScreenerPair, SortConfig, SortColumn } from '../types';
import {
  getTelegramLink,
  getTwitterLink,
  getPairAge,
  formatAge,
  formatUsd,
  formatPercent,
} from '../api/dexscreener';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { useState } from 'react';

interface TokenTableProps {
  pairs: DexScreenerPair[];
  sort: SortConfig;
  toggleSort: (column: SortColumn) => void;
  watchlist: Set<string>;
  onToggleWatchlist: (pair: DexScreenerPair) => void;
  onSelectPair: (pair: DexScreenerPair) => void;
}

function SortIcon({ column, sort }: { column: SortColumn; sort: SortConfig }) {
  if (sort.column !== column) return <ArrowUpDown size={12} className="text-gray-500" />;
  return sort.direction === 'asc' ? (
    <ArrowUp size={12} className="text-emerald-400" />
  ) : (
    <ArrowDown size={12} className="text-emerald-400" />
  );
}

const CHAIN_COLORS: Record<string, string> = {
  solana: 'bg-purple-500/20 text-purple-400',
  ethereum: 'bg-blue-500/20 text-blue-400',
  bsc: 'bg-yellow-500/20 text-yellow-400',
  base: 'bg-blue-500/20 text-blue-400',
  arbitrum: 'bg-cyan-500/20 text-cyan-400',
  optimism: 'bg-red-500/20 text-red-400',
  polygon: 'bg-violet-500/20 text-violet-400',
  avalanche: 'bg-red-500/20 text-red-400',
  fantom: 'bg-indigo-500/20 text-indigo-400',
  linea: 'bg-sky-500/20 text-sky-400',
  manta: 'bg-teal-500/20 text-teal-400',
};

export default function TokenTable({
  pairs,
  sort,
  toggleSort,
  watchlist,
  onToggleWatchlist,
  onSelectPair,
}: TokenTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  if (pairs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <MessageCircle size={48} className="mb-4 opacity-30" />
        <p className="text-lg font-medium">No tokens found</p>
        <p className="text-sm mt-1">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-2 py-3 text-left w-8"></th>
            <th
              className="px-3 py-3 text-left cursor-pointer hover:text-gray-200 transition-colors"
              onClick={() => toggleSort('name')}
            >
              <div className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Token <SortIcon column="name" sort={sort} />
              </div>
            </th>
            <th
              className="px-3 py-3 text-left cursor-pointer hover:text-gray-200 transition-colors"
              onClick={() => toggleSort('chain')}
            >
              <div className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Chain <SortIcon column="chain" sort={sort} />
              </div>
            </th>
            <th
              className="px-3 py-3 text-right cursor-pointer hover:text-gray-200 transition-colors"
              onClick={() => toggleSort('age')}
            >
              <div className="flex items-center justify-end gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Age <SortIcon column="age" sort={sort} />
              </div>
            </th>
            <th
              className="px-3 py-3 text-right cursor-pointer hover:text-gray-200 transition-colors"
              onClick={() => toggleSort('liquidity')}
            >
              <div className="flex items-center justify-end gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Liquidity <SortIcon column="liquidity" sort={sort} />
              </div>
            </th>
            <th
              className="px-3 py-3 text-right cursor-pointer hover:text-gray-200 transition-colors"
              onClick={() => toggleSort('volume24h')}
            >
              <div className="flex items-center justify-end gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                24h Vol <SortIcon column="volume24h" sort={sort} />
              </div>
            </th>
            <th
              className="px-3 py-3 text-right cursor-pointer hover:text-gray-200 transition-colors"
              onClick={() => toggleSort('priceChange24h')}
            >
              <div className="flex items-center justify-end gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                24h Δ <SortIcon column="priceChange24h" sort={sort} />
              </div>
            </th>
            <th
              className="px-3 py-3 text-right cursor-pointer hover:text-gray-200 transition-colors"
              onClick={() => toggleSort('marketCap')}
            >
              <div className="flex items-center justify-end gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                MCap <SortIcon column="marketCap" sort={sort} />
              </div>
            </th>
            <th
              className="px-3 py-3 text-right cursor-pointer hover:text-gray-200 transition-colors"
              onClick={() => toggleSort('txns24h')}
            >
              <div className="flex items-center justify-end gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                24h Txns <SortIcon column="txns24h" sort={sort} />
              </div>
            </th>
            <th className="px-3 py-3 text-center">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Socials
              </div>
            </th>
            <th className="px-3 py-3 text-center w-8"></th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair) => {
            const age = getPairAge(pair);
            const priceChange24 = pair.priceChange?.h24;
            const telegram = getTelegramLink(pair);
            const twitter = getTwitterLink(pair);
            const dexUrl = `https://dexscreener.com/${pair.chainId}/${pair.pairAddress}`;
            const isWatched = watchlist.has(pair.pairAddress);
            const isHovered = hoveredRow === pair.pairAddress;

            return (
              <tr
                key={pair.pairAddress}
                className={`border-b border-gray-800/50 transition-colors cursor-pointer ${
                  isHovered ? 'bg-gray-800/60' : 'hover:bg-gray-800/30'
                }`}
                onMouseEnter={() => setHoveredRow(pair.pairAddress)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onSelectPair(pair)}
              >
                {/* Watchlist star */}
                <td className="px-2 py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchlist(pair);
                    }}
                    className={`transition-colors ${
                      isWatched ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'
                    }`}
                  >
                    <Star size={14} fill={isWatched ? 'currentColor' : 'none'} />
                  </button>
                </td>

                {/* Token name/symbol */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {pair.info?.imageUrl && (
                      <img
                        src={pair.info.imageUrl}
                        alt=""
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <div className="font-medium text-gray-200 truncate max-w-[140px]">
                        {pair.baseToken.symbol}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[140px]">
                        {pair.baseToken.name}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Chain */}
                <td className="px-3 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      CHAIN_COLORS[pair.chainId] || 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {pair.chainId}
                  </span>
                </td>

                {/* Age */}
                <td className="px-3 py-3 text-right text-gray-300">
                  {age !== null ? formatAge(age) : '—'}
                </td>

                {/* Liquidity */}
                <td className="px-3 py-3 text-right text-gray-300">
                  {formatUsd(pair.liquidity?.usd)}
                </td>

                {/* 24h Volume */}
                <td className="px-3 py-3 text-right text-gray-300">
                  {formatUsd(pair.volume?.h24)}
                </td>

                {/* 24h Price Change */}
                <td className="px-3 py-3 text-right">
                  <span
                    className={
                      priceChange24 !== undefined && priceChange24 !== null
                        ? priceChange24 >= 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                        : 'text-gray-500'
                    }
                  >
                    {formatPercent(priceChange24)}
                  </span>
                </td>

                {/* Market Cap */}
                <td className="px-3 py-3 text-right text-gray-300">
                  {formatUsd(pair.marketCap ?? pair.fdv)}
                </td>

                {/* 24h Txns */}
                <td className="px-3 py-3 text-right text-gray-300">
                  {(() => {
                    const buys = pair.txns?.h24?.buys ?? 0;
                    const sells = pair.txns?.h24?.sells ?? 0;
                    const total = buys + sells;
                    return total > 0 ? total.toLocaleString() : '—';
                  })()}
                </td>

                {/* Socials */}
                <td className="px-3 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {telegram && (
                      <a
                        href={
                          telegram.url ||
                          `https://t.me/${telegram.handle.replace('@', '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title={telegram.handle}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.132.001-.236-.138-.165-3.617 1.828-7.595 3.837-11.172 5.634-.266.106-.282.354-.02.448l2.526.832.077.024 1.896-1.536c.136-.11.29-.052.166.066l-3.428 3.28c-.12.116-.088.292.058.372l1.722.966c.16.09.378.024.446-.142l1.968-4.82c.066-.162.238-.242.398-.14l4.038 2.62c.2.13.412.042.49-.188.228-.732.612-2.012.816-2.704.066-.222-.042-.358-.142-.228z" />
                        </svg>
                      </a>
                    )}
                    {twitter && (
                      <a
                        href={
                          twitter.url ||
                          `https://x.com/${twitter.handle.replace('@', '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                        title={twitter.handle}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </td>

                {/* DexScreener link */}
                <td className="px-3 py-3">
                  <a
                    href={dexUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-500 hover:text-emerald-400 transition-colors"
                    title="View on DexScreener"
                  >
                    <ExternalLink size={14} />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
