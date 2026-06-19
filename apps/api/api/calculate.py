from http.server import BaseHTTPRequestHandler
import json
from ._physics.electrostatics import generate_step_by_step_analysis

def parse_params_to_charges(params):
    """
    Convierte una matriz paramétrica plana en estructuras de datos espaciales.
    Aplica heurística de sufijos numéricos mediante expresiones regulares para
    emparejar magnitudes escalares (q1) con sus respectivos vectores de posición (x1, y1).
    """
    charges = []
    
    # entities almacenará el estado tridimensional agrupado por sufijo numérico
    entities = {}
    target = {'x': 0.0, 'y': 0.0, 'z': 0.0}
    
    for p in params:
        name = p.get('name', '')
        val_str = p.get('value', '0')
        try:
            val = float(val_str)
        except ValueError:
            continue
            
        import re
        match = re.match(r'([A-Za-z]+)(\d*)', name)
        if not match:
            continue
            
        base = match.group(1)
        idx = match.group(2)
        
        if idx:
            if idx not in entities:
                entities[idx] = {'x': 0.0, 'y': 0.0, 'z': 0.0, 'q': 0.0}
            entities[idx][base] = val
        else:
            # Si no hay índice, podría ser el punto objetivo o una carga única genérica
            if base in ['x', 'y', 'z']:
                target[base] = val
            elif base == 'q':
                if '0' not in entities:
                    entities['0'] = {'x': 0.0, 'y': 0.0, 'z': 0.0, 'q': 0.0}
                entities['0'][base] = val
            elif base == 'r':
                target['x'] = val # Asume distancia sobre el eje x si solo se recibe "r"
                
    for k, v in entities.items():
        if v.get('q', 0) != 0:
            charges.append({
                'id': f'q{k}',
                'q': v['q'],
                'pos': [v['x'], v['y'], v['z']]
            })
            
    target_point = [target['x'], target['y'], target['z']]
    return charges, target_point

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                raise ValueError("Empty body")
                
            post_data = self.rfile.read(content_length)
            req_body = json.loads(post_data)
            
            params = req_body.get('params', [])
            charges, target_point = parse_params_to_charges(params)
            
            result = generate_step_by_step_analysis(charges, target_point)
            
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            self.wfile.write(json.dumps(result).encode('utf-8'))
            
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
