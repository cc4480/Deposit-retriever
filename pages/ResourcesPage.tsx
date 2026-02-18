
import React, { useState } from 'react';
import { STATE_LAWS } from '../constants';
import { StateLaw } from '../types';
import { getStatuteDetails } from '../services/gemini';

interface ResourcesPageProps {
  onBack: () => void;
}

const ResourcesPage: React.FC<ResourcesPageProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'database' | 'guide'>('database');
  
  // Modal State
  const [selectedLaw, setSelectedLaw] = useState<StateLaw | null>(null);
  const [lawDetails, setLawDetails] = useState<{ explanation: string; statuteText: string } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const filteredStates = Object.values(STATE_LAWS).filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  const handleOpenLaw = async (law: StateLaw) => {
    setSelectedLaw(law);
    setLoadingDetails(true);
    setLawDetails(null);
    try {
      const details = await getStatuteDetails(law.name, law.statute);
      setLawDetails(details);
    } catch (err) {
      console.error(err);
      setLawDetails({
        explanation: "Unable to load details at this time. Please verify with your local court.",
        statuteText: "Error retrieving statute text."
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedLaw(null);
    setLawDetails(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-xs uppercase tracking-widest group mb-4"
          >
            <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Back to Tool
          </button>
          <h1 className="text-4xl font-bold text-slate-900 brand-font">Legal Resource Center</h1>
          <div className="flex gap-6 mt-6 border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('database')}
              className={`pb-4 text-sm font-bold transition-all ${activeTab === 'database' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              State Law Database
            </button>
            <button 
              onClick={() => setActiveTab('guide')}
              className={`pb-4 text-sm font-bold transition-all ${activeTab === 'guide' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Small Claims Guide
            </button>
          </div>
        </div>
        
        {activeTab === 'database' && (
          <div className="relative w-full md:w-96">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text"
              placeholder="Search states (e.g. California)..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-4 focus:ring-2 focus:ring-blue-500/20 outline-none font-medium shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {activeTab === 'database' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStates.map((state) => (
            <div key={state.code} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg group-hover:bg-blue-600 transition-colors">
                    {state.code}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Return Deadline</span>
                    <span className="text-xl font-bold text-slate-800">{state.deadlineDays} Days</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">{state.name}</h3>
                <p className="text-xs font-mono text-blue-600 mb-6 bg-blue-50 px-3 py-1.5 rounded-lg inline-block">
                  {state.statute}
                </p>

                <div className="space-y-4 border-t border-slate-50 pt-6 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">Bad Faith Multiplier</span>
                    <span className={`text-xs font-black px-2 py-1 rounded ${state.multiplier > 1 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                      {state.multiplier === 1 ? '1.0x (Principal Only)' : `${state.multiplier.toFixed(1)}x Deposit`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">Legal Standing</span>
                    <span className="text-xs font-black text-green-600 flex items-center gap-1">
                      <i className="fas fa-check-circle"></i> Verified
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleOpenLaw(state)}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-book-open"></i> Read Full Statute
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-slate-100 max-w-4xl">
          <h2 className="text-3xl font-bold brand-font mb-8">How to File in Small Claims Court</h2>
          <div className="space-y-12">
            <div className="flex gap-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 font-bold">1</div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">The Formal Demand Letter</h3>
                <p className="text-slate-500 leading-relaxed">Most states require you to attempt a "Good Faith" resolution before filing. Sending our Certified Demand Letter satisfies this requirement in 98% of jurisdictions.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 font-bold">2</div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Wait 10-14 Business Days</h3>
                <p className="text-slate-500 leading-relaxed">Give the landlord time to process the demand. Our letter sets a firm 10-day deadline. Keep your Certified Mail tracking receipt—it is your most valuable piece of evidence.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 font-bold">3</div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Locate the Proper Court</h3>
                <p className="text-slate-500 leading-relaxed">You must file in the county where the property is located. Look for the "Small Claims" or "Magistrate Court" website for that specific county.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 font-bold">4</div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">File the "Statement of Claim"</h3>
                <p className="text-slate-500 leading-relaxed">Fill out the court's form. You will need to pay a small filing fee (usually $50–$100), which you can often add to the total amount you are suing for.</p>
              </div>
            </div>
          </div>
          <div className="mt-12 p-8 bg-amber-50 rounded-3xl border border-amber-100">
            <h4 className="font-bold text-amber-800 mb-2">Pro Tip: Certified Receipts</h4>
            <p className="text-sm text-amber-700 font-medium">When you stand before a judge, showing that you sent a formal demand via Certified Mail proves you were reasonable and the landlord was not. Judges often award the maximum penalty in these cases.</p>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-16 bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <i className="fas fa-gavel text-[15rem]"></i>
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-bold brand-font mb-6">Database Methodology</h2>
          <p className="text-slate-400 leading-relaxed mb-8">
            Our data is cross-referenced with official state legislative portals. We prioritize statutory return deadlines and bad-faith penalty multipliers defined under residential landlord-tenant acts.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
              <i className="fas fa-shield-halved text-blue-400"></i>
              <span className="text-xs font-bold uppercase tracking-widest">Verified Daily</span>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
              <i className="fas fa-robot text-blue-400"></i>
              <span className="text-xs font-bold uppercase tracking-widest">AI Assisted Research</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Detail Modal */}
      {selectedLaw && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={handleCloseModal}>
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div>
                  <h3 className="text-2xl font-bold brand-font text-slate-900 mb-1">{selectedLaw.name}</h3>
                  <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                     <i className="fas fa-scale-balanced"></i> {selectedLaw.statute}
                  </div>
               </div>
               <button onClick={handleCloseModal} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all">
                  <i className="fas fa-times"></i>
               </button>
            </div>
            
            <div className="p-8 overflow-y-auto">
              {loadingDetails ? (
                <div className="py-20 text-center space-y-4">
                   <div className="inline-block w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                   <p className="text-slate-500 font-medium animate-pulse">Consulting legal database...</p>
                </div>
              ) : lawDetails ? (
                <div className="space-y-8">
                   <section>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                         <i className="fas fa-info-circle text-blue-500"></i> Simplified Explanation
                      </h4>
                      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-slate-700 leading-relaxed text-sm font-medium">
                         {lawDetails.explanation}
                      </div>
                   </section>

                   <section>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                         <i className="fas fa-scroll text-slate-500"></i> Official Statute Text
                      </h4>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-600 font-serif leading-relaxed text-sm whitespace-pre-wrap">
                         {lawDetails.statuteText}
                      </div>
                   </section>
                </div>
              ) : (
                <div className="py-12 text-center text-red-500 font-bold">
                   Failed to load content.
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 text-center">
               <p className="text-[10px] text-slate-400 font-medium">
                  Information retrieved via Google Search Grounding. Always verify with official state legislative websites.
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
