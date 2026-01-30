import { useEffect, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import RequirementsList from './RequirementsList'

const LeftColumn = () => {
  const folderPath = useAppStore((state) => state.folderPath)
  const hasPrdFile = useAppStore((state) => state.hasPrdFile)
  const setHasPrdFile = useAppStore((state) => state.setHasPrdFile)
  const setPrdItems = useAppStore((state) => state.setPrdItems)

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
      <h2 className="text-lg font-semibold mb-3 text-gh-text">Requirement Manager</h2>

      {/* No project message (shown when no folder is selected) */}
      {!folderPath && (
        <div className="flex items-center justify-center h-64">
          <p className="text-gh-text-muted text-lg italic">No project selected</p>
        </div>
      )}

      {/* Create PRD button (shown when folder selected but no prd.json exists) */}
      {folderPath && !hasPrdFile && (
        <button
          onClick={createPrdFile}
          className="mb-4 bg-gh-green hover:bg-gh-green-hover text-white font-medium py-2 px-4 rounded-md"
        >
          Create prd.json
        </button>
      )}

      {/* PRD Editor (shown when prd.json exists) */}
      {folderPath && hasPrdFile && <RequirementsList />}
    </div>
  )
}

export default LeftColumn
