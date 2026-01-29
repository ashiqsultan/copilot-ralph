import { create } from 'zustand'

export const useAppStore = create((set, get) => ({
  // State
  folderPath: null,

  // Getters
  getFolderPath: () => get().folderPath,

  // Setters
  setFolderPath: (path) => set({ folderPath: path }),
  clearFolderPath: () => set({ folderPath: null }),
}))