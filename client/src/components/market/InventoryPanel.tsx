import { useGameStore } from '../../store/gameStore';
import { useState, useEffect, useMemo } from 'react';
import { SellMethod } from '../../types/game';
import { formatMoney, qualityColor, getQualityTier, qualityLabel } from '../../utils/formatting';
import { motion, AnimatePresence } from 'framer-motion';

const SELL_METHODS: { id: SellMethod; label: string; multiplier: number; risk: number; icon: string; repRequired: number }[] = [
  { id: 'local', label: 'Venta local', multiplier: 1, risk: 5, icon: '🏪', repRequired: 0 },
  { id: 'dealer_sale', label: 'Camello', multiplier: 1.4, risk: 15, icon: '🤝', repRequired: 15 },
  { id: 'darknet', label: 'Darknet', multiplier: 1.8, risk: 30, icon: '🌐', repRequired: 40 },
  { id: 'export', label: 'Exportacion', multiplier: 2.5, risk: 50, icon: '🚢', repRequired: 75 },
];

function calcEffectiveRisk(baseRisk: number, equipmentLv: number, staffLv: number): number {
  const multipliers = [1, 0.9, 0.75, 0.5];
  const SEC_REDUCTION = [0, 5, 12, 25, 40];
  const equipReduction = SEC_REDUCTION[Math.min(equipmentLv, 5) - 1] || 0;
  return Math.max(1, Math.floor((baseRisk - equipReduction) * (multipliers[staffLv] || 1)));
}

