import { useCallback, useState } from 'react'
import {
  IconFolder,
  IconFileText,
  IconBrandGithubCopilot,
  IconPlayerPlay,
  IconFolderPlus
} from '@tabler/icons-react'
import { useAppStore } from '../store/appStore'

const Intro = () => {
  const setFolderPath = useAppStore((state) => state.setFolderPath)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [projectName, setProjectName] = useState('')

  const handleOpenFolder = useCallback(async () => {
    try {
      const selectedPath = await window.electron.ipcRenderer.invoke('dialog:openFolder')
      if (selectedPath) {
        setFolderPath(selectedPath)
      }
    } catch (error) {
      console.error('Error opening folder:', error)
    }
  }, [setFolderPath])

  const handleNewProject = useCallback(() => {
    setShowNewProjectDialog(true)
    setProjectName('')
  }, [])

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
        setShowNewProjectDialog(false)
        setProjectName('')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project: ' + error.message)
    }
  }, [projectName, setFolderPath])

  const handleCancelDialog = useCallback(() => {
    setShowNewProjectDialog(false)
    setProjectName('')
  }, [])

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-md w-full text-center space-y-10">
        {/* Logo + Heading */}
        <div className="space-y-3">
          <IconBrandGithubCopilot
            size={48}
            strokeWidth={1.2}
            className="mx-auto text-gh-text-muted"
          />
          <h1 className="text-2xl font-semibold text-gh-text tracking-tight">
            Copilot Ralph
          </h1>
          <p className="text-sm text-gh-text-muted">Get started by opening a project</p>
        </div>

        {/* Steps */}
        <div className="space-y-2 text-left">
          {/* Open folder – clickable */}
          <button
            onClick={handleOpenFolder}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-gh-surface transition-colors text-left group"
          >
            <IconFolder size={18} className="text-gh-text-muted group-hover:text-gh-blue flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-sm text-gh-text group-hover:text-gh-blue transition-colors">
                Open a folder
              </span>
              <p className="text-xs text-gh-text-muted mt-0.5">
                Choose an existing codebase to work on
              </p>
            </div>
          </button>

          {/* New project – clickable */}
          <button
            onClick={handleNewProject}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-gh-surface transition-colors text-left group"
          >
            <IconFolderPlus size={18} className="text-gh-text-muted group-hover:text-gh-blue flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-sm text-gh-text group-hover:text-gh-blue transition-colors">
                Create a new project
              </span>
              <p className="text-xs text-gh-text-muted mt-0.5">
                Start fresh with a brand-new folder
              </p>
            </div>
          </button>

          {/* Create tasks – informational */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-md">
            <IconFileText size={18} className="text-gh-text-muted flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-sm text-gh-text-muted">Create tasks</span>
              <p className="text-xs text-gh-text-muted mt-0.5">
                Define your requirements like a todo list
              </p>
            </div>
          </div>

          {/* Click start – informational */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-md">
            <IconPlayerPlay size={18} className="text-gh-text-muted flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-sm text-gh-text-muted">Click start</span>
              <p className="text-xs text-gh-text-muted mt-0.5">
                Ralph will work on your requirements while you nap
              </p>
            </div>
          </div>
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
    </div>
  )
}

export default Intro
