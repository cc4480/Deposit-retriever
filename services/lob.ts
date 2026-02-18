
import { logger } from "../utils/logger";

export interface LobResponse {
  id: string;
  expected_delivery_date: string;
  tracking_number: string;
}

export const verifyAddress = async (address: string): Promise<{ valid: boolean; message?: string }> => {
  // Simple client-side pre-validation
  if (!address || address.length < 10) return { valid: false, message: "Address looks too short." };
  return { valid: true };
};

export const sendCertifiedMail = async (
  recipientName: string,
  recipientAddress: string,
  letterText: string
): Promise<LobResponse> => {
  logger.info(`Lob: Sending mail request to backend for ${recipientName}`);
  
  try {
    const response = await fetch('/api/mail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientName, recipientAddress, letterText })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to process mailing request");
    }
    
    const data = await response.json();
    return data as LobResponse;
  } catch (e: any) {
    logger.error("Mailing Error", e);
    throw new Error(e.message || "Server connection failed");
  }
};
