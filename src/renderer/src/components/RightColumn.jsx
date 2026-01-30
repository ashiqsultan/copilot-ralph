import { useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '../store/appStore'

const RightColumn = () => {
  const folderPath = useAppStore((state) => state.folderPath)
  const isRunning = useAppStore((state) => state.isRunning)
  const executorStatus = useAppStore((state) => state.executorStatus)
  const statusText = useAppStore((state) => state.statusText)
  const outputLines = useAppStore((state) => state.outputLines)
  const getPrdItems = useAppStore((state) => state.getPrdItems)

  const setIsRunning = useAppStore((state) => state.setIsRunning)
  const setExecutorStatus = useAppStore((state) => state.setExecutorStatus)
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
    const removeCompleteListener = window.electron.ipcRenderer.on('executor:complete', (_, result) => {
      handleExecutionComplete(result)
    })

    // Cleanup listeners on unmount
    return () => {
      if (removeOutputListener) removeOutputListener()
      if (removeErrorListener) removeErrorListener()
      if (removeCompleteListener) removeCompleteListener()
    }
  }, [])

  // Handle execution completion
  const handleExecutionComplete = useCallback(
    (result) => {
      setIsRunning(false)

      if (result.code === 0) {
        setExecutorStatus('completed', 'Completed')
        appendOutputLine('\n--- Execution completed successfully ---', 'success')
      } else if (result.signal) {
        setExecutorStatus('error', 'Terminated')
        appendOutputLine(`\n--- Process terminated by signal: ${result.signal} ---`, 'error')
      } else {
        setExecutorStatus('error', `Exit code: ${result.code}`)
        appendOutputLine(`\n--- Execution failed with code: ${result.code} ---`, 'error')
      }
    },
    [setIsRunning, setExecutorStatus, appendOutputLine]
  )

  // Handle start button click
  const handleStartClick = useCallback(async () => {
    if (isRunning) {
      console.log('Execution already in progress')
      return
    }

    // Check if folder is selected
    if (!folderPath) {
      appendOutputLine('Error: No folder selected. Please select a folder first.', 'error')
      setExecutorStatus('error', 'No folder selected')
      return
    }

    // Clear previous output
    clearOutput()

    // Update UI state
    setIsRunning(true)
    setExecutorStatus('running', 'Running...')

    try {
      // Get all PRD items
      const allItems = getPrdItems()

      if (!allItems || !Array.isArray(allItems) || allItems.length === 0) {
        appendOutputLine('No PRD items found.', 'stdout')
        setIsRunning(false)
        setExecutorStatus('error', 'No items')
        return
      }

      // Filter items where isDone is false
      const pendingItems = allItems.filter((item) => !item.isDone)

      if (pendingItems.length === 0) {
        appendOutputLine('All items are already completed.', 'stdout')
        setIsRunning(false)
        setExecutorStatus('completed', 'All done')
        return
      }

      appendOutputLine(`Found ${pendingItems.length} pending item(s) to process...`, 'stdout')
      appendOutputLine('---', 'stdout')

      // Loop through each pending item and execute
      for (const item of pendingItems) {
        appendOutputLine(`\nWorking on: [${item.id}] ${item.title}`, 'stdout')
        appendOutputLine('---', 'stdout')

        // Start the CLI execution - pass only requirement ID, backend builds the prompt
        const result = await window.electron.ipcRenderer.invoke('executor:run', item.id, folderPath)

        if (!result.success) {
          appendOutputLine(`Failed to start: ${result.error}`, 'error')
          setIsRunning(false)
          setExecutorStatus('error', 'Failed to start')
          return
        }

        // Wait for the executor to complete before moving to next item
        // The completion is handled by the 'executor:complete' event listener
        await new Promise((resolve) => {
          const checkComplete = window.electron.ipcRenderer.on('executor:complete', () => {
            if (checkComplete) checkComplete()
            resolve()
          })
        })
      }

      // All items processed
      setIsRunning(false)
      setExecutorStatus('completed', 'All items completed')
      appendOutputLine('\n--- All pending items have been processed ---', 'success')
    } catch (error) {
      appendOutputLine(`Error: ${error.message}`, 'error')
      setIsRunning(false)
      setExecutorStatus('error', 'Error')
    }
  }, [
    isRunning,
    folderPath,
    getPrdItems,
    clearOutput,
    setIsRunning,
    setExecutorStatus,
    appendOutputLine
  ])

  // Get status dot color class based on status
  const getStatusDotClass = () => {
    switch (executorStatus) {
      case 'running':
        return 'bg-gh-yellow animate-pulse'
      case 'completed':
        return 'bg-gh-green-bright'
      case 'error':
        return 'bg-gh-red'
      default:
        return 'bg-gh-text-subtle'
    }
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
    <div className="bg-gh-bg p-6 h-full flex flex-col border-l border-gh-border">
      {/* Header with button and status */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleStartClick}
          disabled={isRunning}
          className={`flex items-center gap-2 bg-gh-green text-white px-4 py-2 rounded-md transition-colors ${
            isRunning
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-gh-green-hover'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="icon icon-tabler icons-tabler-filled icon-tabler-player-play"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
          </svg>
          Start
        </button>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 pl-4">
          <div className={`w-3 h-3 rounded-full ${getStatusDotClass()}`} />
          <span className="text-sm text-gh-text-muted">{statusText}</span>
        </div>
      </div>

      {/* Output Container */}
      <div
        ref={outputContainerRef}
        className="flex-1 bg-gh-surface rounded-md border border-gh-border p-4 font-mono text-sm text-gh-text overflow-y-auto min-h-[300px] max-h-[500px]"
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
