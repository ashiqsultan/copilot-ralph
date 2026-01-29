import TopBar from './components/TopBar'
import LeftColumn from './components/LeftColumn'
import RightColumn from './components/RightColumn'

function App() {
  return (
    <div className="bg-gh-bg text-gh-text min-h-screen">
      <TopBar />

      <div className="flex w-full">
        <div className="w-[70%]">
          <LeftColumn />
        </div>

        <div className="w-[30%]">
          <RightColumn />
        </div>
      </div>
    </div>
  )
}

export default App
