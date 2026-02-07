import { IconTrash, IconEdit, IconCircleCheck, IconCircleDashed } from '@tabler/icons-react'

const StatusIcon = ({ isDone, isItemWorking }) => {
  if (isItemWorking) {
    return (
      <IconCircleDashed
        size={20}
        strokeWidth={2}
        className="text-amber-500 animate-spin-slow"
        title="In Progress"
      />
    )
  }
  return (
    <>
      {isDone ? (
        <IconCircleCheck size={20} strokeWidth={2} className="text-green-500" title="Done" />
      ) : (
        <IconCircleDashed size={20} strokeWidth={2} className="text-blue-500" title="In Progress" />
      )}
    </>
  )
}

const RequirementsViewItem = ({ item, workingItemId, onEdit, onDelete }) => {
  const isItemWorking = (id, workingItemId) => id == workingItemId

  return (
    <div className="p-3 bg-gh-surface border border-gh-border-muted rounded-md">
      <div className="">
        {/* title and buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon
              isDone={item.isDone}
              isItemWorking={isItemWorking(item.id, workingItemId)}
            />
            <h4 className="font-medium text-gh-text">{item.title}</h4>
          </div>
          {/* buttons div */}
          <div>
            <button
              onClick={() => onEdit(item.id)}
              className="p-2 text-gh-text-muted hover:text-gh-blue hover:bg-gh-blue-focus/10 rounded transition-colors"
              title="Edit requirement"
            >
              <IconEdit size={20} strokeWidth={2} />
            </button>
            <button
              onClick={() => onDelete(item.id)}
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
        {/* plan */}
        {item.plan && (
          <div className="mt-1">
            <p className="text-sm text-gh-text-muted whitespace-pre-line"><span className="font-medium text-gh-text">Plan:</span> {item.plan}</p>
          </div>
        )}
        {/* attachments */}
        {item.attachments && item.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.attachments.map((attachment, index) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 bg-gh-bg border border-gh-border-muted rounded text-gh-text-muted"
                title={attachment.path}
              >
                📎 {attachment.displayName}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RequirementsViewItem
