import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';

type WorkerChargeInput = {
  position: [number, number, number];
  value: number;
};

type WorkerInput = {
  charges: WorkerChargeInput[];
  resolution: number;
  limits: number;
  center: [number, number, number];
};

let marchingCubes: InstanceType<typeof MarchingCubes> | null = null;

type WorkerScope = {
  onmessage: (event: MessageEvent<WorkerInput>) => void;
  postMessage: (message: {
    positions: Float32Array;
    normals: Float32Array;
    colors: Float32Array;
  }, transfer?: Transferable[]) => void;
};

const workerScope = self as unknown as WorkerScope;

workerScope.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { charges, resolution, limits, center } = e.data;

  if (!charges || charges.length === 0) {
    self.postMessage({
      positions: new Float32Array(0),
      normals: new Float32Array(0),
      colors: new Float32Array(0)
    });
    return;
  }

  if (!marchingCubes || marchingCubes.resolution !== resolution) {
    marchingCubes = new MarchingCubes(resolution, { flatShading: false } as any, false, false, 5000000);
  }

  marchingCubes.reset();

  const SOFTENING = 1e-10;
  const ke = 8.98755e9;

  const precomputedCharges = charges.map((c) => ({
    x: c.position[0],
    y: c.position[1],
    z: c.position[2],
    kq: ke * (c.value * 1e-9)
  }));

  const halfRes = resolution / 2;
  for (let z = 0; z < resolution; z++) {
    const pz = (z / halfRes - 1) * limits + center[2];
    for (let y = 0; y < resolution; y++) {
      const py = (y / halfRes - 1) * limits + center[1];
      for (let x = 0; x < resolution; x++) {
        const px = (x / halfRes - 1) * limits + center[0];
        
        let V = 0;
        for (let i = 0; i < precomputedCharges.length; i++) {
          const c = precomputedCharges[i];
          const dx = px - c.x;
          const dy = py - c.y;
          const dz = pz - c.z;
          const r = Math.sqrt(dx * dx + dy * dy + dz * dz + SOFTENING);
          V += c.kq / r;
        }
        
        marchingCubes.setCell(x, y, z, V);
      }
    }
  }

  // --- Determinamos el rango de potencial real dentro de la caja de cómputo ---
  // Muestreamos los vértices de la cuadrícula para encontrar Vmin y Vmax reales,
  // evitando así generar isosuperficies para valores que no existen en el campo.
  let gridVMin = Infinity;
  let gridVMax = -Infinity;
  const stride = Math.max(1, Math.floor(resolution / 8)); // muestreo rápido (8³ = 512 puntos)
  for (let zi = 0; zi < resolution; zi += stride) {
    for (let yi = 0; yi < resolution; yi += stride) {
      for (let xi = 0; xi < resolution; xi += stride) {
        const idx = xi + yi * resolution + zi * resolution * resolution;
        // MarchingCubes almacena la cuadrícula en `field`
        const v = (marchingCubes as any).field[idx];
        if (v < gridVMin) gridVMin = v;
        if (v > gridVMax) gridVMax = v;
      }
    }
  }

  const maxAbsQ = Math.max(...charges.map((c) => Math.abs(c.value * 1e-9)));
  const maxV_estimated = (ke * maxAbsQ) / 1.2;

  const numLayers = 6;

  // Solo generamos isovalores dentro del rango físico real [gridVMin, gridVMax].
  // Esto elimina las isosuperficies fantasmas que aparecen cuando el campo es
  // exclusivamente positivo (cargas del mismo signo) y se piden aislamientos negativos.
  const rawIsolations: number[] = [];
  const deltaV = maxV_estimated / numLayers;
  for (let i = 1; i <= numLayers; i++) {
    const posIso = i * deltaV;
    const negIso = -i * deltaV;
    if (posIso >= gridVMin && posIso <= gridVMax) rawIsolations.push(posIso);
    if (negIso >= gridVMin && negIso <= gridVMax) rawIsolations.push(negIso);
  }

  // Umbral de triángulos: descartamos cualquier capa cuyo tamaño supere el 30 % del
  // máximo histórico (protección adicional contra artefactos de la caja de cómputo).
  const MAX_TRIANGLE_FRACTION = 0.30;
  let maxCountSeen = 0;

  const allPositions: number[] = [];
  const allNormals: number[] = [];
  const allColors: number[] = [];

  // Primera pasada: medir conteos para calcular el umbral real
  const layerCounts: number[] = [];
  for (const iso of rawIsolations) {
    marchingCubes.isolation = iso;
    marchingCubes.update();
    layerCounts.push(marchingCubes.count);
    if (marchingCubes.count > maxCountSeen) maxCountSeen = marchingCubes.count;
  }

  const triangleThreshold = maxCountSeen * MAX_TRIANGLE_FRACTION;

  // Segunda pasada: construir geometría solo para capas válidas
  for (let li = 0; li < rawIsolations.length; li++) {
    const iso = rawIsolations[li];
    const count = layerCounts[li];

    // Omitimos capas vacías o capas anómalamente grandes (artefactos de borde)
    if (count === 0) continue;
    if (count > triangleThreshold && rawIsolations.length > 1) continue;

    marchingCubes.isolation = iso;
    marchingCubes.update();

    const posArray = marchingCubes.geometry.attributes.position.array;
    const normArray = marchingCubes.geometry.attributes.normal.array;

    const absIso = Math.abs(iso);
    const intensity = 0.3 + 0.7 * (absIso / maxV_estimated);

    const r = iso > 0 ? 0.9 * intensity : 0.15;
    const g = 0.15;
    const b = iso > 0 ? 0.15 : 0.9 * intensity;

    if (iso < 0) {
      // Para valores negativos, MarchingCubes asume que el interior es > iso (que sería el resto del universo).
      // Esto invierte las caras (Inside-Out). Debemos invertir el orden de los vértices (Winding) y las normales.
      for (let i = 0; i < count; i += 3) {
        // Vértice 0
        allPositions.push(posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2]);
        allNormals.push(-normArray[i * 3], -normArray[i * 3 + 1], -normArray[i * 3 + 2]);
        allColors.push(r, g, b);

        // Vértice 2 (intercambiado con 1 para invertir winding)
        allPositions.push(posArray[(i + 2) * 3], posArray[(i + 2) * 3 + 1], posArray[(i + 2) * 3 + 2]);
        allNormals.push(-normArray[(i + 2) * 3], -normArray[(i + 2) * 3 + 1], -normArray[(i + 2) * 3 + 2]);
        allColors.push(r, g, b);

        // Vértice 1 (intercambiado con 2)
        allPositions.push(posArray[(i + 1) * 3], posArray[(i + 1) * 3 + 1], posArray[(i + 1) * 3 + 2]);
        allNormals.push(-normArray[(i + 1) * 3], -normArray[(i + 1) * 3 + 1], -normArray[(i + 1) * 3 + 2]);
        allColors.push(r, g, b);
      }
    } else {
      for (let i = 0; i < count; i++) {
        allPositions.push(posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2]);
        allNormals.push(normArray[i * 3], normArray[i * 3 + 1], normArray[i * 3 + 2]);
        allColors.push(r, g, b);
      }
    }
  }

  const positions = new Float32Array(allPositions);
  const normals = new Float32Array(allNormals);
  const colors = new Float32Array(allColors);

  // Opcional: suavizar aún más si es necesario, pero flatShading: false en MarchingCubes
  // ya genera normales interpoladas. El aumento de resolución es la clave.

  workerScope.postMessage(
    { positions, normals, colors },
    [positions.buffer, normals.buffer, colors.buffer]
  );
};
