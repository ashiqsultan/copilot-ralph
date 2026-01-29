import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <div class="bg-gh-bg text-gh-text">
        <h1 class="text-3xl font-bold ">Hello world!</h1>

        <div id="topbar-container"></div>

        <div class="flex w-full">
          <div id="left-column" class="w-[70%]"></div>

          <div id="right-column" class="w-[30%]"></div>
        </div>
      </div>
      <div className="action">
        <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
          Send IPC
        </a>
      </div>
    </>
  )
}

export default App
