import { useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { IconFolder } from '@tabler/icons-react'

const TopBar = ({ onFolderChange }) => {
  const folderPath = useAppStore((state) => state.folderPath)
  const setFolderPath = useAppStore((state) => state.setFolderPath)

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

  return (
    <header className="w-full bg-gh-surface border-b border-gh-border text-gh-text p-4">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={handleOpenFolder}
            className="bg-gh-green hover:bg-gh-green-hover text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center gap-2"
          >
            {/* <img src="/assets/icons/folder-icon.svg" alt="Folder Icon" width="20" height="20" /> */}
            <IconFolder color="white" size={20} />
            Open Folder
          </button>
        </div>

        <div
          className={`flex-1 text-center mx-4 font-mono text-sm ${
            folderPath ? 'text-white' : 'text-gh-text-muted'
          }`}
        >
          {folderPath || 'No folder selected'}
        </div>

        <div className="w-32"></div>
      </div>
    </header>
  )
}

export default TopBar
