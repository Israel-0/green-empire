export function formatMoney(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
}

export function formatTime(minutes: number): string {
  if (minutes < 0) return '--';

  const now = new Date();
  const target = new Date(now.getTime() + minutes * 60000);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) return 'Listo';

  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export const QUALITY_TIERS = [
  { tier: 1, name: 'Mala',       emoji: '🥀', color: '#9ca3af', minQuality: 0,  multiplier: 0.5, border: 'border-gray-500/30', glow: '' },
  { tier: 2, name: 'Regular',    emoji: '🌿', color: '#e2e8f0', minQuality: 30, multiplier: 0.8, border: 'border-gray-300/30', glow: '' },
  { tier: 3, name: 'Normal',     emoji: '🍃', color: '#4ade80', minQuality: 50, multiplier: 1.0, border: 'border-green-500/40', glow: '' },
  { tier: 4, name: 'Buena',      emoji: '🌱', color: '#38bdf8', minQuality: 65, multiplier: 1.3, border: 'border-blue-400/50', glow: 'shadow-[0_0_10px_rgba(56,189,248,0.15)]' },
  { tier: 5, name: 'Excelente',  emoji: '💎', color: '#a855f7', minQuality: 75, multiplier: 1.7, border: 'border-purple-400/60', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.25)]' },
  { tier: 6, name: 'Premium',    emoji: '👑', color: '#fbbf24', minQuality: 85, multiplier: 2.5, border: 'border-yellow-400/70', glow: 'shadow-[0_0_18px_rgba(251,191,36,0.35)]' },
  { tier: 7, name: 'Legendaria', emoji: '🌟', color: '#f472b6', minQuality: 93, multiplier: 4.0, border: 'border-pink-400/80', glow: 'animate-glow-legendary' },
  { tier: 8, name: 'Yerbon',     emoji: '✦', color: '#fbbf24', minQuality: 98, multiplier: 8.0, border: 'border-yellow-300', glow: 'animate-glow-yerbon' },
];

export function getQualityTier(quality: number) {
  let result = QUALITY_TIERS[0];
  for (const t of QUALITY_TIERS) {
    if (quality >= t.minQuality) result = t;
  }
  return result;
}

export function qualityColor(quality: number): string {
  return getQualityTier(quality).color;
}

export function qualityLabel(quality: number): string {
  const t = getQualityTier(quality);
  return `${t.emoji} ${t.name}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
