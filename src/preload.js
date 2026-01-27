// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Existing file operations
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  readPrdFile: (folderPath) => ipcRenderer.invoke('fs:readPrdFile', folderPath),
  createPrdFile: (folderPath, content) => ipcRenderer.invoke('fs:createPrdFile', folderPath, content),
  savePrdFile: (folderPath, content) => ipcRenderer.invoke('fs:savePrdFile', folderPath, content),

  // Executor - CLI command execution
  executeCommand: (prompt, folderPath) => ipcRenderer.invoke('executor:run', prompt, folderPath),

  // Event listeners for streaming output
  onExecutorOutput: (callback) => {
    ipcRenderer.on('executor:stdout', (event, data) => callback(data));
  },
  onExecutorError: (callback) => {
    ipcRenderer.on('executor:stderr', (event, data) => callback(data));
  },
  onExecutorComplete: (callback) => {
    ipcRenderer.on('executor:complete', (event, result) => callback(result));
  },

  // Remove listeners (for cleanup)
  removeExecutorListeners: () => {
    ipcRenderer.removeAllListeners('executor:stdout');
    ipcRenderer.removeAllListeners('executor:stderr');
    ipcRenderer.removeAllListeners('executor:complete');
  }
});
