import { useState, useCallback, useEffect } from 'react';
import { DexScreenerPair } from '../types';

const STORAGE_KEY = 'dexscreener-watchlist';

interface WatchlistItem {
  pairAddress: string;
  chainId: string;
  tokenSymbol: string;
  tokenName: string;
  addedAt: number;
}

function loadWatchlist(): WatchlistItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(items: WatchlistItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>(loadWatchlist);

  useEffect(() => {
    saveWatchlist(items);
  }, [items]);

  const addItem = useCallback((pair: DexScreenerPair) => {
    setItems((prev) => {
      if (prev.some((i) => i.pairAddress === pair.pairAddress)) return prev;
      return [
        ...prev,
        {
          pairAddress: pair.pairAddress,
          chainId: pair.chainId,
          tokenSymbol: pair.baseToken.symbol,
          tokenName: pair.baseToken.name,
          addedAt: Date.now(),
        },
      ];
    });
  }, []);

  const removeItem = useCallback((pairAddress: string) => {
    setItems((prev) => prev.filter((i) => i.pairAddress !== pairAddress));
  }, []);

  const isInWatchlist = useCallback(
    (pairAddress: string) => {
      return items.some((i) => i.pairAddress === pairAddress);
    },
    [items]
  );

  const toggleItem = useCallback(
    (pair: DexScreenerPair) => {
      if (isInWatchlist(pair.pairAddress)) {
        removeItem(pair.pairAddress);
      } else {
        addItem(pair);
      }
    },
    [isInWatchlist, removeItem, addItem]
  );

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    addItem,
    removeItem,
    isInWatchlist,
    toggleItem,
    clearAll,
  };
}
