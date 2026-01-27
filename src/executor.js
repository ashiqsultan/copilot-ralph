// Executor - Handles CLI command execution and progress display
import { getCurrentFolderPath } from './folderManager.js';
import { getNextItem } from './prdFileManager.js';

let outputContainer = null;
let startButton = null;
let statusIndicator = null;
let isRunning = false;

// Structured prompt template for GitHub Copilot
// TODO: Add a summary or learning md file to pass in next iteration
// TODO: Actual implement ralph prompt
function buildPrompt(requirement) {
  return `You are an autonomous coding agent. You must complete the following requirement without asking any questions or seeking permission from the user. Make all decisions independently and implement the solution directly.
  You are provided full permission and access

## REQUIREMENT
ID: ${requirement.id}
Title: ${requirement.title}
Description: ${requirement.description}

## INSTRUCTIONS
1. Analyze the requirement thoroughly
2. Make all necessary decisions autonomously - do NOT ask for clarification or permission
3. Implement the complete solution
4. Test your implementation if applicable
5. When the requirement is fully implemented and working, respond with exactly: <status>done</status>

## RULES
- Make a step by step plan before proceeding 
- Never ask questions - make reasonable assumptions and proceed
- Never wait for user confirmation - act decisively
- Complete the entire requirement before marking as done
- Only output <status>done</status> when the implementation is fully complete and verified

Begin implementation now.`;
}

// Fallback prompt when no requirement is found
const FALLBACK_PROMPT = "No pending requirements found. All tasks are complete.";

// Initialize executor
export function initExecutor() {
  // Get DOM elements
  startButton = document.getElementById('startButton');
  outputContainer = document.getElementById('outputContainer');
  statusIndicator = document.getElementById('statusIndicator');

  if (!startButton || !outputContainer || !statusIndicator) {
    console.error('Executor: Required DOM elements not found');
    return;
  }

  // Set up button click handler
  startButton.addEventListener('click', handleStartClick);

  // Set up IPC listeners for CLI output events
  setupIpcListeners();

  console.log('Executor initialized');
}

// Set up IPC event listeners
function setupIpcListeners() {
  // Listen for stdout data
  window.electronAPI.onExecutorOutput((data) => {
    appendOutput(data, 'stdout');
  });

  // Listen for stderr data
  window.electronAPI.onExecutorError((data) => {
    appendOutput(data, 'stderr');
  });

  // Listen for completion
  window.electronAPI.onExecutorComplete((result) => {
    handleExecutionComplete(result);
  });
}

// Handle start button click
async function handleStartClick() {
  if (isRunning) {
    console.log('Execution already in progress');
    return;
  }

  // Get the current folder path
  const currentFolderPath = getCurrentFolderPath();
  if (!currentFolderPath) {
    appendOutput('Error: No folder selected. Please select a folder first.', 'error');
    updateStatus('error', 'No folder selected');
    return;
  }

  // Clear previous output
  clearOutput();
  
  // Update UI state
  setRunningState(true);
  updateStatus('running', 'Running...');

  try {
    // Get the next item to work on
    const nextItem = await getNextItem(currentFolderPath);
    
    let prompt;
    if (nextItem && typeof nextItem === 'object') {
      // Build prompt with the requirement
      prompt = buildPrompt(nextItem);
      appendOutput(`Working on: [${nextItem.id}] ${nextItem.title}`, 'stdout');
      appendOutput('---', 'stdout');
    } else {
      // No pending items
      prompt = FALLBACK_PROMPT;
      appendOutput('No pending requirements found.', 'stdout');
    }

    // Start the CLI execution with the current folder path
    const result = await window.electronAPI.executeCommand(prompt, currentFolderPath);
    
    if (!result.success) {
      appendOutput(`Failed to start: ${result.error}`, 'error');
      setRunningState(false);
      updateStatus('error', 'Failed to start');
    }
  } catch (error) {
    appendOutput(`Error: ${error.message}`, 'error');
    setRunningState(false);
    updateStatus('error', 'Error');
  }
}

// Handle execution completion
function handleExecutionComplete(result) {
  setRunningState(false);
  
  if (result.code === 0) {
    updateStatus('completed', 'Completed');
    appendOutput('\n--- Execution completed successfully ---', 'success');
  } else if (result.signal) {
    updateStatus('error', 'Terminated');
    appendOutput(`\n--- Process terminated by signal: ${result.signal} ---`, 'error');
  } else {
    updateStatus('error', `Exit code: ${result.code}`);
    appendOutput(`\n--- Execution failed with code: ${result.code} ---`, 'error');
  }
}

// Append output to the container
function appendOutput(text, type = 'stdout') {
  if (!outputContainer) return;

  const line = document.createElement('div');
  line.textContent = text;
  
  // Apply styling based on type
  switch (type) {
    case 'stderr':
      line.className = 'text-gh-yellow';
      break;
    case 'error':
      line.className = 'text-gh-red font-semibold';
      break;
    case 'success':
      line.className = 'text-gh-green-bright font-semibold';
      break;
    default:
      line.className = 'text-gh-text';
  }

  outputContainer.appendChild(line);
  
  // Auto-scroll to bottom
  outputContainer.scrollTop = outputContainer.scrollHeight;
}

// Clear the output container
function clearOutput() {
  if (outputContainer) {
    outputContainer.innerHTML = '';
  }
}

// Update running state
function setRunningState(running) {
  isRunning = running;
  
  if (startButton) {
    if (running) {
      startButton.disabled = true;
      startButton.classList.add('opacity-50', 'cursor-not-allowed');
      startButton.classList.remove('hover:bg-gh-green-hover');
    } else {
      startButton.disabled = false;
      startButton.classList.remove('opacity-50', 'cursor-not-allowed');
      startButton.classList.add('hover:bg-gh-green-hover');
    }
  }
}

// Update status indicator
function updateStatus(state, text) {
  if (!statusIndicator) return;

  // Remove previous state classes
  statusIndicator.classList.remove(
    'bg-gh-text-subtle', 'bg-gh-yellow', 'bg-gh-green-bright', 'bg-gh-red',
    'animate-pulse'
  );

  const dot = statusIndicator.querySelector('.status-dot');
  const label = statusIndicator.querySelector('.status-label');

  switch (state) {
    case 'running':
      if (dot) dot.className = 'status-dot w-3 h-3 rounded-full bg-gh-yellow animate-pulse';
      if (label) label.textContent = text;
      break;
    case 'completed':
      if (dot) dot.className = 'status-dot w-3 h-3 rounded-full bg-gh-green-bright';
      if (label) label.textContent = text;
      break;
    case 'error':
      if (dot) dot.className = 'status-dot w-3 h-3 rounded-full bg-gh-red';
      if (label) label.textContent = text;
      break;
    default:
      if (dot) dot.className = 'status-dot w-3 h-3 rounded-full bg-gh-text-subtle';
      if (label) label.textContent = 'Idle';
  }
}
