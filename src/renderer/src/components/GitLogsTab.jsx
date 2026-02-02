import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'


const GitLogsTab = () => {
  const folderPath = useAppStore((state) => state.folderPath)
  const [gitLogs, setGitLogs] = useState('')
  const [gitError, setGitError] = useState('')

  useEffect(() => {
    if (folderPath) {
      loadGitLogs()
    }
  }, [folderPath])

  const loadGitLogs = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('git:getLog', folderPath)
      if (result.success) {
        setGitLogs(result.logs)
        setGitError('')
      } else {
        setGitLogs('')
        setGitError(result.error || 'Failed to load git logs')
      }
    } catch (error) {
      console.error('Error loading git logs:', error)
      setGitLogs('')
      setGitError('Failed to load git logs')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gh-text-secondary text-sm">Git Commit History</span>
        <button
          onClick={loadGitLogs}
          className="text-xs bg-gh-green hover:bg-gh-green-hover text-white px-3 py-1 rounded"
        >
          Refresh
        </button>
      </div>
      {gitError ? (
        <div className="text-red-400 text-sm">{gitError}</div>
      ) : (
        <pre className="flex-1 bg-gh-bg-secondary p-4 rounded-md text-gh-text-primary text-sm overflow-auto whitespace-pre-wrap font-mono">
          {gitLogs || 'No commits found.'}
        </pre>
      )}
    </div>
  )
}

export default GitLogsTab
