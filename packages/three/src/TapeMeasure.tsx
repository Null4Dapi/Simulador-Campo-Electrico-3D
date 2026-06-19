import { useState, memo } from 'react';
import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useCursor, Html, Line } from '@react-three/drei';
import { Plane, Vector3 } from 'three';
import { useSimulatorStore } from '@campoelectrico/store';

const xzPlane = new Plane(new Vector3(0, 1, 0), 0);
const intersection = new Vector3();

function RulerPoint({ 
  position, 
  onMove 
}: { 
  position: [number, number, number], 
  onMove: (pos: [number, number, number]) => void 
}) {
  const [hovered, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const get = useThree((state) => state.get);
  const snapToGrid = useSimulatorStore((state) => state.snapToGrid);

  useCursor(hovered || dragging, dragging ? 'grabbing' : 'grab', 'auto');

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    const controls = get().controls;
    if (controls) (controls as unknown as { enabled: boolean }).enabled = false;
  };

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDragging(false);
    const controls = get().controls;
    if (controls) (controls as unknown as { enabled: boolean }).enabled = true;
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (dragging) {
      e.stopPropagation();
      const res = e.ray.intersectPlane(xzPlane, intersection);
      if (res) {
        let x = intersection.x;
        let z = intersection.z;
        if (snapToGrid) {
          x = Math.round(x * 2) / 2;
          z = Math.round(z * 2) / 2;
        }
        onMove([x, 0, z]);
      }
    }
  };

  return (
    <group position={position}>
      {/* Área interactiva invisible expandida para facilitar la selección */}
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
        onPointerOut={() => setHover(false)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      
      {/* Componente visual del marcador de posición */}
      <mesh>
        <boxGeometry args={[0.2, 0.05, 0.05]} />
        <meshBasicMaterial color={hovered || dragging ? "#d946ef" : "#a855f7"} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.05, 0.05, 0.2]} />
        <meshBasicMaterial color={hovered || dragging ? "#d946ef" : "#a855f7"} />
      </mesh>
    </group>
  );
}

export const TapeMeasure = memo(function TapeMeasure() {
  const showTapeMeasure = useSimulatorStore((state) => state.showTapeMeasure);
  
  const [pointA, setPointA] = useState<[number, number, number]>([-2, 0, 0]);
  const [pointB, setPointB] = useState<[number, number, number]>([2, 0, 0]);

  if (!showTapeMeasure) return null;

  const dx = pointB[0] - pointA[0];
  const dz = pointB[2] - pointA[2];
  const distance = Math.sqrt(dx * dx + dz * dz);
  
  const midX = (pointA[0] + pointB[0]) / 2;
  const midZ = (pointA[2] + pointB[2]) / 2;

  return (
    <group>
      <Line 
        points={[pointA, pointB]} 
        color="#d946ef" 
        lineWidth={3} 
        dashed={true}
        dashSize={0.2}
        gapSize={0.1}
      />
      
      <RulerPoint position={pointA} onMove={setPointA} />
      <RulerPoint position={pointB} onMove={setPointB} />
      
      <Html position={[midX, 0, midZ]} center className="pointer-events-none">
        <div className="bg-fuchsia-600/90 text-white font-bold font-mono text-[11px] px-2.5 py-1 rounded-lg border border-fuchsia-400/50 shadow-[0_0_15px_rgba(217,70,239,0.4)] whitespace-nowrap transform -translate-y-6">
          {distance.toFixed(2)} m
        </div>
      </Html>
    </group>
  );
});
