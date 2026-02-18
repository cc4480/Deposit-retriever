
from models import db, StateLaw

def seed_states():
    if StateLaw.query.first():
        return # Already seeded
    
    states = [
        StateLaw(state_code='CA', name='California', return_deadline_days=21, bad_faith_multiplier=2.0, statute_citation='Cal. Civ. Code § 1950.5'),
        StateLaw(state_code='TX', name='Texas', return_deadline_days=30, bad_faith_multiplier=3.0, statute_citation='Texas Prop. Code § 92.103'),
        StateLaw(state_code='NY', name='New York', return_deadline_days=14, bad_faith_multiplier=1.0, statute_citation='NY GOB § 7-108'),
        StateLaw(state_code='WA', name='Washington', return_deadline_days=30, bad_faith_multiplier=2.0, statute_citation='RCW 59.18.280'),
        StateLaw(state_code='FL', name='Florida', return_deadline_days=30, bad_faith_multiplier=1.0, statute_citation='Fla. Stat. § 83.49')
    ]
    
    for s in states:
        db.session.add(s)
    db.session.commit()
