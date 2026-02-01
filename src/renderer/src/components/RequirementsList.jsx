import { useState, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { IconTrash, IconEdit, IconCircleCheck, IconCircleDashed } from '@tabler/icons-react'
import ConfirmDialog from './ConfirmDialog'

const RequirementsList = () => {
  const folderPath = useAppStore((state) => state.folderPath)
  const prdItems = useAppStore((state) => state.prdItems)
  const setPrdItems = useAppStore((state) => state.setPrdItems)
  const deletePrdItem = useAppStore((state) => state.deletePrdItem)

  const [showForm, setShowForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

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

  // Handle delete item
  const handleDeleteItem = (itemId) => {
    const item = prdItems.find((i) => i.id === itemId)
    if (item) {
      setItemToDelete(item)
      setShowDeleteDialog(true)
    }
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (!itemToDelete || !folderPath) return

    const updatedItems = prdItems.filter((item) => item.id !== itemToDelete.id)

    try {
      const success = await window.electron.ipcRenderer.invoke(
        'fs:savePrdFile',
        folderPath,
        JSON.stringify(updatedItems, null, 2)
      )

      if (success) {
        deletePrdItem(itemToDelete.id)
        setShowDeleteDialog(false)
        setItemToDelete(null)
      } else {
        alert('Failed to delete requirement')
      }
    } catch (error) {
      console.error('Error deleting requirement:', error)
      alert('Failed to delete requirement')
    }
  }

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteDialog(false)
    setItemToDelete(null)
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
      const nextId =
        updatedItems.length > 0 ? Math.max(...updatedItems.map((item) => item.id)) + 1 : 0

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

  return (
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
              <div className="">
                {/* title and buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Status indicator icon */}
                    {item.isDone ? (
                      <IconCircleCheck
                        size={20}
                        strokeWidth={2}
                        className="text-green-500"
                        title="Done"
                      />
                    ) : (
                      <IconCircleDashed
                        size={20}
                        strokeWidth={2}
                        className="text-amber-500"
                        title="In Progress"
                      />
                    )}
                    <h4 className="font-medium text-gh-text">{item.title}</h4>
                  </div>
                  {/* buttons div */}
                  <div>
                    <button
                      onClick={() => handleEditItem(item.id)}
                      className="p-2 text-gh-text-muted hover:text-gh-blue hover:bg-gh-blue-focus/10 rounded transition-colors"
                      title="Edit requirement"
                    >
                      <IconEdit size={20} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-gh-text-muted hover:text-gh-red hover:bg-gh-red/10 rounded transition-colors"
                      title="Delete requirement"
                    >
                      <IconTrash size={20} strokeWidth={2} />
                    </button>
                  </div>
                </div>
                {/* descriptions */}
                <div>
                  <p className="text-sm text-gh-text-muted">{item.description}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="Delete Requirement"
        message={
          itemToDelete
            ? `Are you sure you want to delete "${itemToDelete.title}"? This action cannot be undone.`
            : ''
        }
      />
    </div>
  )
}

export default RequirementsList
