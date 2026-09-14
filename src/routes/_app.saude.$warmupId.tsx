import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';

import { useState } from 'react';
import { VOCAL_DATA } from '../data/vocal-exercises';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_app/saude/$warmupId')({
  component: ExerciseStepPage,
});

function ExerciseStepPage() {
  const { warmupId } = Route.useParams();
  const navigate = useNavigate();
  const warmup = VOCAL_DATA[warmupId];
  
  const [currentStep, setCurrentStep] = useState(0);

  if (!warmup) return null;

  const exercise = warmup.exercises[currentStep];
  const progress = ((currentStep + 1) / warmup.exercises.length) * 100;

  const handleNext = () => {
    if (currentStep < warmup.exercises.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.success('Aquecimento concluído!', {
        description: 'Sua voz está pronta para brilhar.',
        icon: <CheckCircle2 className="text-primary" />,
      });
      navigate({ to: '/saude' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background animate-in overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[140%] h-[50%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <header className="flex items-center justify-between p-6 pb-2 relative z-10">
        <div className="space-y-1">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B8955A]">
            {warmup.name}
          </h2>
          <p className="text-[9px] text-white/30 uppercase tracking-widest font-medium">Exercício {currentStep + 1} de {warmup.exercises.length}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/saude' })} className="w-10 h-10 rounded-full bg-white/5 text-white/40 hover:text-white transition-all">
          <X size={20} />
        </Button>
      </header>

      <div className="px-6 relative z-10">
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden my-6 shadow-inner">
          <div 
            className="h-full bg-[#B8955A] transition-all duration-700 ease-out shadow-[0_0_15px_rgba(201,168,76,0.5)]" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-[180px] relative z-10">
        <div className="flex flex-col items-center justify-center space-y-10 max-w-sm mx-auto w-full py-10">
          <div className="text-[140px] leading-none drop-shadow-[0_20px_50px_rgba(255,255,255,0.05)] transition-transform duration-700 hover:scale-110">
            {exercise.icon}
          </div>
          
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-serif text-white tracking-tight leading-tight drop-shadow-sm">{exercise.name}</h1>
            <div className="premium-card bg-[#0D0F12]/50 border-white/[0.03] p-6 backdrop-blur-sm">
              <p className="text-[15px] text-white/60 leading-relaxed font-medium">
                {exercise.instruction}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="px-5 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center">
              <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mb-0.5">Séries</span>
              <span className="text-xl font-bold text-white leading-none">{exercise.sets}</span>
            </div>
            <div className="px-5 py-2.5 rounded-2xl bg-secondary/10 border border-secondary/20 flex flex-col items-center">
              <span className="text-[9px] font-bold text-secondary uppercase tracking-[0.2em] mb-0.5">Reps</span>
              <span className="text-xl font-bold text-white leading-none">{exercise.reps}</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-50 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-background via-background/95 to-transparent pt-12">
        <div className="grid grid-cols-[1fr_2fr] gap-4 max-w-[390px] mx-auto">
          <Button 
            variant="ghost" 
            onClick={handlePrev} 
            disabled={currentStep === 0}
            className="h-16 rounded-[20px] text-white/30 hover:text-white hover:bg-white/5 border border-white/5"
          >
            Anterior
          </Button>
          <Button 
            onClick={handleNext}
            className="h-16 rounded-[20px] bg-primary text-background font-bold text-lg hover:bg-primary/90 shadow-[0_8px_25px_-8px_rgba(201,168,76,0.5)] active:scale-[0.98] transition-all"
          >
            {currentStep === warmup.exercises.length - 1 ? 'Concluir' : 'Próximo'}
          </Button>
        </div>
      </footer>
    </div>


  );
}