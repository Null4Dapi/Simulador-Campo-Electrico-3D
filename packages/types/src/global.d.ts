import type { ElementRef } from 'react';
import type { OrbitControls } from '@react-three/drei';

declare global {
  interface Window {
    useSimulatorStore?: typeof import('../store/useSimulatorStore').useSimulatorStore;
    threeControls?: ElementRef<typeof OrbitControls> | null;
  }

  interface ViewTransition {
    finished: Promise<void>;
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
    skipTransition(): void;
  }

  interface Document {
    startViewTransition?(callback: () => void | Promise<void>): ViewTransition;
  }
}

export {};

