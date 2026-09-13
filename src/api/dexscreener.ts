import { DexScreenerPair, TokenProfile, SocialLink } from '../types';

const BASE_URL = 'https://api.dexscreener.com';

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 30_000; // 30 seconds

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Rate limiter
class RateLimiter {
  private timestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);

    if (this.timestamps.length >= this.maxRequests) {
      const oldest = this.timestamps[0];
      const waitTime = this.windowMs - (now - oldest) + 100;
      console.warn(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.wait();
    }

    this.timestamps.push(now);
  }
}

const standardLimiter = new RateLimiter(250, 60_000); // ~250 req/min for standard endpoints
const profileLimiter = new RateLimiter(50, 60_000); // ~50 req/min for profile endpoints

// Generic fetch with rate limiting and error handling
async function fetchWithRateLimit<T>(
  url: string,
  limiter: RateLimiter,
  cacheKey?: string
): Promise<T> {
  if (cacheKey) {
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;
  }

  await limiter.wait();

  try {
    const response = await fetch(url);

    if (response.status === 429) {
      console.warn('Got 429, backing off for 5s');
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return fetchWithRateLimit<T>(url, limiter, cacheKey);
    }

    if (!response.ok) {
      console.error(`API error: ${response.status} for ${url}`);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (cacheKey) {
      setCache(cacheKey, data);
    }

    return data as T;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
}

// API endpoints

export async function searchPairs(query: string): Promise<DexScreenerPair[]> {
  if (!query.trim()) return [];
  const url = `${BASE_URL}/latest/dex/search?q=${encodeURIComponent(query)}`;
  const cacheKey = `search:${query}`;
  const result = await fetchWithRateLimit<{ pairs: DexScreenerPair[] }>(
    url,
    standardLimiter,
    cacheKey
  );
  return result.pairs || [];
}

export async function getTokenPairs(
  tokenAddress: string
): Promise<DexScreenerPair[]> {
  const url = `${BASE_URL}/latest/dex/tokens/${tokenAddress}`;
  const cacheKey = `tokens:${tokenAddress}`;
  const result = await fetchWithRateLimit<{ pairs: DexScreenerPair[] }>(
    url,
    standardLimiter,
    cacheKey
  );
  return result.pairs || [];
}

export async function getPairByAddress(
  chainId: string,
  pairAddress: string
): Promise<DexScreenerPair | null> {
  const url = `${BASE_URL}/latest/dex/pairs/${chainId}/${pairAddress}`;
  const cacheKey = `pair:${chainId}:${pairAddress}`;
  const result = await fetchWithRateLimit<{ pairs: DexScreenerPair[] }>(
    url,
    standardLimiter,
    cacheKey
  );
  return result.pairs?.[0] || null;
}

export async function getLatestTokenProfiles(): Promise<TokenProfile[]> {
  const url = `${BASE_URL}/token-profiles/latest/v1`;
  const cacheKey = 'profiles:latest';
  const result = await fetchWithRateLimit<TokenProfile[]>(
    url,
    profileLimiter,
    cacheKey
  );
  return result || [];
}

export async function getRecentTokenUpdates(): Promise<TokenProfile[]> {
  const url = `${BASE_URL}/token-profiles/recent-updates/v1`;
  const cacheKey = 'profiles:recent';
  const result = await fetchWithRateLimit<TokenProfile[]>(
    url,
    profileLimiter,
    cacheKey
  );
  return result || [];
}

// Utility: check if a pair has a Telegram link
export function hasTelegram(pair: DexScreenerPair): boolean {
  return (
    pair.info?.socials?.some((s) => s.platform === 'telegram') ?? false
  );
}

// Utility: check if a pair has a Twitter link
export function hasTwitter(pair: DexScreenerPair): boolean {
  return (
    pair.info?.socials?.some(
      (s) => s.platform === 'twitter' || s.platform === 'x'
    ) ?? false
  );
}

// Utility: get Telegram link from pair
export function getTelegramLink(pair: DexScreenerPair): SocialLink | null {
  return pair.info?.socials?.find((s) => s.platform === 'telegram') || null;
}

// Utility: get Twitter link from pair
export function getTwitterLink(pair: DexScreenerPair): SocialLink | null {
  return (
    pair.info?.socials?.find(
      (s) => s.platform === 'twitter' || s.platform === 'x'
    ) || null
  );
}

// Utility: get pair age in ms
export function getPairAge(pair: DexScreenerPair): number | null {
  if (!pair.pairCreatedAt) return null;
  return Date.now() - pair.pairCreatedAt;
}

// Utility: format age as human-readable string
export function formatAge(ageMs: number): string {
  if (ageMs < 60_000) return `${Math.floor(ageMs / 1000)}s`;
  if (ageMs < 3_600_000) return `${Math.floor(ageMs / 60_000)}m`;
  if (ageMs < 86_400_000) return `${Math.floor(ageMs / 3_600_000)}h`;
  return `${Math.floor(ageMs / 86_400_000)}d`;
}

// Utility: format USD value
export function formatUsd(value: number | undefined | null): string {
  if (value === undefined || value === null || value === 0) return '—';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

// Utility: format percentage
export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}