export default function InventoryPanel() {
  const { gameState, sellInventory, lastRepGain } = useGameStore();
  const marketPrices = useGameStore((s) => s.marketPrices);
  const loadPrices = useGameStore((s) => s.loadPrices);

  useEffect(() => { loadPrices(); }, []);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellMethod, setSellMethod] = useState<SellMethod>('local');
  const [lastSaleRep, setLastSaleRep] = useState<number | null>(null);

  useEffect(() => {
    if (lastRepGain !== null) {
      setLastSaleRep(lastRepGain);
      const t = setTimeout(() => setLastSaleRep(null), 4000);
      return () => clearTimeout(t);
    }
  }, [lastRepGain]);

  if (!gameState) return null;

  const inventory = useMemo(() =>
    gameState.inventory
      .filter(i => i.quantity > 0)
      .sort((a, b) => {
        const valA = (a.strain?.baseValue || 0) * (1 + (a.averageQuality - 50) / 100) * getQualityTier(a.averageQuality).multiplier * a.quantity;
        const valB = (b.strain?.baseValue || 0) * (1 + (b.averageQuality - 50) / 100) * getQualityTier(b.averageQuality).multiplier * b.quantity;
        return valB - valA;
      }),
    [gameState.inventory]
  );
  const selected = inventory.find(i => i.id === selectedItem);
  const currentPrice = gameState.activeGrowSpaceId
    ? 0
    : 0;

  const handleSell = async () => {
    if (!selectedItem || sellQuantity <= 0) return;
    const success = await sellInventory(selectedItem, sellQuantity, sellMethod);
    if (success) {
      setSelectedItem(null);
      setSellQuantity(1);
    }
  };

  const maxSecurity = gameState.growSpaces.reduce((max, gs) => Math.max(max, gs.security), 1);
  const securityStaff = gameState.staff.find(s => s.type === 'security');
  const securityLv = securityStaff?.level || 0;
  const SEC_REDUCTION = [0, 5, 12, 25, 40];
  const equipReduction = SEC_REDUCTION[Math.min(maxSecurity, 5) - 1] || 0;
  const staffMultipliers = [1, 0.9, 0.75, 0.5];
  const staffMultiplier = staffMultipliers[securityLv] || 1;

  const method = SELL_METHODS.find(m => m.id === sellMethod)!;
  const effRisk = calcEffectiveRisk(method.risk, maxSecurity, securityLv);
  const estimatedValue = selected
    ? (marketPrices.find(mp => mp.strainId === selected.strainId)?.currentPrice || selected.strain?.baseValue || 0)
      * sellQuantity * (1 + (selected.averageQuality - 50) / 100) * getQualityTier(selected.averageQuality).multiplier * method.multiplier
      * (1 + gameState.reputation / 100)
      * (1 + (gameState.staff.filter(s => s.type === 'dealer').reduce((max, s) => Math.max(max, s.level), 0) * 0.1))
    : 0;

  const dealer = gameState.staff.find(s => s.type === 'dealer');
  const dealerCooldown = [0, 30, 20, 15, 12, 10][dealer?.level || 0] || 30;
  const lastSell = gameState.lastDealerSell ? new Date(gameState.lastDealerSell).getTime() : 0;
  const now = Date.now();
  const elapsedSinceSell = (now - lastSell) / 60000;
  const cooldownProgress = Math.min(100, (elapsedSinceSell / dealerCooldown) * 100);
  const cooldownReady = elapsedSinceSell >= dealerCooldown;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-grow-white">Inventario</h2>

      {(dealer || maxSecurity > 1 || securityLv > 0) && (
        <div className="flex gap-3 flex-wrap">
          {dealer && (
            <div className="card-grow p-3 flex items-center gap-3 flex-1 min-w-[280px]">
              <span className="text-xl">🤝</span>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-grow-white font-medium">
                    {dealer.name} Lv{dealer.level}
                  </span>
                  <span className={cooldownReady ? 'text-grow-green font-bold' : 'text-grow-muted'}>
                    {cooldownReady ? 'Listo para vender' : `${Math.ceil(dealerCooldown - elapsedSinceSell)}min`}
                  </span>
                </div>
                <div className="progress-bar h-2">
                  <div
                    className={`progress-fill ${cooldownReady ? 'bg-grow-green' : 'bg-grow-amber'}`}
                    style={{ width: `${cooldownProgress}%` }}
                  />
                </div>
                <p className="text-xs text-grow-muted mt-1">
                  Vende {dealer.level} item{dealer.level > 1 ? 's' : ''} cada {dealerCooldown}min · Boost +{dealer.level * 10}% precio
                </p>
              </div>
            </div>
          )}
          {(maxSecurity > 1 || securityLv > 0) && (
            <div className="card-grow p-3 flex items-center gap-3 flex-1 min-w-[280px]">
              <span className="text-xl">🛡️</span>
              <div className="flex-1">
                <p className="text-sm text-grow-white font-medium">Seguridad de venta</p>
                <p className="text-xs text-grow-muted">
                  {maxSecurity > 1 && <span>Equipo Lv{maxSecurity} (-{equipReduction} pts) · </span>}
                  {securityLv > 0 && <span>{securityStaff?.name} Lv{securityLv} (x{staffMultiplier}) · </span>}
                  Riesgo máximo: {Math.max(1, Math.floor((50 - equipReduction) * staffMultiplier))}% (exportación)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {inventory.length === 0 ? (
        <div className="card-grow p-12 text-center">
          <p className="text-6xl mb-4">📦</p>
          <p className="text-grow-muted">Tu inventario está vacío</p>
          <p className="text-grow-border text-sm mt-1">Cosecha plantas para llenarlo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {inventory.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`card-grow p-4 cursor-pointer transition-all ${
                  selectedItem === item.id ? 'border-grow-green shadow-grow' : 'hover:border-grow-green/30'
                } ${getQualityTier(item.averageQuality).glow}`}
                style={{ borderColor: selectedItem === item.id ? undefined : qualityColor(item.averageQuality) }}
                onClick={() => { setSelectedItem(item.id); setSellQuantity(Math.min(1, item.quantity)); }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{item.strain?.icon || '🌿'}</span>
                    <div>
                      <h3 className="font-bold text-grow-white flex items-center gap-2">
                        {item.strain?.name}
                        <span className="text-sm" style={{ color: qualityColor(item.averageQuality) }}>
                          {qualityLabel(item.averageQuality)}
                        </span>
                      </h3>
                      <div className="flex gap-3 text-xs text-grow-muted mt-1">
                        <span>Cantidad: <strong className="text-grow-white">{item.quantity}</strong></span>
                        <span>Calidad: <strong style={{ color: qualityColor(item.averageQuality) }}>{item.averageQuality.toFixed(1)}%</strong></span>
                        <span>x{getQualityTier(item.averageQuality).multiplier} valor</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-grow-green font-bold text-lg">
                      {formatMoney((marketPrices.find(mp => mp.strainId === item.strainId)?.currentPrice || item.strain?.baseValue || 0) * (1 + (item.averageQuality - 50) / 100) * getQualityTier(item.averageQuality).multiplier * item.quantity)}
                    </p>
                    <p className="text-xs text-grow-muted">
                      {formatMoney((marketPrices.find(mp => mp.strainId === item.strainId)?.currentPrice || item.strain?.baseValue || 0) * (1 + (item.averageQuality - 50) / 100) * getQualityTier(item.averageQuality).multiplier)} c/u
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="card-grow p-5 lg:sticky lg:top-6 lg:self-start"
            >
              <h3 className="font-display font-bold text-lg mb-3">Vender</h3>

              <div className="bg-grow-green/5 border border-grow-green/20 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-grow-white font-bold text-lg">Total estimado</span>
                  <span className="text-grow-green font-bold text-xl">{formatMoney(estimatedValue)}</span>
                </div>

                <button
                  onClick={handleSell}
                  disabled={sellQuantity <= 0}
                  className="btn-primary w-full py-3 text-base font-bold"
                >
                  Vender por {formatMoney(estimatedValue)}
                </button>

                <AnimatePresence>
                  {lastSaleRep !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center pt-3"
                    >
                      <span className="text-grow-amber font-bold text-sm">
                        ⭐ +{lastSaleRep.toFixed(1)} reputación
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="stat-label block mb-1.5">Cantidad</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))} className="btn-ghost text-sm px-2">-</button>
                    <input
                      type="number" value={sellQuantity}
                      onChange={(e) => setSellQuantity(Math.min(selected.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-16 bg-grow-darker border border-grow-border rounded-lg px-3 py-1.5 text-center text-grow-white text-sm"
                      min={1} max={selected.quantity}
                    />
                    <button onClick={() => setSellQuantity(Math.min(selected.quantity, sellQuantity + 1))} className="btn-ghost text-sm px-2">+</button>
                    <button onClick={() => setSellQuantity(selected.quantity)} className="text-xs text-grow-muted hover:text-grow-green">Todo ({selected.quantity})</button>
                  </div>
                </div>

                <div>
                  <label className="stat-label block mb-1.5">Método de venta</label>
                  <div className="space-y-1.5">
                    {SELL_METHODS.map((m) => {
                      const unlocked = gameState.reputation >= m.repRequired;
                      return (
                        <button
                          key={m.id}
                          onClick={() => unlocked && setSellMethod(m.id)}
                          disabled={!unlocked}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                            !unlocked
                              ? 'border-grow-border/30 bg-grow-darker opacity-50 cursor-not-allowed'
                              : sellMethod === m.id
                                ? 'border-grow-green bg-grow-green/10'
                                : 'border-grow-border hover:border-grow-green/30'
                          }`}
                        >
                          <span className="text-lg">{m.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-grow-white text-xs">
                              {m.label}
                              {!unlocked && <span className="text-grow-red ml-1">🔒 rep {m.repRequired}</span>}
                            </p>
                            <p className="text-grow-muted">
                              x{m.multiplier} · Riesgo: {maxSecurity > 1 || securityLv > 0 ? <span className="text-grow-green font-bold">{calcEffectiveRisk(m.risk, maxSecurity, securityLv)}%</span> : <span className="text-grow-red">{m.risk}%</span>}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <details className="bg-grow-darker rounded-lg p-3 text-xs cursor-pointer">
                  <summary className="text-grow-muted font-medium select-none">📊 Desglose del precio</summary>
                  <div className="space-y-1 mt-2 pt-2 border-t border-grow-border/30">
                    <div className="flex justify-between"><span className="text-grow-muted">Precio base</span><span className="text-grow-white">{formatMoney((marketPrices.find(mp => mp.strainId === selected.strainId)?.currentPrice || selected.strain?.baseValue || 0) * sellQuantity)}</span></div>
                    <div className="flex justify-between"><span className="text-grow-muted">Calidad ({(selected.averageQuality).toFixed(0)}%)</span><span className="text-grow-white">x{(1 + (selected.averageQuality - 50) / 100).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-grow-muted">Tier ({getQualityTier(selected.averageQuality).name})</span><span className="text-grow-white">x{getQualityTier(selected.averageQuality).multiplier}</span></div>
                    <div className="flex justify-between"><span className="text-grow-muted">Método ({method.label})</span><span className="text-grow-white">x{method.multiplier}</span></div>
                    <div className="flex justify-between"><span className="text-grow-muted">Reputación ({(gameState.reputation).toFixed(0)}%)</span><span className="text-grow-amber">x{(1 + gameState.reputation / 100).toFixed(2)}</span></div>
                    {gameState.staff.filter(s => s.type === 'dealer').length > 0 && (
                      <div className="flex justify-between"><span className="text-grow-muted">Camello Lv{gameState.staff.filter(s => s.type === 'dealer').reduce((max, s) => Math.max(max, s.level), 0)}</span><span className="text-grow-white">x{(1 + gameState.staff.filter(s => s.type === 'dealer').reduce((max, s) => Math.max(max, s.level), 0) * 0.1).toFixed(2)}</span></div>
                    )}
                  </div>
                </details>

                <details className="bg-grow-darker rounded-lg p-3 text-xs cursor-pointer">
                  <summary className="text-grow-muted font-medium select-none">🛡️ Riesgo de redada</summary>
                  <div className="space-y-1 mt-2 pt-2 border-t border-grow-border/30">
                    <div className="flex justify-between"><span className="text-grow-muted">Riesgo base</span><span className="text-grow-red">{method.risk}%</span></div>
                    {maxSecurity > 1 && <div className="flex justify-between"><span className="text-grow-muted">⚙️ Equipo Lv{maxSecurity}</span><span className="text-grow-green">-{equipReduction} pts</span></div>}
                    {securityLv > 0 && <div className="flex justify-between"><span className="text-grow-muted">🛡️ {securityStaff?.name} Lv{securityLv}</span><span className="text-grow-green">x{staffMultiplier}</span></div>}
                    <div className="flex justify-between font-bold border-t border-grow-border/30 pt-1"><span className="text-grow-white">Riesgo real</span><span className="text-grow-green text-sm">{effRisk}%</span></div>
                    {securityLv >= 2 && <div className="text-grow-purple mt-1">+ {securityLv >= 3 ? securityLv >= 5 ? '90%' : securityLv >= 4 ? '70%' : '50%' : '25%'} de reembolso en caso de redada</div>}
                  </div>
                </details>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
