import { useCallback, useState } from 'react'
import {
  IconFolder,
  IconBrandGithubCopilot,
  IconPlayerPlay,
  IconFolderPlus,
  IconEdit,
  IconListCheck,
  IconBed,
  IconBrandYoutube
} from '@tabler/icons-react'
import { useAppStore } from '../store/appStore'

const Intro = () => {
  const setFolderPath = useAppStore((state) => state.setFolderPath)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [projectName, setProjectName] = useState('')
  // TODO: Update actual video
  const TUTORIAL_URL = 'https://www.youtube.com'

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
          <h1 className="text-2xl font-semibold text-gh-text tracking-tight">Copilot Ralph</h1>
          <p className="text-sm text-gh-text-muted">Get started by opening a project</p>
        </div>

        {/* Action buttons side by side */}
        <div className="flex gap-0.5">
          {/* Open folder – clickable */}
          <button
            onClick={handleOpenFolder}
            className="flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-md hover:bg-gh-surface border border-transparent hover:border-gh-border transition-colors group"
          >
            <IconFolder size={20} className="text-gh-text-muted group-hover:text-gh-blue" />
            <span className="text-sm text-gh-text group-hover:text-gh-blue transition-colors">
              Open Folder
            </span>
          </button>

          {/* New project – clickable */}
          <button
            onClick={handleNewProject}
            className="flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-md hover:bg-gh-surface border border-transparent hover:border-gh-border transition-colors group"
          >
            <IconFolderPlus size={20} className="text-gh-text-muted group-hover:text-gh-blue" />
            <span className="text-sm text-gh-text group-hover:text-gh-blue transition-colors">
              New Project
            </span>
          </button>
        </div>

        {/* Instructions - styled differently */}
        <div className="space-y-3 pt-1">
          {/* <p className="text-sm text-gh-text-muted font-medium tracking-wide">How to use</p> */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <IconEdit size={16} className="text-gh-text-muted mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gh-text-muted leading-relaxed">Define your tasks</p>
            </div>
            <div className="flex items-start gap-2">
              <IconListCheck size={16} className="text-gh-text-muted mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gh-text-muted leading-relaxed">
                Click Plan (Optional but recommended)
              </p>
            </div>
            <div className="flex items-start gap-2">
              <IconPlayerPlay size={16} className="text-gh-text-muted mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gh-text-muted leading-relaxed">Click start</p>
            </div>
            <div className="flex items-start gap-2">
              <IconBrandYoutube size={16} className="text-gh-text-muted mt-0.5 flex-shrink-0" />
              <a
                href={TUTORIAL_URL}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-gh-text-muted leading-relaxed hover:text-gh-blue transition-colors"
              >
                Watch video tutorial
              </a>
            </div>
            <div className="flex items-start gap-2">
              <IconBed size={16} className="text-gh-text-muted mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gh-text-muted leading-relaxed">Go take a nap</p>
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
