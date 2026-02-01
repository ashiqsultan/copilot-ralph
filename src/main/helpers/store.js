import Store from 'electron-store';

const store = new Store({
  name: 'copilot-ralph-settings',
  defaults: {
    copilotPath: null,
    prd_executor_model: null
  }
});

export const COPILOT_PATH = 'copilotPath';
export const PRD_EXECUTOR_MODEL = 'prd_executor_model';

export const getStoredCopilotPath = () => {
  return store.get(COPILOT_PATH);
};

export const setStoredCopilotPath = (path) => {
  store.set(COPILOT_PATH, path);
};

export const clearStoredCopilotPath = () => {
  store.delete(COPILOT_PATH);
};

export const getPrdExecutorModel = () => {
  return store.get(PRD_EXECUTOR_MODEL);
};

export const setPrdExecutorModel = (model) => {
  store.set(PRD_EXECUTOR_MODEL, model);
};

export const getAllSettings = () => {
  return store.store;
};

export const clearAllSettings = () => {
  store.clear();
};

export default store;
