import cn from '../util/cn'

const TabHeaderItem = ({ id, activeId, onClick, label, Icon }) => {
  const isActive = activeId === id

  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        'px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center hover:cursor-pointer text-gh-text-secondary hover:text-gh-text-primary border-b-2 border-slate-800',
        { 'text-gh-text-primary border-b-2 border-gh-green': isActive }
      )}
    >
      <Icon size={20} strokeWidth={2} className="mr-1" />
      {label}
    </button>
  )
}

export default TabHeaderItem
