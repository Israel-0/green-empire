import { create } from 'zustand';
import api, { ApiResponse } from '../services/api';
import {
  GameState,
  Plant,
  InventoryItem,
  Strain,
  MarketPrice,
  StaffMember,
  GameEvent,
  Transaction,
  Achievement,
  SellMethod,
} from '../types/game';

interface GameStore {
  token: string | null;
  user: { id: string; username: string } | null;
  gameState: GameState | null;
  strains: Strain[];
  marketPrices: MarketPrice[];
  loading: boolean;
  error: string | null;
  lastRepGain: number | null;
  sellMethodCounts: Record<string, number>;
  pestsCured: number;
  upgradeSpent: number;
  newAchievement: { name: string; icon: string } | null;

  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadGame: () => Promise<void>;
  silentRefresh: () => Promise<void>;
  loadStrains: () => Promise<void>;
  loadPrices: () => Promise<void>;
  plantSeed: (strainId: string, growSpaceId: string) => Promise<boolean>;
  waterPlant: (plantId: string) => Promise<void>;
  nutrientPlant: (plantId: string) => Promise<void>;
  carePlant: (plantId: string) => Promise<void>;
  harvestPlant: (plantId: string) => Promise<any>;
  treatPlant: (plantId: string) => Promise<void>;
  sellInventory: (itemId: string, quantity: number, method: SellMethod) => Promise<boolean>;
  buySeed: (strainId: string, quantity: number) => Promise<boolean>;
  upgradeSpace: (growSpaceId: string) => Promise<boolean>;
  upgradeEquipment: (growSpaceId: string, equipmentType: string) => Promise<boolean>;
  hireStaff: (type: string, level: number, growSpaceId?: string) => Promise<boolean>;
  assignStaff: (staffId: string, growSpaceId: string | null) => Promise<void>;
  fireStaff: (staffId: string) => Promise<void>;
  resolveEvent: (eventId: string) => Promise<void>;
  loadEvents: () => Promise<void>;
  setError: (error: string | null) => void;
  toggleAutoPlant: () => Promise<void>;
  deletePlant: (plantId: string) => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  token: localStorage.getItem('token'),
  user: null,
  gameState: null,
  strains: [],
  marketPrices: [],
  loading: false,
  error: null,
  lastRepGain: null,
  sellMethodCounts: {},
  pestsCured: 0,
  upgradeSpent: 0,
  newAchievement: null,

  setError: (error) => set({ error }),

  toggleAutoPlant: async () => {
    try {
      const res = await api.post<ApiResponse<{ autoPlantEnabled: boolean }>>('/game/auto-plant/toggle');
      if (res.data.success && res.data.data) {
        set((state) => ({
          gameState: state.gameState ? { ...state.gameState, autoPlantEnabled: res.data.data!.autoPlantEnabled } : null,
        }));
      }
    } catch {}
  },

  deletePlant: async (plantId) => {
    try {
      await api.delete(`/plants/${plantId}`);
      await get().silentRefresh();
    } catch {}
  },

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post<ApiResponse<{ user: any; token: string }>>('/auth/login', { username, password });
      if (res.data.success && res.data.data) {
        localStorage.setItem('token', res.data.data.token);
        set({ token: res.data.data.token, user: res.data.data.user, loading: false });
        return true;
      }
      set({ error: res.data.error, loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Error al iniciar sesión', loading: false });
      return false;
    }
  },

