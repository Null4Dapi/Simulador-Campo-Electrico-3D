import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from '@campoelectrico/three'
import { HeaderNavbar } from './ui/HeaderNavbar'
import { RightToolbar } from './ui/RightToolbar'
import { RightInspector } from './ui/RightInspector'
import { BottomChatInput } from './ui/BottomChatInput'
import { AgentLog } from './ui/AgentLog'
import { ZoomControls } from './ui/ZoomControls'
import { QuizButton } from './ui/QuizButton'
import { Suspense, lazy } from 'react'

const QuizPanel = lazy(() => import('./ui/QuizPanel').then(m => ({ default: m.QuizPanel })))
const OnboardingModal = lazy(() => import('./ui/OnboardingModal').then(m => ({ default: m.OnboardingModal })))
import { useSimulatorStore } from '@campoelectrico/store'

function App() {
  const theme = useSimulatorStore((state) => state.theme)
  const interactionMode = useSimulatorStore((state) => state.interactionMode)

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const cursorClass = interactionMode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'

  return (
    <main className={`relative w-screen h-screen bg-slate-50 dark:bg-black overflow-hidden font-serif select-none text-zinc-900 dark:text-white ${cursorClass}`}>
      <div className="absolute inset-0 z-0">
        <Canvas 
          camera={{ position: [0, 5, 10], fov: 50 }} 
          gl={{ preserveDrawingBuffer: true, powerPreference: 'high-performance', antialias: true, alpha: false }}
          dpr={[1, 2]}
          role="img"
          aria-label="Simulación 3D interactiva del campo eléctrico"
        >
          <Scene />
        </Canvas>
      </div>

      <div className="layer-ui-wrapper absolute inset-0 pointer-events-none overflow-hidden">
        
        <header className="absolute top-4 left-4 sm:top-6 sm:left-6 pointer-events-none z-10 max-w-[calc(100vw-2rem)]">
          <HeaderNavbar />
        </header>

        <nav className="absolute top-16 left-1/2 -translate-x-1/2 sm:top-6 pointer-events-none z-10 flex justify-center w-[calc(100vw-2rem)] sm:w-auto">
          <RightToolbar />
        </nav>

        <aside className="absolute bottom-0 left-0 right-0 sm:top-24 sm:left-6 sm:bottom-24 sm:right-auto pointer-events-none z-10 flex flex-col items-center sm:items-start justify-end sm:justify-start overflow-hidden sm:max-w-[calc(100vw-2rem)]">
          <RightInspector />
        </aside>

        <div className="absolute top-1/2 -translate-y-1/2 left-4 sm:top-auto sm:translate-y-0 sm:bottom-6 sm:left-6 pointer-events-none z-10">
          <ZoomControls />
        </div>

        <div className="absolute bottom-[50vh] sm:bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10 w-full max-w-xl flex justify-center px-4">
          <BottomChatInput />
        </div>

        <AgentLog />
        
        <QuizButton />
        <Suspense fallback={null}>
          <QuizPanel />
        </Suspense>
        
      </div>

      <Suspense fallback={null}>
        <OnboardingModal />
      </Suspense>
    </main>
  )
}

export default App
