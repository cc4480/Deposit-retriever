
import os
import time
import logging
import base64
from datetime import datetime
from fpdf import FPDF
from io import BytesIO
from PIL import Image
from google.genai import GoogleGenAI

# Configure Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_RETRIES = 2
INITIAL_BACKOFF = 2

def get_ai_client():
    api_key = os.environ.get('API_KEY')
    if not api_key:
        logger.error("API_KEY environment variable is not set")
        raise ValueError("API_KEY environment variable is not set")
    return GoogleGenAI(api_key=api_key)

async def generate_legal_letter(case, state_law, retry_count=0):
    client = get_ai_client()
    
    # Calculate calculated fields for the prompt
    days_late = max(0, case.days_elapsed - state_law.return_deadline_days)
    
    # Format Deductions for Prompt
    deductions_text = "No specific items disputed yet. Demand full return based on statutory failure."
    if case.deductions:
        items = [f"- ${d.get('amount')} for '{d.get('description')}'. Dispute Reasoning: {d.get('notes')}" for d in case.deductions]
        deductions_text = "\n".join(items)

    # Format Evidence for Prompt
    evidence_text = "Standard move-out documentation."
    if case.evidence:
        items = [f"- {e.get('type')}: {e.get('description')}" for e in case.evidence]
        evidence_text = "\n".join(items)

    prompt = f"""
    Role: Senior Real Estate Litigator & Tenant Rights Advocate.
    Task: Draft a formal, authoritative Demand Letter for the return of a security deposit.
    
    SEARCH INSTRUCTIONS: 
    1. Verify the current security deposit return deadline for {state_law.name} (currently listed as {state_law.return_deadline_days} days).
    2. Verify the exact statutory penalty for bad faith withholding in {state_law.name} (e.g., treble damages).
    3. Find the official name and citation for the security deposit statute (e.g., "{state_law.statute_citation}").
    
    CASE FACTS:
    - State: {state_law.name}
    - Statute Citation: {state_law.statute_citation}
    - Statutory Deadline: {state_law.return_deadline_days} days
    - Current Status: {case.days_elapsed} days since move-out ({days_late} days late).
    - Landlord: {case.landlord_name}
    - Tenant: {case.tenant_name}
    - Deposit: ${case.deposit_amount}
    - Demanded Amount: ${case.potential_win} (Includes statutory penalties).
    
    SPECIFIC DISPUTED CHARGES (Use these facts to argue against the landlord's claims):
    {deductions_text}

    EVIDENCE ON RECORD (Reference these to show we have proof):
    {evidence_text}

    ADDITIONAL TENANT NOTES:
    {case.custom_notes or 'No specific notes provided.'}

    LETTER REQUIREMENTS:
    1. Use a standard formal legal letter format.
    2. Header: SENT VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED.
    3. Explicitly cite the {state_law.name} statute: {state_law.statute_citation}.
    4. Set a strict 10-business-day deadline for payment.
    5. Tone: Professional, firm, and non-confrontational but assertive.
    6. Do not include placeholders for date or signature, I will add them programmatically.
    """

    try:
        response = await client.models.generate_content(
            model='gemini-3-pro-preview',
            contents=prompt,
            config={
                'temperature': 0.2,
                'tools': [{'googleSearch': {}}]
            }
        )
        
        if not response.text:
             # Check finish reasons
            candidates = getattr(response, 'candidates', [])
            if candidates:
                reason = getattr(candidates[0], 'finish_reason', 'UNKNOWN')
                if reason == 'SAFETY':
                    raise ValueError("Content flagged by safety filters. Please verify case notes are professional.")
                if reason == 'RECITATION':
                    raise ValueError("Content flagged for recitation.")
            raise ValueError("Empty response received from AI model.")

        # Extract Grounding Sources
        sources = []
        try:
            candidates = getattr(response, 'candidates', [])
            if candidates:
                # Accessing nested grounding metadata structure
                grounding_metadata = getattr(candidates[0], 'grounding_metadata', None)
                if grounding_metadata:
                    chunks = getattr(grounding_metadata, 'grounding_chunks', [])
                    for chunk in chunks:
                        web = getattr(chunk, 'web', None)
                        if web:
                            sources.append({
                                'title': getattr(web, 'title', 'Legal Statute Reference'),
                                'uri': getattr(web, 'uri', '#')
                            })
        except Exception as e:
            logger.warning(f"Failed to extract grounding sources: {e}")

        return {'text': response.text, 'sources': sources}

    except Exception as e:
        error_msg = str(e)
        logger.error(f"AI Generation Error: {error_msg}")
        
        # Retry logic
        if retry_count < MAX_RETRIES:
            if "429" in error_msg or "500" in error_msg or "network" in error_msg.lower():
                time.sleep(INITIAL_BACKOFF * (2 ** retry_count))
                return await generate_legal_letter(case, state_law, retry_count + 1)
        
        # User friendly error mapping
        if "API_KEY" in error_msg:
            return {'text': "System Error: API Configuration missing.", 'sources': []}
        if "safety" in error_msg.lower():
             return {'text': "Error: The case details provided triggered safety filters. Please remove any inflammatory language and try again.", 'sources': []}
             
        return {'text': "We are experiencing high demand. Please try drafting your letter again in a moment.", 'sources': []}

def create_letter_pdf(case):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_margins(25.4, 25.4, 25.4) # 1 inch margins
    pdf.set_font("Times", size=12)
    
    # Add Header
    pdf.set_font("Times", 'B', size=12)
    pdf.cell(0, 10, "DEMAND FOR SECURITY DEPOSIT RETURN", 0, 1, 'C')
    pdf.ln(5)
    
    # Meta
    pdf.set_font("Times", size=10)
    pdf.cell(0, 5, f"Date: {datetime.now().strftime('%B %d, %Y')}", 0, 1)
    pdf.cell(0, 5, "VIA CERTIFIED MAIL", 0, 1)
    pdf.ln(10)

    # Body
    pdf.set_font("Times", size=12)
    text = case.generated_letter_text or "Content not generated."
    
    # Basic unicode handling for FPDF
    try:
        text = text.encode('latin-1', 'replace').decode('latin-1')
    except:
        text = "Error encoding text."
        
    pdf.multi_cell(0, 6, txt=text)
    
    # Add Digital Signature if available
    if case.signature_data:
        try:
            # Handle base64 prefix if present
            data_parts = case.signature_data.split(",")
            encoded = data_parts[1] if len(data_parts) > 1 else case.signature_data
            
            img_data = base64.b64decode(encoded)
            img = Image.open(BytesIO(img_data))
            
            # Save temp file
            if not os.path.exists('tmp'):
                os.makedirs('tmp')
            sig_path = f"tmp/sig_{case.id}.png"
            img.save(sig_path)
            
            # Check if we need a new page
            if pdf.get_y() > 220:
                pdf.add_page()
            
            pdf.ln(10)
            pdf.image(sig_path, x=25.4, w=50) 
            pdf.ln(2)
            pdf.set_font("Times", 'I', size=10)
            pdf.cell(0, 5, f"Signed by: {case.tenant_name}", 0, 1)
        except Exception as e:
            logger.error(f"Signature Error: {e}")

    if not os.path.exists('tmp'):
        os.makedirs('tmp')
    
    file_path = f"tmp/case_{case.id}_letter.pdf"
    pdf.output(file_path)
    return file_path
