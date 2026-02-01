import { useEffect, useCallback, useState } from 'react'
import { useAppStore } from '../store/appStore'
import RequirementsList from './RequirementsList'
import Intro from './Intro'

const LeftColumn = () => {
  const folderPath = useAppStore((state) => state.folderPath)
  const hasPrdFile = useAppStore((state) => state.hasPrdFile)
  const setHasPrdFile = useAppStore((state) => state.setHasPrdFile)
  const setPrdItems = useAppStore((state) => state.setPrdItems)

  const [activeTab, setActiveTab] = useState('requirements')
  const [progressContent, setProgressContent] = useState('')
  const [gitLogs, setGitLogs] = useState('')
  const [gitError, setGitError] = useState('')

  // Check for prd.json file when folder changes
  useEffect(() => {
    if (folderPath) {
      checkPrdFile(folderPath)
    }
  }, [folderPath])

  // Load progress content when tab changes to progress
  useEffect(() => {
    if (activeTab === 'progress' && folderPath) {
      loadProgress()
    }
  }, [activeTab, folderPath])

  // Load git logs when tab changes to gitLogs
  useEffect(() => {
    if (activeTab === 'gitLogs' && folderPath) {
      loadGitLogs()
    }
  }, [activeTab, folderPath])

  const loadProgress = async () => {
    try {
      const content = await window.electron.ipcRenderer.invoke('fs:readProgressFile', folderPath)
      setProgressContent(content || '')
    } catch (error) {
      console.error('Error loading progress:', error)
      setProgressContent('')
    }
  }

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

  const clearProgress = async () => {
    try {
      await window.electron.ipcRenderer.invoke('fs:clearProgressFile', folderPath)
      setProgressContent('')
    } catch (error) {
      console.error('Error clearing progress:', error)
    }
  }

  // Check for prd.json file
  const checkPrdFile = useCallback(
    async (path) => {
      if (!path) return

      try {
        const prdContent = await window.electron.ipcRenderer.invoke('fs:readPrdFile', path)
        if (prdContent) {
          setHasPrdFile(true)
          setPrdItems(prdContent)
          console.log('prd.json content:', prdContent)
        } else {
          setHasPrdFile(false)
          setPrdItems([])
        }
      } catch (error) {
        setHasPrdFile(false)
        setPrdItems([])
        console.error('Error reading PRD file:', error)
      }
    },
    [setHasPrdFile, setPrdItems]
  )

  // Create prd.json file
  const createPrdFile = useCallback(async () => {
    if (!folderPath) {
      console.error('No folder path provided')
      return
    }

    const defaultPrd = { id: 0, title: 'default', description: '', isDone: false }

    try {
      const success = await window.electron.ipcRenderer.invoke(
        'fs:createPrdFile',
        folderPath,
        JSON.stringify(defaultPrd, null, 2)
      )

      if (success) {
        console.log('prd.json created successfully')
        await checkPrdFile(folderPath)
      }
    } catch (error) {
      console.error('Error creating PRD file:', error)
    }
  }, [folderPath, checkPrdFile])

  return (
    <div className="bg-gh-bg p-6 h-full flex flex-col">
      {/* No project message (shown when no folder is selected) */}
      {!folderPath && <Intro />}

      {/* Create PRD button (shown when folder selected but no prd.json exists) */}
      {folderPath && !hasPrdFile && (
        <button
          onClick={createPrdFile}
          className="mb-4 bg-gh-green hover:bg-gh-green-hover text-white font-medium py-2 px-4 rounded-md"
        >
          Create prd.json
        </button>
      )}

      {/* Tab view (shown when prd.json exists) */}
      {folderPath && hasPrdFile && (
        <>
          {/* Tab headers */}
          <div className="flex border-b border-gh-border mb-4">
            <button
              onClick={() => setActiveTab('requirements')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'requirements'
                  ? 'text-gh-text-primary border-b-2 border-gh-green'
                  : 'text-gh-text-secondary hover:text-gh-text-primary'
              }`}
            >
              Requirements
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'progress'
                  ? 'text-gh-text-primary border-b-2 border-gh-green'
                  : 'text-gh-text-secondary hover:text-gh-text-primary'
              }`}
            >
              Progress
            </button>
            <button
              onClick={() => setActiveTab('gitLogs')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'gitLogs'
                  ? 'text-gh-text-primary border-b-2 border-gh-green'
                  : 'text-gh-text-secondary hover:text-gh-text-primary'
              }`}
            >
              Git Logs
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'requirements' && <RequirementsList />}

            {activeTab === 'progress' && (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gh-text-secondary text-sm">progress.txt</span>
                  <button
                    onClick={clearProgress}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    Clear Progress
                  </button>
                </div>
                <pre className="flex-1 bg-gh-bg-secondary p-4 rounded-md text-gh-text-primary text-sm overflow-auto whitespace-pre-wrap font-mono">
                  {progressContent || 'No progress recorded yet.'}
                </pre>
              </div>
            )}

            {activeTab === 'gitLogs' && (
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
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default LeftColumn
