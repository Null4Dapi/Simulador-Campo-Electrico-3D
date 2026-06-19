import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from '@campoelectrico/three'
import { HeaderNavbar } from './ui/HeaderNavbar'
import { RightToolbar } from './ui/RightToolbar'
import { RightInspector } from './ui/RightInspector'
import { BottomChatInput } from './ui/BottomChatInput'
import { AgentLog } from './ui/AgentLog'
import { OnboardingModal } from './ui/OnboardingModal'
import { ZoomControls } from './ui/ZoomControls'
import { QuizButton } from './ui/QuizButton'
import { QuizPanel } from './ui/QuizPanel'
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
    <div className={`relative w-screen h-screen bg-slate-50 dark:bg-black overflow-hidden font-serif select-none text-zinc-900 dark:text-white ${cursorClass}`}>
      {/* Capa base de renderizado tridimensional */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 5, 10], fov: 50 }} gl={{ preserveDrawingBuffer: true }}>
          <Scene />
        </Canvas>
      </div>

      {/* Capa de interfaz superpuesta con transferencia de eventos al lienzo subyacente */}
      <div className="layer-ui-wrapper absolute inset-0 pointer-events-none overflow-hidden">
        
        {/* Controles de navegación y marca (Esquina superior izquierda) */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 pointer-events-auto z-10">
          <HeaderNavbar />
        </div>

        {/* Barra de herramientas principal (Centro superior) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 sm:top-6 pointer-events-auto z-10 flex justify-center">
          <RightToolbar />
        </div>

        {/* Panel de inspección y propiedades (Lateral izquierdo) */}
        <div className="absolute top-20 left-4 sm:top-24 sm:left-6 bottom-20 sm:bottom-24 pointer-events-auto z-10 flex flex-col items-start justify-start">
          <RightInspector />
        </div>

        {/* Controles de nivel de detalle (Esquina inferior izquierda) */}
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 pointer-events-auto z-10">
          <ZoomControls />
        </div>

        {/* Interfaz de entrada para comandos y chat (Centro inferior) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6 pointer-events-auto z-10 w-full max-w-xl flex justify-center px-4">
          <BottomChatInput />
        </div>

        {/* Panel de registro del asistente virtual (Gestión autónoma de posicionamiento) */}
        <AgentLog />
        
        {/* Componentes del Quizz Metacognitivo */}
        <QuizButton />
        <QuizPanel />
        
      </div>

      {/* Capas modales superpuestas */}
      <OnboardingModal />
    </div>
  )
}

export default App
