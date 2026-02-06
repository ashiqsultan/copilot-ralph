import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // State
  folderPath: null,
  hasPrdFile: false,
  prdItems: [],

  // Executor state
  isRunning: false,
  outputLines: [],
  workingItemId: null,

  // Planner state
  isPlanRunning: false,

  // Copilot Settings Modal
  isCopilotSettingsOpen: false,

  // Getters
  getFolderPath: () => get().folderPath,
  getHasPrdFile: () => get().hasPrdFile,
  getPrdItems: () => get().prdItems,
  getNextItem: () => {
    const items = get().prdItems;
    if (Array.isArray(items)) {
      return items.find((item) => !item.isDone) || null;
    }
    return null;
  },
  getStatusText: () => get().statusText,

  // Setters
  setFolderPath: (path) => set({ folderPath: path }),
  clearFolderPath: () => set({ folderPath: null }),
  setHasPrdFile: (hasPrd) => set({ hasPrdFile: hasPrd }),
  setPrdItems: (items) => {
    // Handle both array and single object (legacy format)
    if (Array.isArray(items)) {
      set({ prdItems: items });
    } else if (items && typeof items === 'object') {
      set({ prdItems: [items] });
    } else {
      set({ prdItems: [] });
    }
  },
  addPrdItem: (item) => set((state) => ({ prdItems: [...state.prdItems, item] })),
  updatePrdItem: (id, updates) =>
    set((state) => ({
      prdItems: state.prdItems.map((item) => (item.id === id ? { ...item, ...updates } : item))
    })),
  deletePrdItem: (id) =>
    set((state) => ({
      prdItems: state.prdItems.filter((item) => item.id !== id)
    })),
  clearPrdData: () => set({ hasPrdFile: false, prdItems: [] }),

  // Copilot Settings setters
  setIsCopilotSettingsOpen: (isOpen) => set({ isCopilotSettingsOpen: isOpen }),

  // Executor setters
  setIsRunning: (running) => set({ isRunning: running }),
  setWorkingItemId: (id) => set({ workingItemId: id }),

  // Planner setters
  setIsPlanRunning: (running) => set({ isPlanRunning: running }),
  appendOutputLine: (text, type = 'stdout') =>
    set((state) => ({
      outputLines: [...state.outputLines, { text, type, id: Date.now() + Math.random() }]
    })),
  clearOutput: () => set({ outputLines: [] }),
  resetExecutor: () =>
    set({
      isRunning: false,
      workingItemId: null,
      outputLines: []
    })
}));
