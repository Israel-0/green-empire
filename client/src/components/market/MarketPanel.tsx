import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/formatting';
import { useEffect, useState } from 'react';

export default function MarketPanel() {
  const marketPrices = useGameStore((s) => s.marketPrices);
  const loadPrices = useGameStore((s) => s.loadPrices);

  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const lastUpdate = marketPrices.length > 0 ? new Date(marketPrices[0].updatedAt).getTime() : 0;
  const cooldown = 10;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = (now - lastUpdate) / 60000;
  const progress = Math.min(100, (elapsed / cooldown) * 100);
  const ready = elapsed >= cooldown;

  if (marketPrices.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-bold text-grow-white">Mercado</h2>
        <div className="card-grow p-12 text-center">
          <p className="text-6xl mb-4">📈</p>
          <p className="text-grow-muted">No hay datos de mercado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-grow-white">Mercado</h2>
        <p className="text-grow-muted text-sm mt-1">Precios actuales — se refrescan cada ~10 min</p>
      </div>

      <div className="card-grow p-3 flex items-center gap-3">
        <span className="text-xl">📈</span>
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-grow-white font-medium">Refresco de precios</span>
            <span className={ready ? 'text-grow-green font-bold' : 'text-grow-muted'}>
              {ready ? 'Proximo refresco al cargar' : `${Math.ceil(cooldown - elapsed)}min`}
            </span>
          </div>
          <div className="progress-bar h-2">
            <div
              className={`progress-fill ${ready ? 'bg-grow-green' : 'bg-grow-blue'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="card-grow overflow-hidden">
        <div className="grid grid-cols-5 gap-3 px-4 py-2.5 border-b border-grow-border text-xs text-grow-muted uppercase tracking-wider font-semibold">
          <span className="col-span-2">Cepa</span>
          <span>Precio</span>
          <span>Variacion</span>
          <span>Volatilidad</span>
        </div>

        <div className="divide-y divide-grow-border/50">
          {marketPrices.filter(p => p.strain).map((price) => {
            const vsBase = ((price.currentPrice / price.basePrice - 1) * 100);
            return (
              <div key={price.strainId} className="grid grid-cols-5 gap-3 px-4 py-3 items-center hover:bg-grow-green/5 transition-colors">
                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-xl">{price.strain?.icon || '🌿'}</span>
                  <span className="font-medium text-grow-white text-sm" style={{ color: price.strain?.color }}>
                    {price.strain?.name}
                  </span>
                </div>

                <div>
                  <span className="font-bold text-grow-green text-sm">
                    {formatMoney(price.currentPrice)}
                  </span>
                  <div className="text-xs text-grow-muted">{formatMoney(price.basePrice)} base</div>
                </div>

                <span className={`text-sm font-bold ${vsBase > 0 ? 'text-grow-green' : vsBase < 0 ? 'text-grow-red' : 'text-grow-muted'}`}>
                  {vsBase > 0 ? '▲' : vsBase < 0 ? '▼' : '—'} {vsBase > 0 ? '+' : ''}{vsBase.toFixed(1)}%
                </span>

                <span className="text-xs">
                  {price.volatility >= 1.0
                    ? <span className="badge badge-red">Alta</span>
                    : price.volatility >= 0.6
                    ? <span className="badge badge-amber">Media</span>
                    : <span className="badge badge-green">Baja</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
