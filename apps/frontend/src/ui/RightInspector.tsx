import { memo } from 'react';
import { useSimulatorStore } from '@campoelectrico/store';
import { calculateForceAndEnergy } from '@campoelectrico/three';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

export const RightInspector = memo(function RightInspector() {
  const selectedCharge = useSimulatorStore((state) => state.charges.find((c) => c.id === state.selectedChargeId));
  const isInspectorMinimized = useSimulatorStore((state) => state.isInspectorMinimized);
  const selectCharge = useSimulatorStore((state) => state.selectCharge);
  const updateCharge = useSimulatorStore((state) => state.updateCharge);
  const removeCharge = useSimulatorStore((state) => state.removeCharge);
  const toggleInspectorMinimized = useSimulatorStore((state) => state.toggleInspectorMinimized);
  const setInspectorMinimized = useSimulatorStore((state) => state.setInspectorMinimized);
  const allCharges = useSimulatorStore((state) => state.charges);

  if (!selectedCharge) return null;

  const handlePositionChange = (axis: 'x' | 'y' | 'z', valueStr: string) => {
    const num = parseFloat(valueStr);
    if (!isNaN(num)) {
      const currentPos = [...selectedCharge.position];
      if (axis === 'x') currentPos[0] = num;
      else if (axis === 'y') currentPos[1] = num;
      else currentPos[2] = num;
      updateCharge(selectedCharge.id, { position: currentPos as [number, number, number] });
    }
  };

  const togglePolarity = () => {
    const newType = selectedCharge.type === 'positive' ? 'negative' : 'positive';
    updateCharge(selectedCharge.id, { type: newType });
  };

  const isPositive = selectedCharge.type === 'positive';
  const isTest = selectedCharge.type === 'test';

  let testData = null;
  if (isTest) {
    testData = calculateForceAndEnergy(selectedCharge.position, selectedCharge.value, allCharges);
  }

  if (isInspectorMinimized) {
    return (
      <div className="pointer-events-auto glass-panel-floating flex items-center justify-center p-1.5">
        <button
          onClick={toggleInspectorMinimized}
          className="flex items-center justify-center w-8 h-8 rounded-[calc(var(--radius)-4px)] text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-all duration-200 active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
          title="Abrir Propiedades"
          aria-label="Alternar Panel de Propiedades"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="glass-panel-floating pointer-events-auto w-full sm:w-[280px] rounded-t-2xl sm:rounded-[calc(var(--radius))] rounded-b-none sm:rounded-b-[calc(var(--radius))] p-4 flex flex-col gap-4 text-foreground z-30 max-h-[40vh] sm:max-h-full overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>
          </svg>
          <span className="text-xs uppercase tracking-widest font-bold">Propiedades</span>
        </div>
        <div className="flex items-center gap-1">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { selectCharge(null); removeCharge(selectedCharge.id); }}
            className="text-muted-foreground hover:text-destructive p-1.5 hover:bg-destructive/10 rounded-full transition-colors cursor-pointer"
            title="Eliminar Carga"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>

          <button 
            onClick={() => setInspectorMinimized(true)}
            className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer group"
            title="Minimizar"
            aria-label="Minimizar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:rotate-90">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {isTest ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-[13px] font-semibold shadow-sm">
            Carga de Prueba (q₀)
          </div>
          <div className="relative flex items-center bg-black/5 dark:bg-white/5 rounded-lg p-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { if (selectedCharge.value < 0) updateCharge(selectedCharge.id, { value: Math.abs(selectedCharge.value) }); }}
              className={`relative z-10 flex-1 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${selectedCharge.value >= 0 ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Positiva (+q₀)
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { if (selectedCharge.value >= 0) updateCharge(selectedCharge.id, { value: -selectedCharge.value }); }}
              className={`relative z-10 flex-1 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${selectedCharge.value < 0 ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Negativa (-q₀)
            </motion.button>
            <motion.div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md shadow-sm bg-emerald-500 ${selectedCharge.value >= 0 ? 'left-1' : 'left-[calc(50%+2px)]'}`}
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
        </div>
      ) : (
        <div className="relative flex items-center bg-black/5 dark:bg-white/5 rounded-lg p-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { if (!isPositive) togglePolarity(); }}
            className={`relative z-10 flex-1 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${isPositive ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Positiva (+)
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { if (isPositive) togglePolarity(); }}
            className={`relative z-10 flex-1 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${!isPositive ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Negativa (−)
          </motion.button>
          <motion.div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md shadow-sm ${isPositive ? 'bg-red-500 left-1' : 'bg-blue-500 left-[calc(50%+2px)]'}`}
            layout
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      )}

      <div className="flex flex-col gap-4 mt-2 pb-2">
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-[13px] font-medium text-foreground">
            <label htmlFor="coord-x">Coordenada X</label>
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-1 bg-black/5 dark:bg-zinc-900/80 border border-border rounded-lg px-2 py-1 focus-within:border-primary transition-colors">
              <input
                type="number" id="coord-x" name="coord-x" step="0.1"
                value={Number(selectedCharge.position[0].toFixed(2))}
                onChange={(e) => handlePositionChange('x', e.target.value)}
                className="w-14 bg-transparent text-right font-mono text-xs text-foreground focus:outline-none"
              />
              <span className="text-muted-foreground text-xs font-mono">m</span>
            </motion.div>
          </div>
          <motion.input
            whileHover={{ scale: 1.02 }}
            type="range" min="-10" max="10" step="0.1" value={selectedCharge.position[0]}
            onChange={(e) => handlePositionChange('x', e.target.value)}
            className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary transition-colors"
            aria-label="Ajustar Coordenada X"
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-[13px] font-medium text-foreground">
            <label htmlFor="coord-y">Coordenada Y</label>
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-1 bg-black/5 dark:bg-zinc-900/80 border border-border rounded-lg px-2 py-1 focus-within:border-primary transition-colors">
              <input
                type="number" id="coord-y" name="coord-y" step="0.1"
                value={Number(selectedCharge.position[1].toFixed(2))}
                onChange={(e) => handlePositionChange('y', e.target.value)}
                className="w-14 bg-transparent text-right font-mono text-xs text-foreground focus:outline-none"
              />
              <span className="text-muted-foreground text-xs font-mono">m</span>
            </motion.div>
          </div>
          <motion.input
            whileHover={{ scale: 1.02 }}
            type="range" min="-10" max="10" step="0.1" value={selectedCharge.position[1]}
            onChange={(e) => handlePositionChange('y', e.target.value)}
            className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary transition-colors"
            aria-label="Ajustar Coordenada Y"
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-[13px] font-medium text-foreground">
            <label htmlFor="coord-z">Coordenada Z</label>
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-1 bg-black/5 dark:bg-zinc-900/80 border border-border rounded-lg px-2 py-1 focus-within:border-primary transition-colors">
              <input
                type="number" id="coord-z" name="coord-z" step="0.1"
                value={Number(selectedCharge.position[2].toFixed(2))}
                onChange={(e) => handlePositionChange('z', e.target.value)}
                className="w-14 bg-transparent text-right font-mono text-xs text-foreground focus:outline-none"
              />
              <span className="text-muted-foreground text-xs font-mono">m</span>
            </motion.div>
          </div>
          <motion.input
            whileHover={{ scale: 1.02 }}
            type="range" min="-10" max="10" step="0.1" value={selectedCharge.position[2]}
            onChange={(e) => handlePositionChange('z', e.target.value)}
            className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary transition-colors"
            aria-label="Ajustar Coordenada Z"
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-[13px] font-medium text-foreground">
            <label htmlFor="magnitude">
              {isTest ? 'Magnitud |q₀|' : 'Magnitud |Q|'}
            </label>
            <motion.div whileHover={{ scale: 1.05 }} className={`flex items-center gap-1 bg-black/5 dark:bg-zinc-900/80 border border-border rounded-lg px-2 py-1 transition-colors ${isTest ? 'focus-within:border-emerald-500' : 'focus-within:border-primary'}`}>
              <input
                type="number" id="magnitude" name="magnitude" min="0.1" step="0.1"
                value={Math.abs(selectedCharge.value)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    const sign = selectedCharge.value < 0 ? -1 : 1;
                    updateCharge(selectedCharge.id, { value: val * sign });
                  }
                }}
                className="w-14 bg-transparent text-right font-mono text-xs text-foreground focus:outline-none"
              />
              <span className="text-muted-foreground text-xs font-mono">nC</span>
            </motion.div>
          </div>
          <motion.input
            whileHover={{ scale: 1.02 }}
            type="range" min="0.1" max="10" step="0.1"
            value={Math.abs(selectedCharge.value)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                const sign = selectedCharge.value < 0 ? -1 : 1;
                updateCharge(selectedCharge.id, { value: val * sign });
              }
            }}
            className={`w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer transition-colors ${isTest ? 'accent-emerald-500' : 'accent-primary'}`}
            aria-label={isTest ? 'Ajustar Magnitud de Carga de Prueba' : 'Ajustar Magnitud'}
          />
        </div>

        {isTest && testData && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 mt-1 p-3 bg-green-500/5 border border-green-500/20 rounded-[calc(var(--radius)-4px)] text-foreground"
          >
            <h5 className="text-[11px] font-bold text-green-500 uppercase tracking-wider mb-1">Lecturas en tiempo real</h5>
            
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-muted-foreground flex items-center gap-1">
                Fuerza (|
                <span className="inline-flex flex-col items-center leading-none text-[10px] -mt-0.5">
                  <span className="text-[7px] leading-none -mb-0.5">→</span>
                  <span>F</span>
                </span>
                |):
              </span>
              <span className="text-emerald-500 font-bold">
                {(Math.abs(selectedCharge.value) * testData.fieldMagnitude) >= 1e5
                  ? (Math.abs(selectedCharge.value) * testData.fieldMagnitude).toExponential(2)
                  : (Math.abs(selectedCharge.value) * testData.fieldMagnitude).toFixed(2)} nN
              </span>
            </div>

            <div className="flex flex-col gap-0.5 pl-3 text-[10px] font-mono text-muted-foreground">
              <div className="flex justify-between">
                <span>F<sub className="text-[7px]">x</sub>:</span>
                <span className="font-semibold text-foreground">{(testData.force[0] * 1e9).toFixed(2)} nN</span>
              </div>
              <div className="flex justify-between">
                <span>F<sub className="text-[7px]">y</sub>:</span>
                <span className="font-semibold text-foreground">{(testData.force[1] * 1e9).toFixed(2)} nN</span>
              </div>
              <div className="flex justify-between">
                <span>F<sub className="text-[7px]">z</sub>:</span>
                <span className="font-semibold text-foreground">{(testData.force[2] * 1e9).toFixed(2)} nN</span>
              </div>
            </div>

            <div className="border-t border-green-500/10 my-0.5" />

            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-muted-foreground font-medium">Energía (U):</span>
              <span className="text-emerald-500 font-bold">
                {Math.abs(selectedCharge.value * testData.potential) >= 1e5
                  ? (selectedCharge.value * testData.potential).toExponential(2)
                  : (selectedCharge.value * testData.potential).toFixed(2)} nJ
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});
