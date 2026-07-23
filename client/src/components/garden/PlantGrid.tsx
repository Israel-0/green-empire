import { useGameStore } from '../../store/gameStore';
import PlantCard from './PlantCard';
import { formatDuration } from '../../utils/formatting';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlantGrid() {
  const gameState = useGameStore((s) => s.gameState);
  const strains = useGameStore((s) => s.strains);
  const plantSeed = useGameStore((s) => s.plantSeed);
  const error = useGameStore((s) => s.error);
  const setError = useGameStore((s) => s.setError);
  const toggleAutoPlant = useGameStore((s) => s.toggleAutoPlant);
  const [showPlantModal, setShowPlantModal] = useState(false);

  if (!gameState) return null;

  const activeSpace = gameState.growSpaces.find(s => s.id === gameState.activeGrowSpaceId) || gameState.growSpaces[0];
  const spacePlants = gameState.plants.filter(p => p.growSpaceId === activeSpace?.id && !p.harvestedAt);
  const capacity = activeSpace?.capacity || 2;
  const emptySlots = capacity - spacePlants.length;
  const seedInv = gameState.seedInventory || {};

  const handlePlant = async (strainId: string) => {
    if (!activeSpace) return;
    const success = await plantSeed(strainId, activeSpace.id);
    if (success) {
      setShowPlantModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-grow-white">
            {activeSpace?.name || 'Cultivo'}
          </h2>
          <p className="text-grow-muted text-sm mt-1">
            {spacePlants.length} / {capacity} plantas | Semillas: {Object.values(seedInv).reduce((a: number, b: number) => a + b, 0)}
          </p>
        </div>
        <button
          onClick={() => setShowPlantModal(true)}
          disabled={emptySlots <= 0}
          className="btn-primary"
        >
          + Plantar ({emptySlots} huecos)
        </button>
      </div>

      {activeSpace && (
        <div className="flex gap-2 flex-wrap text-xs">
          {activeSpace.lights > 1 && (
            <span className="badge badge-gold flex items-center gap-1">
              💡 +{[0, 10, 30, 60, 100][activeSpace.lights - 1]}% velocidad
            </span>
          )}
          <span className="badge badge-purple flex items-center gap-1">
            📈 +{gameState.level}% velocidad (nivel)
          </span>
          {activeSpace.irrigation > 1 && (
            <span className="badge badge-green flex items-center gap-1">
              💧 -{[0, 15, 30, 50, 75][activeSpace.irrigation - 1]}% decay
            </span>
          )}
          {activeSpace.ventilation > 1 && (
            <span className="badge badge-green flex items-center gap-1">
              🌀 -{[0, 15, 30, 50, 75][activeSpace.ventilation - 1]}% plagas
            </span>
          )}
          {gameState.staff.some(s => s.type === 'grower' && s.assignedGrowSpaceId === activeSpace.id) && (
            <span className="badge badge-green flex items-center gap-1">
              👨‍🌾 Jardinero activo
            </span>
          )}
          {gameState.staff.some(s => s.type === 'grower' && s.level >= 3 && s.assignedGrowSpaceId === activeSpace.id) && (
            <button
              onClick={toggleAutoPlant}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all hover:scale-105 ${
                gameState.autoPlantEnabled
                  ? 'bg-grow-green/20 text-grow-green border-grow-green/40 hover:bg-grow-green/30'
                  : 'bg-red-900/20 text-red-400 border-red-700/40 hover:bg-red-900/30'
              }`}
            >
              🌱 Auto-planta: {gameState.autoPlantEnabled ? 'ON' : 'OFF'}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {spacePlants.map((plant) => (
          <PlantCard key={plant.id} plant={plant} />
        ))}

        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="card-grow border-dashed border-grow-border/50 flex items-center justify-center h-48 cursor-pointer
                       hover:border-grow-green/30 hover:bg-grow-green/5 transition-all"
            onClick={() => setShowPlantModal(true)}
          >
            <div className="text-center">
              <p className="text-4xl mb-2 opacity-30">🌰</p>
              <p className="text-grow-muted text-sm">Espacio vacio</p>
              <p className="text-grow-border text-xs mt-1">Click para plantar</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showPlantModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setShowPlantModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-grow p-6 w-full max-w-2xl max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-display font-bold text-grow-white mb-4">
                Plantar semilla
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {strains.filter(s => s.drugType === 'marijuana').map((strain) => {
                  const unlocked = gameState.level >= strain.unlockLevel;
                  const owned = (strain.ownedSeeds || 0) + (seedInv[strain.id] || 0);
                  const canPlant = unlocked && owned > 0 && emptySlots > 0;

                  return (
                    <motion.div
                      key={strain.id}
                      whileTap={canPlant ? { scale: 0.97 } : {}}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        canPlant
                          ? 'border-grow-green bg-grow-green/10 shadow-grow hover:border-grow-green'
                          : 'border-grow-border/50 bg-grow-darker opacity-60'
                      }`}
                      onClick={() => canPlant && handlePlant(strain.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{strain.icon}</span>
                        <div className="flex-1">
                          <p className="font-bold text-grow-white" style={{ color: strain.color }}>
                            {strain.name}
                          </p>
                          <div className="flex gap-2 mt-0.5">
                            {!unlocked && <span className="badge badge-red">Nv.{strain.unlockLevel}</span>}
                            <span className={`text-xs font-bold ${owned > 0 ? 'text-grow-green' : 'text-grow-red'}`}>
                              {owned > 0 ? `🌱 x${owned}` : 'Sin semillas'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-grow-muted mb-2">{strain.description}</p>
                      <div className="flex gap-4 text-xs text-grow-muted">
                        <span>⏱ {formatDuration(strain.growTimeMinutes)}</span>
                        <span>📦 x{strain.baseYield}</span>
                        <span>💰 ${strain.seedCost} (tienda)</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-grow-border">
                <p className="text-xs text-grow-muted">
                  Compra semillas en la Tienda antes de plantar
                </p>
                <button onClick={() => setShowPlantModal(false)} className="btn-ghost text-sm">
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 right-6 bg-red-900/90 border border-red-700 rounded-lg px-5 py-3 z-50"
          onClick={() => setError(null)}
        >
          <p className="text-red-300 text-sm">{error}</p>
        </motion.div>
      )}
    </div>
  );
}
