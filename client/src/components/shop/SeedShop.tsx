import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { formatMoney, formatDuration } from '../../utils/formatting';
import { sounds } from '../../utils/sounds';
import { motion } from 'framer-motion';

function getStrainTags(
  strain: { unlockLevel: number; growTimeMinutes: number; baseYield: number; baseValue: number },
  playerLevel: number
): { emoji: string; label: string }[] {
  const tags: { emoji: string; label: string }[] = [];
  if (strain.unlockLevel === 1) tags.push({ emoji: '🌱', label: 'Starter' });
  if (strain.growTimeMinutes <= 15) tags.push({ emoji: '⚡', label: 'Rapida' });
  if (strain.growTimeMinutes >= 180) tags.push({ emoji: '🐢', label: 'Lenta' });
  if (strain.baseYield >= 4) tags.push({ emoji: '📦', label: 'Productiva' });
  if (strain.baseValue >= 100) tags.push({ emoji: '💰', label: 'Valiosa' });
  if (playerLevel < strain.unlockLevel) tags.push({ emoji: '🔒', label: `Nv.${strain.unlockLevel}` });
  return tags;
}

export default function SeedShop() {
  const gameState = useGameStore((s) => s.gameState);
  const strains = useGameStore((s) => s.strains);
  const buySeed = useGameStore((s) => s.buySeed);
  const [selectedStrain, setSelectedStrain] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  if (!gameState) return null;

  const marijuanaStrains = strains.filter(s => s.drugType === 'marijuana');

  const handleBuy = async () => {
    if (!selectedStrain) return;
    sounds.buy();
    await buySeed(selectedStrain, quantity);
    setSelectedStrain(null);
    setQuantity(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-grow-white">Tienda de Semillas</h2>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-grow-muted text-sm">Compra semillas para cultivar</p>
          <span className="text-xs text-grow-green font-medium">
            ({marijuanaStrains.filter(s => gameState.level >= s.unlockLevel).length}/{marijuanaStrains.length} desbloqueadas)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {marijuanaStrains.map((strain) => {
          const unlocked = gameState.level >= strain.unlockLevel;
          const canAfford = gameState.money >= strain.seedCost;
          const tags = getStrainTags(strain, gameState.level);

          return (
            <motion.div
              key={strain.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card-grow p-5 relative overflow-hidden transition-all cursor-pointer ${
                !unlocked ? 'opacity-50' :
                selectedStrain === strain.id ? 'border-grow-green shadow-grow' : 'hover:border-grow-green/30'
              }`}
              onClick={() => unlocked && setSelectedStrain(strain.id)}
            >
              <div className="text-center mb-3">
                <span className="text-5xl">{strain.icon}</span>
                <h3 className="font-display font-bold text-lg mt-2" style={{ color: strain.color }}>
                  {strain.name}
                </h3>
                {!unlocked && (
                  <span className="badge badge-red mt-1">Nivel {strain.unlockLevel} requerido</span>
                )}
              </div>

              <p className="text-xs text-grow-muted text-center mb-3">{strain.description}</p>

              {tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                  {tags.map((tag) => (
                    <span key={tag.label} className="badge badge-green text-xs font-medium flex items-center gap-1">
                      {tag.emoji} {tag.label}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div className="text-center bg-grow-darker rounded-lg p-2">
                  <p className="text-grow-muted">Tiempo</p>
                  <p className="text-grow-white font-bold">
                    {formatDuration(strain.growTimeMinutes)}
                  </p>
                </div>
                <div className="text-center bg-grow-darker rounded-lg p-2">
                  <p className="text-grow-muted">Rendimiento</p>
                  <p className="text-grow-white font-bold">x{strain.baseYield}</p>
                </div>
                <div className="text-center bg-grow-darker rounded-lg p-2">
                  <p className="text-grow-muted">Venta</p>
                  <p className="text-grow-green font-bold">{formatMoney(strain.baseValue)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-grow-green font-bold text-lg">
                  {formatMoney(strain.seedCost)}
                </span>
                <span className="text-xs text-grow-muted">por semilla</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedStrain && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 card-grow p-4 flex items-center gap-4 shadow-grow-lg z-40"
        >
          <span className="text-grow-white font-medium">
            {marijuanaStrains.find(s => s.id === selectedStrain)?.name}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="btn-ghost text-sm px-2">-</button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 bg-grow-darker border border-grow-border rounded-lg px-3 py-1 text-center text-grow-white text-sm"
              min={1}
            />
            <button onClick={() => setQuantity(quantity + 1)} className="btn-ghost text-sm px-2">+</button>
          </div>
          <span className="text-grow-green font-bold">
            Total: {formatMoney((marijuanaStrains.find(s => s.id === selectedStrain)?.seedCost || 0) * quantity)}
          </span>
          <button onClick={handleBuy} className="btn-primary text-sm">
            Comprar
          </button>
          <button onClick={() => { setSelectedStrain(null); setQuantity(1); }} className="btn-ghost text-sm">
            ✕
          </button>
        </motion.div>
      )}
    </div>
  );
}
