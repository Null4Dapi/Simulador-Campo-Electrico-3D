/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState, memo } from 'react';
import { supabaseClient } from '../services/supabaseClient';
import type { ChatMessage } from '../services/supabaseClient';
import { useSimulatorStore } from '@campoelectrico/store';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, Eraser, X } from 'lucide-react';
import { ParameterExtractionPanel } from './ParameterExtractionPanel';

const REMARK_PLUGINS = [remarkMath];
const REHYPE_PLUGINS = [rehypeKatex];

export const AgentLog = memo(function AgentLog() {
  const isChatOpen = useSimulatorStore((state) => state.isChatOpen);
  const toggleChat = useSimulatorStore((state) => state.toggleChat);
  const setIsChatOpen = useSimulatorStore((state) => state.setIsChatOpen);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sessionId = useSimulatorStore((state) => state.sessionId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Inicializa la carga de datos de la sesión y establece escuchadores de eventos al montar el componente
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await supabaseClient.getMessages(sessionId);
        setMessages(data);
      } catch (e) {
        console.error('Error loading chat history:', e);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchMessages();

    // Suscribe el componente a la emisión de nuevos mensajes en el chat
    const handleChatUpdated = () => {
      void fetchMessages();
    };

    window.addEventListener('chat-message-added', handleChatUpdated);
    return () => {
      window.removeEventListener('chat-message-added', handleChatUpdated);
    };
  }, [sessionId]);

  // Controla el desplazamiento automático de la vista hacia los mensajes recientes
  useEffect(() => {
    if (isChatOpen && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 50);
    }
  }, [messages, isChatOpen]);

  const clearChatSession = useSimulatorStore((state) => state.clearChatSession);

  // Ejecuta la purga del historial tanto en el almacenamiento local como en la base de datos remota
  const handleClearHistory = () => {
    clearChatSession();
    setMessages([]);
  };



  if (!isChatOpen) {
    return (
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 pointer-events-auto glass-panel-floating flex items-center justify-center p-1.5 z-30">
        <button
          onClick={toggleChat}
          className="flex items-center justify-center w-8 h-8 rounded-[calc(var(--radius)-4px)] text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-all duration-200 active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
          title="Abrir Chat"
          aria-label="Alternar Chat de Copiloto"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{ originX: 1, originY: 1 }}
      className="absolute bottom-4 right-4 md:bottom-6 md:right-6 glass-panel-floating pointer-events-auto flex flex-col w-[300px] sm:w-[340px] h-[360px] sm:h-[420px] overflow-hidden z-30 shadow-2xl"
    >
      {/* Encabezado visual de la interfaz del asistente */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-black/5 dark:bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-[11px] font-bold text-foreground tracking-widest uppercase">
            Asistente
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors cursor-pointer"
            title="Limpiar historial"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsChatOpen(false)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Cerrar chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenedor desplazable para el historial de mensajes */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col custom-scrollbar"
      >
        {isLoading ? (
          // Indicador de estado de carga mediante elementos esqueleto
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="self-end w-3/4 h-10 bg-primary/20 rounded-2xl rounded-br-sm" />
            <div className="self-start w-2/3 h-16 bg-muted/50 rounded-2xl rounded-bl-sm" />
            <div className="self-start w-1/2 h-10 bg-muted/50 rounded-2xl rounded-bl-sm" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
            <Sparkles className="w-8 h-8 mb-3 opacity-20" />
            <p className="text-xs font-medium">¿En qué puedo ayudarte hoy?</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            
            if (isUser && msg.content.includes('<parameter_confirmed>')) {
              return null;
            }

            const paramRequestMatch = !isUser ? msg.content.match(/<parameter_request>([\s\S]*?)<\/parameter_request>/) : null;
            const hasParamRequest = !!paramRequestMatch;
            const paramJson = paramRequestMatch ? paramRequestMatch[1] : '';
            const contentWithoutParamRequest = !isUser ? msg.content.replace(/<parameter_request>[\s\S]*?<\/parameter_request>/g, '') : msg.content;

            return (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                key={msg.id || index}
                className={`flex flex-col max-w-[85%] ${
                  isUser ? 'self-end' : 'self-start'
                }`}
              >
                <div
                  className={`text-[12px] leading-relaxed px-3.5 py-2.5 shadow-sm ${
                    isUser
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
                      : 'bg-black/5 dark:bg-white/10 backdrop-blur-md border border-border/50 text-foreground rounded-2xl rounded-bl-sm'
                  }`}
                >
                  {isUser ? (
                    msg.content
                  ) : (
                    <>
                      {contentWithoutParamRequest.replace(/<actions>[\s\S]*?<\/actions>/g, '').trim() && (
                        <div className="chat-markdown">
                        <ReactMarkdown
                          remarkPlugins={REMARK_PLUGINS}
                          rehypePlugins={REHYPE_PLUGINS}
                          components={{
                            p: ({node: _, ...props}) => <p className="my-1.5 wrap-break-word" {...props} />,
                            li: ({node: _, ...props}) => <li className="ml-4 list-disc my-0.5" {...props} />,
                            h2: ({node: _, ...props}) => <h2 {...props} />,
                            h3: ({node: _, ...props}) => <h3 {...props} />,
                            hr: ({node: _, ...props}) => <hr {...props} />,

                            code: ({node: _, className, children, ...props}) => {
                              const match = /language-(\w+)/.exec(className || '');
                              return !match ? (
                                <code className="bg-black/5 dark:bg-white/5 rounded border border-black/5 dark:border-white/5 px-1 py-0.5 text-[10px] font-mono text-indigo-600 dark:text-indigo-300" {...props}>
                                  {children}
                                </code>
                              ) : (
                                <code className="block my-1 px-2 py-1 bg-black/5 dark:bg-white/5 rounded border border-black/5 dark:border-white/5 text-[10px] font-mono text-indigo-600 dark:text-indigo-300 overflow-x-auto" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            strong: ({node: _, ...props}) => <strong className="font-semibold text-zinc-900 dark:text-zinc-100" {...props} />
                          }}
                        >
                          {contentWithoutParamRequest.replace(/<actions>[\s\S]*?<\/actions>/g, '').trim()}
                        </ReactMarkdown>
                        </div>
                      )}
                      {hasParamRequest && (
                        <ParameterExtractionPanel 
                          jsonString={paramJson} 
                          isLatest={index === messages.length - 1} 
                        />
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
});
