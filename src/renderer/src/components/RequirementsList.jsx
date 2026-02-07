import { useState, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { IconUpload, IconX, IconPlus, IconCheck } from '@tabler/icons-react'
import ConfirmDialog from './ConfirmDialog'
import FileReferenceDropdown from './FileReferenceDropdown'
import RequirementsView from './RequirementsView'
import Tooltip from './Tooltip'

const RequirementsList = () => {
  const folderPath = useAppStore((state) => state.folderPath)
  const prdItems = useAppStore((state) => state.prdItems)
  const setPrdItems = useAppStore((state) => state.setPrdItems)
  const deletePrdItem = useAppStore((state) => state.deletePrdItem)
  const workingItemId = useAppStore((state) => state.workingItemId)

  const [showForm, setShowForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [formAttachments, setFormAttachments] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [projectFiles, setProjectFiles] = useState([])
  const [showFileDropdown, setShowFileDropdown] = useState(false)
  const [fileSearchQuery, setFileSearchQuery] = useState('')
  const [atTriggerPosition, setAtTriggerPosition] = useState(null)
  const [formPlan, setFormPlan] = useState('')
  const [hasPlanField, setHasPlanField] = useState(false)
  const descriptionRef = useRef(null)

  // Fetch project files from backend
  const fetchProjectFiles = async () => {
    if (!folderPath) return
    try {
      const result = await window.electron.ipcRenderer.invoke('fs:getProjectFiles', folderPath)
      if (result.success) {
        setProjectFiles(result.files)
      }
    } catch (error) {
      console.error('Error fetching project files:', error)
    }
  }

  // Handle create new requirement button
  const handleCreateNewRequirement = () => {
    setEditingItemId(null)
    setFormTitle('')
    setFormDescription('')
    setFormAttachments([])
    setFormPlan('')
    setHasPlanField(false)
    setShowForm(true)
    fetchProjectFiles()
  }

  // Handle cancel button
  const handleCancel = () => {
    setShowForm(false)
    setEditingItemId(null)
    setFormTitle('')
    setFormDescription('')
    setFormAttachments([])
    setFormPlan('')
    setHasPlanField(false)
    setShowFileDropdown(false)
    setFileSearchQuery('')
    setAtTriggerPosition(null)
  }

  // Handle edit item
  const handleEditItem = (itemId) => {
    const item = prdItems.find((i) => i.id === itemId)
    if (item) {
      setEditingItemId(itemId)
      setFormTitle(item.title)
      setFormDescription(item.description)
      setFormAttachments(item.attachments || [])
      if ('plan' in item) {
        setFormPlan(item.plan)
        setHasPlanField(true)
      } else {
        setFormPlan('')
        setHasPlanField(false)
      }
      setShowForm(true)
      fetchProjectFiles()
    }
  }

  // Handle image upload
  const handleUploadImages = async () => {
    if (!folderPath) {
      alert('No folder selected')
      return
    }

    setIsUploading(true)
    try {
      const result = await window.electron.ipcRenderer.invoke('dialog:selectImages', folderPath)
      if (result.success && result.attachments.length > 0) {
        setFormAttachments((prev) => [...prev, ...result.attachments])
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Failed to upload images')
    } finally {
      setIsUploading(false)
    }
  }

  // Remove attachment from form
  const handleRemoveAttachment = (index) => {
    setFormAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  // Handle description change with @ trigger detection
  const handleDescriptionChange = (e) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    setFormDescription(value)

    // Find the last @ before cursor
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      // Check if there's a space or newline between @ and cursor
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      const hasSpaceOrNewline = /[\s\n]/.test(textAfterAt)

      if (!hasSpaceOrNewline) {
        setShowFileDropdown(true)
        setFileSearchQuery(textAfterAt)
        setAtTriggerPosition(lastAtIndex)
        return
      }
    }

    setShowFileDropdown(false)
    setFileSearchQuery('')
    setAtTriggerPosition(null)
  }

  // Handle file selection from dropdown
  const handleFileSelect = (filePath) => {
    if (atTriggerPosition === null) return

    const beforeAt = formDescription.substring(0, atTriggerPosition)
    const afterSearch = formDescription.substring(atTriggerPosition + 1 + fileSearchQuery.length)
    const newDescription = `${beforeAt}@${filePath}${afterSearch}`

    setFormDescription(newDescription)
    setShowFileDropdown(false)
    setFileSearchQuery('')
    setAtTriggerPosition(null)

    // Focus back on textarea
    if (descriptionRef.current) {
      descriptionRef.current.focus()
      const newCursorPos = atTriggerPosition + 1 + filePath.length
      setTimeout(() => {
        descriptionRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    }
  }

  // Close file dropdown
  const handleCloseFileDropdown = () => {
    setShowFileDropdown(false)
    setFileSearchQuery('')
    setAtTriggerPosition(null)
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
        const updatedItem = {
          ...updatedItems[itemIndex],
          title,
          description: description || 'No description',
          attachments: formAttachments.length > 0 ? formAttachments : undefined
        }
        if (hasPlanField) {
          updatedItem.plan = formPlan
        }
        updatedItems[itemIndex] = updatedItem
      }
    } else {
      // Create new item
      const nextId =
        updatedItems.length > 0 ? Math.max(...updatedItems.map((item) => item.id)) + 1 : 0

      const newItem = {
        id: nextId,
        title,
        description: description || 'No description',
        isDone: false,
        attachments: formAttachments.length > 0 ? formAttachments : undefined
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
      <Tooltip text="Add Requirement" position="right">
        <button
          onClick={handleCreateNewRequirement}
          className="bg-gh-green hover:bg-gh-green-hover text-white font-medium p-2 rounded-md flex items-center justify-center"
        >
          <IconPlus size={20} strokeWidth={2} />
        </button>
      </Tooltip>

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
          <div className="relative">
            <label className="block text-sm font-medium text-gh-text mb-1">Description</label>
            <textarea
              ref={descriptionRef}
              value={formDescription}
              onChange={handleDescriptionChange}
              className="w-full px-3 py-2 bg-gh-bg border border-gh-border-muted rounded-md text-gh-text focus:outline-none focus:ring-2 focus:ring-gh-blue-focus focus:border-transparent placeholder-gh-text-muted"
              rows="3"
              placeholder="Enter description (type @ to reference files)"
            />
            <FileReferenceDropdown
              files={projectFiles}
              searchQuery={fileSearchQuery}
              onSelect={handleFileSelect}
              onClose={handleCloseFileDropdown}
              isOpen={showFileDropdown}
              textareaRef={descriptionRef}
            />
          </div>
          {editingItemId !== null && hasPlanField && (
            <div>
              <label className="block text-sm font-medium text-gh-text mb-1">Plan</label>
              <textarea
                value={formPlan}
                onChange={(e) => setFormPlan(e.target.value)}
                className="w-full px-3 py-2 bg-gh-bg border border-gh-border-muted rounded-md text-gh-text focus:outline-none focus:ring-2 focus:ring-gh-blue-focus focus:border-transparent placeholder-gh-text-muted"
                rows="3"
                placeholder="Enter plan"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gh-text mb-1">Attachments</label>
            <Tooltip text={isUploading ? 'Uploading...' : 'Upload Images'} position="right">
              <button
                onClick={handleUploadImages}
                disabled={isUploading}
                className="flex items-center justify-center p-2 bg-gh-bg border border-gh-border-muted rounded-md text-gh-text hover:bg-gh-border-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconUpload size={18} strokeWidth={2} />
              </button>
            </Tooltip>
            {formAttachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formAttachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 bg-gh-bg border border-gh-border-muted rounded text-sm text-gh-text"
                  >
                    <span className="truncate max-w-32" title={attachment.displayName}>
                      {attachment.displayName}
                    </span>
                    <button
                      onClick={() => handleRemoveAttachment(index)}
                      className="p-0.5 text-gh-text-muted hover:text-gh-red rounded"
                      title="Remove attachment"
                    >
                      <IconX size={14} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Tooltip text="Save" position="bottom">
              <button
                onClick={handleSave}
                className="bg-gh-green hover:bg-gh-green-hover text-white font-medium p-2 rounded-md flex items-center justify-center"
              >
                <IconCheck size={18} strokeWidth={2} />
              </button>
            </Tooltip>
            <Tooltip text="Cancel" position="bottom">
              <button
                onClick={handleCancel}
                className="bg-gh-border hover:bg-gh-border-muted text-gh-text font-medium p-2 rounded-md border border-gh-border-muted flex items-center justify-center"
              >
                <IconX size={18} strokeWidth={2} />
              </button>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Requirements List */}
      <RequirementsView
        prdItems={prdItems}
        workingItemId={workingItemId}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
      />

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
