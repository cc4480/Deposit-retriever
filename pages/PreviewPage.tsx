
import React, { useState, useEffect, useRef } from 'react';
import { CaseData, StateLaw, GroundingSource } from '../types';
import { generateDemandLetter } from '../services/gemini';
import { sendCertifiedMail } from '../services/lob';
import { generatePDF } from '../utils/pdfGenerator';
import { logger } from '../utils/logger';

interface PreviewPageProps {
  caseData: CaseData;
  stateLaw: StateLaw;
  onGenerated: (text: string, sources?: GroundingSource[]) => void;
  onSend: () => void;
  onBack: () => void;
  onUpdate?: (updates: Partial<CaseData>) => void;
}

const PreviewPage: React.FC<PreviewPageProps> = ({ caseData, stateLaw, onGenerated, onSend, onBack, onUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [letterText, setLetterText] = useState(caseData.letterText || '');
  const [sources, setSources] = useState<GroundingSource[]>(caseData.groundingSources || []);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!caseData.letterText) {
      handleGenerate();
    } else {
      setLoading(false);
      // Wait for mount to draw signature
      setTimeout(() => {
        if (caseData.signatureData && canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = caseData.signatureData;
          }
        }
      }, 100);
    }
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateDemandLetter(caseData, stateLaw);
      setLetterText(result.text);
      setSources(result.sources);
      onGenerated(result.text, result.sources);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMailing = async () => {
    // Redundant check for safety
    if (!caseData.signatureData) {
      setError("Please sign the document before sending.");
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      await sendCertifiedMail(caseData.landlordName!, caseData.landlordAddress!, letterText);
      onSend();
    } catch (err: any) {
      setError(err.message);
      setIsSending(false);
    }
  };

  const handleSendClick = () => {
    if (!caseData.signatureData) {
      setError("Signature required. Please sign the document below before sending.");
      document.getElementById('signature-area')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setShowDisclaimer(true);
  };

  // Signature Logic
  const getPointerPos = (e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = ('touches' in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent scrolling on mobile when touching the canvas
    if (e.cancelable && e.type === 'touchstart') e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    const { x, y } = getPointerPos(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round'; // Smoother turns
    ctx.strokeStyle = '#1e293b'; // Slate-800
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent scrolling
    if (e.cancelable && e.type === 'touchmove') e.preventDefault();

    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getPointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas && onUpdate) {
        onUpdate({ signatureData: canvas.toDataURL('image/png') });
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onUpdate) onUpdate({ signatureData: undefined });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear existing
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate aspect ratio to fit properly
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.9; // 90% fit
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        
        ctx.drawImage(img, x, y, w, h);
        
        if (onUpdate) {
            onUpdate({ signatureData: canvas.toDataURL('image/png') });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-32 text-center">
        <div className="relative inline-block mb-8">
           <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <i className="fas fa-gavel text-blue-600 text-xl"></i>
           </div>
        </div>
        <h2 className="text-3xl font-bold brand-font mb-4">Searching Case Law...</h2>
        <p className="text-slate-500 max-w-md mx-auto font-medium">Gemini is verifying 2024 statutes for {stateLaw.name} and drafting your authoritative demand.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Document Editor */}
        <div className="flex-grow space-y-8">
          <div className="flex justify-between items-center">
            <button onClick={onBack} className="text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-arrow-left"></i> Edit Analysis
            </button>
            <div className="flex gap-4">
               <button onClick={handleGenerate} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2">
                 <i className="fas fa-rotate"></i> Regenerate Draft
               </button>
            </div>
          </div>

          <div id="letter-preview" className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden ring-1 ring-black/5">
             <div className="bg-slate-50 px-10 py-4 border-b border-slate-200 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Formal Legal Demand - Revision 1</span>
                <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold">STATUTES VERIFIED</span>
             </div>
             
             <textarea 
               className="w-full h-[700px] p-16 md:p-24 font-serif text-slate-800 bg-white leading-relaxed text-lg border-none focus:outline-none resize-none selection:bg-blue-100"
               value={letterText}
               onChange={(e) => setLetterText(e.target.value)}
               spellCheck={false}
             />

             {/* Footer Signature */}
             <div id="signature-area" className="p-16 bg-slate-50/50 border-t border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-end gap-12">
                   <div className="w-full max-w-[400px]">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Tenant Signature</h4>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1"
                            >
                                <i className="fas fa-camera"></i> Upload Photo
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                      </div>
                      <div className={`relative bg-white border-2 border-dashed rounded-3xl group transition-all overflow-hidden ${!caseData.signatureData && error ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-blue-300'}`}>
                         <canvas 
                           ref={canvasRef} width={400} height={120}
                           onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing}
                           onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                           className="w-full h-[120px] cursor-crosshair touch-none"
                         />
                         <button onClick={clearSignature} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 p-2 bg-white/80 rounded-full backdrop-blur-sm transition-colors">
                           <i className="fas fa-eraser"></i>
                         </button>
                         {!caseData.signatureData && !isDrawing && (
                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs font-bold uppercase tracking-widest">
                             {error ? <span className="text-red-400"><i className="fas fa-exclamation-circle"></i> Sign Here</span> : 'Sign Here or Upload'}
                           </div>
                         )}
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Final Penalty Calculation</p>
                      <div className="text-4xl font-black text-slate-900 brand-font">${caseData.potentialWin.toFixed(2)}</div>
                   </div>
                </div>
             </div>
          </div>

          {/* Legal Sources Grounding */}
          {sources.length > 0 && (
            <div className="bg-blue-50/50 rounded-[2rem] p-10 border border-blue-100">
              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <i className="fas fa-magnifying-glass"></i> Verified Legal Grounding
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources.map((s, idx) => (
                  <a key={idx} href={s.uri} target="_blank" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-blue-100 hover:border-blue-400 hover:shadow-lg transition-all group">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <i className="fas fa-scroll text-sm"></i>
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 truncate max-w-[200px]">{s.title}</div>
                      <div className="text-[10px] text-blue-500 font-bold uppercase">View Official Statute</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Sidebar */}
        <div className="w-full lg:w-96 shrink-0 space-y-6">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 sticky top-24">
              <h3 className="text-xl font-bold mb-6 brand-font">Finalize & Send</h3>
              
              <div className="space-y-4">
                 <button 
                   onClick={handleSendClick}
                   disabled={isSending}
                   className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                 >
                   {isSending ? <i className="fas fa-circle-notch animate-spin"></i> : <><i className="fas fa-paper-plane"></i> Send Certified Mail</>}
                 </button>
                 <button 
                   onClick={() => generatePDF(letterText, `demand_${caseData.id}.pdf`, caseData.signatureData)}
                   className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                 >
                   <i className="fas fa-download"></i> Save as PDF
                 </button>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-red-100">
                  <i className="fas fa-exclamation-triangle mr-1"></i> {error}
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-slate-100">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mailing Cost Breakdown</h4>
                 <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                       <span>USPS Certified Postage</span>
                       <span>$8.10</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                       <span>Return Receipt (Green Card)</span>
                       <span>$3.25</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                       <span>Service Fee & Verification</span>
                       <span>$17.65</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-2">
                       <span>Total (Includes tracking)</span>
                       <span>$29.00</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
           <div className="bg-white rounded-[3rem] max-w-lg w-full p-12 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 mx-auto">
                 <i className="fas fa-shield-halved text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-center brand-font mb-4">Legal Attestation</h3>
              <p className="text-slate-500 text-center text-sm font-medium leading-relaxed mb-8">
                 By proceeding, you verify that the information provided is accurate to the best of your knowledge. This letter will be formally mailed via USPS Certified Mail. You are authorizing the charge of $29.00 for this legal tech service.
              </p>
              <div className="flex flex-col gap-3">
                 <button onClick={handleMailing} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">
                    I Attest & Send
                 </button>
                 <button onClick={() => setShowDisclaimer(false)} className="w-full text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest py-2 transition-colors">
                    Go Back
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PreviewPage;
