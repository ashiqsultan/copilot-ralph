import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'

const ProgressTab = () => {
  const folderPath = useAppStore((state) => state.folderPath)
  const [progressContent, setProgressContent] = useState('')

  useEffect(() => {
    if (folderPath) {
      loadProgress()
    }
  }, [folderPath])

  const loadProgress = async () => {
    try {
      const content = await window.electron.ipcRenderer.invoke('fs:readProgressFile', folderPath)
      setProgressContent(content || '')
    } catch (error) {
      console.error('Error loading progress:', error)
      setProgressContent('')
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

  return (
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
  )
}

export default ProgressTab
