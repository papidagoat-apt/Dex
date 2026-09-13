import { DexScreenerPair } from '../types';
import {
  getTelegramLink,
  getTwitterLink,
  getPairAge,
  formatAge,
  formatUsd,
  formatPercent,
} from '../api/dexscreener';
import { X, ExternalLink, Star, Globe } from 'lucide-react';

interface DetailModalProps {
  pair: DexScreenerPair;
  onClose: () => void;
  isWatched: boolean;
  onToggleWatchlist: (pair: DexScreenerPair) => void;
}

export default function DetailModal({
  pair,
  onClose,
  isWatched,
  onToggleWatchlist,
}: DetailModalProps) {
  const age = getPairAge(pair);
  const telegram = getTelegramLink(pair);
  const twitter = getTwitterLink(pair);
  const dexUrl = `https://dexscreener.com/${pair.chainId}/${pair.pairAddress}`;
  const chartUrl = `https://dexscreener.com/${pair.chainId}/${pair.pairAddress}?maker=`;

  const allSocials = pair.info?.socials || [];
  const allWebsites = pair.info?.websites || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {pair.info?.imageUrl && (
              <img
                src={pair.info.imageUrl}
                alt=""
                className="w-10 h-10 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-100">
                {pair.baseToken.symbol}
              </h2>
              <p className="text-sm text-gray-400">{pair.baseToken.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleWatchlist(pair)}
              className={`p-2 rounded-lg transition-colors ${
                isWatched
                  ? 'text-yellow-400 bg-yellow-400/10'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Star size={18} fill={isWatched ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Chart embed */}
          <div className="rounded-xl overflow-hidden border border-gray-800 bg-gray-800/50">
            <iframe
              src={`https://dexscreener.com/${pair.chainId}/${pair.pairAddress}?embed=1&theme=dark`}
              title={`${pair.baseToken.symbol} Chart`}
              className="w-full"
              style={{ height: '300px', border: 'none' }}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Price" value={pair.priceUsd ? `$${Number(pair.priceUsd).toFixed(6)}` : '—'} />
            <StatCard label="Liquidity" value={formatUsd(pair.liquidity?.usd)} />
            <StatCard label="Market Cap" value={formatUsd(pair.marketCap ?? pair.fdv)} />
            <StatCard label="Age" value={age !== null ? formatAge(age) : '—'} />
          </div>

          {/* Price changes */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Price Changes
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <PriceChangeCard label="5m" value={pair.priceChange?.m5} />
              <PriceChangeCard label="1h" value={pair.priceChange?.h1} />
              <PriceChangeCard label="6h" value={pair.priceChange?.h6} />
              <PriceChangeCard label="24h" value={pair.priceChange?.h24} />
            </div>
          </div>

          {/* Volume */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Volume
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <StatCard label="5m" value={formatUsd(pair.volume?.m5)} />
              <StatCard label="1h" value={formatUsd(pair.volume?.h1)} />
              <StatCard label="6h" value={formatUsd(pair.volume?.h6)} />
              <StatCard label="24h" value={formatUsd(pair.volume?.h24)} />
            </div>
          </div>

          {/* Transactions */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              24h Transactions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Buys</div>
                <div className="text-emerald-400 font-medium">
                  {pair.txns?.h24?.buys?.toLocaleString() ?? '—'}
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Sells</div>
                <div className="text-red-400 font-medium">
                  {pair.txns?.h24?.sells?.toLocaleString() ?? '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Pair info */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Pair Info
            </h3>
            <div className="bg-gray-800 rounded-lg p-3 space-y-2 text-sm">
              <InfoRow label="Chain" value={pair.chainId} />
              <InfoRow label="DEX" value={pair.dexId} />
              <InfoRow label="Pair Address" value={pair.pairAddress} monospace />
              <InfoRow label="Base Token" value={`${pair.baseToken.symbol} (${pair.baseToken.address.slice(0, 10)}...)`} />
              <InfoRow label="Quote Token" value={`${pair.quoteToken.symbol} (${pair.quoteToken.address.slice(0, 10)}...)`} />
              {pair.boosts && (
                <InfoRow label="Active Boosts" value={String(pair.boosts.active)} />
              )}
            </div>
          </div>

          {/* Socials & Links */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Socials & Links
            </h3>
            <div className="space-y-2">
              {telegram && (
                <SocialRow
                  platform="Telegram"
                  handle={telegram.handle}
                  url={telegram.url || `https://t.me/${telegram.handle.replace('@', '')}`}
                  color="text-blue-400"
                />
              )}
              {twitter && (
                <SocialRow
                  platform="X/Twitter"
                  handle={twitter.handle}
                  url={twitter.url || `https://x.com/${twitter.handle.replace('@', '')}`}
                  color="text-gray-300"
                />
              )}
              {allSocials
                .filter((s) => s.platform !== 'telegram' && s.platform !== 'twitter' && s.platform !== 'x')
                .map((social, i) => (
                  <SocialRow
                    key={i}
                    platform={social.platform}
                    handle={social.handle}
                    url={social.url || '#'}
                    color="text-gray-400"
                  />
                ))}
              {allWebsites.map((website, i) => (
                <div
                  key={`web-${i}`}
                  className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-300">
                      {website.label || 'Website'}
                    </span>
                  </div>
                  <a
                    href={website.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))}
              {allSocials.length === 0 && allWebsites.length === 0 && (
                <p className="text-sm text-gray-500">No social links found</p>
              )}
            </div>
          </div>

          {/* DexScreener Chart Link */}
          <div className="flex gap-3">
            <a
              href={dexUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2.5 font-medium transition-colors"
            >
              <ExternalLink size={16} />
              View on DexScreener
            </a>
            <a
              href={chartUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg py-2.5 font-medium transition-colors border border-gray-700"
            >
              View Chart
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-200">{value}</div>
    </div>
  );
}

function PriceChangeCard({ label, value }: { label: string; value: number | undefined | null }) {
  const isPositive = value !== undefined && value !== null && value >= 0;
  return (
    <div className="bg-gray-800 rounded-lg p-2 text-center">
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div
        className={`text-sm font-medium ${
          value !== undefined && value !== null
            ? isPositive
              ? 'text-emerald-400'
              : 'text-red-400'
            : 'text-gray-500'
        }`}
      >
        {formatPercent(value)}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  monospace,
}: {
  label: string;
  value: string;
  monospace?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}</span>
      <span
        className={`text-gray-200 ${
          monospace ? 'font-mono text-xs' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SocialRow({
  platform,
  handle,
  url,
  color,
}: {
  platform: string;
  handle: string;
  url: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${color}`}>{platform}</span>
        <span className="text-sm text-gray-400">{handle}</span>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <ExternalLink size={14} />
      </a>
    </div>
  );
}
