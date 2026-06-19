import math
from typing import List, Dict, Any

K_E = 8.9875517923e9  # Constante de Coulomb N m^2 / C^2

def vec_sub(v1: List[float], v2: List[float]) -> List[float]:
    return [v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]]

def vec_add(v1: List[float], v2: List[float]) -> List[float]:
    return [v1[0]+v2[0], v1[1]+v2[1], v1[2]+v2[2]]

def vec_scale(v: List[float], scalar: float) -> List[float]:
    return [v[0]*scalar, v[1]*scalar, v[2]*scalar]

def vec_mag(v: List[float]) -> float:
    return math.sqrt(v[0]**2 + v[1]**2 + v[2]**2)

def calculate_electric_field(q: float, r_source: List[float], r_point: List[float]) -> List[float]:
    """
    Determina el vector tridimensional del campo eléctrico E(P) generado por una carga puntual
    en una posición específica, aplicando la Ley de Coulomb estática.
    """
    r_vec = vec_sub(r_point, r_source)
    r_mag = vec_mag(r_vec)
    if r_mag == 0:
        return [0.0, 0.0, 0.0]
    
    E_mag = K_E * q / (r_mag**2)
    r_hat = vec_scale(r_vec, 1.0 / r_mag)
    return vec_scale(r_hat, E_mag)

def calculate_electric_potential(q: float, r_source: List[float], r_point: List[float]) -> float:
    """
    Calcula el potencial eléctrico escalar V(P) en un punto del espacio generado por una carga puntual,
    basado en el trabajo requerido para mover una carga de prueba desde el infinito.
    """
    r_vec = vec_sub(r_point, r_source)
    r_mag = vec_mag(r_vec)
    if r_mag == 0:
        return 0.0
    return K_E * q / r_mag

def generate_step_by_step_analysis(charges: List[Dict[str, Any]], target_point: List[float]) -> Dict[str, Any]:
    """
    Genera un desglose algorítmico determinista de las contribuciones físicas iterando
    sobre múltiples cargas fuente. El resultado (campo neto, potencial neto y contribuciones)
    está formateado para ser consumido por el modelo de lenguaje de forma determinista,
    previniendo cálculos probabilísticos o alucinaciones matemáticas.
    """
    steps = []
    E_net = [0.0, 0.0, 0.0]
    V_net = 0.0
    
    for i, c in enumerate(charges):
        q = c['q']
        pos = c['pos']
        
        # Field
        E_vec = calculate_electric_field(q, pos, target_point)
        E_net = vec_add(E_net, E_vec)
        
        # Potential
        V_val = calculate_electric_potential(q, pos, target_point)
        V_net += V_val
        
        r_mag = vec_mag(vec_sub(target_point, pos))
        
        steps.append({
            "charge_id": c.get('id', f"q{i+1}"),
            "q_coulombs": q,
            "distance_m": r_mag,
            "E_vector": E_vec,
            "E_magnitude": vec_mag(E_vec),
            "V_contribution": V_val
        })
        
    return {
        "target_point": target_point,
        "contributions": steps,
        "net_E_vector": E_net,
        "net_E_magnitude": vec_mag(E_net),
        "net_V": V_net
    }
