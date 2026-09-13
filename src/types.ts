// DexScreener API types

export interface SocialLink {
  platform: string;
  handle: string;
  url?: string;
}

export interface Info {
  imageUrl?: string;
  websites?: { label?: string; url: string }[];
  socials?: SocialLink[];
}

export interface BaseToken {
  address: string;
  name: string;
  symbol: string;
}

export interface PriceChange {
  m5: number;
  h1: number;
  h6: number;
  h24: number;
}

export interface Volume {
  h24: number;
  h6: number;
  h1: number;
  m5: number;
}

export interface Txns {
  buys: number;
  sells: number;
}

export interface TxnsTimeframe {
  m5: Txns;
  h1: Txns;
  h6: Txns;
  h24: Txns;
}

export interface Liquidity {
  usd: number;
  base: number;
  quote: number;
}

export interface Boosts {
  active: number;
}

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: BaseToken;
  quoteToken: BaseToken;
  priceNative?: string;
  priceUsd?: string;
  txns?: TxnsTimeframe;
  volume?: Volume;
  priceChange?: PriceChange;
  liquidity?: Liquidity;
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: Info;
  boosts?: Boosts;
  url?: string;
  labels?: string[];
}

// Token profile from /token-profiles endpoints
export interface TokenProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  openGraph?: string;
  description?: string;
  links?: { type: string; label: string; url: string }[];
}

// App filter state
export interface FilterState {
  chains: string[];
  hasTelegram: boolean;
  hasTwitter: boolean;
  minLiquidity: number;
  maxLiquidity: number;
  minVolume24h: number;
  maxVolume24h: number;
  minMarketCap: number;
  maxMarketCap: number;
  pairAge: string; // '1h' | '6h' | '24h' | '7d' | 'all'
  minPriceChange24h: number;
  minTxnCount24h: number;
  minBoosts: number;
  excludeNoLiquidity: boolean;
  searchQuery: string;
}

export const DEFAULT_FILTERS: FilterState = {
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
  searchQuery: '',
};

export type SortColumn =
  | 'liquidity'
  | 'volume24h'
  | 'age'
  | 'priceChange24h'
  | 'marketCap'
  | 'txns24h'
  | 'name'
  | 'chain';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  column: SortColumn;
  direction: SortDirection;
}

export const CHAIN_OPTIONS = [
  { id: 'solana', label: 'Solana' },
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'bsc', label: 'BSC' },
  { id: 'base', label: 'Base' },
  { id: 'arbitrum', label: 'Arbitrum' },
  { id: 'optimism', label: 'Optimism' },
  { id: 'polygon', label: 'Polygon' },
  { id: 'avalanche', label: 'Avalanche' },
  { id: 'fantom', label: 'Fantom' },
  { id: 'linea', label: 'Linea' },
  { id: 'manta', label: 'Manta' },
];

export const PAIR_AGE_OPTIONS = [
  { id: '1h', label: 'Last 1h' },
  { id: '6h', label: 'Last 6h' },
  { id: '24h', label: 'Last 24h' },
  { id: '7d', label: 'Last 7d' },
  { id: 'all', label: 'All time' },
];
