// Executor - Handles CLI command execution and progress display

let outputContainer = null;
let startButton = null;
let statusIndicator = null;
let isRunning = false;

// Fixed hardcoded prompt for now
const HARDCODED_PROMPT = "Hello, can you help me understand about google big query";

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

  // Clear previous output
  clearOutput();
  
  // Update UI state
  setRunningState(true);
  updateStatus('running', 'Running...');

  try {
    // Start the CLI execution
    const result = await window.electronAPI.executeCommand(HARDCODED_PROMPT);
    
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
      line.className = 'text-yellow-600';
      break;
    case 'error':
      line.className = 'text-red-500 font-semibold';
      break;
    case 'success':
      line.className = 'text-green-600 font-semibold';
      break;
    default:
      line.className = 'text-gray-800';
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
      startButton.classList.remove('hover:bg-blue-600');
    } else {
      startButton.disabled = false;
      startButton.classList.remove('opacity-50', 'cursor-not-allowed');
      startButton.classList.add('hover:bg-blue-600');
    }
  }
}

// Update status indicator
function updateStatus(state, text) {
  if (!statusIndicator) return;

  // Remove previous state classes
  statusIndicator.classList.remove(
    'bg-gray-400', 'bg-yellow-400', 'bg-green-500', 'bg-red-500',
    'animate-pulse'
  );

  const dot = statusIndicator.querySelector('.status-dot');
  const label = statusIndicator.querySelector('.status-label');

  switch (state) {
    case 'running':
      if (dot) dot.className = 'status-dot w-3 h-3 rounded-full bg-yellow-400 animate-pulse';
      if (label) label.textContent = text;
      break;
    case 'completed':
      if (dot) dot.className = 'status-dot w-3 h-3 rounded-full bg-green-500';
      if (label) label.textContent = text;
      break;
    case 'error':
      if (dot) dot.className = 'status-dot w-3 h-3 rounded-full bg-red-500';
      if (label) label.textContent = text;
      break;
    default:
      if (dot) dot.className = 'status-dot w-3 h-3 rounded-full bg-gray-400';
      if (label) label.textContent = 'Idle';
  }
}
