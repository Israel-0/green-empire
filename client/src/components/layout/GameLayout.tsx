import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import Header from './Header';
import Sidebar from './Sidebar';
import PlantGrid from '../garden/PlantGrid';
import InventoryPanel from '../market/InventoryPanel';
import SeedShop from '../shop/SeedShop';
import MarketPanel from '../market/MarketPanel';
import StaffPanel from '../staff/StaffPanel';
import ExpansionPanel from '../expansion/ExpansionPanel';
import StatsPanel from '../stats/StatsPanel';
import EventLog from '../events/EventLog';
import Notification from '../ui/Notification';
import AchievementToast from '../ui/AchievementToast';

type Tab = 'garden' | 'inventory' | 'shop' | 'market' | 'staff' | 'expansion' | 'stats';

export default function GameLayout() {
  const gameState = useGameStore((s) => s.gameState);
  const error = useGameStore((s) => s.error);
  const setError = useGameStore((s) => s.setError);
  const [activeTab, setActiveTab] = useState<Tab>('garden');

  if (!gameState) {
    return (
      <div className="min-h-screen bg-grow-darker flex items-center justify-center">
        <p className="text-grow-muted">Sin estado de juego</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-grow-darker">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'garden' && <PlantGrid />}
          {activeTab === 'inventory' && <InventoryPanel />}
          {activeTab === 'shop' && <SeedShop />}
          {activeTab === 'market' && <MarketPanel />}
          {activeTab === 'staff' && <StaffPanel />}
          {activeTab === 'expansion' && <ExpansionPanel />}
          {activeTab === 'stats' && <StatsPanel />}
        </main>
        <EventLog />
      </div>
      {error && <Notification message={error} type="error" onClose={() => setError(null)} />}
      <AchievementToast />
    </div>
  );
}
