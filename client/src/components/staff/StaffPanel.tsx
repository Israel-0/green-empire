import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { StaffType } from '../../types/game';
import { formatMoney } from '../../utils/formatting';
import { motion } from 'framer-motion';

const SALARY_INTERVAL = 30;

const STAFF_TYPES: {
  type: StaffType;
  label: string;
  icon: string;
  description: string;
  needsSpace: boolean;
  maxCount: number;
  levels: { level: number; name: string; salary: number; hireCost: number; perk: string }[];
}[] = [
  {
    type: 'grower',
    label: 'Jardinero',
    icon: '👨‍🌾',
    description: 'Cuida automaticamente las plantas del espacio asignado',
    needsSpace: true,
    maxCount: 1,
    levels: [
      { level: 1, name: 'Novato', salary: 3, hireCost: 8, perk: 'Agua minima 70%' },
      { level: 2, name: 'Experto', salary: 8, hireCost: 40, perk: 'Agua minima 77%, +10% velocidad' },
      { level: 3, name: 'Maestro', salary: 15, hireCost: 120, perk: 'Agua minima 85%, +20% vel, auto-cosecha, auto-planta' },
      { level: 4, name: 'Ing. Agrónomo', salary: 25, hireCost: 350, perk: 'Agua minima 92%, +35% vel, auto-cosecha, auto-planta' },
      { level: 5, name: 'Druida', salary: 40, hireCost: 900, perk: 'Agua minima 100%, +50% vel, auto-cosecha, auto-planta, +1 und' },
    ],
  },
  {
    type: 'dealer',
    label: 'Camello',
    icon: '🤝',
    description: 'Vende automaticamente tu inventario mientras no estas',
    needsSpace: false,
    maxCount: 1,
    levels: [
      { level: 1, name: 'De Barrio', salary: 3, hireCost: 10, perk: '1 item cada 30min, +10% precio' },
      { level: 2, name: 'Distribuidor', salary: 8, hireCost: 45, perk: '2 items cada 20min, +20% precio' },
      { level: 3, name: 'Empresario', salary: 15, hireCost: 130, perk: '3 items cada 15min, +30% precio' },
      { level: 4, name: 'Cartel Manager', salary: 25, hireCost: 350, perk: '4 items cada 12min, +40% precio' },
      { level: 5, name: 'Señor Droga', salary: 40, hireCost: 900, perk: '5 items cada 10min, +50% precio' },
    ],
  },
  {
    type: 'security',
    label: 'Seguridad',
    icon: '🛡️',
    description: 'Reduce el riesgo al vender y recupera dinero en redadas',
    needsSpace: false,
    maxCount: 1,
    levels: [
      { level: 1, name: 'Vigilante', salary: 4, hireCost: 15, perk: 'Riesgo de redada x0.9' },
      { level: 2, name: 'Guardia', salary: 10, hireCost: 50, perk: 'Riesgo x0.75, reembolso 25% en multa' },
      { level: 3, name: 'Ex-Militar', salary: 18, hireCost: 140, perk: 'Riesgo x0.5, reembolso 50% en multa' },
      { level: 4, name: 'Agente Intel.', salary: 30, hireCost: 400, perk: 'Riesgo x0.3, reembolso 70% en multa' },
      { level: 5, name: 'Ejército Priv.', salary: 48, hireCost: 1000, perk: 'Riesgo x0.15, reembolso 90% en multa' },
    ],
  },
  {
    type: 'researcher',
    label: 'Investigador',
    icon: '🔬',
    description: 'Mejora la calidad y acelera el crecimiento',
    needsSpace: false,
    maxCount: 1,
    levels: [
      { level: 1, name: 'Biólogo', salary: 6, hireCost: 30, perk: '+5% velocidad, +5% calidad' },
      { level: 2, name: 'Científico', salary: 12, hireCost: 80, perk: '+10% velocidad, +10% calidad' },
      { level: 3, name: 'Doctor', salary: 25, hireCost: 200, perk: '+15% velocidad, +20% calidad' },
      { level: 4, name: 'Premio Nobel', salary: 40, hireCost: 550, perk: '+20% velocidad, +35% calidad' },
      { level: 5, name: 'Científico Loco', salary: 65, hireCost: 1400, perk: '+25% velocidad, +50% calidad' },
    ],
  },
];

