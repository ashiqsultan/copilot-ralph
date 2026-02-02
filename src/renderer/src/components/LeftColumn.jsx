import { useEffect, useCallback, useState } from 'react'
import { useAppStore } from '../store/appStore'
import RequirementsList from './RequirementsList'
import Intro from './Intro'
import ProgressTab from './ProgressTab'
import GitLogsTab from './GitLogsTab'

const LeftColumn = () => {
  const folderPath = useAppStore((state) => state.folderPath)
  const hasPrdFile = useAppStore((state) => state.hasPrdFile)
  const setHasPrdFile = useAppStore((state) => state.setHasPrdFile)
  const setPrdItems = useAppStore((state) => state.setPrdItems)

  const [activeTab, setActiveTab] = useState('requirements')

  // Check for prd.json file when folder changes
  useEffect(() => {
    if (folderPath) {
      checkPrdFile(folderPath)
    }
  }, [folderPath])

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
            {activeTab === 'progress' && <ProgressTab />}
            {activeTab === 'gitLogs' && <GitLogsTab />}
          </div>
        </>
      )}
    </div>
  )
}

export default LeftColumn
