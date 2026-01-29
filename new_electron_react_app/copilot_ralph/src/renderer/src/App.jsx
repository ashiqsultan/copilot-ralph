import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import TopBar from './components/TopBar'

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <div class="bg-gh-bg text-gh-text">
        <div id="topbar-container">
          <TopBar />
        </div>

        <div class="flex w-full">
          <div id="left-column" class="w-[70%]"></div>

          <div id="right-column" class="w-[30%]"></div>
        </div>
      </div>
    </>
  )
}

export default App
