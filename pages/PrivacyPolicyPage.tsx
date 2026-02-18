
import React from 'react';

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-xs uppercase tracking-widest group mb-8"
      >
        <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Back to Home
      </button>

      <div className="bg-white rounded-[2.5rem] p-12 shadow-xl border border-slate-100">
        <h1 className="text-4xl font-bold text-slate-900 brand-font mb-8 border-b border-slate-100 pb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed font-medium">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>
            <p>
              To provide our automated legal reasoning and mailing services, we collect information regarding your tenancy, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Names and contact information for both Tenants and Landlords.</li>
              <li>Property addresses and dates of residency.</li>
              <li>Financial details related to security deposits and disputed charges.</li>
              <li>Evidence descriptions and user-provided narratives of the dispute.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. AI Processing & Data Usage</h2>
            <p>
              Our application utilizes the Google Gemini API to analyze case facts and generate demand letters. While we provide data to the model for drafting:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Data is processed in real-time to generate your documents.</li>
              <li>We do not sell your case information to third-party data brokers.</li>
              <li>Case data stored in local browser storage is for your convenience and can be cleared at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Legal Disclaimer</h2>
            <p className="bg-slate-50 p-6 rounded-2xl border-l-4 border-blue-500 text-slate-800 italic">
              "The Deposit Retriever" is a document automation platform, not a law firm. Use of this application does not create an attorney-client relationship. The AI-generated output should be reviewed by a qualified legal professional if you have specific legal questions. We provide informational tools to help you advocate for your rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Third-Party Services</h2>
            <p>
              If you choose our premium mailing service, your data is shared with Lob.com solely for the purpose of printing and mailing your certified letter via the USPS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">5. Your Rights</h2>
            <p>
              You have the right to access, modify, or delete your data at any time. Since most data is stored locally in your browser, clearing your browser cache will remove your active cases from our local view.
            </p>
          </section>

          <div className="pt-12 border-t border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-widest">
            Last Updated: May 2024
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
