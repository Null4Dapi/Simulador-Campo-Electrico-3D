import { useRef, useEffect, useMemo } from 'react'
import type { ElementRef } from 'react'
import { Vector3 } from 'three'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import { useSimulatorStore } from '@campoelectrico/store'
import { Charge } from './Charge'
import { FieldArrows } from './FieldArrows'
import { EquipotentialSurfaces } from './EquipotentialSurfaces'
import { TapeMeasure } from './TapeMeasure'

function syncCameraZoom(camera: { zoom: number; updateProjectionMatrix: () => void }, zoom: number) {
  camera.zoom = zoom;
  camera.updateProjectionMatrix();
}

type OrbitControlsImpl = ElementRef<typeof OrbitControls>;


export function Scene() {
  const charges = useSimulatorStore((state) => state.charges)
  const resetCameraTrigger = useSimulatorStore((state) => state.resetCameraTrigger)
  const gridVisible = useSimulatorStore((state) => state.gridVisible)
  const zoom = useSimulatorStore((state) => state.zoom)
  const theme = useSimulatorStore((state) => state.theme)
  const cameraView = useSimulatorStore((state) => state.cameraView)
  const setCameraView = useSimulatorStore((state) => state.setCameraView)
  const interactionMode = useSimulatorStore((state) => state.interactionMode)
  
  const camera = useThree((state) => state.camera)
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  
  const viewPositions = useMemo(() => ({
    isometric: new Vector3(10, 10, 10),
    top: new Vector3(0, 15, 0),
    front: new Vector3(0, 0, 15),
    right: new Vector3(15, 0, 0)
  }), []);
  const targetLookAt = useMemo(() => new Vector3(0, 0, 0), []);

  useEffect(() => {
    if (resetCameraTrigger > 0) {
      setCameraView('isometric');
      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    }
  }, [resetCameraTrigger, setCameraView]);

  useEffect(() => {
    syncCameraZoom(camera, zoom / 100);
  }, [zoom, camera]);

  useEffect(() => {
    if ((import.meta as any).env?.DEV) {
      (window as any).threeControls = controlsRef.current;
    }
  }, []);

  useFrame(({ camera }) => {
    if (cameraView !== 'custom') {
      const targetPos = viewPositions[cameraView as keyof typeof viewPositions];
      if (targetPos) {
        camera.position.lerp(targetPos, 0.05);
        if (controlsRef.current) {
          controlsRef.current.target.lerp(targetLookAt, 0.05);
          controlsRef.current.update();
        }
      }
    }
  });

  const bgColor = useMemo(() => theme === 'dark' ? '#000000' : '#f8fafc', [theme])
  const gridCellColor = useMemo(() => theme === 'dark' ? '#444444' : '#D0D2D4', [theme])
  const gridSectionColor = useMemo(() => theme === 'dark' ? '#888888' : '#A0A2A4', [theme])



  return (
    <>
      <color attach="background" args={[bgColor]} />
      
      <OrbitControls 
        ref={controlsRef} 
        makeDefault 
        onStart={() => {
          if (cameraView !== 'custom') setCameraView('custom');
        }}
        mouseButtons={{
          LEFT: interactionMode === 'pan' ? 2 : 0,
          MIDDLE: 1,
          RIGHT: interactionMode === 'pan' ? 0 : 2
        }}
      />
      
      {gridVisible && (
        <Grid 
          position={[0, 0, 0]} 
          args={[100, 100]} 
          cellSize={1} 
          cellThickness={0.4} 
          cellColor={gridCellColor} 
          sectionSize={5} 
          sectionThickness={0.8} 
          sectionColor={gridSectionColor} 
          fadeDistance={80} 
          fadeStrength={1}
          infiniteGrid
        />
      )}

      <ambientLight intensity={theme === 'dark' ? 0.3 : 0.6} />
      <directionalLight position={[10, 10, 10]} intensity={theme === 'dark' ? 0.8 : 1.2} />

      <FieldArrows />
      <EquipotentialSurfaces />
      <TapeMeasure />

      {charges.map((charge) => (
        <Charge key={charge.id} charge={charge} />
      ))}
    </>
  )
}
