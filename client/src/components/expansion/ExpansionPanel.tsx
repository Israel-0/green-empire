import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/formatting';
import { EquipmentType } from '../../types/game';
import { motion } from 'framer-motion';

const EXPANSION_INFO = [
  { level: 1, name: 'Armario', capacity: 2, cost: 0, requirement: 1 },
  { level: 2, name: 'Tienda de cultivo', capacity: 4, cost: 200, requirement: 5 },
  { level: 3, name: 'Habitacion', capacity: 8, cost: 800, requirement: 10 },
  { level: 4, name: 'Sotano', capacity: 16, cost: 3000, requirement: 18 },
  { level: 5, name: 'Nave industrial', capacity: 32, cost: 12000, requirement: 30 },
  { level: 6, name: 'Invernadero', capacity: 50, cost: 50000, requirement: 45 },
];

const EQUIPMENT_INFO: {
  type: EquipmentType;
  label: string;
  icon: string;
  description: string;
  effects: string[];
  levels: { level: number; name: string; cost: number }[];
}[] = [
  {
    type: 'lights',
    label: 'Luces',
    icon: '💡',
    description: 'Aceleran el crecimiento de las plantas',
    effects: ['Sin efecto', '+10% velocidad', '+30% velocidad', '+60% velocidad', '+100% velocidad'],
    levels: [
      { level: 1, name: 'CFL', cost: 0 },
      { level: 2, name: 'LED', cost: 50 },
      { level: 3, name: 'HPS', cost: 200 },
      { level: 4, name: 'Quantum', cost: 800 },
      { level: 5, name: 'Espectro Pro', cost: 3000 },
    ],
  },
  {
    type: 'ventilation',
    label: 'Ventilacion',
    icon: '🌀',
    description: 'Reduce plagas y protege la salud de las plantas',
    effects: ['Sin efecto', 'Plagas -15%, Agua -10%', 'Plagas -30%, Agua -20%', 'Plagas -50%, Agua -35%', 'Plagas -75%, Agua -50%'],
    levels: [
      { level: 1, name: 'PC Fan', cost: 0 },
      { level: 2, name: 'Inline', cost: 30 },
      { level: 3, name: 'Carbon Filter', cost: 120 },
      { level: 4, name: 'Clima Control', cost: 500 },
      { level: 5, name: 'Semi-industrial', cost: 2000 },
    ],
  },
  {
    type: 'irrigation',
    label: 'Riego',
    icon: '💧',
    description: 'Reduce la velocidad a la que baja el agua',
    effects: ['Sin efecto', '-15% decay', '-30% decay', '-50% decay', '-75% decay'],
    levels: [
      { level: 1, name: 'Manual', cost: 0 },
      { level: 2, name: 'Goteo', cost: 40 },
      { level: 3, name: 'Automatico', cost: 180 },
      { level: 4, name: 'Hidroponico', cost: 700 },
      { level: 5, name: 'Aeroponico', cost: 2500 },
    ],
  },
  {
    type: 'security',
    label: 'Seguridad',
    icon: '🛡️',
    description: 'Reduce el riesgo de redadas al vender',
    effects: ['Sin reduccion', '-5 pts riesgo', '-12 pts riesgo', '-25 pts riesgo', '-40 pts riesgo'],
    levels: [
      { level: 1, name: 'Ninguna', cost: 0 },
      { level: 2, name: 'Alarma', cost: 80 },
      { level: 3, name: 'Camaras', cost: 350 },
      { level: 4, name: 'Perro Guardian', cost: 1500 },
      { level: 5, name: 'Seguridad Privada', cost: 6000 },
    ],
  },
];

