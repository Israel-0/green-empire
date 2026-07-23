import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/formatting';
import { motion, AnimatePresence } from 'framer-motion';

interface AchievementDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  check: (state: ReturnType<typeof useGameStore.getState>) => { unlocked: boolean; progress: number; max: number };
}

const ACHIEVEMENTS: AchievementDef[] = [
  // Cosecha
  { id: 'harvest_1', name: 'Primeros pasos', icon: '🌱', description: 'Cosecha tu primera planta', category: 'Cosecha',
    check: (s) => ({ unlocked: (s.gameState?.totalHarvested || 0) >= 1, progress: Math.min(1, s.gameState?.totalHarvested || 0), max: 1 }) },
  { id: 'harvest_10', name: 'Manos verdes', icon: '🌿', description: 'Cosecha 10 plantas', category: 'Cosecha',
    check: (s) => ({ unlocked: (s.gameState?.totalHarvested || 0) >= 10, progress: s.gameState?.totalHarvested || 0, max: 10 }) },
  { id: 'harvest_50', name: 'Agricultor', icon: '🌳', description: 'Cosecha 50 plantas', category: 'Cosecha',
    check: (s) => ({ unlocked: (s.gameState?.totalHarvested || 0) >= 50, progress: s.gameState?.totalHarvested || 0, max: 50 }) },
  { id: 'harvest_100', name: 'Imperio verde', icon: '🌲', description: 'Cosecha 100 plantas', category: 'Cosecha',
    check: (s) => ({ unlocked: (s.gameState?.totalHarvested || 0) >= 100, progress: s.gameState?.totalHarvested || 0, max: 100 }) },
  { id: 'harvest_500', name: 'Produccion en masa', icon: '🏭', description: 'Cosecha 500 plantas', category: 'Cosecha',
    check: (s) => ({ unlocked: (s.gameState?.totalHarvested || 0) >= 500, progress: s.gameState?.totalHarvested || 0, max: 500 }) },

  // Calidad
  { id: 'quality_65', name: 'Buena hierba', icon: '⭐', description: 'Cosecha calidad >= 65%', category: 'Calidad',
    check: (s) => {
      const best = Math.max(0, ...(s.gameState?.plants.filter(p => p.harvestedAt).map(p => p.quality) || [0]));
      return { unlocked: best >= 65, progress: Math.min(65, best), max: 65 };
    }},
  { id: 'quality_85', name: 'Premium', icon: '💎', description: 'Cosecha calidad >= 85%', category: 'Calidad',
    check: (s) => {
      const best = Math.max(0, ...(s.gameState?.plants.filter(p => p.harvestedAt).map(p => p.quality) || [0]));
      return { unlocked: best >= 85, progress: Math.min(85, best), max: 85 };
    }},
  { id: 'yerbon_1', name: 'Primer yerbon', icon: '👑', description: 'Cosecha tu primer yerbon', category: 'Calidad',
    check: (s) => {
      const count = s.gameState?.plants.filter(p => p.harvestedAt && p.isYerbon).length || 0;
      return { unlocked: count >= 1, progress: Math.min(1, count), max: 1 };
    }},
  { id: 'yerbon_10', name: 'Maestro yerbon', icon: '🌟', description: 'Cosecha 10 yerbones', category: 'Calidad',
    check: (s) => {
      const count = s.gameState?.plants.filter(p => p.harvestedAt && p.isYerbon).length || 0;
      return { unlocked: count >= 10, progress: count, max: 10 };
    }},

  // Dinero
  { id: 'sold_100', name: 'Primer trato', icon: '💵', description: 'Vende $100 en total', category: 'Dinero',
    check: (s) => ({ unlocked: (s.gameState?.totalSold || 0) >= 100, progress: s.gameState?.totalSold || 0, max: 100 }) },
  { id: 'sold_1k', name: 'Traficante', icon: '💰', description: 'Vende $1,000 en total', category: 'Dinero',
    check: (s) => ({ unlocked: (s.gameState?.totalSold || 0) >= 1000, progress: s.gameState?.totalSold || 0, max: 1000 }) },
  { id: 'sold_10k', name: 'Narco', icon: '🏦', description: 'Vende $10,000 en total', category: 'Dinero',
    check: (s) => ({ unlocked: (s.gameState?.totalSold || 0) >= 10000, progress: s.gameState?.totalSold || 0, max: 10000 }) },
  { id: 'sold_50k', name: 'Cartel', icon: '🏰', description: 'Vende $50,000 en total', category: 'Dinero',
    check: (s) => ({ unlocked: (s.gameState?.totalSold || 0) >= 50000, progress: s.gameState?.totalSold || 0, max: 50000 }) },
  { id: 'sold_250k', name: 'Rey del mercado', icon: '👑', description: 'Vende $250,000 en total', category: 'Dinero',
    check: (s) => ({ unlocked: (s.gameState?.totalSold || 0) >= 250000, progress: s.gameState?.totalSold || 0, max: 250000 }) },

  // Nivel
  { id: 'level_5', name: 'Aprendiz', icon: '📈', description: 'Alcanza nivel 5', category: 'Nivel',
    check: (s) => ({ unlocked: (s.gameState?.level || 0) >= 5, progress: s.gameState?.level || 0, max: 5 }) },
  { id: 'level_10', name: 'Experto', icon: '🎓', description: 'Alcanza nivel 10', category: 'Nivel',
    check: (s) => ({ unlocked: (s.gameState?.level || 0) >= 10, progress: s.gameState?.level || 0, max: 10 }) },
  { id: 'level_25', name: 'Maestro', icon: '🧙', description: 'Alcanza nivel 25', category: 'Nivel',
    check: (s) => ({ unlocked: (s.gameState?.level || 0) >= 25, progress: s.gameState?.level || 0, max: 25 }) },
  { id: 'level_50', name: 'Leyenda', icon: '🌟', description: 'Alcanza nivel 50', category: 'Nivel',
    check: (s) => ({ unlocked: (s.gameState?.level || 0) >= 50, progress: s.gameState?.level || 0, max: 50 }) },
  { id: 'level_100', name: 'Emperador', icon: '👑', description: 'Alcanza nivel 100', category: 'Nivel',
    check: (s) => ({ unlocked: (s.gameState?.level || 0) >= 100, progress: s.gameState?.level || 0, max: 100 }) },

  // Cepas
  { id: 'strains_3', name: 'Coleccionista', icon: '🌱', description: 'Desbloquea 3 cepas', category: 'Cepas',
    check: (s) => ({ unlocked: (s.strains.filter(st => (s.gameState?.level || 0) >= st.unlockLevel).length) >= 3, progress: s.strains.filter(st => (s.gameState?.level || 0) >= st.unlockLevel).length, max: 3 }) },
  { id: 'strains_5', name: 'Botanico', icon: '🌿', description: 'Desbloquea 5 cepas', category: 'Cepas',
    check: (s) => ({ unlocked: (s.strains.filter(st => (s.gameState?.level || 0) >= st.unlockLevel).length) >= 5, progress: s.strains.filter(st => (s.gameState?.level || 0) >= st.unlockLevel).length, max: 5 }) },
  { id: 'strains_7', name: 'Banco de semillas', icon: '🧬', description: 'Desbloquea las 11 cepas', category: 'Cepas',
    check: (s) => ({ unlocked: (s.strains.filter(st => (s.gameState?.level || 0) >= st.unlockLevel).length) >= 11, progress: s.strains.filter(st => (s.gameState?.level || 0) >= st.unlockLevel).length, max: 11 }) },

  // Ventas por metodo
  { id: 'sell_local_10', name: 'Camello local', icon: '🏪', description: '10 ventas locales', category: 'Ventas',
    check: (s) => ({ unlocked: (s.sellMethodCounts['local'] || 0) >= 10, progress: s.sellMethodCounts['local'] || 0, max: 10 }) },
  { id: 'sell_darknet_10', name: 'Darknet', icon: '🌐', description: '10 ventas en Darknet', category: 'Ventas',
    check: (s) => ({ unlocked: (s.sellMethodCounts['darknet'] || 0) >= 10, progress: s.sellMethodCounts['darknet'] || 0, max: 10 }) },
  { id: 'sell_export_10', name: 'Exportador', icon: '🚢', description: '10 ventas por exportacion', category: 'Ventas',
    check: (s) => ({ unlocked: (s.sellMethodCounts['export'] || 0) >= 10, progress: s.sellMethodCounts['export'] || 0, max: 10 }) },

  // Personal
  { id: 'staff_first', name: 'Primer empleado', icon: '👨‍🌾', description: 'Contrata a tu primer empleado', category: 'Personal',
    check: (s) => ({ unlocked: (s.gameState?.staff.length || 0) >= 1, progress: Math.min(1, s.gameState?.staff.length || 0), max: 1 }) },
  { id: 'staff_all', name: 'Equipo completo', icon: '👥', description: 'Contrata los 4 tipos de empleado', category: 'Personal',
    check: (s) => {
      const types = new Set(s.gameState?.staff.map(st => st.type) || []);
      return { unlocked: types.size >= 4, progress: types.size, max: 4 };
    }},
  { id: 'staff_max', name: 'CEO', icon: '🎓', description: 'Todo el personal a nivel maximo', category: 'Personal',
    check: (s) => {
      const allMax = (s.gameState?.staff.length || 0) >= 4 && s.gameState!.staff.every(st => st.level >= 5);
      const maxCount = s.gameState?.staff.filter(st => st.level >= 5).length || 0;
      return { unlocked: allMax, progress: maxCount, max: 4 };
    }},

  // Expansión
  { id: 'expand_first', name: 'Reforma', icon: '🏠', description: 'Expande tu espacio por primera vez', category: 'Expansión',
    check: (s) => {
      const maxLv = Math.max(1, ...(s.gameState?.growSpaces.map(gs => gs.level) || [1]));
      return { unlocked: maxLv >= 2, progress: Math.min(2, maxLv), max: 2 };
    }},
  { id: 'expand_industrial', name: 'Industrial', icon: '🏭', description: 'Alcanza Nave industrial o superior', category: 'Expansión',
    check: (s) => {
      const maxLv = Math.max(1, ...(s.gameState?.growSpaces.map(gs => gs.level) || [1]));
      return { unlocked: maxLv >= 5, progress: Math.min(5, maxLv), max: 5 };
    }},
  { id: 'equip_lights', name: 'Iluminado', icon: '💡', description: 'Luces a nivel maximo', category: 'Expansión',
    check: (s) => {
      const maxEq = Math.max(1, ...(s.gameState?.growSpaces.map(gs => gs.lights) || [1]));
      return { unlocked: maxEq >= 5, progress: Math.min(5, maxEq), max: 5 };
    }},
  { id: 'equip_all', name: 'Full equipado', icon: '🔧', description: 'Los 4 equipos a nivel maximo', category: 'Expansión',
    check: (s) => {
      const gs = s.gameState?.growSpaces[0];
      if (!gs) return { unlocked: false, progress: 0, max: 4 };
      let count = 0;
      if (gs.lights >= 5) count++; if (gs.ventilation >= 5) count++;
      if (gs.irrigation >= 5) count++; if (gs.security >= 5) count++;
      return { unlocked: count >= 4, progress: count, max: 4 };
    }},

  // Mercado
  { id: 'market_30', name: 'Oportunista', icon: '📈', description: 'Vende con el precio >= +30%', category: 'Mercado',
    check: (s) => {
      const high = s.marketPrices.some(p => p.currentPrice >= p.basePrice * 1.3);
      return { unlocked: high, progress: high ? 1 : 0, max: 1 };
    }},
  { id: 'market_50', name: 'Tiburon', icon: '🦈', description: 'Vende con el precio >= +50%', category: 'Mercado',
    check: (s) => {
      const high = s.marketPrices.some(p => p.currentPrice >= p.basePrice * 1.5);
      return { unlocked: high, progress: high ? 1 : 0, max: 1 };
    }},

  // Plagas
  { id: 'pest_5', name: 'Exterminador', icon: '🐛', description: 'Cura 5 plagas', category: 'Plagas',
    check: (s) => ({ unlocked: s.pestsCured >= 5, progress: s.pestsCured, max: 5 }) },
  { id: 'pest_25', name: 'Inmune', icon: '🛡️', description: 'Cura 25 plagas', category: 'Plagas',
    check: (s) => ({ unlocked: s.pestsCured >= 25, progress: s.pestsCured, max: 25 }) },

  // Riesgo
  { id: 'raid_survive', name: 'Sobreviviente', icon: '🚨', description: 'Sobrevive a una redada', category: 'Riesgo',
    check: (s) => {
      const hasRaid = s.gameState?.activeEvents?.some((e: any) => e.type === 'raid') || false;
      return { unlocked: hasRaid, progress: hasRaid ? 1 : 0, max: 1 };
    }},

  // Misc
  { id: 'money_50k', name: 'Acumulador', icon: '🏦', description: 'Acumula $50,000', category: 'Misc',
    check: (s) => ({ unlocked: (s.gameState?.money || 0) >= 50000, progress: s.gameState?.money || 0, max: 50000 }) },
];

