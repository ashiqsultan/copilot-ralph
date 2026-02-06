import RequirementsViewItem from './RequirementsViewItem'

const RequirementsView = ({ prdItems, workingItemId, onEdit, onDelete }) => {
  return (
    <div className="space-y-2">
      {prdItems.length === 0 ? (
        <p className="text-gh-text-muted italic">No items found. Create a new item to see</p>
      ) : (
        prdItems.map((item) => (
          <RequirementsViewItem
            key={item.id}
            item={item}
            workingItemId={workingItemId}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  )
}

export default RequirementsView
