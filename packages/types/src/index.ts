export type ChargeType = 'positive' | 'negative' | 'test';
export type CameraView = 'isometric' | 'top' | 'front' | 'right' | 'custom';

export interface Charge {
  id: string;                    // Identificador único universal
  position: [number, number, number]; // Vector de coordenadas espaciales
  value: number;                 // Magnitud de la carga escalar paramétrica
  type: ChargeType;
}

export type InteractionMode = 'select' | 'pan';

export interface SimulatorState {
  interactionMode: InteractionMode;
  charges: Charge[];
  showFieldLines: boolean;
  showEquipotential: boolean;
  isSimulating: boolean;
  isDragging: boolean;
  resetCameraTrigger: number;
  selectedChargeId: string | null;
  isInspectorMinimized: boolean;
  snapToGrid: boolean;
  gridVisible: boolean;
  showSettings: boolean;
  showTapeMeasure: boolean;
  cameraView: CameraView;
  zoom: number;
  isChatOpen: boolean;
  isQuizOpen: boolean;
  sessionId: string;
  theme: 'dark' | 'light';
  hasSeenOnboarding: boolean;
  
  // Métodos de mutación de estado
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  addCharge: (type: ChargeType) => void;
  addChargeAt: (type: ChargeType, position: [number, number, number], value: number) => void;
  removeCharge: (id: string) => void;
  updateCharge: (id: string, updates: Partial<Charge>) => void;
  clearScene: () => void;
  toggleFieldLines: () => void;
  toggleEquipotential: () => void;
  setShowFieldLines: (show: boolean) => void;
  setShowEquipotential: (show: boolean) => void;
  setIsDragging: (isDragging: boolean) => void;
  triggerResetCamera: () => void;
  selectCharge: (id: string | null) => void;
  toggleInspectorMinimized: () => void;
  setInspectorMinimized: (minimized: boolean) => void;
  toggleSnapToGrid: () => void;
  toggleGridVisible: () => void;
  setGridVisible: (visible: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  toggleSettings: () => void;
  setShowSettings: (show: boolean) => void;
  toggleTapeMeasure: () => void;
  setShowTapeMeasure: (show: boolean) => void;
  setCameraView: (view: CameraView) => void;
  setZoom: (zoom: number) => void;
  toggleSimulating: () => void;
  setSimulating: (simulating: boolean) => void;
  toggleChat: () => void;
  setIsChatOpen: (open: boolean) => void;
  toggleQuiz: () => void;
  setQuizOpen: (open: boolean) => void;
  clearChatSession: () => void;
  setInteractionMode: (mode: InteractionMode) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}
