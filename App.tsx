
import React, { useState, useEffect, useRef } from 'react';
import { CaseData, StateLaw, Deduction, GroundingSource } from './types';
import { STATE_LAWS } from './constants';
import LandingPage from './pages/LandingPage';
import AnalysisPage from './pages/AnalysisPage';
import PreviewPage from './pages/PreviewPage';
import SuccessPage from './pages/SuccessPage';
import ResourcesPage from './pages/ResourcesPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import { Tour, TourStep } from './components/Tour';
import { logger } from './utils/logger';

// Tour Config
const TOUR_STEPS: Record<string, TourStep[]> = {
  home: [
    { targetId: 'landing-form', title: 'Start Your Recovery', content: 'Enter your lease details here. We check your state laws instantly to see if you are owed penalties.' },
    { targetId: 'features-grid', title: 'Why Choose Us?', content: 'We handle everything: automatic penalty calculations, legal drafting, and certified mailing.' },
    { targetId: 'how-it-works', title: 'The Process', content: 'It is simple: Analyze, Draft, and Send. No lawyers required.' }
  ],
  analysis: [
    { targetId: 'disputes-section', title: 'Line Item Disputes', content: 'Did they charge you for painting or cleaning? List those deductions here to challenge them.' },
    { targetId: 'win-calculator', title: 'Real-Time Calculator', content: 'Watch your potential win amount increase as we apply bad-faith multipliers for your state.' }
  ],
  preview: [
    { targetId: 'letter-preview', title: 'AI-Generated Demand', content: 'Review your formal demand letter. It is legally structured and cites the exact statutes we found.' },
    { targetId: 'signature-area', title: 'Sign & Send', content: 'Add your digital signature here, then send via USPS Certified Mail with one click.' }
  ]
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'home' | 'analysis' | 'preview' | 'sent' | 'resources' | 'privacy'>('home');
  const [currentCase, setCurrentCase] = useState<CaseData | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tour State
  const [tourCompleted, setTourCompleted] = useState<Record<string, boolean>>({
    home: false,
    analysis: false,
    preview: false
  });

  useEffect(() => {
    // Try to load from local storage first for speed, then could fetch from API if we implemented a case list
    const saved = localStorage.getItem('activeCase');
    if (saved) {
      try {
        setCurrentCase(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved case", e);
      }
    }
    
    // Load tour state
    const savedTour = localStorage.getItem('tourCompleted');
    if (savedTour) {
      try {
        setTourCompleted(JSON.parse(savedTour));
      } catch (e) { console.error("Failed to parse tour state", e); }
    }
  }, []);

  // Persistence Logic
  useEffect(() => {
    if (currentCase) {
      // 1. Save Local
      localStorage.setItem('activeCase', JSON.stringify(currentCase));
      
      // 2. Save to Backend (Debounced)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch('/api/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentCase)
          });
          logger.debug("Case synced to backend");
        } catch (err) {
          logger.error("Failed to sync case to backend", err);
        }
      }, 1000);
    }
  }, [currentCase]);

  const handleTourComplete = (stepKey: string) => {
    const updated = { ...tourCompleted, [stepKey]: true };
    setTourCompleted(updated);
    localStorage.setItem('tourCompleted', JSON.stringify(updated));
  };

  const calculatePotentialWin = (deposit: number, stateCode: string, moveOutDate: string, deductions: Deduction[]) => {
    const stateLaw = STATE_LAWS[stateCode];
    if (!stateLaw) return deposit;

    const today = new Date();
    const moveDate = new Date(moveOutDate);
    const diffTime = Math.abs(today.getTime() - moveDate.getTime());
    const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isLate = daysElapsed > stateLaw.deadlineDays;
    
    if (isLate) {
      return deposit * stateLaw.multiplier;
    } else {
      const disputedTotal = deductions
        .filter(d => d.isDisputed)
        .reduce((acc, d) => acc + d.amount, 0);
      
      const undisputedTotal = deductions
        .filter(d => !d.isDisputed)
        .reduce((acc, d) => acc + d.amount, 0);
      
      const potentialBase = deposit - undisputedTotal;
      return potentialBase * (stateLaw.multiplier > 1 ? stateLaw.multiplier : 1);
    }
  };

  const handleStartAnalysis = (stateCode: string, moveOutDate: string, deposit: number) => {
    const today = new Date();
    const moveDate = new Date(moveOutDate);
    const diffTime = Math.abs(today.getTime() - moveDate.getTime());
    const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const stateLaw = STATE_LAWS[stateCode];

    const newCase: CaseData = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
      state: stateCode,
      moveOutDate,
      depositAmount: deposit,
      deductions: [],
      evidence: [],
      status: 'analyzed',
      daysElapsed,
      isLate: daysElapsed > stateLaw.deadlineDays,
      potentialWin: (daysElapsed > stateLaw.deadlineDays) ? (deposit * stateLaw.multiplier) : deposit
    };

    setCurrentCase(newCase);
    setCurrentStep('analysis');
  };

  const handleUpdateCase = (updates: Partial<CaseData>) => {
    if (!currentCase) return;
    const updated = { ...currentCase, ...updates };
    
    updated.potentialWin = calculatePotentialWin(
      updated.depositAmount, 
      updated.state, 
      updated.moveOutDate, 
      updated.deductions
    );

    setCurrentCase(updated);
  };

  const handleFinishAnalysis = (tenantData: Partial<CaseData>) => {
    if (!currentCase) return;
    handleUpdateCase({
      ...tenantData,
      status: 'preview'
    });
    setCurrentStep('preview');
  };

  const handleSend = () => {
    if (!currentCase) return;
    handleUpdateCase({ status: 'sent' });
    setCurrentStep('sent');
  };

  const reset = () => {
    setCurrentCase(null);
    setCurrentStep('home');
    localStorage.removeItem('activeCase');
    // Optional: Reset tour state for debugging
    // setTourCompleted({ home: false, analysis: false, preview: false });
  };

  const openResources = () => setCurrentStep('resources');
  const openPrivacy = () => setCurrentStep('privacy');

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={reset}>
            <div className="bg-slate-900 text-white p-2.5 rounded-xl group-hover:bg-blue-600 transition-all duration-300 transform group-hover:rotate-12">
              <i className="fas fa-gavel text-lg"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-800 brand-font">The Deposit Retriever</span>
              <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Justice for Tenants</span>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <button 
              onClick={openResources}
              className={`text-sm font-bold transition-colors ${currentStep === 'resources' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Law Database
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <button onClick={reset} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
              Restart
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow relative">
        {currentStep === 'home' && <LandingPage onStart={handleStartAnalysis} />}
        {currentStep === 'resources' && <ResourcesPage onBack={() => setCurrentStep('home')} />}
        {currentStep === 'privacy' && <PrivacyPolicyPage onBack={() => setCurrentStep('home')} />}
        {currentStep === 'analysis' && currentCase && (
          <AnalysisPage 
            caseData={currentCase} 
            stateLaw={STATE_LAWS[currentCase.state]} 
            onUpdate={handleUpdateCase}
            onNext={handleFinishAnalysis}
            onBack={() => setCurrentStep('home')}
          />
        )}
        {currentStep === 'preview' && currentCase && (
          <PreviewPage 
            caseData={currentCase} 
            stateLaw={STATE_LAWS[currentCase.state]} 
            onGenerated={(text, sources) => handleUpdateCase({ letterText: text, groundingSources: sources })}
            onUpdate={handleUpdateCase}
            onSend={handleSend}
            onBack={() => setCurrentStep('analysis')}
          />
        )}
        {currentStep === 'sent' && currentCase && (
          <SuccessPage caseData={currentCase} onReset={reset} />
        )}

        {/* Tour Overlay */}
        {(currentStep === 'home' || currentStep === 'analysis' || currentStep === 'preview') && (
            <Tour 
                isOpen={!tourCompleted[currentStep]}
                steps={TOUR_STEPS[currentStep]} 
                onComplete={() => handleTourComplete(currentStep)}
            />
        )}
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <i className="fas fa-gavel text-slate-400"></i>
                <span className="font-bold text-slate-800 brand-font">The Deposit Retriever</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Empowering tenants through technology and real-time legal search. We believe security deposits belong to the people who paid them.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Resources</h4>
              <ul className="text-sm space-y-2 text-slate-600 font-medium">
                <li>
                  <button onClick={openResources} className="hover:text-blue-600 transition-colors text-left w-full">
                    State Law Database
                  </button>
                </li>
                <li>
                  <button onClick={openResources} className="hover:text-blue-600 transition-colors text-left w-full">
                    Small Claims Guide
                  </button>
                </li>
                <li>
                  <button onClick={openPrivacy} className="hover:text-blue-600 transition-colors text-left w-full">
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Contact</h4>
              <p className="text-sm text-slate-600">help@depositretriever.legal</p>
              <div className="flex gap-4 mt-4 text-slate-400">
                <i className="fab fa-twitter hover:text-slate-600 cursor-pointer"></i>
                <i className="fab fa-github hover:text-slate-600 cursor-pointer"></i>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              © 2024 The Deposit Retriever. Not a law firm. No attorney-client relationship is formed.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by Gemini AI + Google Search</span>
              <i className="fas fa-bolt text-amber-500"></i>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
