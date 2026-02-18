
import os
import uuid
import logging
import json
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, send_file
from models import db, StateLaw, Case
from seed_data import seed_states
from utils import generate_legal_letter, create_letter_pdf

# Load environment variables
load_dotenv()

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///instance/database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')

db.init_app(app)

@app.before_request
def setup():
    if not os.path.exists('instance'):
        try:
            os.makedirs('instance')
        except OSError:
            pass # might exist already
    db.create_all()
    seed_states()

@app.route('/')
def index():
    states = StateLaw.query.order_by(StateLaw.name).all()
    return render_template('index.html', states=states)

@app.route('/analyze', methods=['POST'])
def analyze():
    state_code = request.form.get('state')
    move_out_date_str = request.form.get('move_out_date')
    
    try:
        deposit_amount = float(request.form.get('deposit_amount', 0))
    except ValueError:
        flash("Invalid deposit amount.")
        return redirect(url_for('index'))
    
    state_law = StateLaw.query.filter_by(state_code=state_code).first()
    if not state_law:
        flash("Invalid state selected.")
        return redirect(url_for('index'))

    try:
        move_out_date = datetime.strptime(move_out_date_str, '%Y-%m-%d').date()
    except ValueError:
        flash("Invalid date format.")
        return redirect(url_for('index'))

    days_elapsed = (datetime.now().date() - move_out_date).days
    
    # Calculate Potential Win
    is_late = days_elapsed > state_law.return_deadline_days
    multiplier = state_law.bad_faith_multiplier if is_late else 1.0
    potential_win = deposit_amount * multiplier

    # Create Case
    case_id = str(uuid.uuid4())
    new_case = Case(
        id=case_id,
        user_state=state_code,
        move_out_date=move_out_date,
        deposit_amount=deposit_amount,
        days_elapsed=days_elapsed,
        is_late=is_late,
        potential_win=potential_win,
        status='analyzed'
    )
    db.session.add(new_case)
    db.session.commit()

    return render_template(
        'analysis.html', 
        case=new_case, 
        state_law=state_law, 
        potential_win=potential_win,
        is_late=is_late,
        days_elapsed=days_elapsed
    )

@app.route('/generate', methods=['POST'])
async def generate():
    case_id = request.form.get('case_id')
    case = Case.query.get_or_404(case_id)
    
    # Update Case Details
    case.landlord_name = request.form.get('landlord_name')
    case.landlord_address = request.form.get('landlord_address')
    case.tenant_name = request.form.get('tenant_name')
    case.tenant_address = request.form.get('tenant_address')
    case.custom_notes = request.form.get('custom_notes')

    # Process JSON Arrays
    try:
        deductions_raw = request.form.get('deductions_json')
        if deductions_raw:
            case.deductions = json.loads(deductions_raw)
        
        evidence_raw = request.form.get('evidence_json')
        if evidence_raw:
            case.evidence = json.loads(evidence_raw)
    except Exception as e:
        logger.warning(f"Failed to parse JSON inputs: {e}")
    
    state_law = StateLaw.query.filter_by(state_code=case.user_state).first()
    
    # Generate Content
    result = await generate_legal_letter(case, state_law)
    
    case.generated_letter_text = result['text']
    case.grounding_sources = result['sources']
    case.status = 'preview'
    
    db.session.commit()
    
    return render_template('preview.html', case=case)

@app.route('/send/<case_id>', methods=['POST'])
def send_mail(case_id):
    case = Case.query.get_or_404(case_id)
    
    # 1. Update text if user edited it
    case.generated_letter_text = request.form.get('letter_text')
    
    # 2. Capture Signature
    signature_data = request.form.get('signature_data')
    
    # Server-side validation for signature
    if not signature_data or len(signature_data) < 100:
        flash("Error: Digital signature is required to proceed.")
        return redirect(url_for('preview_case', case_id=case_id))
        
    case.signature_data = signature_data
    case.status = 'sent'
    db.session.commit()
    
    # 3. Simulate Mailing (Mock)
    tracking = {
        "tracking_number": f"9405 5000 {datetime.now().strftime('%Y %m%d')} {uuid.uuid4().hex[:4]}",
        "expected_delivery": "3-5 Business Days"
    }
    
    return render_template('success.html', case=case, tracking=tracking)

@app.route('/preview/<case_id>')
def preview_case(case_id):
    case = Case.query.get_or_404(case_id)
    return render_template('preview.html', case=case)

@app.route('/download_pdf/<case_id>', methods=['POST'])
def download_pdf(case_id):
    case = Case.query.get_or_404(case_id)
    case.generated_letter_text = request.form.get('letter_text')
    case.signature_data = request.form.get('signature_data')
    db.session.commit()
    
    try:
        pdf_path = create_letter_pdf(case)
        return send_file(pdf_path, as_attachment=True, download_name=f"Demand_Letter_{case_id}.pdf")
    except Exception as e:
        logger.error(f"PDF Generation Failed: {e}")
        flash("Failed to generate PDF. Please try again.")
        return redirect(url_for('preview_case', case_id=case_id))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
