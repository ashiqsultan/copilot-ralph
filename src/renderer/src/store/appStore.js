import { create } from 'zustand'

export const useAppStore = create((set, get) => ({
  // State
  folderPath: null,
  hasPrdFile: false,
  prdItems: [],

  // Executor state
  isRunning: false,
  executorStatus: 'idle', // 'idle' | 'running' | 'completed' | 'error'
  statusText: 'Idle',
  outputLines: [],

  // Getters
  getFolderPath: () => get().folderPath,
  getHasPrdFile: () => get().hasPrdFile,
  getPrdItems: () => get().prdItems,
  getNextItem: () => {
    const items = get().prdItems
    if (Array.isArray(items)) {
      return items.find((item) => !item.isDone) || null
    }
    return null
  },

  // Setters
  setFolderPath: (path) => set({ folderPath: path }),
  clearFolderPath: () => set({ folderPath: null }),
  setHasPrdFile: (hasPrd) => set({ hasPrdFile: hasPrd }),
  setPrdItems: (items) => {
    // Handle both array and single object (legacy format)
    if (Array.isArray(items)) {
      set({ prdItems: items })
    } else if (items && typeof items === 'object') {
      set({ prdItems: [items] })
    } else {
      set({ prdItems: [] })
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

  // Executor setters
  setIsRunning: (running) => set({ isRunning: running }),
  setExecutorStatus: (status, text) => set({ executorStatus: status, statusText: text }),
  appendOutputLine: (text, type = 'stdout') =>
    set((state) => ({
      outputLines: [...state.outputLines, { text, type, id: Date.now() + Math.random() }]
    })),
  clearOutput: () => set({ outputLines: [] }),
  resetExecutor: () =>
    set({
      isRunning: false,
      executorStatus: 'idle',
      statusText: 'Idle',
      outputLines: []
    })
}))
