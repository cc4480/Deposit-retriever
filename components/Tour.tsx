
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export type TourStep = {
  targetId: string;
  title: string;
  content: string;
};

interface TourProps {
  steps: TourStep[];
  onComplete: () => void;
  isOpen: boolean;
}

export const Tour: React.FC<TourProps> = ({ steps, onComplete, isOpen }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isOpen) {
        setCurrentStep(0);
    }
  }, [isOpen]);

  // Handle scrolling to the target when the step changes
  useEffect(() => {
    if (isOpen && steps && steps[currentStep]) {
        const step = steps[currentStep];
        const el = document.getElementById(step.targetId);
        if (el) {
            // Scroll into view only when the step changes
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [isOpen, currentStep, steps]);

  const updateTarget = useCallback(() => {
    const step = steps?.[currentStep];
    if (step) {
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Update highlight position without forcing scroll
        if (rect.width > 0 && rect.height > 0) {
            setTargetRect(rect);
        }
      }
    }
  }, [steps, currentStep]);

  useEffect(() => {
    if (isOpen && steps && steps[currentStep]) {
        // Initial update
        updateTarget();
        
        // Poll briefly to catch any layout shifts or smooth scroll end
        const timer = setInterval(updateTarget, 100);
        const timeout = setTimeout(() => clearInterval(timer), 1000); 

        window.addEventListener('resize', updateTarget);
        window.addEventListener('scroll', updateTarget, { capture: true }); 
        
        return () => {
            clearInterval(timer);
            clearTimeout(timeout);
            window.removeEventListener('resize', updateTarget);
            window.removeEventListener('scroll', updateTarget, { capture: true });
        };
    }
  }, [isOpen, currentStep, steps, updateTarget]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      onComplete();
    }
  };
  
  const handleSkip = () => {
      onComplete();
  };

  if (!isOpen || !targetRect || !steps || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const isTopPosition = targetRect.top > 300; 

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      {/* 
         Visual Highlight Overlay 
         Removed transition-all to prevent "laggy" feel when scrolling.
         The highlight will now stick instantly to the element.
      */}
      <div 
        className="absolute border-2 border-white/50 rounded-xl pointer-events-none"
        style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)'
        }}
      >
        <div className="absolute -inset-1 border border-blue-500/50 rounded-xl animate-pulse"></div>
      </div>

      {/* Tooltip */}
      <div 
        className="absolute w-[calc(100%-2rem)] md:max-w-sm bg-white p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 pointer-events-auto"
        style={{
          top: isTopPosition ? targetRect.top - 20 : targetRect.bottom + 30,
          left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 340)),
          transform: isTopPosition ? 'translateY(-100%)' : 'none'
        }}
      >
        <button 
            onClick={handleSkip} 
            className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors pointer-events-auto"
            title="Close Tour"
        >
            <i className="fas fa-times text-lg"></i>
        </button>

        <div className="flex justify-between items-start mb-3 pr-8">
            <h3 className="font-bold text-lg text-slate-900 brand-font">{step.title}</h3>
        </div>
        
        <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">{step.content}</p>
        
        <div className="flex justify-between items-center border-t border-slate-100 pt-4">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Step {currentStep + 1} of {steps.length}</span>
            <div className="flex gap-3">
                {currentStep > 0 && (
                    <button 
                        onClick={() => setCurrentStep(c => c - 1)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-2"
                    >
                        Back
                    </button>
                )}
                <button 
                    onClick={handleNext}
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                >
                    {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
        </div>
        
        {/* Arrow Indicator */}
        <div 
            className="absolute w-4 h-4 bg-white transform rotate-45"
            style={{
                bottom: isTopPosition ? -8 : 'auto',
                top: isTopPosition ? 'auto' : -8,
                left: 24
            }}
        />
      </div>
    </div>,
    document.body
  );
};
