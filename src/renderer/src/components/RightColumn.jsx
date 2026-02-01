import { useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { IconPlayerPlayFilled, IconCancel } from '@tabler/icons-react'
import ModelSelector from './ModelSelector'

const RightColumn = () => {
  const folderPath = useAppStore((state) => state.folderPath)
  const isRunning = useAppStore((state) => state.isRunning)
  const outputLines = useAppStore((state) => state.outputLines)
  const getPrdItems = useAppStore((state) => state.getPrdItems)
  const setIsRunning = useAppStore((state) => state.setIsRunning)
  const setWorkingItemId = useAppStore((state) => state.setWorkingItemId)
  const appendOutputLine = useAppStore((state) => state.appendOutputLine)
  const clearOutput = useAppStore((state) => state.clearOutput)

  const outputContainerRef = useRef(null)

  // Auto-scroll to bottom when new output is added
  useEffect(() => {
    if (outputContainerRef.current) {
      outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight
    }
  }, [outputLines])

  // Set up IPC event listeners
  useEffect(() => {
    // Listen for stdout data
    const removeOutputListener = window.electron.ipcRenderer.on('executor:stdout', (_, data) => {
      appendOutputLine(data, 'stdout')
    })

    // Listen for stderr data
    const removeErrorListener = window.electron.ipcRenderer.on('executor:stderr', (_, data) => {
      appendOutputLine(data, 'stderr')
    })

    // Listen for completion
    const removeCompleteListener = window.electron.ipcRenderer.on(
      'executor:complete',
      (_, result) => {
        if (result.code === 0) {
          appendOutputLine('\n--- Execution completed successfully ---', 'success')
        } else if (result.signal) {
          appendOutputLine(`\n--- Process terminated by signal: ${result.signal} ---`, 'error')
        } else {
          appendOutputLine(`\n--- Execution failed with code: ${result.code} ---`, 'error')
        }
      }
    )

    // Cleanup listeners on unmount
    return () => {
      if (removeOutputListener) removeOutputListener()
      if (removeErrorListener) removeErrorListener()
      if (removeCompleteListener) removeCompleteListener()
    }
  }, [])

  // Handle start button click
  const handleStartClick = useCallback(async () => {
    if (isRunning) {
      console.log('Execution already in progress')
      return
    }

    // Check if folder is selected
    if (!folderPath) {
      appendOutputLine('Error: No folder selected. Please select a folder first.', 'error')
      return
    }

    // Clear previous output
    clearOutput()

    // Update UI state
    setIsRunning(true)

    try {
      // Get all PRD items
      const allItems = getPrdItems()

      if (!allItems || !Array.isArray(allItems) || allItems.length === 0) {
        appendOutputLine('No PRD items found.', 'stdout')
        setIsRunning(false)
        return
      }

      // Filter items where isDone is false
      const pendingItems = allItems.filter((item) => !item.isDone)

      if (pendingItems.length === 0) {
        appendOutputLine('All items are already completed.', 'stdout')
        setIsRunning(false)
        return
      }

      appendOutputLine(`Found ${pendingItems.length} pending item(s) to process...`, 'stdout')
      appendOutputLine('---', 'stdout')

      // Track if execution was aborted
      let wasAborted = false

      // Loop through each pending item and execute
      for (const item of pendingItems) {
        // Check if we should stop due to abort
        if (wasAborted) {
          appendOutputLine('\n--- Remaining items skipped due to abort ---', 'stdout')
          break
        }

        // Set the current working item
        setWorkingItemId(item.id)

        appendOutputLine('=== Starting new task ===', 'stdout')
        appendOutputLine(`\nWorking on: [${item.id}] ${item.title}`, 'stdout')
        appendOutputLine('-----', 'stdout')

        // Start the CLI execution - pass only requirement ID, backend builds the prompt
        const result = await window.electron.ipcRenderer.invoke('executor:run', item.id, folderPath)

        if (!result.success) {
          appendOutputLine(`Failed to start: ${result.error}`, 'error')
          setIsRunning(false)
          return
        }

        // Wait for the executor to complete before moving to next item
        // The completion is handled by the 'executor:complete' event listener
        const completionResult = await new Promise((resolve) => {
          const checkComplete = window.electron.ipcRenderer.on('executor:complete', (_, result) => {
            if (checkComplete) checkComplete()
            resolve(result)
          })
        })

        // Check if the process was aborted
        if (completionResult.aborted || completionResult.signal === 'SIGTERM') {
          wasAborted = true
          setWorkingItemId(null)
          setIsRunning(false)
          return
        }
      }

      // All items processed
      if (!wasAborted) {
        setWorkingItemId(null)
        setIsRunning(false)

        appendOutputLine('\n--- All pending items have been processed ---', 'success')
      }
    } catch (error) {
      appendOutputLine(`Error: ${error.message}`, 'error')
      setWorkingItemId(null)
      setIsRunning(false)
    }
  }, [isRunning, folderPath, getPrdItems, clearOutput, setIsRunning, setWorkingItemId, appendOutputLine])

  const handleAbortClick = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('executor:abort')
      if (result.success) {
        appendOutputLine('\n--- Abort initiated ---', 'stdout')
        setWorkingItemId(null)
      } else {
        appendOutputLine(`\n--- Abort failed: ${result.error} ---`, 'error')
      }
    } catch (error) {
      appendOutputLine(`\n--- Error aborting: ${error.message} ---`, 'error')
    }
  }

  // Get status dot color class based on status
  const getStatusDotClass = (isRunning) => {
    return isRunning ? 'bg-gh-yellow animate-pulse' : 'bg-gh-text-subtle'
  }

  // Get output line color class based on type
  const getOutputLineClass = (type) => {
    switch (type) {
      case 'stderr':
        return 'text-gh-yellow'
      case 'error':
        return 'text-gh-red font-semibold'
      case 'success':
        return 'text-gh-green-bright font-semibold'
      default:
        return 'text-gh-text'
    }
  }

  return (
    <div className="bg-gh-bg flex flex-col min-h-full border-l border-gh-border p-6">
      {/* Header with button and status */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleStartClick}
            disabled={isRunning}
            className={`flex items-center gap-1 bg-gh-green text-white px-3 py-1.5 rounded-md text-sm transition-colors ${
              isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gh-green-hover'
            }`}
          >
            <IconPlayerPlayFilled size={18} strokeWidth={2} />
            Start
          </button>

          <button
            onClick={handleAbortClick}
            disabled={!isRunning}
            className={`flex items-center gap-1 border border-gh-red text-gh-red px-3 py-1.5 rounded-md text-sm transition-colors duration-150 ease-in-out ${
              isRunning
                ? 'hover:bg-gh-red hover:text-white hover:border-gh-red'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <IconCancel size={18} strokeWidth={2} />
            Abort
          </button>

          {/* Model Selector */}
          <ModelSelector />
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 pl-4">
          <div className={`w-3 h-3 rounded-full ${getStatusDotClass(isRunning)}`} />
          <span className="text-sm text-gh-text-muted">{isRunning ? 'Running' : 'Idle'}</span>
        </div>
      </div>

      {/* Output Container */}
      <div
        ref={outputContainerRef}
        className="flex-1 bg-gh-surface rounded-md border border-gh-border p-4 font-mono text-sm text-gh-text overflow-y-auto"
      >
        {outputLines.length === 0 ? (
          <div className="text-gh-text-muted italic">Progress will appear here</div>
        ) : (
          outputLines.map((line) => (
            <div key={line.id} className={getOutputLineClass(line.type)}>
              {line.text}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default RightColumn
