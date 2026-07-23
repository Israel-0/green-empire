import { Plant } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { calculateRemainingMinutes, getStageProgress, getStageIcon } from '../../utils/quality';
import { formatTime, qualityColor, qualityLabel, getQualityTier } from '../../utils/formatting';
import { sounds } from '../../utils/sounds';
import ProgressBar from '../ui/ProgressBar';
import Timer from '../ui/Timer';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';

interface PlantCardProps {
  plant: Plant;
}

export default function PlantCard({ plant }: PlantCardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const carePlant = useGameStore((s) => s.carePlant);
  const harvestPlant = useGameStore((s) => s.harvestPlant);
  const treatPlant = useGameStore((s) => s.treatPlant);
  const deletePlant = useGameStore((s) => s.deletePlant);
  const [careEffect, setCareEffect] = useState(false);
  const [harvestResult, setHarvestResult] = useState<{
    show: boolean;
    yieldCount: number;
    quality: number;
    strainName: string;
    tierName: string;
    tierEmoji: string;
    isYerbon: boolean;
    expGain: number;
    newLevel: number;
  } | null>(null);

  const strain = plant.strain;
  if (!strain || !gameState) return null;

  const growSpace = gameState.growSpaces.find(gs => gs.id === plant.growSpaceId);
  const lightsLevel = growSpace?.lights || 1;
  const lightsSpeedPercent = (lightsLevel - 1) * 15;
  const gardener = gameState.staff.find(s => s.type === 'grower' && s.assignedGrowSpaceId === plant.growSpaceId);
  const gardenerLevel = gardener?.level || 0;
  const gardenerSpeedBonus = gardenerLevel >= 2 ? (gardenerLevel - 1) * 10 : 0;
  const researcher = gameState.staff.find(s => s.type === 'researcher');
  const researcherLevel = researcher?.level || 0;

  const remaining = calculateRemainingMinutes(plant, strain, lightsLevel, researcherLevel, gardenerLevel);
  const progress = getStageProgress(plant, strain, lightsLevel, researcherLevel, gardenerLevel);
  const stageIcon = getStageIcon(plant.stage);
  const quality = plant.quality || 0;
  const isReady = plant.stage === 'ready';
  const hasPests = plant.hasPests;

  const tier = getQualityTier(quality);
  const isYerbonTier = tier.tier === 8;

  const handleCare = async () => {
    sounds.water();
    setCareEffect(true);
    setTimeout(() => setCareEffect(false), 700);
    await carePlant(plant.id);
  };

  const handleTreat = async () => {
    sounds.water();
    await treatPlant(plant.id);
  };

  const handleHarvest = async () => {
    sounds.harvest();
    const result = await harvestPlant(plant.id);
    if (result) {
      const harvestedTier = getQualityTier(result.quality);
      const isLegendary = harvestedTier.tier >= 7;
      if (isLegendary) {
        sounds.yerbon();
        setTimeout(() => sounds.yerbon(), 800);
      }
      if (result.newLevel && result.newLevel > 0) {
        sounds.levelUp();
      }
      setHarvestResult({
        show: true,
        yieldCount: result.yield,
        quality: result.quality,
        strainName: strain.name,
        tierName: harvestedTier.name,
        tierEmoji: harvestedTier.emoji,
        isYerbon: result.isYerbon,
        expGain: result.expGain || 0,
        newLevel: result.newLevel || 0,
      });
      setTimeout(() => setHarvestResult(null), 3000);
    }
  };

  const healthColor = plant.health > 65 ? '#4ade80' : plant.health > 35 ? '#f59e0b' : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
        borderColor: careEffect ? 'rgba(74,222,128,0.8)' : undefined,
      }}
      transition={{ duration: 0.3 }}
      className={`card-grow p-4 relative overflow-hidden ${
        isReady ? 'animate-pulse-green' : ''
      } ${isYerbonTier ? 'shadow-gold' : ''} ${hasPests ? 'border-red-500/70 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}`}
    >
      {isYerbonTier && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 animate-pulse" />
      )}

      {careEffect && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <motion.div
            initial={{ opacity: 0.8, scale: 0.5 }}
            animate={{ opacity: 0, scale: 1.5, y: -30 }}
            transition={{ duration: 0.6 }}
            className="absolute top-1/3 left-1/3 text-4xl"
          >
            💧
          </motion.div>
          <motion.div
            initial={{ opacity: 0.6, scale: 0.5 }}
            animate={{ opacity: 0, scale: 1.5, y: -30 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="absolute top-1/3 right-1/3 text-3xl"
          >
            ✨
          </motion.div>
        </div>
      )}

      <div className="absolute top-2 right-2 flex gap-1 z-20">
        {hasPests && (
          <span className="badge badge-red text-xs font-bold animate-pulse">🪲 PLAGA</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); deletePlant(plant.id); }}
          className="text-grow-muted hover:text-grow-red transition-colors text-xs px-1.5 py-0.5 rounded hover:bg-red-900/30"
          title="Eliminar planta"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <motion.span
          className="text-4xl"
          animate={isReady ? { scale: [1, 1.15, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {stageIcon}
        </motion.span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-grow-white truncate" style={{ color: strain.color }}>
            {strain.name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-grow-muted capitalize">{plant.stage}</p>
            {lightsSpeedPercent > 0 && (
              <span className="text-xs text-grow-amber" title="Bonus de velocidad por luces">
                ⚡ +{lightsSpeedPercent}%
              </span>
            )}
            {gardener && (
              <span className="text-xs text-grow-green" title={`${gardener.name} cuida esta planta`}>
                👨‍🌾 Auto{gardenerSpeedBonus > 0 ? ` ⚡+${gardenerSpeedBonus}%` : ''}
              </span>
            )}
            {researcherLevel > 0 && (
              <span className="text-xs text-grow-gold" title={`+${researcherLevel * 3}% calidad general + ${researcherLevel * 5}% velocidad`}>
                🔬 +{researcherLevel * 3}%🍀
              </span>
            )}
          </div>
        </div>
        {isReady && (
          <motion.span
            className="badge badge-green"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            LISTO
          </motion.span>
        )}
      </div>

      <div className="space-y-2 mb-3">
        {!isReady && (
          <>
            <ProgressBar
              value={progress}
              color={hasPests || plant.health < 35 ? '#ef4444' : '#4ade80'}
              label="Crecimiento"
              showPercent
            />
            <ProgressBar
              value={plant.health}
              color={healthColor}
              label="Agua"
              size="sm"
            />
          </>
        )}
      </div>

      {!isReady && (
        <div className="flex justify-between items-center text-xs mb-3">
          <span className="text-grow-muted">Tiempo est.:</span>
          <Timer remainingMinutes={remaining} />
        </div>
      )}

      {isReady && (
        <div className="space-y-2 mb-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-grow-muted">Calidad:</span>
            <span style={{ color: qualityColor(quality) }} className="font-bold">
              {qualityLabel(quality)} ({quality.toFixed(1)}%)
            </span>
          </div>
          <ProgressBar value={quality} color={qualityColor(quality)} />
          {getQualityTier(quality).tier >= 5 && (
            <div className={`text-center text-xs font-bold px-2 py-0.5 rounded ${getQualityTier(quality).border} bg-grow-darker`} style={{ color: qualityColor(quality) }}>
              {qualityLabel(quality)} x{getQualityTier(quality).multiplier}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {!isReady && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCare}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-bold
                       bg-grow-green/20 border border-grow-green/40 text-grow-green
                       hover:bg-grow-green/30 hover:border-grow-green active:bg-grow-green/40
                       transition-all duration-150"
          >
            💧 Regar
          </motion.button>
        )}
        {hasPests && !isReady && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleTreat}
            className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-sm font-bold
                       bg-red-900/30 border border-red-500/50 text-red-300
                       hover:bg-red-800/40 transition-all duration-150"
          >
            🧪 ${Math.max(1, Math.round(strain.baseValue * 0.3))}
          </motion.button>
        )}
        {isReady && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleHarvest}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-bold
                       bg-grow-amber/20 border border-grow-amber/40 text-grow-amber
                       hover:bg-grow-amber/30 transition-all duration-150"
          >
            ✂️ Cosechar
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {harvestResult?.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ duration: 0.4 }}
            className={`absolute inset-0 flex flex-col items-center justify-center rounded-xl z-30 pointer-events-none ${
              harvestResult.isYerbon
                ? 'bg-gradient-to-b from-yellow-900/90 to-black/90'
                : 'bg-grow-darker/95'
            }`}
          >
            {harvestResult.isYerbon && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1.5, rotate: 45 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="absolute text-5xl"
                  style={{ top: '15%', left: '10%' }}
                >✨</motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1.5, rotate: -30 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="absolute text-4xl"
                  style={{ top: '20%', right: '15%' }}
                >✨</motion.div>
              </>
            )}
            <motion.span
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              className={`text-2xl mb-1 ${harvestResult.isYerbon ? 'text-yellow-300' : 'text-grow-amber'}`}
            >
              ✂️
            </motion.span>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`text-lg font-bold ${harvestResult.isYerbon ? 'text-yellow-300' : 'text-grow-white'}`}
            >
              +{harvestResult.yieldCount}x {harvestResult.strainName}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-sm ${harvestResult.isYerbon ? 'text-yellow-400' : 'text-grow-green'}`}
            >
              {harvestResult.tierEmoji} {harvestResult.tierName} ({harvestResult.quality.toFixed(0)}%)
            </motion.p>
            {harvestResult.isYerbon && (
              <motion.p
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="text-yellow-300 font-bold text-sm mt-1 tracking-widest"
              >
                ★ YERBON ★
              </motion.p>
            )}
            {harvestResult.expGain > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-grow-muted mt-1"
              >
                +{harvestResult.expGain.toFixed(0)} EXP
              </motion.p>
            )}
            {harvestResult.newLevel > 0 && (
              <motion.p
                initial={{ opacity: 0, y: 10, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                className="text-grow-purple font-bold text-sm mt-1"
              >
                ⬆️ ¡Nivel {harvestResult.newLevel}!
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
