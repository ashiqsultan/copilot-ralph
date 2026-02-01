import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import path from 'node:path'
import fs from 'node:fs/promises'
import { executeCommand, abortCurrentProcess, isProcessRunning, getCurrentProcessInfo } from './ai_runner'
import { checkCopilotStatus, getCopilotPath, cleanupCopilotClient, getAvailableModels } from './copilot_client'
import { getStoredCopilotPath, setStoredCopilotPath, getPrdExecutorModel, setPrdExecutorModel } from './helpers/store'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // Clean up Copilot client on quit
  cleanupCopilotClient()
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// IPC handler for opening folder dialog
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })

  if (result.canceled) {
    return null
  }

  return result.filePaths[0]
})

// IPC handler for creating a new project
ipcMain.handle('dialog:createNewProject', async (event, projectName) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Parent Folder for New Project',
    buttonLabel: 'Select Folder'
  })

  if (result.canceled) {
    return null
  }

  const parentFolder = result.filePaths[0]
  const projectPath = path.join(parentFolder, projectName)

  try {
    await fs.mkdir(projectPath, { recursive: true })
    return projectPath
  } catch (error) {
    console.error('Error creating project folder:', error)
    throw error
  }
})

// IPC handler for opening folder in explorer (cross-platform)
ipcMain.handle('dialog:openInExplorer', async (event, folderPath) => {
  try {
    await shell.openPath(folderPath)
  } catch (error) {
    console.error('Error opening folder in explorer:', error)
    throw error
  }
})

ipcMain.handle('fs:readPrdFile', async (event, folderPath) => {
  try {
    const prdPath = path.join(folderPath, '.copilot_ralph', 'prd.json')
    const content = await fs.readFile(prdPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    return null
  }
})

ipcMain.handle('fs:createPrdFile', async (event, folderPath, content) => {
  try {
    const copilotRalphDir = path.join(folderPath, '.copilot_ralph')
    await fs.mkdir(copilotRalphDir, { recursive: true })
    const prdPath = path.join(copilotRalphDir, 'prd.json')
    await fs.writeFile(prdPath, content, 'utf-8')
    return true
  } catch (error) {
    console.error('Error creating prd.json:', error)
    return false
  }
})

ipcMain.handle('fs:savePrdFile', async (event, folderPath, content) => {
  try {
    const copilotRalphDir = path.join(folderPath, '.copilot_ralph')
    await fs.mkdir(copilotRalphDir, { recursive: true })
    const prdPath = path.join(copilotRalphDir, 'prd.json')
    await fs.writeFile(prdPath, content, 'utf-8')
    return true
  } catch (error) {
    console.error('Error saving prd.json:', error)
    return false
  }
})

// IPC handler for executing CLI commands
ipcMain.handle('executor:run', async (event, requirementId, folderPath) => {
  return executeCommand(requirementId, folderPath)
})

// IPC handler for aborting the current running process
ipcMain.handle('executor:abort', async () => {
  return abortCurrentProcess()
})

// IPC handler for checking if a process is currently running
ipcMain.handle('executor:isRunning', async () => {
  return isProcessRunning()
})

// IPC handler for getting current process info (for debugging)
ipcMain.handle('executor:getProcessInfo', async () => {
  return getCurrentProcessInfo()
})

// IPC handler for checking Copilot login status
ipcMain.handle('check-copilot-login', async () => {
  return checkCopilotStatus()
})

// IPC handler for getting Copilot CLI path
ipcMain.handle('select-copilot-path', async () => {
  const copilotPath = getCopilotPath()
  return copilotPath && copilotPath !== 'copilot' ? copilotPath : null
})

// IPC handler for saving Copilot path (for future persistence)
ipcMain.handle('save-copilot-path', async (event, customPath) => {
  // Validate the path exists and save to electron-store
  try {
    const stats = await fs.stat(customPath)
    if (stats.isFile()) {
      setStoredCopilotPath(customPath)
      return { success: true, message: 'Path saved successfully' }
    }
    return { success: false, message: 'Path is not a valid file' }
  } catch (error) {
    return { success: false, message: `Path validation failed: ${error.message}` }
  }
})

// IPC handler for getting available models
ipcMain.handle('get-available-models', async () => {
  return getAvailableModels()
})

// IPC handler for getting stored executor model
ipcMain.handle('get-prd-executor-model', async () => {
  return getPrdExecutorModel()
})

// IPC handler for setting executor model
ipcMain.handle('set-prd-executor-model', async (event, model) => {
  setPrdExecutorModel(model)
  return { success: true }
})
