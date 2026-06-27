import { memo } from 'react';
import { useSimulatorStore } from '@campoelectrico/store';
import { motion } from 'framer-motion';
import { Hand, MousePointer2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@campoelectrico/ui';

export const RightToolbar = memo(function RightToolbar() {
  const addCharge = useSimulatorStore((state) => state.addCharge);
  const interactionMode = useSimulatorStore((state) => state.interactionMode);
  const setInteractionMode = useSimulatorStore((state) => state.setInteractionMode);

  const showFieldLines = useSimulatorStore((state) => state.showFieldLines);
  const showEquipotential = useSimulatorStore((state) => state.showEquipotential);
  const toggleFieldLines = useSimulatorStore((state) => state.toggleFieldLines);
  const toggleEquipotential = useSimulatorStore((state) => state.toggleEquipotential);
  
  const setCameraView = useSimulatorStore((state) => state.setCameraView);
  const cameraView = useSimulatorStore((state) => state.cameraView);

  return (
    <motion.div 
      layout
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="glass-panel-floating pointer-events-auto flex flex-row items-center gap-1 p-1.5 z-20 max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      <button
        onClick={() => setInteractionMode('pan')}
        className={`relative w-8 h-8 rounded-[calc(var(--radius)-4px)] flex items-center justify-center transition-colors duration-200 cursor-pointer active:scale-95 border outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          interactionMode === 'pan'
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border-transparent'
        }`}
        title="Herramienta Mano (Paneo)"
        aria-label="Modo Paneo"
      >
        <Hand className="w-4 h-4" />
      </button>

      <button
        onClick={() => setInteractionMode('select')}
        className={`relative w-8 h-8 rounded-[calc(var(--radius)-4px)] flex items-center justify-center transition-colors duration-200 cursor-pointer active:scale-95 border outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          interactionMode === 'select'
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border-transparent'
        }`}
        title="Herramienta Selección"
        aria-label="Modo Selección"
      >
        <MousePointer2 className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      <button
        onClick={() => {
          setInteractionMode('select');
          addCharge('positive');
        }}
        className="relative w-8 h-8 rounded-[calc(var(--radius)-4px)] text-red-500 hover:bg-red-500/15 flex items-center justify-center transition-colors duration-200 cursor-pointer active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        title="Añadir Carga Positiva (+1 nC)"
        aria-label="Añadir Carga Positiva"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity="0.1" />
          <text x="12" y="16.5" textAnchor="middle" fontSize="14" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">+</text>
        </svg>
      </button>

      <button
        onClick={() => {
          setInteractionMode('select');
          addCharge('negative');
        }}
        className="relative w-8 h-8 rounded-[calc(var(--radius)-4px)] text-blue-500 hover:bg-blue-500/15 flex items-center justify-center transition-colors duration-200 cursor-pointer active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        title="Añadir Carga Negativa (-1 nC)"
        aria-label="Añadir Carga Negativa"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity="0.1" />
          <text x="12" y="15.5" textAnchor="middle" fontSize="16" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">-</text>
        </svg>
      </button>

      <button
        onClick={() => {
          setInteractionMode('select');
          addCharge('test');
        }}
        className="relative w-8 h-8 rounded-[calc(var(--radius)-4px)] text-green-500 hover:bg-green-500/15 flex items-center justify-center transition-colors duration-200 cursor-pointer active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        title="Añadir Carga de Prueba (q₀)"
        aria-label="Añadir Carga de Prueba"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity="0.1" strokeDasharray="4 4" />
          <text x="12" y="16.5" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">q0</text>
        </svg>
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      <button
        onClick={toggleFieldLines}
        className={`relative w-8 h-8 rounded-[calc(var(--radius)-4px)] flex items-center justify-center transition-colors duration-200 cursor-pointer active:scale-95 border outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          showFieldLines
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
            : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border-transparent'
        }`}
        title="Líneas de Campo"
        aria-label="Líneas de Campo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18"></path><path d="M3 12h18"></path>
          <path d="M18.36 5.64 5.64 18.36"></path><path d="M18.36 18.36 5.64 5.64"></path>
        </svg>
      </button>

      <button
        onClick={toggleEquipotential}
        className={`relative w-8 h-8 rounded-[calc(var(--radius)-4px)] flex items-center justify-center transition-colors duration-200 cursor-pointer active:scale-95 border outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          showEquipotential
            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
            : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border-transparent'
        }`}
        title="Superficies Equipotenciales"
        aria-label="Superficies Equipotenciales"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle>
        </svg>
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Cambiar vista de cámara" className="flex items-center gap-1.5 px-3 h-8 hover:bg-black/5 dark:hover:bg-white/5 rounded-[calc(var(--radius)-4px)] text-xs font-medium text-foreground transition-all duration-200 active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <span>Vistas</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32 mt-2">
          <DropdownMenuItem onClick={() => setCameraView('top')} className="cursor-pointer justify-between">
            Superior
            {cameraView === 'top' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCameraView('front')} className="cursor-pointer justify-between">
            Frontal
            {cameraView === 'front' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCameraView('right')} className="cursor-pointer justify-between">
            Derecha
            {cameraView === 'right' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCameraView('isometric')} className="cursor-pointer justify-between">
            Isométrica
            {cameraView === 'isometric' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

    </motion.div>
  );
});