  register: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post<ApiResponse<{ user: any; token: string }>>('/auth/register', { username, password });
      if (res.data.success && res.data.data) {
        localStorage.setItem('token', res.data.data.token);
        set({ token: res.data.data.token, user: res.data.data.user, loading: false });
        return true;
      }
      set({ error: res.data.error, loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Error al registrarse', loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, gameState: null });
  },

  loadGame: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<ApiResponse<GameState>>('/game/state');
      if (res.data.success && res.data.data) {
        set({ gameState: res.data.data, loading: false });
      } else {
        set({ error: res.data.error, loading: false });
      }
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Error al cargar juego', loading: false });
    }
  },

  silentRefresh: async () => {
    try {
      const res = await api.get<ApiResponse<GameState>>('/game/state');
      if (res.data.success && res.data.data) {
        set({ gameState: res.data.data });
      }
    } catch {
      // silent
    }
  },

  loadStrains: async () => {
    try {
      const res = await api.get<ApiResponse<Strain[]>>('/shop/strains');
      if (res.data.success && res.data.data) {
        set({ strains: res.data.data });
      }
    } catch {}
  },

  loadPrices: async () => {
    try {
      const res = await api.get<ApiResponse<MarketPrice[]>>('/market/prices');
      if (res.data.success && res.data.data) {
        set({ marketPrices: res.data.data });
      }
    } catch {}
  },

  plantSeed: async (strainId, growSpaceId) => {
    try {
      const res = await api.post<ApiResponse<Plant>>('/plants/plant', { strainId, growSpaceId });
      if (res.data.success) {
        await get().silentRefresh();
        return true;
      }
      set({ error: res.data.error });
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Error al plantar' });
      return false;
    }
  },

  waterPlant: async (plantId) => {
    try {
      const res = await api.post(`/plants/${plantId}/water`);
      if (res.data.success && res.data.data) {
        const updated = res.data.data;
        set((state) => ({
          gameState: state.gameState ? {
            ...state.gameState,
            plants: state.gameState.plants.map(p =>
              p.id === plantId ? { ...p, waterLevel: updated.waterLevel } : p
            ),
          } : null,
        }));
      }
    } catch (err: any) {
      set({ error: err.response?.data?.error });
    }
  },

  nutrientPlant: async (plantId) => {
    try {
      const res = await api.post(`/plants/${plantId}/nutrient`);
      if (res.data.success && res.data.data) {
        const updated = res.data.data;
        set((state) => ({
          gameState: state.gameState ? {
            ...state.gameState,
            plants: state.gameState.plants.map(p =>
              p.id === plantId ? { ...p, nutrientLevel: updated.nutrientLevel } : p
            ),
          } : null,
        }));
      }
    } catch (err: any) {
      set({ error: err.response?.data?.error });
    }
  },

  carePlant: async (plantId) => {
    try {
      const res = await api.post(`/plants/${plantId}/care`);
      if (res.data.success && res.data.data) {
        const updated = res.data.data;
        set((state) => ({
          gameState: state.gameState ? {
            ...state.gameState,
            plants: state.gameState.plants.map(p =>
              p.id === plantId ? {
                ...p,
                waterLevel: updated.waterLevel,
                nutrientLevel: updated.nutrientLevel,
                health: updated.health,
              } : p
            ),
          } : null,
        }));
      }
    } catch (err: any) {
      set({ error: err.response?.data?.error });
    }
  },

  harvestPlant: async (plantId) => {
    try {
      const res = await api.post<ApiResponse<any>>(`/plants/${plantId}/harvest`);
      await get().silentRefresh();
      return res.data.data;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Error al cosechar' });
      return null;
    }
  },

  treatPlant: async (plantId) => {
    try {
      const res = await api.post(`/plants/${plantId}/treat`);
      if (res.data.success && res.data.data) {
        const { cost, ...updated } = res.data.data;
        set((state) => ({
          gameState: state.gameState ? {
            ...state.gameState,
            money: state.gameState.money - (cost || 15),
            plants: state.gameState.plants.map(p =>
              p.id === plantId ? { ...p, hasPests: false, health: updated.health } : p
            ),
          } : null,
          pestsCured: state.pestsCured + 1,
        }));
      }
    } catch (err: any) {
      set({ error: err.response?.data?.error });
    }
  },

  sellInventory: async (itemId, quantity, method) => {
    try {
      const res = await api.post<ApiResponse<any>>('/market/sell', { inventoryItemId: itemId, quantity, method });
      if (res.data.success) {
        const repGain = res.data.data?.reputationGained;
        if (typeof repGain === 'number') {
          set({ lastRepGain: repGain });
          setTimeout(() => set({ lastRepGain: null }), 4000);
        }
        const counts = { ...get().sellMethodCounts };
        counts[method] = (counts[method] || 0) + 1;
        set({ sellMethodCounts: counts });
        await get().silentRefresh();
        return true;
      }
      set({ error: res.data.error });
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Error al vender' });
      return false;
    }
  },

  buySeed: async (strainId, quantity) => {
    try {
      const res = await api.post<ApiResponse<any>>('/shop/buy', { strainId, quantity });
      if (res.data.success) {
        await get().silentRefresh();
        return true;
      }
      set({ error: res.data.error });
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Error al comprar' });
      return false;
    }
  },

  upgradeSpace: async (growSpaceId) => {
    try {
      const res = await api.post('/expansion/space/upgrade', { growSpaceId });
      if (res.data.success) {
        await get().silentRefresh();
        return true;
      }
      set({ error: res.data.error });
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Error al mejorar' });
      return false;
    }
  },

  upgradeEquipment: async (growSpaceId, equipmentType) => {
    try {
      const res = await api.post('/expansion/equipment/upgrade', { growSpaceId, equipmentType });
      if (res.data.success) {
        await get().silentRefresh();
        return true;
      }
      set({ error: res.data.error });
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Error al mejorar equipo' });
      return false;
    }
  },

  hireStaff: async (type, level, growSpaceId) => {
    try {
      const res = await api.post('/staff/hire', { type, level, growSpaceId });
      if (res.data.success) {
        await get().silentRefresh();
        return true;
      }
      set({ error: res.data.error });
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Error al contratar' });
      return false;
    }
  },

  assignStaff: async (staffId, growSpaceId) => {
    try {
      await api.post('/staff/assign', { staffId, growSpaceId });
      await get().silentRefresh();
    } catch (err: any) {
      set({ error: err.response?.data?.error });
    }
  },

  fireStaff: async (staffId) => {
    try {
      await api.post('/staff/fire', { staffId });
      await get().silentRefresh();
    } catch (err: any) {
      set({ error: err.response?.data?.error });
    }
  },

  resolveEvent: async (eventId) => {
    try {
      await api.post(`/events/${eventId}/resolve`);
      await get().silentRefresh();
    } catch (err: any) {
      set({ error: err.response?.data?.error });
    }
  },

  loadEvents: async () => {
    try {
      const res = await api.get<ApiResponse<GameEvent[]>>('/events');
      if (res.data.success && res.data.data && get().gameState) {
        set({ gameState: { ...get().gameState!, activeEvents: res.data.data } });
      }
    } catch {}
  },
}));
