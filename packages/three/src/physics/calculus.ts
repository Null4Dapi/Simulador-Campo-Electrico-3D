const ke = 8.98755e9; // N·m²/C²
const SOFTENING = 1e-10; // Define la constante de atenuación para evitar singularidades matemáticas

export interface ChargeData {
  position: [number, number, number];
  value: number; // Especifica la carga en nanoCoulombs (nC)
  type?: string; // Clasificación paramétrica ('positive', 'negative', 'test')
}

/**
 * Determina el campo eléctrico E(P) resultante por superposición vectorial de N cargas.
 * Retorna un objeto con el vector direccional normalizado y la magnitud escalar en N/C.
 */
export function calculateElectricField(
  point: [number, number, number],
  charges: ChargeData[]
): { direction: [number, number, number]; magnitude: number } {
  let Ex = 0, Ey = 0, Ez = 0;

  for (const charge of charges) {
    if (charge.type === 'test') continue; // Excluye las cargas de prueba ya que no emiten campo eléctrico
    const sign = charge.type === 'negative' ? -1 : 1;
    const q = charge.value * sign * 1e-9; // Realiza la conversión de nanoCoulombs a Coulombs
    const dx = point[0] - charge.position[0];
    const dy = point[1] - charge.position[1];
    const dz = point[2] - charge.position[2];
    
    // Aplica el factor de atenuación sobre el cuadrado de la distancia para mitigar el error por división por cero
    const r2 = dx * dx + dy * dy + dz * dz + SOFTENING;
    const r3 = r2 * Math.sqrt(r2);
    const factor = (ke * q) / r3;
    
    Ex += factor * dx;
    Ey += factor * dy;
    Ez += factor * dz;
  }

  const magnitude = Math.sqrt(Ex * Ex + Ey * Ey + Ez * Ez);
  if (magnitude === 0) return { direction: [0, 0, 0], magnitude: 0 };

  return {
    direction: [Ex / magnitude, Ey / magnitude, Ez / magnitude],
    magnitude,
  };
}

/**
 * Determina el potencial eléctrico escalar V(P) resultante por el principio de superposición.
 * Utilizado como métrica central para el cálculo de superficies equipotenciales.
 */
export function calculateElectricPotential(
  point: [number, number, number],
  charges: ChargeData[]
): number {
  let V = 0;
  for (const charge of charges) {
    if (charge.type === 'test') continue; // Excluye las cargas de prueba ya que no inciden sobre el potencial eléctrico
    const sign = charge.type === 'negative' ? -1 : 1;
    const q = charge.value * sign * 1e-9; // Realiza la conversión de nanoCoulombs a Coulombs
    const dx = point[0] - charge.position[0];
    const dy = point[1] - charge.position[1];
    const dz = point[2] - charge.position[2];
    
    const r = Math.sqrt(dx * dx + dy * dy + dz * dz + SOFTENING);
    V += (ke * q) / r;
  }
  return V;
}

/**
 * Determina el vector de fuerza eléctrica y el valor de energía potencial experimentados por una carga de prueba.
 */
export function calculateForceAndEnergy(
  point: [number, number, number],
  q0Value_nC: number,
  sourceCharges: ChargeData[]
): { force: [number, number, number]; energy: number; potential: number; fieldMagnitude: number } {
  const { direction, magnitude } = calculateElectricField(point, sourceCharges);
  const potential = calculateElectricPotential(point, sourceCharges);
  
  const q0 = q0Value_nC * 1e-9; // Realiza la conversión paramétrica a Coulombs
  const energy = q0 * potential; // Evalúa la energía potencial eléctrica de la partícula
  
  // Estima la magnitud de la fuerza como producto de carga y campo
  const forceMagnitude = Math.abs(q0) * magnitude;
  // Invierte el vector direccional si la carga fuente posee un signo negativo
  const forceDirSign = q0 < 0 ? -1 : 1;
  
  return {
    force: [
      direction[0] * forceMagnitude * forceDirSign,
      direction[1] * forceMagnitude * forceDirSign,
      direction[2] * forceMagnitude * forceDirSign
    ],
    energy,
    potential,
    fieldMagnitude: magnitude
  };
}
