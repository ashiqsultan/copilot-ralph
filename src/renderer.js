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
import { initFolderManager, getCurrentFolderPath } from './folderManager.js';
import { initPrdFileManager, checkPrdFile } from './prdFileManager.js';

// Load component HTML
async function loadComponent(elementId, filePath) {
  const response = await fetch(filePath);
  const html = await response.text();
  document.getElementById(elementId).innerHTML = html;
}

// Load PRD editor into container
async function loadPrdEditor(initialItems = null) {
  const response = await fetch('prdeditor.html');
  const html = await response.text();
  const container = document.getElementById('prdEditorContainer');
  if (container) {
    container.innerHTML = html;
    initPrdEditor(getCurrentFolderPath, refreshPrdData);
    
    // Set initial items after HTML is loaded and initialized
    if (initialItems !== null) {
      setPrdItems(initialItems);
    }
  }
}

// Load top bar
async function loadTopBar() {
  await loadComponent('topbar-container', 'topbar.html');
  // Initialize folder manager after topbar is loaded
  initFolderManager(handleFolderChange);
}

// Load both columns
loadTopBar();
loadComponent('left-column', 'left.html');
loadComponent('right-column', 'right.html');

// Initialize PRD file manager
initPrdFileManager(handlePrdFileStatusChange);

// Handle folder change event
async function handleFolderChange(folderPath) {
  updateNoProjectMessage(false);
  await checkPrdFile(folderPath);
}

// Handle PRD file status change
async function handlePrdFileStatusChange(status) {
  if (status.exists) {
    updatePrdButton(false);
    await showPrdEditor(true, status.content);
  } else {
    updatePrdButton(true);
    await showPrdEditor(false);
  }
}

// Refresh PRD data
async function refreshPrdData() {
  const folderPath = getCurrentFolderPath();
  if (folderPath) {
    await checkPrdFile(folderPath);
  }
}

// Show/hide PRD editor
async function showPrdEditor(show, initialItems = null) {
  const container = document.getElementById('prdEditorContainer');
  if (container) {
    container.style.display = show ? 'block' : 'none';
    if (show) {
      await loadPrdEditor(initialItems);
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

// Update "No project selected" message visibility
function updateNoProjectMessage(show) {
  const noProjectMessage = document.getElementById('noProjectMessage');
  if (noProjectMessage) {
    noProjectMessage.style.display = show ? 'flex' : 'none';
  }
}

