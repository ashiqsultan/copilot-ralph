import TopBar from './components/TopBar'
import LeftColumn from './components/LeftColumn'
import RightColumn from './components/RightColumn'

function App() {
  return (
    <div className="bg-gh-bg text-gh-text min-h-screen  flex flex-col">
      <TopBar />

      <div className="flex w-full flex-1  min-h-0">
        <div className="w-[70%]  h-full flex-1 min-h-0">
          <LeftColumn />
        </div>

        <div className="w-[30%]  h-full flex-1 min-h-0">
          <RightColumn />
        </div>
      </div>
    </div>
  )
}

export default App
