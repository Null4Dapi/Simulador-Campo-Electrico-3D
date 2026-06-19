import { useSimulatorStore } from '@campoelectrico/store';
import { BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function QuizButton() {
  const isQuizOpen = useSimulatorStore((state) => state.isQuizOpen);
  const toggleQuiz = useSimulatorStore((state) => state.toggleQuiz);

  return (
    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 pointer-events-auto z-10">
      <AnimatePresence>
        {!isQuizOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={toggleQuiz}
            className="glass-panel-floating flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-all duration-200 active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-lg group relative"
            aria-label="Abrir Quizz Metacognitivo"
            title="Quizz de Metacognición"
          >
            <BookOpen className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            
            {/* Notification Badge / Pulso decorativo opcional para llamar la atención inicial */}
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
