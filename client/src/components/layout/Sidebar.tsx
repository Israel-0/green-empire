import { useGameStore } from '../../store/gameStore';

type Tab = 'garden' | 'inventory' | 'shop' | 'market' | 'staff' | 'expansion' | 'stats';

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'garden', label: 'Cultivo', icon: '🌿' },
  { id: 'inventory', label: 'Inventario', icon: '📦' },
  { id: 'shop', label: 'Tienda', icon: '🛒' },
  { id: 'market', label: 'Mercado', icon: '📈' },
  { id: 'staff', label: 'Personal', icon: '👥' },
  { id: 'expansion', label: 'Expansión', icon: '🏗️' },
  { id: 'stats', label: 'Estadísticas', icon: '🏆' },
];

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { gameState } = useGameStore();
  const plantCount = gameState?.plants.filter(p => !p.harvestedAt).length || 0;

  return (
    <aside className="w-56 bg-grow-panel border-r border-grow-border flex flex-col py-4 shrink-0">
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-grow-green/10 text-grow-green border border-grow-green/30 shadow-grow'
                : 'text-grow-muted hover:text-grow-white hover:bg-grow-border/30'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
            {item.id === 'garden' && plantCount > 0 && (
              <span className="ml-auto badge badge-green">{plantCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-4 pt-4 border-t border-grow-border mt-2">
        <p className="text-xs text-grow-muted text-center">
          Green Empire v1.0
        </p>
      </div>
    </aside>
  );
}
