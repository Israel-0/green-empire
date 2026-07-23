import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';

interface AchievementInfo {
  id: string;
  name: string;
  icon: string;
}

const ACHIEVEMENTS: AchievementInfo[] = [
  { id: 'harvest_1', name: 'Primeros pasos', icon: '🌱' },
  { id: 'harvest_10', name: 'Manos verdes', icon: '🌿' },
  { id: 'harvest_50', name: 'Agricultor', icon: '🌳' },
  { id: 'harvest_100', name: 'Imperio verde', icon: '🌲' },
  { id: 'harvest_500', name: 'Produccion en masa', icon: '🏭' },
  { id: 'quality_65', name: 'Buena hierba', icon: '⭐' },
  { id: 'quality_85', name: 'Premium', icon: '💎' },
  { id: 'yerbon_1', name: 'Primer yerbon', icon: '👑' },
  { id: 'yerbon_10', name: 'Maestro yerbon', icon: '🌟' },
  { id: 'sold_100', name: 'Primer trato', icon: '💵' },
  { id: 'sold_1k', name: 'Traficante', icon: '💰' },
  { id: 'sold_10k', name: 'Narco', icon: '🏦' },
  { id: 'sold_50k', name: 'Cartel', icon: '🏰' },
  { id: 'sold_250k', name: 'Rey del mercado', icon: '👑' },
  { id: 'level_5', name: 'Aprendiz', icon: '📈' },
  { id: 'level_10', name: 'Experto', icon: '🎓' },
  { id: 'level_25', name: 'Maestro', icon: '🧙' },
  { id: 'level_50', name: 'Leyenda', icon: '🌟' },
  { id: 'level_100', name: 'Emperador', icon: '👑' },
  { id: 'strains_3', name: 'Coleccionista', icon: '🌱' },
  { id: 'strains_5', name: 'Botanico', icon: '🌿' },
  { id: 'strains_7', name: 'Banco de semillas', icon: '🧬' },
  { id: 'sell_local_10', name: 'Camello local', icon: '🏪' },
  { id: 'sell_darknet_10', name: 'Darknet', icon: '🌐' },
  { id: 'sell_export_10', name: 'Exportador', icon: '🚢' },
  { id: 'staff_first', name: 'Primer empleado', icon: '👨‍🌾' },
  { id: 'staff_all', name: 'Equipo completo', icon: '👥' },
  { id: 'staff_max', name: 'CEO', icon: '🎓' },
  { id: 'expand_first', name: 'Reforma', icon: '🏠' },
  { id: 'expand_industrial', name: 'Industrial', icon: '🏭' },
  { id: 'equip_lights', name: 'Iluminado', icon: '💡' },
  { id: 'equip_all', name: 'Full equipado', icon: '🔧' },
  { id: 'market_30', name: 'Oportunista', icon: '📈' },
  { id: 'market_50', name: 'Tiburon', icon: '🦈' },
  { id: 'pest_5', name: 'Exterminador', icon: '🐛' },
  { id: 'pest_25', name: 'Inmune', icon: '🛡️' },
  { id: 'raid_survive', name: 'Sobreviviente', icon: '🚨' },
  { id: 'money_50k', name: 'Acumulador', icon: '🏦' },
];

