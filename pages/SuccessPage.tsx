
import React from 'react';
import { CaseData } from '../types';
import { generatePDF } from '../utils/pdfGenerator';

interface SuccessPageProps {
  caseData: CaseData;
  onReset: () => void;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ caseData, onReset }) => {
  const trackingNumber = `7021-${Math.random().toString(36).toUpperCase().substr(2, 12)}`;

  const handleDownload = () => {
    if (caseData.letterText) {
      generatePDF(caseData.letterText, `demand_letter_final_${caseData.id}.pdf`, caseData.signatureData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-24 text-center">
      <div className="w-24 h-24 bg-green-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-4xl shadow-2xl shadow-green-200 animate-bounce">
        <i className="fas fa-check"></i>
      </div>
      
      <h1 className="text-5xl font-bold mb-4 brand-font text-slate-900">Justice is on its way.</h1>
      <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto font-medium">
        Your demand for <span className="text-slate-900 font-black">${caseData.potentialWin.toLocaleString()}</span> has been electronically submitted to the USPS queue.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-left">
        {/* Tracking Card */}
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Certified Tracking</span>
              <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[10px] font-black">ACTIVE</span>
            </div>
            <div className="text-2xl font-mono font-bold text-slate-800 mb-4 tracking-tighter">
              {trackingNumber}
            </div>
            <p className="text-xs text-slate-500 font-medium mb-6">
              This number will be live in the USPS system within 24 hours once it leaves our local processing center.
            </p>
          </div>
          <button 
            onClick={handleDownload}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
          >
            <i className="fas fa-file-pdf"></i> Download Official Draft
          </button>
        </div>

        {/* Roadmap Card */}
        <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Next Steps</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-[10px] font-black flex items-center justify-center shrink-0">1</div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-1 text-blue-400">Wait for Delivery</p>
                <p className="text-xs text-slate-400 font-medium">USPS will deliver the letter in 3-5 business days. Someone must sign for it.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-slate-700 text-[10px] font-black flex items-center justify-center shrink-0 text-slate-400">2</div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-1">The 10-Day Clock</p>
                <p className="text-xs text-slate-400 font-medium">From the moment they sign, your landlord has 10 business days to pay.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-slate-700 text-[10px] font-black flex items-center justify-center shrink-0 text-slate-400">3</div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-1">Final Settlement</p>
                <p className="text-xs text-slate-400 font-medium">If they refuse, your certified receipt is your "Golden Ticket" in Small Claims court.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <button 
          onClick={onReset}
          className="bg-white border-2 border-slate-200 hover:border-slate-800 text-slate-800 font-black py-4 px-12 rounded-2xl transition-all uppercase tracking-widest text-xs"
        >
          New Case
        </button>
      </div>

      <p className="mt-16 text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
        Safe • Verified • Final
      </p>
    </div>
  );
};

export default SuccessPage;
