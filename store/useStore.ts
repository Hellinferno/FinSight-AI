import { create } from 'zustand';
import { AppView, Scenario } from '../types';
import { DEFAULT_SCENARIO, OPTIMISTIC_SCENARIO, PESSIMISTIC_SCENARIO } from '../constants';

interface AppState {
  // User State
  user: any | null;
  setUser: (user: any) => void;

  // Subscription State
  isPro: boolean;
  setProStatus: (status: boolean) => void;

  // View State
  currentView: AppView;
  setView: (view: AppView) => void;

  // Scenario State
  scenarios: Scenario[];
  activeScenarioId: string;
  setScenarios: (scenarios: Scenario[]) => void;
  setActiveScenarioId: (id: string) => void;
  addScenario: (scenario: Scenario) => void;
  
  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  isPro: false,
  setProStatus: (status) => set({ isPro: status }),

  currentView: AppView.DASHBOARD,
  setView: (view) => set({ currentView: view }),

  scenarios: [DEFAULT_SCENARIO, OPTIMISTIC_SCENARIO, PESSIMISTIC_SCENARIO],
  activeScenarioId: DEFAULT_SCENARIO.id,
  setScenarios: (scenarios) => set({ scenarios }),
  setActiveScenarioId: (id) => set({ activeScenarioId: id }),
  addScenario: (scenario) => set((state) => ({ scenarios: [...state.scenarios, scenario] })),

  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
}));