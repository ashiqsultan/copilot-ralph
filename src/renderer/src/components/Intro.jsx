import { IconFolder, IconFileText, IconListCheck, IconPlayerPlay } from '@tabler/icons-react'

const Intro = () => {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-3xl font-bold text-gh-text mb-8">
          Welcome to Copilot Ralph
        </h1>

        <div className="space-y-6 text-left">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-gh-surface border border-gh-border">
            <IconFolder className="text-gh-blue mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-gh-text mb-1">
                Select project
              </h3>
              <p className="text-gh-text-muted text-sm">
                Choose an existing codebase folder or create new 
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-gh-surface border border-gh-border">
            <IconFileText className="text-gh-green-bright mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-gh-text mb-1">
                Create Tasks
              </h3>
              <p className="text-gh-text-muted text-sm">
                Define your requirements like a todo list.
              </p>
            </div>
          </div>

         
          <div className="flex items-start gap-4 p-4 rounded-lg bg-gh-surface border border-gh-border">
            <IconPlayerPlay className="text-gh-green mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-gh-text mb-1">
                Click start
              </h3>
              <p className="text-gh-text-muted text-sm">
                Copilot Ralph will work on your requirements while you nap 
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Intro
