import { useState } from 'react';
import { useSimulatorStore } from '@campoelectrico/store';

const SLIDES = [
  {
    title: 'Exploración 3D y Cargas',
    description: 'Navega libremente por la escena (clic para rotar, rueda para zoom). Añade cargas puntuales positivas o negativas y observa las líneas de campo en tiempo real.',
    image: '/onboarding/onboarding_camera_controls_1780963682668.webp'
  },
  {
    title: 'Asistente IA',
    description: 'Pide en lenguaje natural que el Asistente IA cree configuraciones como dipolos o limpie la escena. Presiona "/" en el chat para comandos rápidos.',
    image: '/onboarding/onboarding_ai_copilot_1780963693278.webp'
  },
  {
    title: 'Motor de Física Exacto',
    description: 'Cuando la IA propone crear cargas, aparecerá un panel de parámetros matemáticos. Confirma las coordenadas y un motor predictivo calculará la física con precisión absoluta.',
    image: '/onboarding/onboarding_add_charges_1780964544699.webp'
  }
];

export function OnboardingModal() {
  const hasSeenOnboarding = useSimulatorStore((state) => state.hasSeenOnboarding);
  const completeOnboarding = useSimulatorStore((state) => state.completeOnboarding);
  const [activeSlide, setActiveSlide] = useState(0);

  if (hasSeenOnboarding) return null;

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleComplete = () => {
    completeOnboarding();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-md animate-in fade-in duration-500" />
      
      <div className="relative w-full max-w-lg bg-slate-50 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-500">
        <div className="px-8 pt-8 pb-4 text-center">
          <h2 className="text-2xl font-serif font-bold text-zinc-900 dark:text-white tracking-wide">
            Campo Eléctrico 3D
          </h2>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">
            Introducción
          </p>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Bienvenido al simulador interactivo de electromagnetismo. Aquí tienes una guía rápida para aprovechar al máximo sus funcionalidades.
          </p>
        </div>

        <div className="relative w-full px-2 py-4 flex flex-col items-center justify-center">
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-[100px] w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 transition-colors z-10"
            aria-label="Diapositiva anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-[100px] w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 transition-colors z-10"
            aria-label="Diapositiva siguiente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>

          <div className="w-full overflow-hidden px-8 relative">
            <div className="w-full flex transition-transform duration-500 ease-out will-change-transform" style={{ transform: `translate3d(-${activeSlide * 100}%, 0, 0)` }}>
              {SLIDES.map((slide, index) => (
                <div key={index} className="w-full shrink-0 px-2 flex flex-col items-center text-center">
                  <div className="w-full aspect-video rounded-xl overflow-hidden shadow-inner border border-black/5 dark:border-white/5 mb-4 bg-zinc-200 dark:bg-zinc-800">
                    <img src={slide.image} alt={slide.title} loading="eager" decoding="async" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">{slide.title}</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 px-2">{slide.description}</p>
                </div>
              ))}
            </div>
            <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-slate-50 dark:from-zinc-900 to-transparent pointer-events-none" />
            <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-slate-50 dark:from-zinc-900 to-transparent pointer-events-none" />
          </div>
        </div>

        <div className="px-8 pb-8 pt-4 flex flex-col items-center gap-6">
          <div className="flex gap-2">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${activeSlide === index ? 'w-6 bg-blue-500' : 'bg-black/20 dark:bg-white/20'}`}
                aria-label={`Ir a la diapositiva ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleComplete}
            className="w-auto px-10 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide transition-colors shadow-lg active:scale-[0.98]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
