import Store from 'electron-store';

const store = new Store({
  name: 'copilot-ralph-settings',
  defaults: {
    copilotPath: null
  }
});

export const COPILOT_PATH = 'copilotPath';

export const getStoredCopilotPath = () => {
  return store.get(COPILOT_PATH);
};

export const setStoredCopilotPath = (path) => {
  store.set(COPILOT_PATH, path);
};

export const clearStoredCopilotPath = () => {
  store.delete(COPILOT_PATH);
};

export const getAllSettings = () => {
  return store.store;
};

export const clearAllSettings = () => {
  store.clear();
};

export default store;
