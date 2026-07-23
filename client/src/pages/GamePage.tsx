import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import GameLayout from '../components/layout/GameLayout';
import ErrorBoundary from '../components/ui/ErrorBoundary';

export default function GamePage() {
  const token = useGameStore((s) => s.token);
  const gameState = useGameStore((s) => s.gameState);
  const loading = useGameStore((s) => s.loading);
  const error = useGameStore((s) => s.error);
  const loadGame = useGameStore((s) => s.loadGame);
  const silentRefresh = useGameStore((s) => s.silentRefresh);
  const loadStrains = useGameStore((s) => s.loadStrains);
  const loadPrices = useGameStore((s) => s.loadPrices);
  const navigate = useNavigate();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadGame();
    loadStrains();
    loadPrices();
    setInitialized(true);
  }, [token]);

  useEffect(() => {
    if (!token || !initialized) return;
    const interval = setInterval(silentRefresh, 15000);
    return () => clearInterval(interval);
  }, [token, initialized, silentRefresh]);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-grow-darker flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-float">🌿</div>
          <p className="text-grow-green animate-pulse text-lg font-medium">
            Cargando tu imperio...
          </p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-grow-darker flex items-center justify-center">
        <div className="text-center">
          <p className="text-grow-red text-lg mb-4">Error al cargar el juego</p>
          {error && <p className="text-grow-muted text-sm mb-4">{error}</p>}
          <button onClick={loadGame} className="btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <GameLayout />
    </ErrorBoundary>
  );
}
