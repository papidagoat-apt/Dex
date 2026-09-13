import { DexScreenerPair } from '../types';
import { Star, Trash2, ExternalLink, MessageCircle } from 'lucide-react';
import { getTelegramLink, formatUsd } from '../api/dexscreener';

interface WatchlistItem {
  pairAddress: string;
  chainId: string;
  tokenSymbol: string;
  tokenName: string;
  addedAt: number;
}

interface WatchlistPanelProps {
  items: WatchlistItem[];
  onRemove: (pairAddress: string) => void;
  onClearAll: () => void;
  pairs: DexScreenerPair[];
  onSelectPair: (pair: DexScreenerPair) => void;
}

export default function WatchlistPanel({
  items,
  onRemove,
  onClearAll,
  pairs,
  onSelectPair,
}: WatchlistPanelProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Star size={36} className="mb-3 opacity-30" />
        <p className="text-sm">Watchlist is empty</p>
        <p className="text-xs mt-1 text-gray-600">
          Star tokens to track them here
        </p>
      </div>
    );
  }

  // Build a map of pair data for enrichment
  const pairMap = new Map<string, DexScreenerPair>();
  pairs.forEach((p) => pairMap.set(p.pairAddress, p));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">
          {items.length} token{items.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          <Trash2 size={12} />
          Clear All
        </button>
      </div>
      {items.map((item) => {
        const pair = pairMap.get(item.pairAddress);
        const telegram = pair ? getTelegramLink(pair) : null;
        const dexUrl = `https://dexscreener.com/${item.chainId}/${item.pairAddress}`;

        return (
          <div
            key={item.pairAddress}
            className="flex items-center gap-3 bg-gray-800/50 border border-gray-800 rounded-lg px-3 py-2.5 hover:bg-gray-800 transition-colors"
          >
            <button
              onClick={() => onRemove(item.pairAddress)}
              className="text-yellow-400 hover:text-yellow-300 transition-colors flex-shrink-0"
            >
              <Star size={14} fill="currentColor" />
            </button>
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => {
                if (pair) onSelectPair(pair);
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-200">
                  {item.tokenSymbol}
                </span>
                <span className="text-xs text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">
                  {item.chainId}
                </span>
              </div>
              <div className="text-xs text-gray-500 truncate">
                {item.tokenName}
              </div>
              {pair && (
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>Liq: {formatUsd(pair.liquidity?.usd)}</span>
                  <span>Vol: {formatUsd(pair.volume?.h24)}</span>
                  {pair.priceChange?.h24 !== undefined && (
                    <span
                      className={
                        pair.priceChange.h24 >= 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }
                    >
                      24h: {pair.priceChange.h24 >= 0 ? '+' : ''}
                      {pair.priceChange.h24.toFixed(2)}%
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {telegram && (
                <a
                  href={
                    telegram.url ||
                    `https://t.me/${telegram.handle.replace('@', '')}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  title={telegram.handle}
                >
                  <MessageCircle size={14} />
                </a>
              )}
              <a
                href={dexUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-emerald-400 transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
