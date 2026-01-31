import { useCallback, useState } from 'react'
import { useAppStore } from '../store/appStore'
import {
  IconFolder,
  IconFolderPlus,
  IconFolderOpen,
  IconBrandGithubCopilot
} from '@tabler/icons-react'
import Tooltip from './Tooltip'

const TopBar = ({ onFolderChange }) => {
  const folderPath = useAppStore((state) => state.folderPath)
  const setFolderPath = useAppStore((state) => state.setFolderPath)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [projectName, setProjectName] = useState('')
  const setIsCopilotSettingsOpen = useAppStore((state) => state.setIsCopilotSettingsOpen)

  // Handle open folder button click
  const handleOpenFolder = useCallback(async () => {
    try {
      // Use the electron API to open folder dialog
      const selectedPath = await window.electron.ipcRenderer.invoke('dialog:openFolder')

      if (selectedPath) {
        setFolderPath(selectedPath)
        console.log('Folder selected:', selectedPath)

        // Notify parent component of folder change
        if (onFolderChange) {
          onFolderChange(selectedPath)
        }
      }
    } catch (error) {
      console.error('Error opening folder:', error)
    }
  }, [onFolderChange, setFolderPath])

  // Handle new project button click
  const handleNewProject = useCallback(() => {
    setShowNewProjectDialog(true)
    setProjectName('')
  }, [])

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

        // Notify parent component of folder change
        if (onFolderChange) {
          onFolderChange(projectPath)
        }
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project: ' + error.message)
    }
  }, [projectName, onFolderChange, setFolderPath])

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
    console.log("oncopilot buttonclick")
  }

  return (
    <header className="w-full bg-gh-surface border-b border-gh-border text-gh-text p-4">
      <div className="flex items-center justify-between">
        {/* buttons: max 30% */}
        <div className="flex gap-2 w-[20%] min-w-[120px]">
          <Tooltip text="Config" position="bottom">
            <button
              onClick={onCopilotIconClick}
              className="bg-gh-bg hover:bg-gh-border text-white font-semibold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 text-sm border border-gh-border"
            >
              <IconBrandGithubCopilot color="white" size={18} />
            </button>
          </Tooltip>
          <Tooltip text="Open an existing folder" position="bottom">
            <button
              onClick={handleOpenFolder}
              className="bg-gh-green hover:bg-gh-green-hover text-white font-semibold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 text-sm"
            >
              <IconFolder color="white" size={18} />
              Open
            </button>
          </Tooltip>
          <Tooltip text="Create a new project" position="bottom">
            <button
              onClick={handleNewProject}
              className="bg-gh-green hover:bg-gh-green-hover text-white font-semibold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 text-sm"
            >
              <IconFolderPlus color="white" size={18} />
              New
            </button>
          </Tooltip>
        </div>

        {/* folder path: 70% with truncation */}
        <div className="w-[80%] text-center mx-4 min-w-0">
          {folderPath ? (
            <>
              {/* Project Name (last folder) with open icon */}
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
              {/* Breadcrumb Path */}
              <div className="text-gh-text-muted font-mono text-xs truncate mt-1">{folderPath}</div>
            </>
          ) : (
            <div className="text-gh-text-muted">No folder selected</div>
          )}
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
