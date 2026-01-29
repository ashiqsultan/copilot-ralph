import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn, execSync } from 'node:child_process'
import buildPrompt from './buildPrompt'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
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

// IPC handler for reading prd.json file
ipcMain.handle('fs:readPrdFile', async (event, folderPath) => {
  try {
    const prdPath = path.join(folderPath, 'prd.json')
    const content = await fs.readFile(prdPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    return null
  }
})

// IPC handler for creating prd.json file
ipcMain.handle('fs:createPrdFile', async (event, folderPath, content) => {
  try {
    const prdPath = path.join(folderPath, 'prd.json')
    await fs.writeFile(prdPath, content, 'utf-8')
    return true
  } catch (error) {
    console.error('Error creating prd.json:', error)
    return false
  }
})

// IPC handler for saving prd.json file
ipcMain.handle('fs:savePrdFile', async (event, folderPath, content) => {
  try {
    const prdPath = path.join(folderPath, 'prd.json')
    await fs.writeFile(prdPath, content, 'utf-8')
    return true
  } catch (error) {
    console.error('Error saving prd.json:', error)
    return false
  }
})

// Helper function to get the user's shell PATH
function getShellPath() {
  try {
    if (process.platform === 'win32') {
      // On Windows, use the system PATH
      return process.env.PATH
    }

    // On Unix-like systems, get PATH from shell
    const shell = process.env.SHELL || '/bin/zsh'
    const shellPath = execSync(`${shell} -ilc 'echo $PATH'`, {
      encoding: 'utf8',
      timeout: 5000
    }).trim()

    return shellPath
  } catch (error) {
    console.error('Error getting shell PATH:', error)
    return process.env.PATH
  }
}

// Helper function to find copilot executable
function findCopilotPath() {
  try {
    const shellPath = getShellPath()
    const command = process.platform === 'win32' ? 'where copilot' : 'which copilot'

    const result = execSync(command, {
      encoding: 'utf8',
      env: { ...process.env, PATH: shellPath },
      timeout: 5000
    }).trim()

    // On Windows, 'where' might return multiple paths, take the first one
    return process.platform === 'win32' ? result.split('\n')[0] : result
  } catch (error) {
    console.error('Error finding copilot:', error)
    return 'copilot' // Fallback to command name
  }
}

// Helper function to find git executable
function findGitPath() {
  try {
    const shellPath = getShellPath()
    const command = process.platform === 'win32' ? 'where git' : 'which git'

    const result = execSync(command, {
      encoding: 'utf8',
      env: { ...process.env, PATH: shellPath },
      timeout: 5000
    }).trim()

    return process.platform === 'win32' ? result.split('\n')[0] : result
  } catch (error) {
    console.error('Error finding git:', error)
    return null
  }
}

// Helper function to commit changes after requirement completion
async function commitRequirementChanges(folderPath, requirement) {
  const gitPath = findGitPath()
  const shellPath = getShellPath()

  if (!gitPath) {
    console.log("Can't use git - executable not found")
    return { success: false, error: "Can't use git" }
  }

  const execOptions = {
    cwd: folderPath,
    encoding: 'utf8',
    env: { ...process.env, PATH: shellPath },
    timeout: 30000
  }

  try {
    // Check if git is initialized
    try {
      execSync(`"${gitPath}" rev-parse --git-dir`, execOptions)
    } catch {
      // Git not initialized, init it
      execSync(`"${gitPath}" init`, execOptions)
      console.log('Git repository initialized')
    }

    // Stage all changes
    execSync(`"${gitPath}" add -A`, execOptions)

    // Check if there are changes to commit
    try {
      execSync(`"${gitPath}" diff --cached --quiet`, execOptions)
      // If no error, there are no changes to commit
      console.log('No changes to commit')
      return { success: true, message: 'No changes to commit' }
    } catch {
      // There are changes to commit
    }

    // Commit with requirement info
    const commitMessage = `[${requirement.id}] ${requirement.title}`
    execSync(`"${gitPath}" commit -m "${commitMessage}"`, execOptions)

    console.log(`Committed: ${commitMessage}`)
    return { success: true, message: `Committed: ${commitMessage}` }
  } catch (error) {
    console.error('Error committing changes:', error)
    return { success: false, error: error.message }
  }
}

// Helper function to read prd.json and find requirement by ID
async function getRequirementById(folderPath, requirementId) {
  try {
    const prdPath = path.join(folderPath, 'prd.json')
    const content = await fs.readFile(prdPath, 'utf-8')
    const prdContent = JSON.parse(content)

    if (Array.isArray(prdContent)) {
      return prdContent.find((item) => item.id === requirementId) || null
    }
    return null
  } catch (error) {
    console.error('Error reading requirement:', error)
    return null
  }
}

// Helper function to update requirement isDone status
async function updatePrdIsDone(folderPath, requirementId, isDone) {
  try {
    const prdPath = path.join(folderPath, 'prd.json')
    const content = await fs.readFile(prdPath, 'utf-8')
    const prdContent = JSON.parse(content)

    if (Array.isArray(prdContent)) {
      const index = prdContent.findIndex((item) => item.id === requirementId)
      if (index !== -1) {
        prdContent[index].isDone = isDone
        await fs.writeFile(prdPath, JSON.stringify(prdContent, null, 2), 'utf-8')
        return true
      }
    }
    return false
  } catch (error) {
    console.error('Error updating requirement isDone:', error)
    return false
  }
}

// Helper function to get next incomplete requirement
async function getNextIncompleteRequirement(folderPath) {
  try {
    const prdPath = path.join(folderPath, 'prd.json')
    const content = await fs.readFile(prdPath, 'utf-8')
    const prdContent = JSON.parse(content)

    if (Array.isArray(prdContent)) {
      return prdContent.find((item) => item.isDone === false) || null
    }
    return null
  } catch (error) {
    console.error('Error getting next requirement:', error)
    return null
  }
}

// IPC handler for executing CLI commands
ipcMain.handle('executor:run', async (event, requirementId, folderPath) => {
  try {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (!mainWindow) {
      return { success: false, error: 'No window available' }
    }

    if (!folderPath) {
      return { success: false, error: 'No folder path provided' }
    }

    // Get requirement from prd.json
    let requirement
    if (requirementId !== null && requirementId !== undefined) {
      requirement = await getRequirementById(folderPath, requirementId)
    } else {
      requirement = await getNextIncompleteRequirement(folderPath)
    }

    if (!requirement) {
      return { success: false, error: 'No requirement found' }
    }

    // Build the prompt from the requirement
    const prompt = buildPrompt(requirement.id, requirement.title, requirement.description)

    // Get the full path to copilot and shell PATH
    const copilotPath = findCopilotPath()
    const shellPath = getShellPath()

    // Build the command arguments
    const args = ['--yolo', '--model', 'gpt-4.1', '-i', `"${prompt}"`]

    // Spawn the copilot process with the correct environment and working directory
    const child = spawn(copilotPath, args, {
      shell: true,
      cwd: folderPath,
      env: { ...process.env, PATH: shellPath }
    })

    // Track output buffer for status detection
    let outputBuffer = ''
    let hasMarkedDone = false

    // Handle stdout - stream to renderer and detect status
    child.stdout.on('data', async (data) => {
      const text = data.toString()
      outputBuffer += text
      mainWindow.webContents.send('executor:stdout', text)

      // Check for <status>done</status> pattern (only process once)
      if (!hasMarkedDone && outputBuffer.includes('<status>done</status>')) {
        hasMarkedDone = true
        await updatePrdIsDone(folderPath, requirement.id, true)
        mainWindow.webContents.send('executor:stdout', '\n--- Requirement marked as done ---')

        // Commit changes to git
        const commitResult = await commitRequirementChanges(folderPath, requirement)
        if (commitResult.success) {
          mainWindow.webContents.send('executor:stdout', `\n--- ${commitResult.message} ---`)
        } else {
          mainWindow.webContents.send('executor:stderr', `\n--- Git: ${commitResult.error} ---`)
        }
      }
    })

    // Handle stderr - stream to renderer
    child.stderr.on('data', (data) => {
      const text = data.toString()
      mainWindow.webContents.send('executor:stderr', text)
    })

    // Handle process completion
    child.on('close', (code, signal) => {
      mainWindow.webContents.send('executor:complete', { code, signal })
    })

    // Handle spawn errors
    child.on('error', (error) => {
      mainWindow.webContents.send('executor:stderr', `Spawn error: ${error.message}`)
      mainWindow.webContents.send('executor:complete', { code: 1, error: error.message })
    })

    return { success: true }
  } catch (error) {
    console.error('Error executing command:', error)
    return { success: false, error: error.message }
  }
})
