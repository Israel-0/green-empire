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
  const hasStaff = !!(dealer || grower || security || researcher);

  return (
    <header className="bg-grow-panel border-b border-grow-border px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-lg font-display font-bold text-grow-green text-shadow-glow tracking-wide">
            🌿 GREEN EMPIRE
          </h1>

          <div className="flex items-center gap-5 text-sm">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-grow-darker/50">
              <span className="text-grow-green font-bold text-base">{formatMoney(gameState.money)}</span>
            </div>

            <div className="w-40">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-grow-muted">Nv.{gameState.level}</span>
                <span className="text-xs text-grow-muted font-mono">
                  {Math.floor(gameState.experience).toLocaleString()}/{gameState.experienceToNext.toLocaleString()}
                </span>
              </div>
              <div className="progress-bar h-2">
                <div className="progress-fill bg-grow-purple" style={{ width: `${expPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-grow-amber font-mono font-bold">{gameState.reputation.toFixed(1)}</span>
                <span className="text-xs text-grow-muted">rep</span>
                <span className="text-grow-green text-xs">(+{gameState.reputation.toFixed(0)}% precio)</span>
                <AnimatePresence>
                  {lastRepGain !== null && (
                    <motion.span
                      initial={{ opacity: 0, y: -8, scale: 0.5 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="text-grow-amber text-xs font-bold"
                    >
                      +{lastRepGain.toFixed(1)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {hasStaff && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-grow-darker/50">
              {dealer && <span className="text-xs text-grow-green font-medium">🤝 Auto-venta</span>}
              {grower && <span className="text-xs text-grow-green font-medium ml-2">👨‍🌾 Lv{grower.level}</span>}
              {security && <span className="text-xs text-grow-purple font-medium ml-2">🛡️ Lv{security.level}</span>}
              {researcher && <span className="text-xs text-grow-gold font-medium ml-2">🔬 Lv{researcher.level}</span>}
            </div>
          )}

          <span className="text-grow-muted text-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-grow-green" />
            {gameState.plants.filter(p => !p.harvestedAt).length} plantas
          </span>

          <button onClick={logout} className="btn-ghost text-sm">
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
