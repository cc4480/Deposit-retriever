
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class StateLaw(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    state_code = db.Column(db.String(2), unique=True, nullable=False)
    name = db.Column(db.String(50), nullable=False)
    return_deadline_days = db.Column(db.Integer, nullable=False)
    bad_faith_multiplier = db.Column(db.Float, default=1.0)
    statute_citation = db.Column(db.String(100), nullable=False)

class Case(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Core Data
    user_state = db.Column(db.String(2), nullable=False)
    move_out_date = db.Column(db.Date, nullable=False)
    deposit_amount = db.Column(db.Float, nullable=False)
    
    # Parties
    landlord_name = db.Column(db.String(100))
    landlord_address = db.Column(db.String(255))
    tenant_name = db.Column(db.String(100))
    tenant_address = db.Column(db.String(255))
    tenant_email = db.Column(db.String(100))
    
    # JSON Fields
    _deductions = db.Column("deductions", db.Text, default='[]') 
    _evidence = db.Column("evidence", db.Text, default='[]')
    _grounding_sources = db.Column("grounding_sources", db.Text, default='[]')
    
    # Case Details
    custom_notes = db.Column(db.Text)
    generated_letter_text = db.Column(db.Text)
    signature_data = db.Column(db.Text)  # Base64 string
    
    # Status & Calculation
    status = db.Column(db.String(20), default='initial')
    is_late = db.Column(db.Boolean, default=False)
    potential_win = db.Column(db.Float, default=0.0)
    days_elapsed = db.Column(db.Integer, default=0)

    @property
    def deductions(self):
        return json.loads(self._deductions or '[]')
    
    @deductions.setter
    def deductions(self, value):
        self._deductions = json.dumps(value)

    @property
    def evidence(self):
        return json.loads(self._evidence or '[]')
    
    @evidence.setter
    def evidence(self, value):
        self._evidence = json.dumps(value)

    @property
    def grounding_sources(self):
        return json.loads(self._grounding_sources or '[]')
    
    @grounding_sources.setter
    def grounding_sources(self, value):
        self._grounding_sources = json.dumps(value)