function getUnlockedIds(
  gameState: ReturnType<typeof useGameStore.getState>['gameState'],
  sellMethodCounts: Record<string, number>,
  pestsCured: number,
  strains: ReturnType<typeof useGameStore.getState>['strains'],
  marketPrices: ReturnType<typeof useGameStore.getState>['marketPrices']
): Set<string> {
  const ids = new Set<string>();
  if (!gameState) return ids;

  if (gameState.totalHarvested >= 1) ids.add('harvest_1');
  if (gameState.totalHarvested >= 10) ids.add('harvest_10');
  if (gameState.totalHarvested >= 50) ids.add('harvest_50');
  if (gameState.totalHarvested >= 100) ids.add('harvest_100');
  if (gameState.totalHarvested >= 500) ids.add('harvest_500');

  const bestQ = Math.max(0, ...gameState.plants.filter((p: any) => p.harvestedAt).map((p: any) => p.quality));
  if (bestQ >= 65) ids.add('quality_65');
  if (bestQ >= 85) ids.add('quality_85');

  const yerbonCount = gameState.plants.filter((p: any) => p.harvestedAt && p.isYerbon).length;
  if (yerbonCount >= 1) ids.add('yerbon_1');
  if (yerbonCount >= 10) ids.add('yerbon_10');

  if (gameState.totalSold >= 100) ids.add('sold_100');
  if (gameState.totalSold >= 1000) ids.add('sold_1k');
  if (gameState.totalSold >= 10000) ids.add('sold_10k');
  if (gameState.totalSold >= 50000) ids.add('sold_50k');
  if (gameState.totalSold >= 250000) ids.add('sold_250k');

  if (gameState.level >= 5) ids.add('level_5');
  if (gameState.level >= 10) ids.add('level_10');
  if (gameState.level >= 25) ids.add('level_25');
  if (gameState.level >= 50) ids.add('level_50');
  if (gameState.level >= 100) ids.add('level_100');

  if (gameState.staff.length >= 1) ids.add('staff_first');
  const staffTypes = new Set(gameState.staff.map((s: any) => s.type));
  if (staffTypes.size >= 4) ids.add('staff_all');
  if (gameState.staff.length >= 4 && gameState.staff.every((s: any) => s.level >= 5)) ids.add('staff_max');

  const maxSpaceLv = Math.max(1, ...gameState.growSpaces.map((gs: any) => gs.level));
  if (maxSpaceLv >= 2) ids.add('expand_first');
  if (maxSpaceLv >= 5) ids.add('expand_industrial');

  const maxEq = Math.max(1, ...gameState.growSpaces.map((gs: any) => gs.lights));
  if (maxEq >= 5) ids.add('equip_lights');
  const gs = gameState.growSpaces[0];
  if (gs && (gs as any).lights >= 5 && (gs as any).ventilation >= 5 && (gs as any).irrigation >= 5 && (gs as any).security >= 5) ids.add('equip_all');

  if (gameState.money >= 50000) ids.add('money_50k');
  if ((gameState as any).activeEvents?.some((e: any) => e.type === 'raid')) ids.add('raid_survive');

  if (strains.length > 0) {
    const unlocked = strains.filter(s => gameState.level >= s.unlockLevel).length;
      if (unlocked >= 3) ids.add('strains_3');
      if (unlocked >= 5) ids.add('strains_5');
      if (unlocked >= 11) ids.add('strains_7');
  }

  if ((sellMethodCounts['local'] || 0) >= 10) ids.add('sell_local_10');
  if ((sellMethodCounts['darknet'] || 0) >= 10) ids.add('sell_darknet_10');
  if ((sellMethodCounts['export'] || 0) >= 10) ids.add('sell_export_10');

  if (pestsCured >= 5) ids.add('pest_5');
  if (pestsCured >= 25) ids.add('pest_25');

  if (marketPrices.some((p: any) => p.currentPrice >= p.basePrice * 1.3)) ids.add('market_30');
  if (marketPrices.some((p: any) => p.currentPrice >= p.basePrice * 1.5)) ids.add('market_50');

  return ids;
}

export default function AchievementToast() {
  const gameState = useGameStore((s) => s.gameState);
  const sellMethodCounts = useGameStore((s) => s.sellMethodCounts);
  const pestsCured = useGameStore((s) => s.pestsCured);
  const strains = useGameStore((s) => s.strains);
  const marketPrices = useGameStore((s) => s.marketPrices);

  const [showQueue, setShowQueue] = useState<AchievementInfo[]>([]);
  const [currentToast, setCurrentToast] = useState<AchievementInfo | null>(null);
  const shownIds = useRef<Set<string>>(new Set());
  const isProcessing = useRef(false);
  const initialized = useRef(false);

  const checkAndEnqueue = useCallback(() => {
    const unlocked = getUnlockedIds(gameState, sellMethodCounts, pestsCured, strains, marketPrices);
    const newUnlocks: AchievementInfo[] = [];

    for (const ach of ACHIEVEMENTS) {
      if (unlocked.has(ach.id)) {
        if (!initialized.current) {
          // First load: mark as shown without toasting
          shownIds.current.add(ach.id);
        } else if (!shownIds.current.has(ach.id)) {
          shownIds.current.add(ach.id);
          newUnlocks.push(ach);
        }
      }
    }

    if (!initialized.current) {
      initialized.current = true;
    } else if (newUnlocks.length > 0) {
      setShowQueue(prev => [...prev, ...newUnlocks]);
    }
  }, [gameState, sellMethodCounts, pestsCured, strains, marketPrices]);

  useEffect(() => {
    checkAndEnqueue();
  }, [checkAndEnqueue]);

  useEffect(() => {
    if (showQueue.length > 0 && !currentToast && !isProcessing.current) {
      isProcessing.current = true;
      const [next, ...rest] = showQueue;
      setCurrentToast(next);
      setShowQueue(rest);

      setTimeout(() => {
        setCurrentToast(null);
        isProcessing.current = false;
      }, 3500);
    }
  }, [showQueue, currentToast]);

  return (
    <AnimatePresence onExitComplete={() => {}}>
      {currentToast && (
        <motion.div
          key="achievement-toast"
          initial={{ x: 120, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 120, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed top-20 right-6 z-50 bg-grow-panel border border-grow-green/40 rounded-xl p-4 shadow-grow-lg max-w-xs pointer-events-auto"
        >
          <div className="flex items-center gap-3">
            <motion.span
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl"
            >
              {currentToast.icon}
            </motion.span>
            <div>
              <p className="text-grow-amber text-xs font-bold uppercase tracking-wider">Logro desbloqueado!</p>
              <p className="text-grow-white font-bold text-sm">{currentToast.name}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
