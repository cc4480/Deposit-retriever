
import React, { useState, useMemo, useRef } from 'react';
import { CaseData, StateLaw, Deduction, Evidence } from '../types';

interface AnalysisPageProps {
  caseData: CaseData;
  stateLaw: StateLaw;
  onUpdate: (updates: Partial<CaseData>) => void;
  onNext: (data: Partial<CaseData>) => void;
  onBack: () => void;
}

type AnalysisStep = 'disputes' | 'parties' | 'narrative';

const AnalysisPage: React.FC<AnalysisPageProps> = ({ caseData, stateLaw, onUpdate, onNext, onBack }) => {
  const [activeTab, setActiveTab] = useState<AnalysisStep>('disputes');

  // Input states
  const [lName, setLName] = useState(caseData.landlordName || '');
  const [lAddress, setLAddress] = useState(caseData.landlordAddress || '');
  const [tName, setTName] = useState(caseData.tenantName || '');
  const [tAddress, setTAddress] = useState(caseData.tenantAddress || '');
  const [tEmail, setTEmail] = useState(caseData.tenantEmail || '');
  const [customNotes, setCustomNotes] = useState(caseData.customNotes || '');

  // Itemized Deductions
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Evidence
  const [evDesc, setEvDesc] = useState('');
  const [evType, setEvType] = useState<Evidence['type']>('photo');
  const [evFile, setEvFile] = useState<{name: string, data: string} | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addDeduction = () => {
    if (!newDesc || !newAmount) return;
    const item: Deduction = {
      id: Math.random().toString(36).substr(2, 9),
      description: newDesc,
      amount: parseFloat(newAmount),
      isDisputed: true,
      notes: newNotes.trim() || undefined
    };
    onUpdate({ deductions: [...caseData.deductions, item] });
    setNewDesc('');
    setNewAmount('');
    setNewNotes('');
  };

  const removeDeduction = (id: string) => {
    onUpdate({ deductions: caseData.deductions.filter(d => d.id !== id) });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    
    if (!file) return;

    // Validate Size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File is too large. Max size is 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate Type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError("Invalid file type. Please upload JPG, PNG, or PDF.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEvFile({
          name: file.name,
          data: event.target.result as string
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setEvFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addEvidence = () => {
    if (!evDesc) return;
    const item: Evidence = {
      id: Math.random().toString(36).substr(2, 9),
      type: evType,
      description: evDesc,
      fileData: evFile?.data,
      fileName: evFile?.name
    };
    onUpdate({ evidence: [...caseData.evidence, item] });
    setEvDesc('');
    clearFile();
  };

  const removeEvidence = (id: string) => {
    onUpdate({ evidence: caseData.evidence.filter(e => e.id !== id) });
  };

  const isPartiesValid = useMemo(() => {
    return lName && lAddress && tName && tAddress && tEmail.includes('@');
  }, [lName, lAddress, tName, tAddress, tEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPartiesValid) {
      setActiveTab('parties');
      return;
    }
    onNext({
      landlordName: lName,
      landlordAddress: lAddress,
      tenantName: tName,
      tenantAddress: tAddress,
      tenantEmail: tEmail,
      customNotes: customNotes
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header & Progress */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest group mb-2">
            <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Change Basic Info
          </button>
          <h1 className="text-3xl font-bold brand-font text-slate-900">Case Deep-Dive</h1>
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
          {(['disputes', 'narrative', 'parties'] as AnalysisStep[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          
          {activeTab === 'disputes' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section id="disputes-section" className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-calculator"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Line Item Disputes</h2>
                    <p className="text-sm text-slate-500 font-medium">Add deductions from your landlord's accounting to dispute them.</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {caseData.deductions.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                      <p className="text-slate-400 font-medium">No deductions added yet. If they haven't sent a list, leave this empty.</p>
                    </div>
                  ) : (
                    caseData.deductions.map(d => (
                      <div key={d.id} className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <button 
                          onClick={() => onUpdate({ deductions: caseData.deductions.map(item => item.id === d.id ? {...item, isDisputed: !item.isDisputed} : item)})}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${d.isDisputed ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-300'}`}
                        >
                          <i className={`fas ${d.isDisputed ? 'fa-check' : 'fa-minus'}`}></i>
                        </button>
                        <div className="flex-grow">
                          <h4 className={`font-bold ${d.isDisputed ? 'text-slate-900' : 'text-slate-400'}`}>{d.description}</h4>
                          <span className="text-sm font-black text-blue-600">${d.amount.toFixed(2)}</span>
                        </div>
                        <button onClick={() => removeDeduction(d.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                          <i className="fas fa-trash-can text-sm"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      placeholder="e.g., 'Unreasonable Cleaning Fee'"
                      className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/10 outline-none"
                      value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                    />
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input 
                        type="number" placeholder="0.00"
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/10 outline-none"
                        value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <input 
                      placeholder="Why is this unfair? (e.g. 'Left spotless, see photos')"
                      className="flex-grow bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/10 outline-none"
                      value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
                    />
                    <button 
                      onClick={addDeduction}
                      disabled={!newDesc || !newAmount}
                      className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </section>

              <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-camera"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Supporting Evidence</h2>
                    <p className="text-sm text-slate-500 font-medium">Log your proof here. Attach photos or documents to strengthen your case.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-8">
                  {caseData.evidence.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No evidence logged</p>
                    </div>
                  ) : (
                    caseData.evidence.map(e => (
                      <div key={e.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 text-sm border border-slate-100 overflow-hidden">
                          {e.fileData && e.fileData.startsWith('data:image') ? (
                              <img src={e.fileData} alt="thumb" className="w-full h-full object-cover" />
                          ) : (
                             <i className={`fas ${e.type === 'photo' ? 'fa-image' : e.type === 'receipt' ? 'fa-file-invoice-dollar' : 'fa-file'}`}></i>
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="text-sm font-bold text-slate-700 truncate">{e.description}</div>
                          {e.fileName && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-blue-600 font-medium">
                              <i className="fas fa-paperclip"></i> {e.fileName}
                            </div>
                          )}
                        </div>
                        <button onClick={() => removeEvidence(e.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <select 
                      value={evType}
                      onChange={(e) => setEvType(e.target.value as Evidence['type'])}
                      className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/10 md:w-1/3"
                    >
                      <option value="photo">Photo Evidence</option>
                      <option value="receipt">Repair Receipt</option>
                      <option value="video">Video Walkthrough</option>
                      <option value="witness">Witness Statement</option>
                      <option value="other">Other Document</option>
                    </select>
                    <input 
                      placeholder="Description (e.g. 'Clean floor photo')"
                      className="flex-grow bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/10"
                      value={evDesc} onChange={(e) => setEvDesc(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/png,image/jpeg,image/webp,application/pdf"
                        />
                        
                        {!evFile ? (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border border-slate-200 bg-white text-slate-500 hover:border-slate-300 transition-all flex items-center gap-2 whitespace-nowrap"
                            >
                                <i className="fas fa-paperclip"></i> Attach File
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-2 pr-4 transition-all">
                                <div className="w-10 h-10 rounded-lg bg-white border border-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                                    {evFile.data.startsWith('data:image') ? (
                                        <img src={evFile.data} alt="preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <i className="fas fa-file-pdf text-red-500 text-lg"></i>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0 max-w-[150px]">
                                    <span className="text-xs font-bold text-slate-800 truncate" title={evFile.name}>{evFile.name}</span>
                                    <span className="text-[9px] text-blue-500 font-bold uppercase">Ready to Upload</span>
                                </div>
                                <button 
                                    onClick={clearFile}
                                    className="ml-2 w-6 h-6 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center"
                                >
                                    <i className="fas fa-times text-xs"></i>
                                </button>
                            </div>
                        )}
                        </div>
                        
                        <button 
                        onClick={addEvidence}
                        disabled={!evDesc}
                        className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg disabled:opacity-50 disabled:shadow-none whitespace-nowrap"
                        >
                        Log Proof
                        </button>
                    </div>
                    {uploadError && (
                        <div className="text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 px-2">
                            <i className="fas fa-circle-exclamation"></i> {uploadError}
                        </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'narrative' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-pen-nib"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Your Story</h2>
                    <p className="text-sm text-slate-500 font-medium">Explain any verbal agreements or special circumstances.</p>
                  </div>
                </div>
                <textarea 
                  className="w-full h-64 bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/10 outline-none resize-none transition-all"
                  placeholder="e.g., 'The property manager promised me in a text on 10/12 that the carpets would not be charged because of the existing stains recorded in the move-in inspection...'"
                  value={customNotes} onChange={(e) => setCustomNotes(e.target.value)}
                />
              </section>
            </div>
          )}

          {activeTab === 'parties' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-users"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">The Parties Involved</h2>
                    <p className="text-sm text-slate-500 font-medium">Accurate addresses are critical for Certified Mail deliverability.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Recipient (Landlord)</h4>
                    <div className="space-y-4">
                      <input 
                        placeholder="Company or Manager Name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none"
                        value={lName} onChange={(e) => setLName(e.target.value)}
                      />
                      <input 
                        placeholder="Street, City, State ZIP"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none"
                        value={lAddress} onChange={(e) => setLAddress(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Sender (Tenant)</h4>
                    <div className="space-y-4">
                      <input 
                        placeholder="Your Legal Full Name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none"
                        value={tName} onChange={(e) => setTName(e.target.value)}
                      />
                      <input 
                        placeholder="Your New Mailing Address"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none"
                        value={tAddress} onChange={(e) => setTAddress(e.target.value)}
                      />
                      <input 
                        type="email" placeholder="Your Email for Tracking"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none"
                        value={tEmail} onChange={(e) => setTEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          <div className="flex justify-between gap-4 pt-4">
            <button 
              onClick={() => {
                const tabs: AnalysisStep[] = ['disputes', 'narrative', 'parties'];
                const prevIndex = tabs.indexOf(activeTab) - 1;
                if (prevIndex >= 0) setActiveTab(tabs[prevIndex]);
              }}
              className={`px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'disputes' ? 'opacity-0 pointer-events-none' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Previous Step
            </button>
            
            {activeTab === 'parties' ? (
              <button 
                onClick={handleSubmit}
                disabled={!isPartiesValid}
                className="flex-grow md:flex-none bg-blue-600 text-white px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                Generate Final Demand <i className="fas fa-arrow-right"></i>
              </button>
            ) : (
              <button 
                onClick={() => {
                  const tabs: AnalysisStep[] = ['disputes', 'narrative', 'parties'];
                  const nextIndex = tabs.indexOf(activeTab) + 1;
                  setActiveTab(tabs[nextIndex]);
                }}
                className="flex-grow md:flex-none bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
              >
                Next Step <i className="fas fa-chevron-right text-xs"></i>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Calculator */}
        <div id="win-calculator" className="lg:col-span-4 sticky top-24">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl"></div>
            
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6">Live Potential Win</h3>
            <div className="text-6xl font-black brand-font mb-4 text-blue-400">
              ${caseData.potentialWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            
            <div className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Original Deposit</span>
                <span>${caseData.depositAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Late Penalty ({stateLaw.multiplier}x)</span>
                <span className={caseData.isLate ? 'text-green-400' : 'text-slate-600'}>
                  {caseData.isLate ? `+$${((caseData.multiplier || stateLaw.multiplier - 1) * caseData.depositAmount).toFixed(2)}` : '$0.00'}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Disputed Items</span>
                <span className="text-blue-400">+${caseData.deductions.filter(d => d.isDisputed).reduce((a,b) => a+b.amount, 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] leading-relaxed text-slate-400 font-medium">
                <i className="fas fa-info-circle mr-1 text-blue-400"></i>
                Calculated based on <strong>{stateLaw.name} {stateLaw.statute}</strong>. Penalties applied for being {caseData.daysElapsed} days past move-out.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
