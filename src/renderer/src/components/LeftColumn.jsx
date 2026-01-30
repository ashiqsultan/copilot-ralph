import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../store/appStore'

const LeftColumn = () => {
  const folderPath = useAppStore((state) => state.folderPath)
  const hasPrdFile = useAppStore((state) => state.hasPrdFile)
  const prdItems = useAppStore((state) => state.prdItems)
  const setHasPrdFile = useAppStore((state) => state.setHasPrdFile)
  const setPrdItems = useAppStore((state) => state.setPrdItems)
  const updatePrdItem = useAppStore((state) => state.updatePrdItem)

  const [showForm, setShowForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')

  // Check for prd.json file when folder changes
  useEffect(() => {
    if (folderPath) {
      checkPrdFile(folderPath)
    }
  }, [folderPath])

  // Check for prd.json file
  const checkPrdFile = useCallback(async (path) => {
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
  }, [setHasPrdFile, setPrdItems])

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

  // Handle create new requirement button
  const handleCreateNewRequirement = () => {
    setEditingItemId(null)
    setFormTitle('')
    setFormDescription('')
    setShowForm(true)
  }

  // Handle cancel button
  const handleCancel = () => {
    setShowForm(false)
    setEditingItemId(null)
    setFormTitle('')
    setFormDescription('')
  }

  // Handle edit item
  const handleEditItem = (itemId) => {
    const item = prdItems.find((i) => i.id === itemId)
    if (item) {
      setEditingItemId(itemId)
      setFormTitle(item.title)
      setFormDescription(item.description)
      setShowForm(true)
    }
  }

  // Handle save (Okay button)
  const handleSave = async () => {
    const title = formTitle.trim()
    const description = formDescription.trim()

    if (!title) {
      alert('Please enter a title')
      return
    }

    if (!folderPath) {
      alert('No folder selected')
      return
    }

    let updatedItems = [...prdItems]

    if (editingItemId !== null) {
      // Edit existing item
      const itemIndex = updatedItems.findIndex((item) => item.id === editingItemId)
      if (itemIndex !== -1) {
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          title,
          description: description || 'No description'
        }
      }
    } else {
      // Create new item
      const nextId = updatedItems.length > 0 ? Math.max(...updatedItems.map((item) => item.id)) + 1 : 0

      const newItem = {
        id: nextId,
        title,
        description: description || 'No description'
      }

      updatedItems.push(newItem)
    }

    // Save to file
    try {
      const success = await window.electron.ipcRenderer.invoke(
        'fs:savePrdFile',
        folderPath,
        JSON.stringify(updatedItems, null, 2)
      )

      if (success) {
        setPrdItems(updatedItems)
        handleCancel()
      } else {
        alert('Failed to save requirement')
      }
    } catch (error) {
      console.error('Error saving PRD file:', error)
      alert('Failed to save requirement')
    }
  }

  // Escape HTML to prevent XSS
  const escapeHtml = (text) => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

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
      {folderPath && hasPrdFile && (
        <div className="space-y-4">
          {/* Create New Requirement Button */}
          <button
            onClick={handleCreateNewRequirement}
            className="bg-gh-green hover:bg-gh-green-hover text-white font-medium py-2 px-4 rounded-md"
          >
            Create new requirement
          </button>

          {/* Input Form */}
          {showForm && (
            <div className="space-y-3 p-4 bg-gh-surface border border-gh-border rounded-md">
              <div>
                <label className="block text-sm font-medium text-gh-text mb-1">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gh-bg border border-gh-border-muted rounded-md text-gh-text focus:outline-none focus:ring-2 focus:ring-gh-blue-focus focus:border-transparent placeholder-gh-text-muted"
                  placeholder="Enter title"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gh-text mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gh-bg border border-gh-border-muted rounded-md text-gh-text focus:outline-none focus:ring-2 focus:ring-gh-blue-focus focus:border-transparent placeholder-gh-text-muted"
                  rows="3"
                  placeholder="Enter description"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="bg-gh-green hover:bg-gh-green-hover text-white font-medium py-2 px-4 rounded-md"
                >
                  Okay
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gh-border hover:bg-gh-border-muted text-gh-text font-medium py-2 px-4 rounded-md border border-gh-border-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Requirements List */}
          <div className="space-y-2">
            {prdItems.length === 0 ? (
              <p className="text-gh-text-muted italic">No items found. Create a new item to see</p>
            ) : (
              prdItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-gh-surface border border-gh-border-muted rounded-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            item.isDone ? 'bg-gh-green-bright' : 'bg-gh-yellow'
                          }`}
                          title={item.isDone ? 'Completed' : 'Not completed'}
                        />
                        <span className="text-xs text-gh-text-muted font-mono">ID: {item.id}</span>
                      </div>
                      <h4 className="font-medium text-gh-text">{item.title}</h4>
                      <p className="text-sm text-gh-text-muted">{item.description}</p>
                    </div>
                    <button
                      onClick={() => handleEditItem(item.id)}
                      className="ml-2 p-2 text-gh-text-muted hover:text-gh-blue hover:bg-gh-blue-focus/10 rounded transition-colors"
                      title="Edit requirement"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
                        <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415" />
                        <path d="M16 5l3 3" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LeftColumn
