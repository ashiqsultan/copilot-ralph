/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import { initPrdEditor, setPrdItems } from './prdeditor.js';

// Load component HTML
async function loadComponent(elementId, filePath) {
  const response = await fetch(filePath);
  const html = await response.text();
  document.getElementById(elementId).innerHTML = html;
}

// Load PRD editor into container
async function loadPrdEditor() {
  const response = await fetch('prdeditor.html');
  const html = await response.text();
  const container = document.getElementById('prdEditorContainer');
  if (container) {
    container.innerHTML = html;
    initPrdEditor(() => currentFolderPath, refreshPrdData);
  }
}

// Load both columns
loadComponent('left-column', 'left.html');
loadComponent('right-column', 'right.html');

// State for current folder
let currentFolderPath = null;
let hasPrdFile = false;

// DOM elements
const openFolderBtn = document.getElementById('openFolderBtn');
const folderPathDisplay = document.getElementById('folderPathDisplay');

// Update folder path display
function updateFolderDisplay() {
  if (currentFolderPath) {
    folderPathDisplay.textContent = currentFolderPath;
    folderPathDisplay.classList.remove('text-gray-400');
    folderPathDisplay.classList.add('text-white');
  } else {
    folderPathDisplay.textContent = 'No folder selected';
    folderPathDisplay.classList.remove('text-white');
    folderPathDisplay.classList.add('text-gray-400');
  }
}

// Check for prd.json file
async function checkPrdFile() {
  if (!currentFolderPath) return;
  
  try {
    const prdContent = await window.electronAPI.readPrdFile(currentFolderPath);
    if (prdContent) {
      hasPrdFile = true;
      console.log('prd.json content:', prdContent);
      updatePrdButton(false);
      showPrdEditor(true);
      setPrdItems(prdContent);
    } else {
      hasPrdFile = false;
      updatePrdButton(true);
      showPrdEditor(false);
    }
  } catch (error) {
    hasPrdFile = false;
    updatePrdButton(true);
    showPrdEditor(false);
  }
}

// Refresh PRD data
async function refreshPrdData() {
  await checkPrdFile();
}

// Show/hide PRD editor
function showPrdEditor(show) {
  const container = document.getElementById('prdEditorContainer');
  if (container) {
    container.style.display = show ? 'block' : 'none';
    if (show) {
      loadPrdEditor();
    }
  }
}

// Update PRD button visibility
function updatePrdButton(show) {
  const createPrdBtn = document.getElementById('createPrdBtn');
  if (createPrdBtn) {
    createPrdBtn.style.display = show ? 'block' : 'none';
  }
}

// Create prd.json file
async function createPrdFile() {
  if (!currentFolderPath) return;
  
  const defaultPrd = ""
  
  const success = await window.electronAPI.createPrdFile(currentFolderPath, JSON.stringify(defaultPrd, null, 2));
  if (success) {
    console.log('prd.json created successfully');
    await checkPrdFile();
  }
}

// Make createPrdFile globally accessible
window.createPrdFile = createPrdFile;

// Open folder button handler
openFolderBtn.addEventListener('click', async () => {
  const folderPath = await window.electronAPI.openFolder();
  
  if (folderPath) {
    currentFolderPath = folderPath;
    updateFolderDisplay();
    console.log('Folder selected:', folderPath);
    await checkPrdFile();
  }
});

// Initialize display
updateFolderDisplay();
