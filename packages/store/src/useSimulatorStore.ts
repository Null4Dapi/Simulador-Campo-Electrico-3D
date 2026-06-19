import { create } from 'zustand';
import type { SimulatorState, ChargeType, CameraView } from '@campoelectrico/types';

export const useSimulatorStore = create<SimulatorState>((set) => ({
  interactionMode: 'select',
  charges: [],
  showFieldLines: true,
  showEquipotential: true,
  isSimulating: true,
  isDragging: false,
  resetCameraTrigger: 0,
  selectedChargeId: null,
  isInspectorMinimized: false,
  snapToGrid: false,
  gridVisible: true,
  showSettings: false,
  showTapeMeasure: false,
  cameraView: 'isometric',
  zoom: 100,
  isChatOpen: false,
  sessionId: sessionStorage.getItem('simulator_chat_session_id') || (() => {
    const newId = crypto.randomUUID();
    sessionStorage.setItem('simulator_chat_session_id', newId);
    return newId;
  })(),
  isQuizOpen: false,
  theme: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark',
  hasSeenOnboarding: localStorage.getItem('campo_electrico_onboarding') === 'true',

  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setTheme: (theme) => set({ theme }),

  /**
   * Instancia una nueva carga electromagnética en la escena.
   * Genera coordenadas pseudoaleatorias garantizando una separación mínima
   * respecto a las cargas preexistentes mediante comprobación espacial (volumétrica).
   */
  addCharge: (type: ChargeType) => set((state) => {
    const newId = crypto.randomUUID();
    
    const minDistance = 1.2;
    let pos: [number, number, number] = [0, 0, 0];
    let isValid = false;
    let attempts = 0;
    
    while (!isValid && attempts < 50) {
      pos = [Math.random() * 8 - 4, Math.random() * 8 - 4, Math.random() * 8 - 4];
      isValid = true;
      for (const charge of state.charges) {
        const dx = charge.position[0] - pos[0];
        const dy = charge.position[1] - pos[1];
        const dz = charge.position[2] - pos[2];
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < minDistance * minDistance) {
          isValid = false;
          break;
        }
      }
      attempts++;
    }

    return {
      charges: [...state.charges, {
        id: newId,
        position: pos,
        value: 1,
        type,
      }],
      selectedChargeId: newId
    };
  }),

  /**
   * Inyecta una carga en coordenadas tridimensionales explícitas.
   * Garantiza que la magnitud sea absoluta para cargas estáticas (source) y 
   * preserva la polaridad matemática paramétrica si es carga de prueba.
   */
  addChargeAt: (type: ChargeType, position: [number, number, number], value: number) => set((state) => {
    const newId = crypto.randomUUID();
    const finalValue = type === 'test' ? value : Math.abs(value);
    return {
      charges: [...state.charges, {
        id: newId,
        position,
        value: finalValue,
        type,
      }],
      selectedChargeId: newId
    };
  }),

  removeCharge: (id) => set((state) => ({
    charges: state.charges.filter((c) => c.id !== id),
    selectedChargeId: state.selectedChargeId === id ? null : state.selectedChargeId
  })),

  /**
   * Actualiza inmutablemente las propiedades (posición, magnitud, polaridad) de una carga específica.
   */
  updateCharge: (id, updates) => set((state) => ({
    charges: state.charges.map((c) => {
      if (c.id === id) {
        const value = updates.value !== undefined
          ? (c.type === 'test' ? updates.value : Math.abs(updates.value))
          : c.value;
        return { ...c, ...updates, value };
      }
      return c;
    })
  })),

  /**
   * Restablece el contexto de simulación, purgando todas las entidades de la malla tridimensional.
   */
  clearScene: () => set({ charges: [], selectedChargeId: null, isInspectorMinimized: false }),
  toggleFieldLines: () => set((state) => ({ showFieldLines: !state.showFieldLines })),
  toggleEquipotential: () => set((state) => ({ showEquipotential: !state.showEquipotential })),
  setShowFieldLines: (show) => set({ showFieldLines: show }),
  setShowEquipotential: (show) => set({ showEquipotential: show }),
  setIsDragging: (isDragging) => set({ isDragging }),
  triggerResetCamera: () => set((state) => ({ resetCameraTrigger: state.resetCameraTrigger + 1 })),
  selectCharge: (id) => set({ selectedChargeId: id, isInspectorMinimized: false }),
  toggleInspectorMinimized: () => set((state) => ({ isInspectorMinimized: !state.isInspectorMinimized })),
  setInspectorMinimized: (minimized) => set({ isInspectorMinimized: minimized }),
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  toggleGridVisible: () => set((state) => ({ gridVisible: !state.gridVisible })),
  setGridVisible: (visible) => set({ gridVisible: visible }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
  setShowSettings: (show) => set({ showSettings: show }),
  toggleTapeMeasure: () => set((state) => ({ showTapeMeasure: !state.showTapeMeasure })),
  setShowTapeMeasure: (show) => set({ showTapeMeasure: show }),
  setCameraView: (view: CameraView) => set({ cameraView: view }),
  setZoom: (zoom) => set({ zoom }),
  toggleSimulating: () => set((state) => ({ isSimulating: !state.isSimulating })),
  setSimulating: (isSimulating) => set({ isSimulating }),
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  setIsChatOpen: (isChatOpen) => set({ isChatOpen }),
  toggleQuiz: () => set((state) => ({ isQuizOpen: !state.isQuizOpen })),
  setQuizOpen: (isQuizOpen) => set({ isQuizOpen }),
  clearChatSession: () => set(() => {
    const newId = crypto.randomUUID();
    sessionStorage.setItem('simulator_chat_session_id', newId);
    return { sessionId: newId };
  }),
  completeOnboarding: () => {
    localStorage.setItem('campo_electrico_onboarding', 'true');
    set({ hasSeenOnboarding: true });
  },
  resetOnboarding: () => {
    localStorage.removeItem('campo_electrico_onboarding');
    set({ hasSeenOnboarding: false });
  },
  setInteractionMode: (mode) => set({ interactionMode: mode }),
}));

// Expone el objeto de estado en el entorno global para facilitar instrumentación y pruebas automatizadas
if ((import.meta as any).env?.DEV) {
  (window as any).useSimulatorStore = useSimulatorStore;
}
