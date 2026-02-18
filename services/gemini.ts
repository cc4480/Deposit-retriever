
import { GoogleGenAI, Type } from "@google/genai";
import { CaseData, StateLaw, GroundingSource } from "../types";
import { logger } from "../utils/logger";

const MAX_RETRIES = 2;
const INITIAL_BACKOFF = 2000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const handleGeminiError = (error: any): string => {
  const message = error?.message || String(error);
  
  // Pass through friendly errors we threw ourselves
  if (message.includes("safety filters") || message.includes("recitation") || message.includes("empty response")) {
      return message;
  }

  // Handle standard API errors
  if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
      return "The AI service is experiencing high traffic. Please wait a moment and try again.";
  }
  if (message.includes("401") || message.includes("403") || message.includes("PERMISSION_DENIED")) {
      return "Authentication error. Service is temporarily unavailable.";
  }
  if (message.includes("safety") || message.includes("blocked") || message.includes("finishReason")) {
      return "The description provided was flagged by safety filters. Please use professional, factual language.";
  }
  if (message.includes("network") || message.includes("fetch") || message.includes("Failed to fetch")) {
      return "Network connection error. Please check your internet connection and try again.";
  }
  
  return "An unexpected error occurred while drafting your legal letter. Please try again.";
};

export const generateDemandLetter = async (
  caseData: CaseData, 
  stateLaw: StateLaw, 
  retryCount = 0
): Promise<{ text: string, sources: GroundingSource[] }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing from the environment.");

  const ai = new GoogleGenAI({ apiKey });
  
  const daysLate = Math.max(0, (caseData.daysElapsed || 0) - stateLaw.deadlineDays);
  const disputedItems = caseData.deductions.filter(d => d.isDisputed);
  const evidenceList = caseData.evidence || [];
  
  const prompt = `
    Role: Senior Real Estate Litigator & Tenant Rights Advocate.
    Task: Draft a formal, authoritative Demand Letter for the return of a security deposit.
    
    SEARCH INSTRUCTIONS: 
    1. Verify the current security deposit return deadline for ${stateLaw.name} (currently listed as ${stateLaw.deadlineDays} days).
    2. Verify the exact statutory penalty for bad faith withholding in ${stateLaw.name} (e.g., treble damages, double damages).
    3. Find the official name and citation for the security deposit statute (e.g., "${stateLaw.statute}").
    4. Check if missing the deadline results in an automatic waiver of the landlord's right to deductions.

    CASE FACTS:
    - State: ${stateLaw.name}
    - Landlord: ${caseData.landlordName} (${caseData.landlordAddress})
    - Tenant: ${caseData.tenantName} (${caseData.tenantAddress})
    - Move-out Date: ${caseData.moveOutDate}
    - Deposit Amount: $${caseData.depositAmount}
    - Status: ${caseData.isLate ? `CRITICAL VIOLATION: Landlord is ${daysLate} days past the legal deadline.` : 'Disputing itemized deductions.'}
    
    DISPUTED CHARGES:
    ${disputedItems.length > 0 ? disputedItems.map(d => `- $${d.amount.toFixed(2)} for "${d.description}". Basis: ${d.notes || 'Normal wear and tear/Unreasonable charge'}`).join('\n') : 'No deductions provided yet, demanding full return based on statutory failure.'}

    EVIDENCE ON RECORD:
    ${evidenceList.length > 0 ? evidenceList.map(e => `- ${e.type.toUpperCase()}: ${e.description}`).join('\n') : 'Move-out photos and clean-up logs recorded.'}

    ADDITIONAL CONTEXT:
    ${caseData.customNotes || 'None.'}

    LETTER REQUIREMENTS:
    1. Use a standard formal legal letter format.
    2. Header: SENT VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED.
    3. Explicitly cite the ${stateLaw.name} statutes found in your search.
    4. Calculate and demand the TOTAL amount including penalties: $${caseData.potentialWin}.
    5. Set a strict 10-business-day deadline for the check to be received at the tenant's address.
    6. Include a clear statement of intent to file in Small Claims Court if the deadline is missed.
    7. Professional, firm, and non-confrontational but assertive tone.
    8. Use placeholders like [Signature] for the final signing area.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        temperature: 0.2, 
        tools: [{ googleSearch: {} }]
      }
    });

    // Explicitly check for content generation success
    if (!response.text) {
        const candidate = response.candidates?.[0];
        
        if (candidate?.finishReason) {
             if (candidate.finishReason === 'SAFETY') {
                throw new Error("The description provided was flagged by safety filters. Please use professional, factual language.");
            }
            if (candidate.finishReason === 'RECITATION') {
                throw new Error("The AI detected potential copyright recitation. Please rephrase your custom notes.");
            }
            if (candidate.finishReason === 'OTHER') {
                throw new Error("The model stopped generating unexpectedly. Please try again.");
            }
        }
        
        throw new Error("The AI returned an empty response. Please try adding more specific details to your case notes.");
    }

    const text = response.text;
    const sources: GroundingSource[] = [];
    
    // Extract grounding sources for the UI
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || 'Official Statute Reference',
          uri: chunk.web.uri
        });
      }
    });

    return { text, sources };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);

    // Retry logic for transient errors (Network or Rate Limit)
    if (retryCount < MAX_RETRIES) {
      const isTransient = errorMsg.includes("429") || 
                          errorMsg.includes("500") || 
                          errorMsg.includes("network") || 
                          errorMsg.includes("fetch");
      
      if (isTransient) {
        await delay(INITIAL_BACKOFF * Math.pow(2, retryCount));
        return generateDemandLetter(caseData, stateLaw, retryCount + 1);
      }
    }

    logger.error("Gemini Service Error", error);
    throw new Error(handleGeminiError(error));
  }
};

export const getStatuteDetails = async (
  stateName: string, 
  statuteCitation: string
): Promise<{ explanation: string; statuteText: string }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing from the environment.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Find and explain the official security deposit statute "${statuteCitation}" for the state of ${stateName}.
    
    1. EXPLANATION: Provide a clear, tenant-friendly explanation of what this law mandates regarding deadlines, deductions, and penalties.
    2. TEXT: Provide the key excerpts or full text of the statute itself.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            statuteText: { type: Type.STRING }
          }
        },
        tools: [{ googleSearch: {} }]
      }
    });

    const jsonStr = response.text || "{}";
    const data = JSON.parse(jsonStr);

    return {
      explanation: data.explanation || "No explanation available.",
      statuteText: data.statuteText || "No statute text available."
    };
  } catch (error: any) {
    logger.error("Statute Fetch Error", error);
    // Use the same robust error handling
    throw new Error(handleGeminiError(error));
  }
};
