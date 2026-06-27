import { useState, memo, useMemo, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Vector3, Group, Plane } from 'three';
import { ThreeEvent } from '@react-three/fiber';
import type { Charge as ChargeType } from '@campoelectrico/types';
import { useSimulatorStore } from '@campoelectrico/store';
import { calculateForceAndEnergy } from './physics/calculus';

interface ChargeProps {
  charge: ChargeType;
}

export const Charge = memo(function Charge({ charge }: ChargeProps) {
  const updateCharge = useSimulatorStore((state) => state.updateCharge);
  const setIsDraggingGlobal = useSimulatorStore((state) => state.setIsDragging);
  const selectedChargeId = useSimulatorStore((state) => state.selectedChargeId);
  const selectCharge = useSimulatorStore((state) => state.selectCharge);
  const snapToGrid = useSimulatorStore((state) => state.snapToGrid);
  const allCharges = useSimulatorStore((state) => state.charges);
  const interactionMode = useSimulatorStore((state) => state.interactionMode);
  const cameraView = useSimulatorStore((state) => state.cameraView);
  
  const [hovered, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const groupRef = useRef<Group>(null);
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const dragOffset = useRef(new Vector3());
  const intersectionPoint = useRef(new Vector3());
  const lastUpdateTime = useRef(0);
  
  // Opcional: Cambiar cursor si se está sobre la carga
  // useEffect(() => {
  //   document.body.style.cursor = hovered ? 'pointer' : 'auto';
  // }, [hovered]);

  const get = useThree((state) => state.get);

  const isSelected = selectedChargeId === charge.id;
  const isTest = charge.type === 'test';
  
  const [showLabel, setShowLabel] = useState(true);
  const positionVector = useMemo(() => new Vector3(), []);

  useFrame((state) => {
    if (isTest && isSelected) {
      positionVector.set(charge.position[0], charge.position[1], charge.position[2]);
      const dist = state.camera.position.distanceTo(positionVector);
      const VISIBILITY_THRESHOLD = 15;
      const isClose = dist <= VISIBILITY_THRESHOLD;
      if (isClose !== showLabel) {
        setShowLabel(isClose);
      }
    }
  });
  
  let color = '#3b82f6';
  if (charge.type === 'positive') color = '#ef4444';
  if (charge.type === 'test') color = '#22c55e';
  
  let testData = null;
  if (isTest) {
    testData = calculateForceAndEnergy(charge.position, charge.value, allCharges);
  }

  let forceDir = new Vector3(0, 1, 0);
  let forceLength = 0;
  if (isTest && testData && testData.fieldMagnitude > 0) {
    forceDir = new Vector3(...testData.force).normalize();
    const forceMag_nN = Math.abs(charge.value) * testData.fieldMagnitude;
    forceLength = Math.max(0.6, Math.min(3.5, Math.log10(forceMag_nN + 1) * 0.6));
  }

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (interactionMode === 'pan') return;
    e.stopPropagation();
    selectCharge(charge.id);
    
    if (isSelected) {
      setDragging(true);
      setIsDraggingGlobal(true);
      
      const controls = get().controls as any;
      if (controls) controls.enabled = false;
      
      const target = e.target as HTMLElement;
      if (target.setPointerCapture) target.setPointerCapture(e.pointerId);

      const normal = new Vector3();
      if (cameraView === 'top') normal.set(0, 1, 0);
      else if (cameraView === 'front') normal.set(0, 0, 1);
      else if (cameraView === 'right') normal.set(1, 0, 0);
      else get().camera.getWorldDirection(normal).negate();
      
      dragPlane.setFromNormalAndCoplanarPoint(normal, groupRef.current!.position);
      
      if (e.ray.intersectPlane(dragPlane, intersectionPoint.current)) {
        dragOffset.current.copy(groupRef.current!.position).sub(intersectionPoint.current);
      }
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging || !groupRef.current) return;
    e.stopPropagation();

    if (e.ray.intersectPlane(dragPlane, intersectionPoint.current)) {
      let x = intersectionPoint.current.x + dragOffset.current.x;
      let y = intersectionPoint.current.y + dragOffset.current.y;
      let z = intersectionPoint.current.z + dragOffset.current.z;

      if (snapToGrid) {
        x = Math.round(x * 2) / 2;
        y = Math.round(y * 2) / 2;
        z = Math.round(z * 2) / 2;
      }

      groupRef.current.position.set(x, y, z);
      
      const now = performance.now();
      if (now - lastUpdateTime.current > 75) { // ~13 FPS throttling for physics
        lastUpdateTime.current = now;
        updateCharge(charge.id, { position: [x, y, z] });
      }
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    e.stopPropagation();
    
    setDragging(false);
    setIsDraggingGlobal(false);
    
    const target = e.target as HTMLElement;
    if (target.releasePointerCapture) target.releasePointerCapture(e.pointerId);
    
    const controls = get().controls as any;
    if (controls) controls.enabled = true;
    
    if (groupRef.current) {
       const { x, y, z } = groupRef.current.position;
       updateCharge(charge.id, { position: [x, y, z] });
    }
  };

  return (
    <group ref={groupRef} position={charge.position}>
      {isTest && testData && testData.fieldMagnitude > 0 && Math.abs(charge.value) > 0 && (
        <arrowHelper 
          args={[forceDir, new Vector3(0,0,0), forceLength, 0x22c55e, 0.3, 0.2]} 
        />
      )}
      
      <mesh
        onPointerOver={(e) => { 
          if (interactionMode !== 'pan') {
            e.stopPropagation(); 
            setHover(true); 
            document.body.style.cursor = isSelected ? 'grab' : 'pointer';
          }
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = 'auto';
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <sphereGeometry args={[isTest ? 0.1 : 0.25, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.3} 
          emissive={color}
          emissiveIntensity={isSelected ? 0.8 : (hovered ? 0.4 : 0.2)}
        />
      </mesh>

      {isTest && isSelected && testData && (
        <Html 
          position={[0, 0, 0]} 
          center 
          style={{ pointerEvents: 'none' }}
          className={`pointer-events-none select-none z-50 transition-opacity duration-200 ${showLabel ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="translate-x-[65px] -translate-y-[45px] glass-panel-floating text-foreground p-2.5 text-[11px] font-sans space-y-1.5 w-36 whitespace-nowrap">
            <div className="flex justify-between items-center gap-2">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                Campo <span className="inline-flex flex-col items-center leading-none text-[10px] -mt-0.5"><span className="text-[7px] leading-none -mb-0.5 text-muted-foreground">→</span><span>E</span></span>:
              </span>
              <span className="font-mono font-bold text-primary">
                {testData.fieldMagnitude >= 1e4 ? testData.fieldMagnitude.toExponential(2) : testData.fieldMagnitude.toFixed(2)} N/C
              </span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-muted-foreground font-medium">Potencial V:</span>
              <span className="font-mono font-bold text-primary">
                {Math.abs(testData.potential) >= 1e4 ? testData.potential.toExponential(2) : testData.potential.toFixed(2)} V
              </span>
            </div>
          </div>
        </Html>
      )}

      {dragging && (
        <Html position={[0, 0.6, 0]} center className="pointer-events-none">
          <div className="glass-panel-floating text-foreground text-[11px] px-2 py-1 font-mono whitespace-nowrap z-50">
            ({groupRef.current?.position.x.toFixed(2) || charge.position[0].toFixed(2)}, {groupRef.current?.position.z.toFixed(2) || charge.position[2].toFixed(2)})
          </div>
        </Html>
      )}
    </group>
  );
});
