import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3, Color, Float32BufferAttribute, LineSegments, BufferGeometry } from 'three';
import { useSimulatorStore } from '@campoelectrico/store';
import { calculateElectricField, calculateElectricPotential } from './physics/calculus';

const STEPS = 250;
const STEP_SIZE = 0.2;
const MIN_DIST = 0.25;
const NUM_LINES_PER_CHARGE = 20;

const positiveColor = new Color('#ef4444');
const negativeColor = new Color('#3b82f6');
const tempColorGrad = new Color();
const tempColorFinal = new Color();
const tempArrowColorGrad = new Color();
const tempArrowColorFinal = new Color();
const tempVec3 = new Vector3();
const neutralDark = new Color('#121214');
const neutralLight = new Color('#cc1111');

export const FieldArrows = memo(function FieldArrows() {
  const charges = useSimulatorStore((state) => state.charges);
  const showFieldLines = useSimulatorStore((state) => state.showFieldLines);
  const theme = useSimulatorStore((state) => state.theme);
  
  const arrowsMeshRef = useRef<InstancedMesh>(null);
  const linesRef = useRef<LineSegments>(null);
  
  const dummy = useMemo(() => new Object3D(), []);
  const baseUp = useMemo(() => new Vector3(0, 1, 0), []);

  const prevChargesRef = useRef<string>('__init__');
  const prevShowRef = useRef(true);
  const posAttrRef = useRef<Float32BufferAttribute | null>(null);
  const colAttrRef = useRef<Float32BufferAttribute | null>(null);

  useFrame(() => {
    const arrowsMesh = arrowsMeshRef.current;
    const lines = linesRef.current;
    if (!lines || !arrowsMesh) return;

    if (!showFieldLines) {
      if (prevShowRef.current) {
        const emptyPos = new Float32Array(0);
        const emptyCol = new Float32Array(0);
        lines.geometry.setAttribute('position', new Float32BufferAttribute(emptyPos, 3));
        lines.geometry.setAttribute('color', new Float32BufferAttribute(emptyCol, 3));
        // Limpiamos las referencias obsoletas: los atributos anteriores ya no están adjuntos
        // a la geometría, por lo que cualquier escritura futura debe crear atributos nuevos.
        posAttrRef.current = null;
        colAttrRef.current = null;
        for (let i = 0; i < arrowsMesh.count; i++) {
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          arrowsMesh.setMatrixAt(i, dummy.matrix);
        }
        arrowsMesh.instanceMatrix.needsUpdate = true;
        prevShowRef.current = false;
      }
      return;
    }
    // Si las líneas acaban de reactivarse, forzamos un recálculo completo
    if (!prevShowRef.current) {
      prevChargesRef.current = '__init__';
    }
    prevShowRef.current = true;

    // Incluimos el tema en la clave para que un cambio de tema fuerce el recálculo de colores
    const chargesKey = charges.map(c =>
      `${c.id}:${c.position[0].toFixed(4)},${c.position[1].toFixed(4)},${c.position[2].toFixed(4)},${c.value},${c.type}`
    ).join('|') + `|theme:${theme}`;

    if (chargesKey === prevChargesRef.current) {
      return;
    }
    prevChargesRef.current = chargesKey;

    const neutralColor = theme === 'dark' ? neutralDark : neutralLight;

    const chargesData = charges
      .filter(c => c.type !== 'test')
      .map(c => ({
      id: c.id,
      position: c.position,
      value: c.value,
      type: c.type
    }));

    const linePositions: number[] = [];
    const lineColors: number[] = [];
    let arrowIndex = 0;

    // Para obtener una representación fiel sin superposición de líneas, y con una densidad
    // de líneas proporcional a la magnitud de la carga:
    // 1. Trazamos desde TODAS las cargas.
    // 2. Desde positivas, trazamos hacia adelante.
    // 3. Desde negativas, trazamos hacia atrás.
    // 4. Si una línea trazada hacia atrás (desde una negativa) choca con una positiva,
    //    la DESCARTAMOS para evitar superposición (porque la positiva ya dibujará esa conexión).
    chargesData.forEach(sourceCharge => {
      const isPos = sourceCharge.type === 'positive';
      const sign = isPos ? 1 : -1;
      
      // La cantidad de líneas es proporcional al valor absoluto de la carga, con un mínimo para visibilidad
      const numLines = Math.min(100, Math.max(8, Math.round(NUM_LINES_PER_CHARGE * Math.abs(sourceCharge.value))));
      const phi = Math.PI * (3 - Math.sqrt(5));

      for (let i = 0; i < numLines; i++) {
        const y = 1 - (i / (numLines - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = phi * i;

        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;

        const startX = sourceCharge.position[0] + x * (MIN_DIST + 0.05);
        const startY = sourceCharge.position[1] + y * (MIN_DIST + 0.05);
        const startZ = sourceCharge.position[2] + z * (MIN_DIST + 0.05);
        
        let currentX = startX;
        let currentY = startY;
        let currentZ = startZ;
        
        const tempPositions: number[] = [];
        const tempColors: number[] = [];
        const tempArrows: { pos: [number, number, number], dir: [number, number, number], V: number }[] = [];
        
        let discardLine = false;
        
        // Ajustamos la precisión del trazado para evitar colapso de líneas (Runge-Kutta 4)
        const localSteps = 400;
        const localStepSize = 0.15;

        for (let step = 0; step < localSteps; step++) {
          const { direction: dir1, magnitude: mag1 } = calculateElectricField(
            [currentX, currentY, currentZ], 
            chargesData
          );
          
          if (mag1 < 1e-5) break; // Cerca de puntos de estancamiento el campo es nulo
          
          const h = sign * localStepSize;
          
          // Integrador RK4 (Runge-Kutta 4) - Mayor estabilidad para líneas curvas, evita colapsos y cruces
          const k1x = dir1[0];
          const k1y = dir1[1];
          const k1z = dir1[2];
          
          const { direction: k2dir, magnitude: mag2 } = calculateElectricField(
            [currentX + 0.5 * h * k1x, currentY + 0.5 * h * k1y, currentZ + 0.5 * h * k1z],
            chargesData
          );
          if (mag2 < 1e-5) break;

          const { direction: k3dir, magnitude: mag3 } = calculateElectricField(
            [currentX + 0.5 * h * k2dir[0], currentY + 0.5 * h * k2dir[1], currentZ + 0.5 * h * k2dir[2]],
            chargesData
          );
          if (mag3 < 1e-5) break;

          const { direction: k4dir, magnitude: mag4 } = calculateElectricField(
            [currentX + h * k3dir[0], currentY + h * k3dir[1], currentZ + h * k3dir[2]],
            chargesData
          );
          if (mag4 < 1e-5) break;
          
          const dX = (h / 6) * (k1x + 2 * k2dir[0] + 2 * k3dir[0] + k4dir[0]);
          const dY = (h / 6) * (k1y + 2 * k2dir[1] + 2 * k3dir[1] + k4dir[1]);
          const dZ = (h / 6) * (k1z + 2 * k2dir[2] + 2 * k3dir[2] + k4dir[2]);
          
          const nextX = currentX + dX;
          const nextY = currentY + dY;
          const nextZ = currentZ + dZ;
          
          tempPositions.push(currentX, currentY, currentZ);
          tempPositions.push(nextX, nextY, nextZ);
          
          const midX = (currentX + nextX) / 2;
          const midY = (currentY + nextY) / 2;
          const midZ = (currentZ + nextZ) / 2;
          const V = calculateElectricPotential([midX, midY, midZ], chargesData);
          
          const V_norm = Math.tanh(V / 8.0);
          const s = (V_norm + 1) / 2;
          
          tempColorGrad.lerpColors(negativeColor, positiveColor, s);
          
          const E_norm = Math.tanh(mag1 / 6.0);
          tempColorFinal.lerpColors(neutralColor, tempColorGrad, E_norm);
          
          tempColors.push(tempColorFinal.r, tempColorFinal.g, tempColorFinal.b);
          tempColors.push(tempColorFinal.r, tempColorFinal.g, tempColorFinal.b);
          
          if (step % 20 === 10) {
            tempArrows.push({
              pos: [nextX, nextY, nextZ],
              dir: dir1,
              V
            });
          }

          let hit = false;
          let hitPositive = false;
          for (let cIdx = 0; cIdx < chargesData.length; cIdx++) {
            const c = chargesData[cIdx];
            if (c.id === sourceCharge.id) continue;
            
            const dx = nextX - c.position[0];
            const dy = nextY - c.position[1];
            const dz = nextZ - c.position[2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Radio de la carga es ~0.25. Detectamos impacto un poco antes para mayor fiabilidad.
            if (dist <= 0.35) {
              hit = true;
              if (c.type === 'positive') hitPositive = true;
              
              if (dist > 0) {
                const ratio = 0.25 / dist;
                const finalX = c.position[0] + dx * ratio;
                const finalY = c.position[1] + dy * ratio;
                const finalZ = c.position[2] + dz * ratio;
                
                tempPositions[tempPositions.length - 3] = finalX;
                tempPositions[tempPositions.length - 2] = finalY;
                tempPositions[tempPositions.length - 1] = finalZ;
              }
              break;
            }
          }
          
          if (hit) {
            // Si trazamos hacia atrás desde una negativa y chocamos con una positiva, 
            // descartamos esta línea porque la carga positiva ya dibujará una idéntica hacia adelante.
            if (!isPos && hitPositive) {
              discardLine = true;
            }
            break;
          }
          
          if (Math.abs(nextX) > 30 || Math.abs(nextY) > 30 || Math.abs(nextZ) > 30) break;
          
          currentX = nextX;
          currentY = nextY;
          currentZ = nextZ;
        }

        if (!discardLine) {
          linePositions.push(...tempPositions);
          lineColors.push(...tempColors);

          for (let arrIdx = 0; arrIdx < tempArrows.length; arrIdx++) {
            const arr = tempArrows[arrIdx];
            if (arrowIndex < arrowsMesh.count) {
              dummy.position.set(arr.pos[0], arr.pos[1], arr.pos[2]);
              // Para las flechas, siempre apuntan en la dirección del campo (dir1), incluso trazando hacia atrás
              tempVec3.set(arr.dir[0], arr.dir[1], arr.dir[2]);
              dummy.quaternion.setFromUnitVectors(baseUp, tempVec3);
              dummy.scale.setScalar(0.7);
              dummy.updateMatrix();
              arrowsMesh.setMatrixAt(arrowIndex, dummy.matrix);

              const V_norm = Math.tanh(arr.V / 8.0);
              const s = (V_norm + 1) / 2;
              
              tempArrowColorGrad.lerpColors(negativeColor, positiveColor, s);
              
              const { magnitude: arrowE } = calculateElectricField(arr.pos, chargesData);
              const E_norm = Math.tanh(arrowE / 6.0);
              tempArrowColorFinal.lerpColors(neutralColor, tempArrowColorGrad, E_norm);
              
              arrowsMesh.setColorAt(arrowIndex, tempArrowColorFinal);
              arrowIndex++;
            }
          }
        }
      }
    });

    for (let i = arrowIndex; i < arrowsMesh.count; i++) {
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      arrowsMesh.setMatrixAt(i, dummy.matrix);
    }
    
    arrowsMesh.instanceMatrix.needsUpdate = true;
    if (arrowsMesh.instanceColor) {
      arrowsMesh.instanceColor.needsUpdate = true;
    }

    const posArray = new Float32Array(linePositions);
    const colArray = new Float32Array(lineColors);
    
    const geom = lines.geometry as BufferGeometry;
    const existingPosAttr = posAttrRef.current;
    
    if (existingPosAttr && existingPosAttr.count === posArray.length / 3) {
      existingPosAttr.set(posArray);
      existingPosAttr.needsUpdate = true;
      colAttrRef.current!.set(colArray);
      colAttrRef.current!.needsUpdate = true;
    } else {
      const newPosAttr = new Float32BufferAttribute(posArray, 3);
      const newColAttr = new Float32BufferAttribute(colArray, 3);
      geom.setAttribute('position', newPosAttr);
      geom.setAttribute('color', newColAttr);
      posAttrRef.current = newPosAttr;
      colAttrRef.current = newColAttr;
    }
  });


  const MAX_ARROWS = 10000;

  return (
    <group renderOrder={10}>
      <lineSegments ref={linesRef} renderOrder={10}>
        <bufferGeometry />
        <lineBasicMaterial 
          vertexColors 
          transparent 
          opacity={0.85} 
          linewidth={1}
          depthTest={true}
          depthWrite={false}
        />
      </lineSegments>

      <instancedMesh ref={arrowsMeshRef} args={[undefined, undefined, MAX_ARROWS]} renderOrder={11}>
        <coneGeometry args={[0.08, 0.25, 8]} />
        <meshBasicMaterial depthTest={true} depthWrite={false} />
      </instancedMesh>
    </group>
  );
});