export default function ExpansionPanel() {
  const gameState = useGameStore((s) => s.gameState);
  const upgradeSpace = useGameStore((s) => s.upgradeSpace);
  const upgradeEquipment = useGameStore((s) => s.upgradeEquipment);

  if (!gameState) return null;

  const activeSpace = gameState.growSpaces.find(s => s.id === gameState.activeGrowSpaceId) || gameState.growSpaces[0];
  if (!activeSpace) return null;

  const nextExpansion = EXPANSION_INFO.find(e => e.level === activeSpace.level + 1);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold text-grow-white">Expansion</h2>
        <p className="text-grow-muted text-sm mt-1">Mejora tu espacio y equipamiento para potenciar tu imperio</p>
      </div>

      <div>
        <h3 className="text-lg font-display font-bold text-grow-white mb-4">
          Espacio actual: {activeSpace.name}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card-grow p-5">
            <p className="stat-label mb-1">Capacidad</p>
            <p className="text-3xl font-bold text-grow-green">{activeSpace.capacity} plantas</p>
          </div>
          <div className="card-grow p-5">
            <p className="stat-label mb-1">Nivel</p>
            <p className="text-3xl font-bold text-grow-purple">{activeSpace.level} / 6</p>
          </div>
        </div>

        {nextExpansion && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-grow p-5 border-grow-amber/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-grow-amber font-display font-bold text-lg">
                  {activeSpace.name} → {nextExpansion.name}
                </p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-grow-muted">
                    Capacidad: <span className="text-grow-white font-bold">{activeSpace.capacity} → {nextExpansion.capacity}</span>
                  </span>
                  <span className="text-grow-green">
                    +{nextExpansion.capacity - activeSpace.capacity} plantas mas
                  </span>
                </div>
                {gameState.level < nextExpansion.requirement && (
                  <p className="text-grow-amber text-sm mt-2 font-medium">
                    🔒 Requiere nivel {nextExpansion.requirement} (tienes {gameState.level})
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-grow-green">{formatMoney(nextExpansion.cost)}</p>
                <button
                  onClick={() => upgradeSpace(activeSpace.id)}
                  disabled={gameState.money < nextExpansion.cost || gameState.level < nextExpansion.requirement}
                  className="btn-primary mt-2 text-xs"
                >
                  Mejorar
                </button>
                {gameState.level < nextExpansion.requirement && (
                  <p className="text-red-400 text-xs mt-1">Requiere nivel {nextExpansion.requirement}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {!nextExpansion && (
          <div className="card-grow p-5 text-center">
            <p className="text-grow-green font-bold text-lg">Nivel maximo alcanzado! 🌟</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-display font-bold text-grow-white mb-4">Equipamiento</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EQUIPMENT_INFO.map((eq) => {
            const currentLevel = (activeSpace[eq.type] as number) || 1;
            const nextLevelData = currentLevel < 5 ? eq.levels[currentLevel] : null;
            const hasNext = currentLevel < 5;

            return (
              <div key={eq.type} className="card-grow p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{eq.icon}</span>
                  <div>
                    <h4 className="font-display font-bold text-grow-white">{eq.label}</h4>
                    <p className="text-xs text-grow-muted">{eq.description}</p>
                  </div>
                </div>

                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`flex-1 h-2 rounded-full transition-colors ${
                        lvl <= currentLevel ? 'bg-grow-green' : 'bg-grow-border'
                      }`}
                    />
                  ))}
                </div>

                <div className="bg-grow-darker rounded-lg p-3 mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-grow-muted">Actual (Nv.{currentLevel})</span>
                    <span className="text-grow-green">{eq.levels[currentLevel - 1]?.name}</span>
                  </div>
                  <p className="text-xs text-grow-green font-medium">
                    {eq.effects[currentLevel - 1]}
                  </p>
                </div>

                {hasNext && nextLevelData && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-grow-muted">Siguiente (Nv.{currentLevel + 1})</span>
                      <span className="text-grow-amber">{nextLevelData.name}</span>
                    </div>
                    <p className="text-xs text-grow-amber font-medium mb-2">
                      {eq.effects[currentLevel]}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-grow-border/30">
                      <span className="text-sm text-grow-white font-bold">{formatMoney(nextLevelData.cost)}</span>
                      <button
                        onClick={() => upgradeEquipment(activeSpace.id, eq.type)}
                        disabled={gameState.money < nextLevelData.cost}
                        className="btn-primary text-xs py-1 px-4"
                      >
                        Comprar
                      </button>
                    </div>
                  </div>
                )}

                {!hasNext && (
                  <div className="pt-2 border-t border-grow-border/30">
                    <p className="text-xs text-grow-green font-medium">Nivel maximo alcanzado</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