function useCountdown(targetTime: string | null, intervalMinutes: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  if (!targetTime) return { progress: 100, remaining: 0, nextPayday: null };

  const last = new Date(targetTime).getTime();
  const next = last + intervalMinutes * 60 * 1000;
  const remaining = next - now;
  const total = intervalMinutes * 60 * 1000;
  const progress = Math.min(100, Math.max(0, ((total - remaining) / total) * 100));
  const remainingMinutes = Math.max(0, remaining / 60000);

  return { progress, remaining: remainingMinutes, nextPayday: next };
}

export default function StaffPanel() {
  const gameState = useGameStore((s) => s.gameState);
  const hireStaff = useGameStore((s) => s.hireStaff);
  const assignStaff = useGameStore((s) => s.assignStaff);
  const fireStaff = useGameStore((s) => s.fireStaff);
  const [selectedType, setSelectedType] = useState<StaffType | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  if (!gameState) return null;

  const totalSalary = gameState.staff.reduce((sum, s) => sum + s.salary, 0);
  const staffTypeInfo = STAFF_TYPES.find(t => t.type === selectedType);
  const { progress: payProgress, remaining: payRemaining } = useCountdown(
    gameState.lastSalaryPaid,
    SALARY_INTERVAL
  );

  const handleHire = async () => {
    if (!selectedType) return;
    const spaceId = staffTypeInfo?.needsSpace ? selectedSpaceId || gameState.growSpaces[0]?.id : undefined;
    const success = await hireStaff(selectedType, selectedLevel, spaceId);
    if (success) {
      setSelectedType(null);
      setSelectedLevel(1);
      setSelectedSpaceId(null);
    }
  };

  const handleAssign = (staffId: string, growSpaceId: string) => {
    assignStaff(staffId, growSpaceId);
  };

  const payRemainingMin = Math.floor(payRemaining);
  const payRemainingSec = Math.floor((payRemaining - payRemainingMin) * 60);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-grow-white">Personal</h2>
        <p className="text-grow-muted text-sm mt-1">Contrata empleados para automatizar tu imperio</p>
      </div>

      {gameState.staff.length > 0 && (
        <div className="card-grow p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <span className="text-sm text-grow-white font-semibold">Nómina</span>
              <span className="text-grow-green font-bold">{formatMoney(totalSalary)}</span>
              <span className="text-xs text-grow-muted">cada {SALARY_INTERVAL}min</span>
            </div>
            <div className="text-xs text-grow-muted">
              {payRemaining > 0 ? (
                <span>Próx. cobro en {payRemainingMin}:{String(payRemainingSec).padStart(2, '0')}</span>
              ) : (
                <span className="text-grow-green font-bold">Cobrando ahora...</span>
              )}
            </div>
          </div>

          <div className="progress-bar h-2 mb-3">
            <div
              className="progress-fill bg-grow-amber"
              style={{ width: `${payProgress}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-1 text-xs text-grow-muted">
            {gameState.staff.map((s) => (
              <span key={s.id} className="badge badge-green">
                {STAFF_TYPES.find(t => t.type === s.type)?.icon} ${s.salary}
              </span>
            ))}
          </div>
        </div>
      )}

      {gameState.staff.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-grow-muted uppercase tracking-wider mb-3">Contratados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gameState.staff.map((member) => {
              const typeInfo = STAFF_TYPES.find(t => t.type === member.type);
              const assignedSpace = gameState.growSpaces.find(gs => gs.id === member.assignedGrowSpaceId);

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card-grow p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{typeInfo?.icon}</span>
                      <div>
                        <p className="font-medium text-grow-white text-sm">{member.name}</p>
                        <p className="text-xs text-grow-muted">
                          Nv.{member.level} · 💰 {formatMoney(member.salary)}/30min
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => fireStaff(member.id)}
                      className="btn-danger text-xs py-1 px-2"
                    >
                      X
                    </button>
                  </div>

                  {typeInfo?.needsSpace && (
                    <div className="mt-2 pt-2 border-t border-grow-border/30">
                      <p className="text-xs text-grow-muted mb-1">Asignado a:</p>
                      <div className="flex gap-1 flex-wrap">
                        {gameState.growSpaces.map((space) => (
                          <button
                            key={space.id}
                            onClick={() => handleAssign(member.id, space.id)}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              member.assignedGrowSpaceId === space.id
                                ? 'bg-grow-green/20 text-grow-green border border-grow-green/40'
                                : 'bg-grow-darker text-grow-muted hover:text-grow-white border border-grow-border/30'
                            }`}
                          >
                            {space.name}
                          </button>
                        ))}
                      </div>
                      {assignedSpace && (
                        <p className="text-xs text-grow-green mt-1">
                          Cuidando {gameState.plants.filter(p => p.growSpaceId === assignedSpace.id && !p.harvestedAt).length} plantas
                        </p>
                      )}
                    </div>
                  )}
                  {!typeInfo?.needsSpace && member.type !== 'grower' && (
                    <div className="mt-2 pt-2 border-t border-grow-border/30">
                      <p className="text-xs text-grow-muted">
                        {typeInfo?.levels[member.level - 1]?.perk || 'Activo'}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-grow-muted uppercase tracking-wider mb-3">Contratar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STAFF_TYPES.map((staffType) => {
            const count = gameState.staff.filter(s => s.type === staffType.type).length;
            const maxed = count >= staffType.maxCount;
            const hired = gameState.staff.find(s => s.type === staffType.type);
            const currentLevel = hired?.level || 0;

            return (
              <div
                key={staffType.type}
                className={`card-grow p-5 transition-all cursor-pointer ${
                  selectedType === staffType.type ? 'border-grow-green shadow-grow' : 'hover:border-grow-green/30'
                } ${maxed && currentLevel >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !(maxed && currentLevel >= 5) && setSelectedType(staffType.type)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{staffType.icon}</span>
                  <div>
                    <h4 className="font-display font-bold text-grow-white">{staffType.label}</h4>
                    <p className="text-xs text-grow-muted">
                      {hired ? `Contratado Nv.${currentLevel}` : `${count}/${staffType.maxCount} contratados`}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-grow-muted mb-4">{staffType.description}</p>

                <div className="space-y-2">
                  {staffType.levels.map((lvl) => {
                    const isUpgrade = currentLevel > 0 && lvl.level > currentLevel;
                    const lvlCost = isUpgrade
                      ? lvl.hireCost - staffType.levels[currentLevel - 1].hireCost
                      : lvl.hireCost;

                    return (
                      <div
                        key={lvl.level}
                        className={`p-2 rounded-lg text-xs flex justify-between items-center transition-colors ${
                          selectedType === staffType.type && selectedLevel === lvl.level
                            ? 'bg-grow-green/10 border border-grow-green/30'
                            : 'bg-grow-darker'
                        } ${lvl.level <= currentLevel ? 'opacity-40' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (lvl.level > currentLevel) setSelectedLevel(lvl.level);
                        }}
                      >
                        <div>
                          <p className="text-grow-white font-medium">
                            {lvl.name} {lvl.level <= currentLevel ? '(Ya contratado)' : `Nv.${lvl.level}`}
                          </p>
                          <p className="text-grow-muted">{lvl.perk}</p>
                        </div>
                        <div className="text-right">
                          {lvl.level > currentLevel && (
                            <p className="text-grow-green font-bold">{formatMoney(lvlCost)}</p>
                          )}
                          <p className="text-grow-muted">💰 {formatMoney(lvl.salary)}/30min</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 card-grow p-5 shadow-grow-lg z-40 w-full max-w-xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{staffTypeInfo?.icon}</span>
            <div>
              <p className="text-grow-white font-bold">
                Contratar {staffTypeInfo?.label} Nivel {selectedLevel}
              </p>
              <p className="text-grow-green text-sm">
                {formatMoney(staffTypeInfo?.levels[selectedLevel - 1]?.hireCost || 0)}
              </p>
            </div>
          </div>

          {staffTypeInfo?.needsSpace && (
            <div className="mb-3">
              <p className="text-xs text-grow-muted mb-1.5">Asignar a espacio:</p>
              <div className="flex gap-2">
                {gameState.growSpaces.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => setSelectedSpaceId(space.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      selectedSpaceId === space.id || (!selectedSpaceId && gameState.growSpaces.indexOf(space) === 0)
                        ? 'bg-grow-green/20 text-grow-green border border-grow-green/40'
                        : 'bg-grow-darker text-grow-muted hover:text-grow-white border border-grow-border/30'
                    }`}
                  >
                    {space.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button onClick={() => { setSelectedType(null); setSelectedSpaceId(null); }} className="btn-ghost text-sm">
              Cancelar
            </button>
            <button onClick={handleHire} className="btn-primary text-sm">
              Contratar
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
