import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn, execSync } from 'node:child_process';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// IPC handler for opening folder dialog
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePaths[0];
});

// IPC handler for reading prd.json file
ipcMain.handle('fs:readPrdFile', async (event, folderPath) => {
  try {
    const prdPath = path.join(folderPath, 'prd.json');
    const content = await fs.readFile(prdPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
});

// IPC handler for creating prd.json file
ipcMain.handle('fs:createPrdFile', async (event, folderPath, content) => {
  try {
    const prdPath = path.join(folderPath, 'prd.json');
    await fs.writeFile(prdPath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error creating prd.json:', error);
    return false;
  }
});

// IPC handler for saving prd.json file
ipcMain.handle('fs:savePrdFile', async (event, folderPath, content) => {
  try {
    const prdPath = path.join(folderPath, 'prd.json');
    await fs.writeFile(prdPath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving prd.json:', error);
    return false;
  }
});

// Helper function to get the user's shell PATH
function getShellPath() {
  try {
    if (process.platform === 'win32') {
      // On Windows, use the system PATH
      return process.env.PATH;
    }
    
    // On Unix-like systems, get PATH from shell
    const shell = process.env.SHELL || '/bin/zsh';
    const shellPath = execSync(`${shell} -ilc 'echo $PATH'`, {
      encoding: 'utf8',
      timeout: 5000
    }).trim();
    
    return shellPath;
  } catch (error) {
    console.error('Error getting shell PATH:', error);
    return process.env.PATH;
  }
}

// Helper function to find copilot executable
function findCopilotPath() {
  try {
    const shellPath = getShellPath();
    const command = process.platform === 'win32' ? 'where copilot' : 'which copilot';
    
    const result = execSync(command, {
      encoding: 'utf8',
      env: { ...process.env, PATH: shellPath },
      timeout: 5000
    }).trim();
    
    // On Windows, 'where' might return multiple paths, take the first one
    return process.platform === 'win32' ? result.split('\n')[0] : result;
  } catch (error) {
    console.error('Error finding copilot:', error);
    return 'copilot'; // Fallback to command name
  }
}

// IPC handler for executing CLI commands
ipcMain.handle('executor:run', async (event, prompt, folderPath) => {
  try {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      return { success: false, error: 'No window available' };
    }

    if (!folderPath) {
      return { success: false, error: 'No folder path provided' };
    }

    // Get the full path to copilot and shell PATH
    const copilotPath = findCopilotPath();
    const shellPath = getShellPath();

    // Build the command arguments
    const args = ['--yolo', '--model', 'gpt-4.1', '-i', `"${prompt}"`];

    // Spawn the copilot process with the correct environment and working directory
    const child = spawn(copilotPath, args, {
      shell: true,
      cwd: folderPath,
      env: { ...process.env, PATH: shellPath }
    });

    // Handle stdout - stream to renderer
    child.stdout.on('data', (data) => {
      const text = data.toString();
      mainWindow.webContents.send('executor:stdout', text);
    });

    // Handle stderr - stream to renderer
    child.stderr.on('data', (data) => {
      const text = data.toString();
      mainWindow.webContents.send('executor:stderr', text);
    });

    // Handle process completion
    child.on('close', (code, signal) => {
      mainWindow.webContents.send('executor:complete', { code, signal });
    });

    // Handle spawn errors
    child.on('error', (error) => {
      mainWindow.webContents.send('executor:stderr', `Spawn error: ${error.message}`);
      mainWindow.webContents.send('executor:complete', { code: 1, error: error.message });
    });

    return { success: true };
  } catch (error) {
    console.error('Error executing command:', error);
    return { success: false, error: error.message };
  }
});
