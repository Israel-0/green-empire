import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/formatting';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { gameState, logout, lastRepGain } = useGameStore();

  if (!gameState) return null;

  const expPercent = Math.min(100, (gameState.experience / gameState.experienceToNext) * 100);
  const grower = gameState.staff.find(s => s.type === 'grower');
  const dealer = gameState.staff.find(s => s.type === 'dealer');
  const security = gameState.staff.find(s => s.type === 'security');
  const researcher = gameState.staff.find(s => s.type === 'researcher');

  return (
    <header className="bg-grow-panel border-b border-grow-border px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
          <h1 className="text-xl font-display font-bold text-grow-green text-shadow-glow tracking-wide">
            🌿 GREEN EMPIRE
          </h1>
        <div className="flex items-center gap-3 text-sm">
          <div>
            <span className="stat-label">Dinero</span>
            <p className="stat-value text-grow-green">{formatMoney(gameState.money)}</p>
          </div>
          <div>
            <span className="stat-label">Nivel</span>
            <p className="stat-value text-grow-purple">{gameState.level}</p>
          </div>
          <div className="w-32">
            <span className="stat-label">EXP</span>
            <div className="progress-bar h-1.5 mt-1">
              <div
                className="progress-fill bg-grow-purple"
                style={{ width: `${expPercent}%` }}
              />
            </div>
          </div>
          <div>
            <span className="stat-label">Reputación</span>
            <p className="stat-value text-grow-amber flex items-center gap-1">
              <span>
                {'★'.repeat(Math.min(5, Math.floor(gameState.reputation / 20)))}
                {'☆'.repeat(Math.max(0, 5 - Math.floor(gameState.reputation / 20)))}
              </span>
              <span className="text-grow-green text-xs">+{(gameState.reputation).toFixed(0)}% precio</span>
              <AnimatePresence>
                {lastRepGain !== null && (
                  <motion.span
                    initial={{ opacity: 0, y: -10, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-grow-amber text-xs font-bold"
                  >
                    +{lastRepGain.toFixed(1)} rep
                  </motion.span>
                )}
              </AnimatePresence>
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {dealer && <span className="badge badge-green text-xs">🤝 Auto-venta</span>}
          {grower && <span className="badge badge-green text-xs">👨‍🌾 Lv{grower.level}</span>}
          {security && <span className="badge badge-purple text-xs">🛡️ Lv{security.level}</span>}
          {researcher && <span className="badge badge-gold text-xs">🔬 Lv{researcher.level}</span>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-grow-muted text-sm">Plantas: {gameState.plants.filter(p => !p.harvestedAt).length}</span>
        <button onClick={logout} className="btn-ghost text-sm">
          Salir
        </button>
      </div>
    </header>
  );
}
