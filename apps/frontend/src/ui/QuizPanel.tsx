import { useState, useEffect } from 'react';
import { useSimulatorStore } from '@campoelectrico/store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, Lightbulb, ChevronRight, RefreshCw, Trophy, Frown, Sparkles } from 'lucide-react';
import { quizData } from '../lib/quizData';

export function QuizPanel() {
  const isQuizOpen = useSimulatorStore((state) => state.isQuizOpen);
  const setQuizOpen = useSimulatorStore((state) => state.setQuizOpen);

  // Intentar recuperar el progreso desde localStorage
  const getInitialProgress = () => {
    try {
      const saved = localStorage.getItem('campo_electrico_quiz_progress');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error reading quiz progress', e);
    }
    return { currentIndex: 0, score: 0 };
  };

  const initialProgress = getInitialProgress();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialProgress.currentIndex);
  const [score, setScore] = useState(initialProgress.score);
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const question = quizData[currentQuestionIndex];
  const isFinished = currentQuestionIndex >= quizData.length;

  useEffect(() => {
    if (!isFinished) {
      localStorage.setItem('campo_electrico_quiz_progress', JSON.stringify({
        currentIndex: currentQuestionIndex,
        score
      }));
    }
  }, [currentQuestionIndex, score, isFinished]);

  const handleSelectOption = (index: number) => {
    if (isAnswered) return; // No permitir cambiar después de responder
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null || isAnswered) return;
    
    const correct = selectedOption === question.correctAnswerIndex;
    setIsCorrect(correct);
    setIsAnswered(true);
    
    if (correct) {
      setScore((s: number) => s + 1);
    }
  };

  const handleNext = () => {
    setCurrentQuestionIndex((i: number) => i + 1);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    localStorage.removeItem('campo_electrico_quiz_progress');
  };

  return (
    <AnimatePresence>
      {isQuizOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 bottom-4 sm:bottom-6 w-full max-w-[360px] pointer-events-auto z-50 flex flex-col glass-panel-floating shadow-2xl overflow-hidden rounded-xl border border-border"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-background/50 backdrop-blur-sm shrink-0">
            <div>
              <h2 className="font-serif font-bold text-lg text-foreground tracking-wide">Quizz de Reflexión</h2>
              {!isFinished && (
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Pregunta {currentQuestionIndex + 1} de {quizData.length}
                </p>
              )}
            </div>
            <button
              onClick={() => setQuizOpen(false)}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Cerrar panel de Quiz"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col">
            {isFinished ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="flex flex-col items-center justify-center h-full text-center space-y-6"
              >
                {score === 3 && (
                  <motion.div 
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center relative"
                  >
                    <Trophy className="w-12 h-12 text-yellow-500" />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 rounded-full border-2 border-yellow-500/30"
                    />
                  </motion.div>
                )}
                
                {(score === 1 || score === 2) && (
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center"
                  >
                    <Sparkles className="w-12 h-12 text-blue-500" />
                  </motion.div>
                )}
                
                {score === 0 && (
                  <motion.div 
                    initial={{ x: [-10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center"
                  >
                    <Frown className="w-12 h-12 text-red-500" />
                  </motion.div>
                )}

                <div>
                  <h3 className="text-xl font-bold font-serif mb-2">
                    {score === 3 ? "¡Excelente Trabajo!" : (score > 0 ? "¡Casi lo logras!" : "¡Inténtalo de nuevo!")}
                  </h3>
                  <p className="text-muted-foreground">
                    Tu puntuación final es:
                  </p>
                  <p className={`text-4xl font-bold mt-2 font-serif ${score === 3 ? 'text-yellow-500' : (score > 0 ? 'text-blue-500' : 'text-red-500')}`}>
                    {score} / {quizData.length}
                  </p>
                </div>
                <button
                  onClick={handleRestart}
                  className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-background border border-border shadow-sm text-foreground rounded-lg font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reintentar Quizz
                </button>
              </motion.div>
            ) : (
              <>
                {/* Pregunta */}
                <h3 className="text-[15px] leading-relaxed font-medium mb-6 text-foreground">
                  {question.question}
                </h3>

                {/* Alternativas */}
                <div className="space-y-2.5 mb-8">
                  {question.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrectOption = idx === question.correctAnswerIndex;
                    
                    let btnClass = "w-full text-left p-3 rounded-lg border text-sm transition-all duration-200 outline-none ";
                    
                    if (!isAnswered) {
                      btnClass += isSelected 
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground focus-visible:border-primary";
                    } else {
                      if (isCorrectOption) {
                        btnClass += "border-green-500 bg-green-500/15 text-green-700 dark:text-green-300 ring-1 ring-green-500";
                      } else if (isSelected && !isCorrectOption) {
                        btnClass += "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300";
                      } else {
                        btnClass += "border-border opacity-50";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={isAnswered}
                        className={btnClass}
                      >
                        <div className="flex gap-3">
                          <span className="shrink-0 font-bold opacity-70">{String.fromCharCode(65 + idx)}.</span>
                          <span className="leading-snug">{opt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback */}
                <AnimatePresence mode="wait">
                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg mb-6 text-sm ${
                        isCorrect 
                          ? 'bg-green-500/10 border border-green-500/20 text-green-800 dark:text-green-200' 
                          : 'bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 mb-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                        )}
                        <h4 className="font-semibold">{isCorrect ? '¡Correcto!' : 'Respuesta incorrecta'}</h4>
                      </div>
                      
                      <p className="leading-relaxed opacity-90 mt-1 mb-3">
                        {isCorrect ? question.explanation : "Tu respuesta no es correcta. Usa el simulador para comprobar la teoría."}
                      </p>

                      {!isCorrect && (
                        <div className="flex items-start gap-2 bg-background/50 rounded p-2.5 border border-amber-500/10">
                          <Lightbulb className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                          <p className="text-xs font-medium leading-relaxed italic opacity-90">
                            {question.hint}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Pie / Botones de acción */}
          {!isFinished && (
            <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm shrink-0">
              {!isAnswered ? (
                <button
                  onClick={handleSubmit}
                  disabled={selectedOption === null}
                  className={`w-full py-2.5 rounded-lg font-medium transition-all duration-200 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                    selectedOption !== null
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                  }`}
                >
                  Confirmar Respuesta
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
