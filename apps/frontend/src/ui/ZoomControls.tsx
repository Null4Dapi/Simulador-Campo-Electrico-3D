import { useSimulatorStore } from '@campoelectrico/store';
import { Minus, Plus } from 'lucide-react';

export function ZoomControls() {
  const zoom = useSimulatorStore((state) => state.zoom);
  const setZoom = useSimulatorStore((state) => state.setZoom);

  return (
    <div className="pointer-events-auto glass-panel-floating p-1.5 flex flex-row items-center justify-center gap-1 select-none">
      <button
        onClick={() => setZoom(Math.max(25, zoom - 25))}
        className="w-8 h-8 rounded-[calc(var(--radius)-4px)] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
        title="Disminuir Zoom"
        aria-label="Disminuir Zoom"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="text-xs font-semibold font-mono text-foreground w-10 text-center">{zoom}%</span>
      <button
        onClick={() => setZoom(Math.min(200, zoom + 25))}
        className="w-8 h-8 rounded-[calc(var(--radius)-4px)] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
        title="Aumentar Zoom"
        aria-label="Aumentar Zoom"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
