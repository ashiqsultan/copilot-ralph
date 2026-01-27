// PRD File Manager - Handles PRD file operations and state

let hasPrdFile = false;

// Callbacks
let onPrdFileStatusChangeCallback = null;

// Initialize PRD file manager
export function initPrdFileManager(onPrdFileStatusChange) {
  onPrdFileStatusChangeCallback = onPrdFileStatusChange;
  
  // Make createPrdFile globally accessible
  window.createPrdFile = createPrdFile;
}

// Check for prd.json file
export async function checkPrdFile(folderPath) {
  if (!folderPath) return;
  
  try {
    const prdContent = await window.electronAPI.readPrdFile(folderPath);
    if (prdContent) {
      hasPrdFile = true;
      console.log('prd.json content:', prdContent);
      
      // Notify callback with status
      if (onPrdFileStatusChangeCallback) {
        onPrdFileStatusChangeCallback({
          exists: true,
          content: prdContent
        });
      }
    } else {
      hasPrdFile = false;
      
      if (onPrdFileStatusChangeCallback) {
        onPrdFileStatusChangeCallback({
          exists: false,
          content: null
        });
      }
    }
  } catch (error) {
    hasPrdFile = false;
    
    if (onPrdFileStatusChangeCallback) {
      onPrdFileStatusChangeCallback({
        exists: false,
        content: null,
        error: error
      });
    }
  }
}

// Create prd.json file
export async function createPrdFile(folderPath) {
  if (!folderPath) {
    console.error('No folder path provided');
    return false;
  }
  
  const defaultPrd = "";
  
  const success = await window.electronAPI.createPrdFile(folderPath, JSON.stringify(defaultPrd, null, 2));
  if (success) {
    console.log('prd.json created successfully');
    await checkPrdFile(folderPath);
    return true;
  }
  return false;
}

// Get PRD file status
export function hasPrdFileInFolder() {
  return hasPrdFile;
}

// Read PRD file content
export async function readPrdFile(folderPath) {
  if (!folderPath) return null;
  
  try {
    return await window.electronAPI.readPrdFile(folderPath);
  } catch (error) {
    console.error('Error reading PRD file:', error);
    return null;
  }
}

// Save PRD file content
export async function savePrdFile(folderPath, content) {
  if (!folderPath) return false;
  
  try {
    return await window.electronAPI.savePrdFile(folderPath, content);
  } catch (error) {
    console.error('Error saving PRD file:', error);
    return false;
  }
}
