import { useState } from 'react';
import { useSimulatorStore } from '@campoelectrico/store';
import { supabaseClient } from '../services/supabaseClient';
import { aiService } from '../services/aiService';
import { Plus, Check, X } from 'lucide-react';

interface Param {
  name: string;
  value: string;
  unit?: string;
  isDraft?: boolean;
}

interface Props {
  jsonString: string;
  isLatest: boolean;
}

const AVAILABLE_VARIABLES = [
  { label: 'Seleccionar...', value: '', unit: '' },
  { label: 'Carga (q)', value: 'q', unit: 'C' },
  { label: 'Posición X (x)', value: 'x', unit: 'm' },
  { label: 'Posición Y (y)', value: 'y', unit: 'm' },
  { label: 'Distancia (r)', value: 'r', unit: 'm' },
  { label: 'Campo Eléctrico (E)', value: 'E', unit: 'N/C' },
  { label: 'Masa (m)', value: 'm', unit: 'kg' },
  { label: 'Velocidad (v0)', value: 'v0', unit: 'm/s' },
  { label: 'Ángulo (θ)', value: 'θ', unit: '°' },
  { label: 'Tiempo (t)', value: 't', unit: 's' },
  { label: 'Potencial (V)', value: 'V', unit: 'V' }
];

export function ParameterExtractionPanel({ jsonString, isLatest }: Props) {
  const sessionId = useSimulatorStore((state) => state.sessionId);
  const [params, setParams] = useState<Param[]>(() => {
    try {
      const data = JSON.parse(jsonString);
      return data.params || [];
    } catch {
      return [];
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const disabled = !isLatest || submitted || isSubmitting;

  const handleParamChange = (index: number, field: keyof Param, val: string) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], [field]: val };
    setParams(newParams);
  };

  const handleAddParam = () => {
    setParams([...params, { name: '', value: '', unit: '', isDraft: true }]);
  };

  const handleRemoveParam = (index: number) => {
    const newParams = [...params];
    newParams.splice(index, 1);
    setParams(newParams);
  };

  const handleVariableSelect = (index: number, selectedValue: string) => {
    if (!selectedValue) return;
    const variableMeta = AVAILABLE_VARIABLES.find(v => v.value === selectedValue);
    if (!variableMeta) return;

    const sameVars = params.filter((p, i) => i !== index && !p.isDraft && p.name.startsWith(selectedValue));
    
    let finalName = selectedValue;
    if (sameVars.length > 0) {
      let maxNum = 0;
      sameVars.forEach(p => {
        const numPart = p.name.replace(selectedValue, '');
        const num = parseInt(numPart);
        if (!isNaN(num) && num > maxNum) maxNum = num;
        else if (numPart === '' && maxNum === 0) maxNum = 1;
      });
      finalName = `${selectedValue}${maxNum + 1}`;
    }

    const newParams = [...params];
    newParams[index] = { 
      ...newParams[index], 
      name: finalName, 
      unit: variableMeta.unit,
      isDraft: false
    };
    setParams(newParams);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const finalParams = params.filter(p => !p.isDraft && p.name);
      const confirmedJson = JSON.stringify({ params: finalParams });
      const messageText = `<parameter_confirmed>${confirmedJson}</parameter_confirmed>`;
      
      await supabaseClient.saveMessage('user', messageText, sessionId);
      window.dispatchEvent(new CustomEvent('chat-message-added'));

      const history = await supabaseClient.getMessages(sessionId);
      const response = await aiService.getChatResponse(history);
      
      await supabaseClient.saveMessage('assistant', response, sessionId);
      window.dispatchEvent(new CustomEvent('chat-message-added'));
      setSubmitted(true);
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Error desconocido';
      await supabaseClient.saveMessage(
        'assistant',
        `❌ **Error:** No se pudo completar tu petición. ${errorMessage}`,
        sessionId
      );
      window.dispatchEvent(new CustomEvent('chat-message-added'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`mt-2 mb-2 border border-border/50 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 transition-opacity duration-300 ${disabled ? 'opacity-60 grayscale-[30%]' : ''}`}>
      <div className="bg-primary/10 px-3 py-2 text-xs font-semibold text-primary flex items-center justify-between border-b border-primary/20">
        <span>Parámetros Identificados</span>
      </div>
      <div className="p-3 space-y-2.5">
        {params.map((p, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            {p.isDraft ? (
              <select
                className="w-[35%] bg-background border border-border rounded-md text-[11px] px-2 py-1.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground cursor-pointer"
                onChange={(e) => handleVariableSelect(idx, e.target.value)}
                defaultValue=""
                disabled={disabled}
              >
                {AVAILABLE_VARIABLES.map(v => (
                  <option key={v.value} value={v.value} disabled={v.value === ''}>{v.label}</option>
                ))}
              </select>
            ) : (
              <div className="w-[30%] bg-muted/20 border border-border/50 rounded-md text-[11px] px-2 py-1.5 text-center text-muted-foreground flex items-center justify-center select-none overflow-hidden text-ellipsis whitespace-nowrap">
                {p.name || '-'}
              </div>
            )}
            
            <span className="text-muted-foreground text-xs font-medium">=</span>
            
            <input 
              type="text" 
              value={p.value} 
              onChange={(e) => handleParamChange(idx, 'value', e.target.value)}
              placeholder="Valor"
              className={`${p.isDraft ? 'w-[45%]' : 'w-[40%]'} bg-background/50 border border-border rounded-md text-[11px] px-2 py-1.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 font-mono`}
              disabled={disabled}
            />
            
            {!p.isDraft && (
              <div className="w-[15%] text-[12px] px-1 text-muted-foreground flex items-center select-none overflow-hidden text-ellipsis whitespace-nowrap">
                {p.unit}
              </div>
            )}

            {!disabled && (
              <button 
                onClick={() => handleRemoveParam(idx)} 
                className="p-1.5 text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors ml-auto"
                title="Eliminar parámetro"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

        {!disabled && (
          <div className="pt-3 mt-1 border-t border-border/50 flex items-center justify-between">
            <button 
              onClick={handleAddParam} 
              className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar parámetro
            </button>
            <button 
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground text-[11px] font-semibold px-4 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-primary/90 hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Listo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
