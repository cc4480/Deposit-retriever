
export interface StateLaw {
  code: string;
  name: string;
  deadlineDays: number;
  multiplier: number;
  statute: string;
}

export interface Deduction {
  id: string;
  description: string;
  amount: number;
  isDisputed: boolean;
  notes?: string;
}

export interface Evidence {
  id: string;
  type: 'photo' | 'receipt' | 'video' | 'witness' | 'other';
  description: string;
  fileData?: string;
  fileName?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface CaseData {
  id: string;
  state: string;
  moveOutDate: string;
  depositAmount: number;
  deductions: Deduction[];
  evidence: Evidence[];
  customNotes?: string;
  landlordName?: string;
  landlordAddress?: string;
  tenantName?: string;
  tenantAddress?: string;
  tenantEmail?: string;
  letterText?: string;
  groundingSources?: GroundingSource[];
  signatureData?: string;
  status: 'initial' | 'analyzed' | 'preview' | 'sent';
  daysElapsed: number;
  isLate: boolean;
  potentialWin: number;
}

export interface AppState {
  currentCase: CaseData | null;
  history: CaseData[];
}