import Tooltip from './Tooltip'

const TabHeaderItem = ({ id, activeId, onClick, tooltipText, label, Icon }) => {
  const isActive = activeId === id

  return (
    <Tooltip text={tooltipText} position="bottom">
      <button
        onClick={() => onClick(id)}
        className={`px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center ${
          isActive
            ? 'text-gh-text-primary border-b-2 border-gh-green'
            : 'text-gh-text-secondary hover:text-gh-text-primary'
        }`}
      >
        <Icon size={20} strokeWidth={2} className="mr-1" />
        {label}
      </button>
    </Tooltip>
  )
}

export default TabHeaderItem
