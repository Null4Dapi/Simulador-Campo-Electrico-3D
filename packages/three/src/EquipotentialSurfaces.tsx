import { memo, useEffect, useRef, useState } from 'react';
import { DoubleSide } from 'three';
import { useSimulatorStore } from '@campoelectrico/store';
import FieldWorker from './physics/fieldWorker?worker';

export const EquipotentialSurfaces = memo(function EquipotentialSurfaces() {
  const charges = useSimulatorStore((state) => state.charges);
  const showEquipotential = useSimulatorStore((state) => state.showEquipotential);
  const isDragging = useSimulatorStore((state) => state.isDragging);
  const theme = useSimulatorStore((state) => state.theme);

  const [geometryData, setGeometryData] = useState<{
    positions: Float32Array;
    normals: Float32Array;
    colors: Float32Array;
  } | null>(null);

  const [transform, setTransform] = useState<{
    center: [number, number, number];
    limits: number;
  }>({
    center: [0, 0, 0],
    limits: 5,
  });

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new FieldWorker();
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<{
      positions: Float32Array;
      normals: Float32Array;
      colors: Float32Array;
    }>) => {
      const { positions, normals, colors } = e.data;
      setGeometryData({ positions, normals, colors });
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!showEquipotential || charges.length === 0 || !workerRef.current) {
      setGeometryData(null);
      return;
    }

    const validCharges = charges.filter((c) => c.type !== 'test');
    if (validCharges.length === 0) {
      setGeometryData(null);
      return;
    }
    
    const chargesData = validCharges.map((c) => ({
      position: c.position,
      value: c.type === 'positive' ? c.value : -c.value,
    }));

    // Aumentamos la resolución para que se vean más esféricas y menos poligonales
    const resolution = isDragging ? 24 : 64;

    const PAD = 10;

    const minX = Math.min(...validCharges.map(c => c.position[0])) - PAD;
    const maxX = Math.max(...validCharges.map(c => c.position[0])) + PAD;
    const minY = Math.min(...validCharges.map(c => c.position[1])) - PAD;
    const maxY = Math.max(...validCharges.map(c => c.position[1])) + PAD;
    const minZ = Math.min(...validCharges.map(c => c.position[2])) - PAD;
    const maxZ = Math.max(...validCharges.map(c => c.position[2])) + PAD;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const limitX = (maxX - minX) / 2;
    const limitY = (maxY - minY) / 2;
    const limitZ = (maxZ - minZ) / 2;
    const limits = Math.max(limitX, limitY, limitZ);

    const center: [number, number, number] = [centerX, centerY, centerZ];
    setTransform({ center, limits });

    workerRef.current.postMessage({
      charges: chargesData,
      resolution,
      limits,
      center,
    });
  }, [charges, showEquipotential, isDragging]);

  if (!showEquipotential || !geometryData || geometryData.positions.length === 0) {
    return null;
  }

  return (
    <mesh 
      position={transform.center} 
      scale={[transform.limits, transform.limits, transform.limits]}
      renderOrder={1}
    >
      <bufferGeometry key={geometryData.positions.length}>
        <bufferAttribute
          attach="attributes-position"
          args={[geometryData.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-normal"
          args={[geometryData.normals, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[geometryData.colors, 3]}
        />
      </bufferGeometry>
      <meshLambertMaterial
        vertexColors
        transparent
        opacity={theme === 'dark' ? 0.25 : 0.15}
        depthWrite={false}
        emissive="#000000"
      />
    </mesh>
  );
});
