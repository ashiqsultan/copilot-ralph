import TopBar from './components/TopBar'
import LeftColumn from './components/LeftColumn'
import RightColumn from './components/RightColumn'
import CopilotSettings from './components/CopilotSettings'

function App() {
  return (
    <div className="bg-gh-bg text-gh-text h-screen max-h-screen flex flex-col overflow-hidden">
      <TopBar />
      <CopilotSettings />

      <div className="flex w-full flex-1 min-h-0 overflow-hidden">
        <div className="w-[60%] h-full overflow-y-auto">
          <LeftColumn />
        </div>

        <div className="w-[40%] h-full flex">
          <RightColumn />
        </div>
      </div>
    </div>
  )
}

export default App
