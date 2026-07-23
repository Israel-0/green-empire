import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/formatting';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function EventLog() {
  const { gameState } = useGameStore();
  const [collapsed, setCollapsed] = useState(true);

  if (!gameState) return null;

  const events = gameState.activeEvents || [];
  const transactions = gameState.transactions || [];
  const unresolvedEvents = events.filter(e => !e.resolved);

  const severityColors: Record<string, string> = {
    info: 'border-l-grow-blue text-grow-blue',
    warning: 'border-l-grow-amber text-grow-amber',
    danger: 'border-l-grow-red text-grow-red',
    success: 'border-l-grow-green text-grow-green',
    legendary: 'border-l-grow-gold text-grow-gold',
  };

  const severityIcons: Record<string, string> = {
    info: 'ℹ️',
    warning: '⚠️',
    danger: '🚨',
    success: '✅',
    legendary: '👑',
  };

  if (collapsed) {
    return (
      <div className="w-12 bg-grow-panel border-l border-grow-border flex flex-col items-center py-4 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="text-grow-muted hover:text-grow-white transition-colors text-sm mb-4"
          title="Expandir registro"
        >
          ◀
        </button>
        {unresolvedEvents.length > 0 && (
          <span className="badge badge-red text-xs mb-2">{unresolvedEvents.length}</span>
        )}
      </div>
    );
  }

  return (
    <div className="w-72 bg-grow-panel border-l border-grow-border flex flex-col shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-grow-border">
        <h3 className="font-display font-bold text-sm text-grow-white">Registro</h3>
        <button
          onClick={() => setCollapsed(true)}
          className="text-grow-muted hover:text-grow-white transition-colors text-sm"
        >
          ▶
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {unresolvedEvents.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-grow-muted mb-2 uppercase tracking-wider">Eventos activos</p>
            {unresolvedEvents.map((event) => (
              <div
                key={event.id}
                className={`bg-grow-darker border-l-2 ${severityColors[event.severity] || 'border-l-grow-muted'} rounded-r-lg p-2 mb-2`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm">{severityIcons[event.severity] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{event.message}</p>
                    {event.reward && <p className="text-xs text-grow-green mt-1">+{formatMoney(event.reward)}</p>}
                    {event.penalty && <p className="text-xs text-grow-red mt-1">-{formatMoney(event.penalty)}</p>}
                    <p className="text-xs text-grow-muted mt-1">
                      {new Date(event.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-grow-muted mb-2 uppercase tracking-wider">Transacciones</p>
        {transactions.slice(0, 20).map((tx) => (
          <div key={tx.id} className="flex items-center justify-between text-xs py-1.5 border-b border-grow-border/30">
            <div className="flex-1 min-w-0">
              <p className="text-grow-white truncate">{tx.description}</p>
              <p className="text-grow-muted">{new Date(tx.createdAt).toLocaleTimeString()}</p>
            </div>
            <span className={`font-mono font-bold ml-2 ${
              tx.amount > 0 ? 'text-grow-green' :
              tx.amount < 0 ? 'text-grow-red' : 'text-grow-muted'
            }`}>
              {tx.amount > 0 ? '+' : ''}{formatMoney(tx.amount)}
            </span>
          </div>
        ))}

        {transactions.length === 0 && (
          <p className="text-xs text-grow-muted text-center py-4">Sin transacciones</p>
        )}
      </div>
    </div>
  );
}
