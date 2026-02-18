
import React, { useState } from 'react';
import { STATE_LAWS } from '../constants';

interface LandingPageProps {
  onStart: (state: string, date: string, deposit: number) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [state, setState] = useState('CA');
  const [date, setDate] = useState('');
  const [deposit, setDeposit] = useState<string>('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const moveOut = new Date(date);
    const today = new Date();
    
    if (moveOut > today) {
      setError("Move-out date cannot be in the future.");
      return;
    }

    const depositVal = parseFloat(deposit);
    if (isNaN(depositVal) || depositVal <= 0) {
      setError("Please enter a valid deposit amount.");
      return;
    }

    onStart(state, date, depositVal);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-blue-100">
              <i className="fas fa-certificate"></i> Verified State Laws
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-slate-900 mb-8 brand-font">
              Get your <span className="text-blue-600 italic">money</span> back from bad landlords.
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed font-medium">
              We analyze your state's security deposit statutes and use AI to generate powerful, attorney-grade demand letters that win cases.
            </p>
            
            <div id="features-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: 'fa-file-invoice-dollar', text: 'Auto-Penalty Logic' },
                { icon: 'fa-truck-fast', text: 'USPS Certified Mail' },
                { icon: 'fa-scale-balanced', text: 'All 50 States' },
                { icon: 'fa-robot', text: 'AI Legal Reasoning' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600">
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <span className="text-sm font-bold text-slate-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div id="landing-form" className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 relative">
            <div className="absolute -top-6 -right-6 bg-blue-600 text-white w-24 h-24 rounded-full flex flex-col items-center justify-center transform rotate-12 border-4 border-white shadow-xl">
              <span className="text-xs font-black uppercase tracking-widest">Starts at</span>
              <span className="text-2xl font-black">$29</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 brand-font">Start Recovery Analysis</h2>
              
              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-bold flex items-center gap-3">
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Property State</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-slate-700 transition-all appearance-none"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  >
                    {Object.values(STATE_LAWS).sort((a,b) => a.name.localeCompare(b.name)).map(sl => (
                      <option key={sl.code} value={sl.code}>{sl.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Move-out Date</label>
                    <input 
                      type="date" required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-slate-700 transition-all"
                      value={date} onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Original Deposit</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input 
                        type="number" required placeholder="1200"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-5 py-4 focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-slate-700 transition-all"
                        value={deposit} onChange={(e) => setDeposit(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
              >
                Start Legal Analysis <i className="fas fa-chevron-right text-xs"></i>
              </button>

              <div className="flex justify-center items-center gap-4 text-slate-400">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Joined by 12,000+ Tenants</span>
              </div>
            </form>
          </div>
        </div>

        {/* How it Works Section */}
        <div id="how-it-works" className="pt-24 border-t border-slate-200">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 brand-font mb-4">Three Steps to Recovery</h2>
            <p className="text-slate-500 font-medium">No lawyers needed. No expensive fees. Just justice.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                step: '01', 
                title: 'Data Analysis', 
                desc: 'We cross-reference your lease details against state-specific landlord-tenant statutes.',
                icon: 'fa-microchip'
              },
              { 
                step: '02', 
                title: 'AI Drafting', 
                desc: 'Our legal-tuned AI generates a high-pressure demand letter citing the exact codes violated.',
                icon: 'fa-feather-pointed'
              },
              { 
                step: '03', 
                title: 'Official Mailing', 
                desc: 'We print and send your letter via USPS Certified Mail with a formal tracking receipt.',
                icon: 'fa-envelope-open-text'
              }
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -top-6 -left-4 text-7xl font-black text-slate-100 group-hover:text-blue-50 transition-colors">
                  {item.step}
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
