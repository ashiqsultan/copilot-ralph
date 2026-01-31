import { useState } from 'react'
import { IconX, IconFolder } from '@tabler/icons-react'
import { useAppStore } from '../store/appStore'

const CopilotSettings = () => {
  const isOpen = useAppStore((state) => state.isCopilotSettingsOpen)
  const setIsCopilotSettingsOpen = useAppStore((state) => state.setIsCopilotSettingsOpen)
  const [copilotPath, setCopilotPath] = useState('')
  const [loginStatus, setLoginStatus] = useState(null)
  const [isCheckingLogin, setIsCheckingLogin] = useState(false)

  if (!isOpen) return null

  const onClose = () => setIsCopilotSettingsOpen(false)

  const handleCheckLoginStatus = async () => {
    setIsCheckingLogin(true)
    setLoginStatus(null)

    try {
      // Call the main process to check login status
      const result = await window.electron.ipcRenderer.invoke('check-copilot-login')
      setLoginStatus(result)
    } catch (error) {
      setLoginStatus({ success: false, message: error.message })
    } finally {
      setIsCheckingLogin(false)
    }
  }

  const handleBrowsePath = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('select-copilot-path')
      if (result) {
        setCopilotPath(result)
      }
    } catch (error) {
      console.error('Error selecting path:', error)
    }
  }

  const handleSavePath = async () => {
    try {
      await window.electron.ipcRenderer.invoke('save-copilot-path', copilotPath)
      // Show success feedback
      alert('Copilot path saved successfully!')
    } catch (error) {
      alert('Error saving copilot path: ' + error.message)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-gh-bg rounded-lg shadow-xl w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gh-border">
          <h2 className="text-xl font-semibold text-gh-text">Copilot Settings</h2>
          <button
            onClick={onClose}
            className="text-gh-text-muted hover:text-gh-text transition-colors"
            aria-label="Close"
          >
            <IconX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Login Status Check */}
          <div className="border border-gh-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-[80%]">
                <h3 className="text-sm font-semibold text-gh-text">Login Status</h3>
                <p className="text-xs text-gh-text-muted mt-1">
                  Check if GitHub Copilot is authenticated
                </p>
              </div>
              <button
                onClick={handleCheckLoginStatus}
                disabled={isCheckingLogin}
                className="ml-auto w-[20%] px-2 py-1 bg-gh-surface text-gh-text-muted text-xs font-medium rounded-md hover:bg-gh-border-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 h-8"
              >
                {isCheckingLogin ? (
                  <>
                    <div className="w-3 h-3 border-2 border-gh-text-muted border-t-transparent rounded-full animate-spin" />
                    <span className="sr-only">Checking</span>
                  </>
                ) : (
                  <div className="hidden sm:inline text-gh-text">Check</div>
                )}
              </button>
            </div>

            {loginStatus && (
              <div
                className={`mt-3 p-3 rounded-md text-sm ${
                  loginStatus.success
                    ? 'bg-gh-green/10 text-gh-green border border-gh-green'
                    : 'bg-gh-red/10 text-gh-red border border-gh-red'
                }`}
              >
                {loginStatus.message}
              </div>
            )}
          </div>

          {/* Copilot Path */}
          <div className="border border-gh-border rounded-lg p-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gh-text">Copilot Path</h3>
              <p className="text-xs text-gh-text-muted mt-1">
                Specify the path to GitHub Copilot executable
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={copilotPath}
                  onChange={(e) => setCopilotPath(e.target.value)}
                  placeholder="/path/to/copilot"
                  className="flex-1 px-3 py-2 border border-gh-border-muted rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gh-blue-focus focus:border-transparent text-gh-text placeholder-gh-text-muted"
                />
                <button
                  onClick={handleBrowsePath}
                  className="px-4 py-2 border border-gh-border-muted text-gh-text-muted text-sm font-medium rounded-md hover:bg-gh-surface transition-colors flex items-center gap-2"
                >
                  <IconFolder size={16} />
                  Browse
                </button>
              </div>

              <button
                onClick={handleSavePath}
                disabled={!copilotPath.trim()}
                className="w-full px-4 py-2 bg-gh-green text-white text-sm font-medium rounded-md hover:bg-gh-green-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Path
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gh-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gh-text-muted hover:text-gh-text transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default CopilotSettings
