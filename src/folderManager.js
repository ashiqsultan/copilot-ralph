// Folder Manager - Handles folder selection and display

let currentFolderPath = null;

// DOM elements
let openFolderBtn = null;
let folderPathDisplay = null;

// Callbacks
let onFolderChangeCallback = null;

// Initialize folder manager
export function initFolderManager(onFolderChange) {
  openFolderBtn = document.getElementById('openFolderBtn');
  folderPathDisplay = document.getElementById('folderPathDisplay');
  onFolderChangeCallback = onFolderChange;

  if (!openFolderBtn) {
    console.error('Open folder button not found');
    return;
  }

  // Open folder button handler
  openFolderBtn.addEventListener('click', async () => {
    const folderPath = await window.electronAPI.openFolder();
    
    if (folderPath) {
      currentFolderPath = folderPath;
      updateFolderDisplay();
      console.log('Folder selected:', folderPath);
      
      // Notify callback
      if (onFolderChangeCallback) {
        onFolderChangeCallback(folderPath);
      }
    }
  });

  // Initialize display
  updateFolderDisplay();
}

// Update folder path display
function updateFolderDisplay() {
  if (!folderPathDisplay) return;

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

// Get current folder path
export function getCurrentFolderPath() {
  return currentFolderPath;
}

// Set folder path programmatically
export function setFolderPath(path) {
  currentFolderPath = path;
  updateFolderDisplay();
}
