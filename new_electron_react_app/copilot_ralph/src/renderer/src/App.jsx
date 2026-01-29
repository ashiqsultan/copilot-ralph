import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import TopBar from './components/TopBar'

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <div className="bg-gh-bg text-gh-text">
        <div id="topbar-container">
          <TopBar />
        </div>

        <div className="flex w-full">
          <div id="left-column" className="w-[70%]"></div>

          <div id="right-column" className="w-[30%]"></div>
        </div>
      </div>
    </>
  )
}

export default App
