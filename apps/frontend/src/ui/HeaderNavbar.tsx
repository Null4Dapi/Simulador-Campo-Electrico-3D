import { useRef } from 'react';
import { useSimulatorStore } from '@campoelectrico/store';
import { Menu, Ruler, Grid, Moon, Sun, Image as ImageIcon, Trash2, HelpCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@campoelectrico/ui';

export function HeaderNavbar() {
  const theme = useSimulatorStore((state) => state.theme);
  const toggleTheme = useSimulatorStore((state) => state.toggleTheme);
  const toggleTapeMeasure = useSimulatorStore((state) => state.toggleTapeMeasure);
  const showTapeMeasure = useSimulatorStore((state) => state.showTapeMeasure);
  const toggleGridVisible = useSimulatorStore((state) => state.toggleGridVisible);
  const gridVisible = useSimulatorStore((state) => state.gridVisible);
  const clearScene = useSimulatorStore((state) => state.clearScene);
  const resetOnboarding = useSimulatorStore((state) => state.resetOnboarding);
  const isTransitioning = useRef(false);

  const handleToggleTheme = (e: React.MouseEvent) => {
    if (isTransitioning.current) return;

    // Determina las coordenadas exactas del evento de interacción
    const x = e.clientX;
    const y = e.clientY;

    document.documentElement.style.setProperty('--theme-toggle-x', `${x}px`);
    document.documentElement.style.setProperty('--theme-toggle-y', `${y}px`);

    if (!document.startViewTransition) {
      toggleTheme();
      return;
    }

    isTransitioning.current = true;
    const transition = document.startViewTransition(() => {
      toggleTheme();
    });

    transition.finished.then(() => {
      isTransitioning.current = false;
    }).catch(() => {
      isTransitioning.current = false;
    });
  };

  const handleExport = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.warn('No se encontró el canvas para exportar la escena.');
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        console.warn('No se pudo generar la imagen JPEG de la escena.');
        return;
      }

      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `campo-electrico-escena-${new Date().toISOString().slice(0, 10)}.jpeg`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.92);
  };

  return (
    <header className="flex items-center gap-4 select-none">
      
      {/* Elemento disparador del menú con estilo de panel translúcido */}
      <div className="pointer-events-auto glass-panel-floating flex items-center justify-center p-1.5">
        <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center justify-center w-8 h-8 rounded-[calc(var(--radius)-4px)] text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-all duration-200 active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <Menu className="w-5 h-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={16} alignOffset={-6} className="w-56">
          <DropdownMenuItem onClick={toggleTapeMeasure} className="cursor-pointer">
            <Ruler className="w-4 h-4 mr-2" />
            <span>Regla</span>
            {showTapeMeasure && <span className="ml-auto text-xs text-muted-foreground">Activo</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleGridVisible} className="cursor-pointer">
            <Grid className="w-4 h-4 mr-2" />
            <span>Activar/desactivar cuadrícula</span>
            {gridVisible && <span className="ml-auto text-xs text-muted-foreground">Activo</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleToggleTheme(e)} className="cursor-pointer">
            {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            <span>Modo {theme === 'dark' ? 'claro' : 'oscuro'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExport} className="cursor-pointer">
            <ImageIcon className="w-4 h-4 mr-2" />
            <span>Exportar imagen...</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={clearScene} className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-950">
            <Trash2 className="w-4 h-4 mr-2" />
            <span>Limpiar lienzo</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={resetOnboarding} className="cursor-pointer">
            <HelpCircle className="w-4 h-4 mr-2" />
            <span>Help & Issues</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>

      {/* Componente tipográfico principal superpuesto en la interfaz */}
      <div className="pointer-events-auto flex flex-col drop-shadow-md">
        <h1 className="text-sm font-bold tracking-widest text-foreground uppercase font-serif">
          Campo Eléctrico 3D
        </h1>
        <span className="text-[9px] text-primary font-serif tracking-widest font-semibold uppercase leading-none mt-0.5">
          Simulador de Cargas
        </span>
      </div>
    </header>
  );
}

