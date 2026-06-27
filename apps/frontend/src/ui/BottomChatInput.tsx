import { useState, useEffect, useRef, memo } from 'react';
import { useSimulatorStore } from '@campoelectrico/store';
import { supabaseClient } from '../services/supabaseClient';
import { aiService } from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  "¿Qué te gustaría crear?",
  "Añade una carga...",
  "Crea un dipolo",
  "Añade un cuadripolo en el origen",
  "Oculta las líneas de campo",
  "Agrega una carga positiva de 5nC",
  "Accede a los comandos rápidos con '/'",
];

const quickCommands = [
  { cmd: 'Crea un dipolo eléctrico', desc: 'Carga positiva y negativa separadas' },
  { cmd: 'Añade un cuadripolo', desc: '4 cargas alternas en cuadrado' },
  { cmd: 'Borra todas las cargas', desc: 'Limpia la escena por completo' },
  { cmd: 'Oculta las líneas de campo', desc: 'Desactiva la visualización de líneas' },
  { cmd: 'Muestra la cuadrícula', desc: 'Activa la cuadrícula de referencia' },
  { cmd: 'Centra la cámara', desc: 'Restablece la vista original' },
];

export const BottomChatInput = memo(function BottomChatInput() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setIsChatOpen = useSimulatorStore((state) => state.setIsChatOpen);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sessionId = useSimulatorStore((state) => state.sessionId);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowCommands(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    setInput('');
    setIsLoading(true);
    setError(null);
    setShowCommands(false);
    setIsChatOpen(true);

    try {
      await supabaseClient.saveMessage('user', messageText.trim(), sessionId);
      window.dispatchEvent(new CustomEvent('chat-message-added'));

      const history = await supabaseClient.getMessages(sessionId);

      const response = await aiService.getChatResponse(history);

      await supabaseClient.saveMessage('assistant', response, sessionId);
      window.dispatchEvent(new CustomEvent('chat-message-added'));

    } catch (err: unknown) {
      console.error('Error in handleSend:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      
      await supabaseClient.saveMessage(
        'assistant',
        `❌ **Error:** No se pudo completar tu petición. ${errorMessage}`,
        sessionId
      );
      window.dispatchEvent(new CustomEvent('chat-message-added'));
    } finally {
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    if (value.startsWith('/')) {
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }
  };



  const [placeholderText, setPlaceholderText] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentSuggestion = SUGGESTIONS[suggestionIndex];
    const typingSpeed = isDeleting ? 30 : 60;
    const currentLength = placeholderText.length;
    
    if (!isDeleting && currentLength === currentSuggestion.length) {
      const pauseTimer = setTimeout(() => setIsDeleting(true), 18000); 
      return () => clearTimeout(pauseTimer);
    } else if (isDeleting && currentLength === 0) {
      setIsDeleting(false);
      setSuggestionIndex((prev) => (prev + 1) % SUGGESTIONS.length);
      return;
    }

    const timer = setTimeout(() => {
      setPlaceholderText(currentSuggestion.substring(0, currentLength + (isDeleting ? -1 : 1)));
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [placeholderText, isDeleting, suggestionIndex]);

  const selectCommand = (commandText: string) => {
    handleSend(commandText);
    setShowCommands(false);
  };



  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="pointer-events-none flex flex-col items-center gap-3 self-center z-20 w-full max-w-[280px] sm:max-w-xl px-4 sm:px-0">
      <div ref={containerRef} className="relative pointer-events-auto flex flex-col items-center w-full">
        
        <AnimatePresence>
        {showCommands && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 w-full mb-2 glass-panel-floating overflow-hidden z-30"
          >
            <div className="relative z-10">
              <div className="px-3 py-1.5 bg-black/5 dark:bg-white/5 border-b border-border text-[10px] text-muted-foreground font-semibold tracking-wider uppercase font-mono">
                Comandos rápidos del Simulador
              </div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {quickCommands.map((qc, index) => (
                  <button
                    key={index}
                    onClick={() => selectCommand(qc.cmd)}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 border-b border-black/5 dark:border-white/5 last:border-0 text-left text-xs text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{qc.cmd}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{qc.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        <motion.div 
          initial={false}
          animate={{ width: isFocused || input ? '100%' : '280px' }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="glass-panel-floating flex flex-row items-end gap-2 p-1.5 px-2 mx-auto origin-center max-w-full"
        >
          <textarea
            ref={textareaRef}
            id="chat-textarea"
            name="chat-textarea"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholderText || " "}
            rows={1}
            aria-label="Mensaje para el copiloto"
            className={`flex-1 w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none border-0 px-2 py-1.5 leading-relaxed h-8 max-h-32 relative z-10 custom-scrollbar ${!input ? 'whitespace-nowrap overflow-hidden' : ''}`}
            disabled={isLoading}
          />

          <div className="flex items-center gap-2 mb-0.5 relative z-10 shrink-0">
            {error && (
              <span className="text-[10px] text-red-400 max-w-[120px] truncate" title={error}>
                {error}
              </span>
            )}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              aria-label="Enviar mensaje"
              className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition-all ${
                input.trim() && !isLoading
                  ? 'bg-primary text-primary-foreground shadow-md cursor-pointer active:scale-95'
                  : 'bg-muted text-muted-foreground cursor-default'
              }`}
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white dark:border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
});
