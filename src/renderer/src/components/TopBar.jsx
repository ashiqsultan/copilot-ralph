import { useCallback, useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { IconFolderOpen, IconSettings } from '@tabler/icons-react'
import Logo from './Logo'
import Tooltip from './Tooltip'

const TopBar = () => {
  const folderPath = useAppStore((state) => state.folderPath)
  const setFolderPath = useAppStore((state) => state.setFolderPath)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [projectName, setProjectName] = useState('')
  const setIsCopilotSettingsOpen = useAppStore((state) => state.setIsCopilotSettingsOpen)

  // Listen for menu actions
  useEffect(() => {
    // Listen for folder selection from menu
    const handleFolderSelected = (event, folderPath) => {
      setFolderPath(folderPath)
      console.log('Folder selected from menu:', folderPath)
    }

    // Listen for new project request from menu
    const handleNewProject = () => {
      setShowNewProjectDialog(true)
      setProjectName('')
    }

    window.electron.ipcRenderer.on('menu:folderSelected', handleFolderSelected)
    window.electron.ipcRenderer.on('menu:newProject', handleNewProject)

    // Cleanup
    return () => {
      window.electron.ipcRenderer.removeListener('menu:folderSelected', handleFolderSelected)
      window.electron.ipcRenderer.removeListener('menu:newProject', handleNewProject)
    }
  }, [setFolderPath])

  // Handle creating the new project
  const handleCreateProject = useCallback(async () => {
    if (!projectName.trim()) {
      alert('Please enter a project name')
      return
    }

    try {
      const projectPath = await window.electron.ipcRenderer.invoke(
        'dialog:createNewProject',
        projectName.trim()
      )

      if (projectPath) {
        setFolderPath(projectPath)
        console.log('Project created:', projectPath)
        setShowNewProjectDialog(false)
        setProjectName('')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project: ' + error.message)
    }
  }, [projectName, setFolderPath])

  // Handle cancel dialog
  const handleCancelDialog = useCallback(() => {
    setShowNewProjectDialog(false)
    setProjectName('')
  }, [])

  // Handle opening folder in explorer
  const handleOpenInExplorer = useCallback(async () => {
    if (folderPath) {
      try {
        await window.electron.ipcRenderer.invoke('dialog:openInExplorer', folderPath)
      } catch (error) {
        console.error('Error opening folder in explorer:', error)
      }
    }
  }, [folderPath])

  const onCopilotIconClick = () => {
    setIsCopilotSettingsOpen(true)
    console.log('oncopilot buttonclick')
  }

  return (
    <header className="w-full bg-gh-surface  text-gh-text p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full min-w-0">
          <div className="flex-shrink-0">
            <Logo />
          </div>
          {/* folder path: takes available space with truncation */}
          <div className="flex-1 text-center mx-4 min-w-0">
            {folderPath ? (
              <>
                <div className="flex items-center justify-center gap-2">
                  <div className="text-white font-semibold text-base truncate">
                    {folderPath.split('/').filter(Boolean).pop()}
                  </div>
                  <button
                    onClick={handleOpenInExplorer}
                    className="flex-shrink-0 text-gh-text-muted hover:text-gh-green transition-colors"
                    title="Open in explorer"
                  >
                    <IconFolderOpen size={18} />
                  </button>
                </div>
                <div className="text-gh-text-muted font-mono text-xs truncate mt-1">
                  {folderPath}
                </div>
              </>
            ) : (
              <div className="text-gh-text-muted">
                No folder selected - Use the menu to open a folder or create a new project
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <Tooltip text="Settings" position="bottom">
            <button
              onClick={onCopilotIconClick}
              className="hover:bg-gh-border text-white font-semibold px-2 py-1 rounded-md transition-colors flex items-center gap-1 text-sm"
            >
              <IconSettings color="white" size={20} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* New Project Dialog */}
      {showNewProjectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gh-surface border border-gh-border rounded-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4 text-white">Create New Project</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gh-text">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                className="w-full px-3 py-2 bg-gh-bg border border-gh-border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-gh-green"
                placeholder="Enter project name"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelDialog}
                className="px-4 py-2 bg-gh-bg hover:bg-gh-border text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-gh-green hover:bg-gh-green-hover text-white rounded-md transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default TopBar