const CATEGORIES = ['Todos', 'Cosecha', 'Calidad', 'Dinero', 'Nivel', 'Cepas', 'Ventas', 'Personal', 'Expansión', 'Mercado', 'Plagas', 'Riesgo', 'Misc'];

export default function StatsPanel() {
  const gameState = useGameStore((s) => s.gameState);
  const strains = useGameStore((s) => s.strains);
  const store = useGameStore;
  const [filter, setFilter] = useState('Todos');

  if (!gameState) return null;

  const activePlants = gameState.plants.filter(p => !p.harvestedAt).length;
  const yerbonCount = gameState.plants.filter(p => p.harvestedAt && p.isYerbon).length;
  const unlockedStrains = strains.filter(s => gameState.level >= s.unlockLevel).length;
  const totalCapacity = gameState.growSpaces.reduce((sum, gs) => sum + gs.capacity, 0);
  const bestLights = Math.max(1, ...gameState.growSpaces.map(gs => gs.lights));
  const LIGHTS_SPEED = [0, 10, 30, 60, 100];
  const growSpeed = LIGHTS_SPEED[Math.min(bestLights, 5) - 1] || 0;
  const levelSpeed = (gameState?.level || 1);
  const totalSpeed = growSpeed + levelSpeed;
  const bestSecurity = Math.max(1, ...gameState.growSpaces.map(gs => gs.security));
  const SEC_REDUCTION = [0, 5, 12, 25, 40];
  const riskReduction = SEC_REDUCTION[Math.min(bestSecurity, 5) - 1] || 0;

  const state = store();
  const filtered = ACHIEVEMENTS.filter(a => filter === 'Todos' || a.category === filter);
  const unlockedCount = ACHIEVEMENTS.filter(a => a.check(state).unlocked).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-grow-white">Estadisticas</h2>
        <p className="text-grow-muted text-sm mt-1">Progreso de tu imperio</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="card-grow p-4 flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-xs text-grow-muted">Dinero</p>
            <p className="text-base font-bold text-grow-green">{formatMoney(gameState.money)}</p>
          </div>
        </div>
        <div className="card-grow p-4 flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <div>
            <p className="text-xs text-grow-muted">Nivel</p>
            <p className="text-base font-bold text-grow-purple">{gameState.level}</p>
          </div>
        </div>
        <div className="card-grow p-4 flex items-center gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <p className="text-xs text-grow-muted">Reputacion</p>
            <p className="text-base font-bold text-grow-amber">{(gameState.reputation || 0).toFixed(0)}</p>
          </div>
        </div>
        <div className="card-grow p-4 flex items-center gap-3">
          <span className="text-2xl">🌿</span>
          <div>
            <p className="text-xs text-grow-muted">Plantas</p>
            <p className="text-base font-bold text-grow-green">{activePlants}<span className="text-grow-muted text-sm">/{totalCapacity}</span></p>
          </div>
        </div>
        <div className="card-grow p-4 flex items-center gap-3">
          <span className="text-2xl">🌱</span>
          <div>
            <p className="text-xs text-grow-muted">Cepas</p>
            <p className="text-base font-bold text-grow-white">{unlockedStrains}<span className="text-grow-muted text-sm">/11</span></p>
          </div>
        </div>
        <div className="card-grow p-4 flex items-center gap-3">
          <span className="text-2xl">✂️</span>
          <div>
            <p className="text-xs text-grow-muted">Cosechadas</p>
            <p className="text-base font-bold text-grow-white">{gameState.totalHarvested}</p>
          </div>
        </div>
        <div className="card-grow p-4 flex items-center gap-3">
          <span className="text-2xl">💸</span>
          <div>
            <p className="text-xs text-grow-muted">Vendido</p>
            <p className="text-base font-bold text-grow-green">{formatMoney(gameState.totalSold)}</p>
          </div>
        </div>
        <div className="card-grow p-4 flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <div>
            <p className="text-xs text-grow-muted">Yerbones</p>
            <p className="text-base font-bold text-grow-amber">{yerbonCount}</p>
          </div>
        </div>
        <div className="card-grow p-4 flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="text-xs text-grow-muted">Velocidad</p>
            <p className="text-base font-bold text-grow-gold">+{totalSpeed}%</p>
          </div>
        </div>
        <div className="card-grow p-4 flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <p className="text-xs text-grow-muted">Red. riesgo</p>
            <p className="text-base font-bold text-grow-purple">-{riskReduction} pts</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-bold text-grow-white">
            Logros <span className="text-grow-green text-sm">({unlockedCount}/{ACHIEVEMENTS.length})</span>
          </h3>
        </div>

        <div className="flex gap-1 flex-wrap mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                filter === cat ? 'bg-grow-green/20 text-grow-green border border-grow-green/40' : 'text-grow-muted hover:text-grow-white bg-grow-darker'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filtered.map((ach) => {
            const result = ach.check(state);
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card-grow p-4 text-center transition-all ${
                  result.unlocked ? 'border-grow-green bg-grow-green/5' : 'opacity-60'
                }`}
              >
                <span className="text-3xl block mb-2">{ach.icon}</span>
                <p className="text-xs font-bold text-grow-white mb-0.5">{ach.name}</p>
                <p className="text-xs text-grow-muted mb-2">{ach.description}</p>
                {result.unlocked ? (
                  <span className="badge badge-green text-xs">✅</span>
                ) : (
                  <div>
                    <div className="progress-bar h-1.5 mb-1">
                      <div
                        className="progress-fill bg-grow-amber"
                        style={{ width: `${Math.min(100, (result.progress / result.max) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-grow-muted">
                      {result.max === 1 ? 'Pendiente' : `${Math.floor(result.progress)}/${result.max}`}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
