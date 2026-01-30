const ConfirmDialog = ({ isOpen, onConfirm, onCancel, title, message }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-gh-surface border border-gh-border rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gh-text mb-3">
          {title}
        </h3>

        {/* Message */}
        <p className="text-gh-text-muted mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="bg-gh-border hover:bg-gh-border-muted text-gh-text font-medium py-2 px-4 rounded-md border border-gh-border-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-gh-red hover:bg-gh-red/80 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
