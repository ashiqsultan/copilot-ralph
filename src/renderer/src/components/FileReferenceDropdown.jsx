import { useState, useEffect, useRef } from 'react'

const FileReferenceDropdown = ({ files, searchQuery, onSelect, onClose, isOpen, textareaRef }) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const dropdownRef = useRef(null)
  const listRef = useRef(null)

  // Filter files based on search query
  const filteredFiles = files.filter((file) =>
    file.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Reset selected index when filtered files change
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredFiles.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, filteredFiles.length])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filteredFiles.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && filteredFiles.length > 0) {
        e.preventDefault()
        onSelect(filteredFiles[selectedIndex])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Tab') {
        e.preventDefault()
        if (filteredFiles.length > 0) {
          onSelect(filteredFiles[selectedIndex])
        }
      }
    }

    const textarea = textareaRef?.current
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown)
      return () => textarea.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, filteredFiles, selectedIndex, onSelect, onClose, textareaRef])

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen || filteredFiles.length === 0) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 w-80 max-h-48 overflow-y-auto bg-gh-surface border border-gh-border rounded-md shadow-lg mt-1"
      style={{ top: '100%', left: 0 }}
    >
      <ul ref={listRef} className="py-1">
        {filteredFiles.slice(0, 50).map((file, index) => (
          <li
            key={file}
            onClick={() => onSelect(file)}
            className={`px-3 py-1.5 cursor-pointer text-sm truncate ${
              index === selectedIndex
                ? 'bg-gh-blue-focus text-white'
                : 'text-gh-text hover:bg-gh-border-muted'
            }`}
            title={file}
          >
            <span className="text-gh-text-muted mr-1">📄</span>
            {file}
          </li>
        ))}
        {filteredFiles.length > 50 && (
          <li className="px-3 py-1.5 text-sm text-gh-text-muted italic">
            ... and {filteredFiles.length - 50} more files
          </li>
        )}
      </ul>
    </div>
  )
}

export default FileReferenceDropdown
