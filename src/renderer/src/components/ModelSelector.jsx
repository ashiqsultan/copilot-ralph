import { useEffect, useRef, useState } from 'react'
import { IconChevronDown, IconLoader2 } from '@tabler/icons-react'

const ModelSelector = () => {
  const dropdownRef = useRef(null)

  // Model selection state
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('')
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Fetch available models on mount
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true)
      try {
        // Get stored model preference
        const storedModel = await window.electron.ipcRenderer.invoke('get-prd-executor-model')
        
        const result = await window.electron.ipcRenderer.invoke('get-available-models')
        if (result.success && result.models) {
          setModels(result.models)
          
          // Use stored model if available, otherwise default to first model
          if (storedModel) {
            setSelectedModel(storedModel)
          } else if (result.models.length > 0) {
            const firstModelId = result.models[0].id || result.models[0].name || result.models[0]
            setSelectedModel(firstModelId)
            // Save the default selection to store
            await window.electron.ipcRenderer.invoke('set-prd-executor-model', firstModelId)
          }
        } else {
          console.error('Failed to fetch models:', result.message)
        }
      } catch (error) {
        console.error('Error fetching models:', error)
      } finally {
        setIsLoadingModels(false)
      }
    }

    fetchModels()
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isLoadingModels}
        className="flex items-center gap-2 border border-gh-border bg-gh-surface text-gh-text px-3 py-1.5 rounded-md text-sm hover:bg-gh-surface-hover transition-colors min-w-[140px]"
      >
        {isLoadingModels ? (
          <>
            <IconLoader2 size={16} className="animate-spin" />
            <span className="text-gh-text-muted">Loading...</span>
          </>
        ) : (
          <>
            <span className="truncate flex-1 text-left">{selectedModel || 'Select model'}</span>
            <IconChevronDown
              size={16}
              className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && !isLoadingModels && models.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-gh-surface border border-gh-border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
          {models.map((model) => {
            const modelId = model.id || model.name || model
            const modelName = model.name || model.id || model
            return (
              <button
                key={modelId}
                onClick={async () => {
                  setSelectedModel(modelId)
                  setIsDropdownOpen(false)
                  // Save selection to store
                  await window.electron.ipcRenderer.invoke('set-prd-executor-model', modelId)
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gh-bg transition-colors ${
                  selectedModel === modelId ? 'bg-gh-blue-subtle text-gh-blue' : 'text-gh-text'
                }`}
              >
                {modelName}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ModelSelector
