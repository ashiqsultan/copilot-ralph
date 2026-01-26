// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  readPrdFile: (folderPath) => ipcRenderer.invoke('fs:readPrdFile', folderPath),
  createPrdFile: (folderPath, content) => ipcRenderer.invoke('fs:createPrdFile', folderPath, content),
  savePrdFile: (folderPath, content) => ipcRenderer.invoke('fs:savePrdFile', folderPath, content)
});
