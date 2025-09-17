# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
from uuid import uuid4
import random
import os

app = Flask(__name__)
CORS(app, origins=['https://your-github-username.github.io', 'http://localhost:3000', 'http://127.0.0.1:5500'])

# --- Enhanced Data Models for SIH Variables ---
TRAINS = [
    {
        "trainId": "KMTR-045", "setSize": 4, "lastMileage": 1200, "inIBL": False,
        "fitnessCerts": {"rolling": "2024-12-25", "signalling": "2024-12-20", "telecom": "2024-12-22"},
        "jobCards": ["JC-001", "JC-045"], "openJobCards": 2,
        "brandingContract": {"advertiser": "Coca-Cola", "hoursRequired": 8, "hoursCompleted": 3},
        "mileageTarget": 1500, "lastCleaning": "2024-12-15", "stablingBay": "A1"
    },
    {
        "trainId": "KMTR-102", "setSize": 4, "lastMileage": 3500, "inIBL": False,
        "fitnessCerts": {"rolling": "2024-12-30", "signalling": "2024-12-28", "telecom": "2024-12-25"},
        "jobCards": [], "openJobCards": 0,
        "brandingContract": {"advertiser": "Samsung", "hoursRequired": 12, "hoursCompleted": 10},
        "mileageTarget": 3000, "lastCleaning": "2024-12-18", "stablingBay": "B2"
    },
    {
        "trainId": "KMTR-221", "setSize": 4, "lastMileage": 2200, "inIBL": False,
        "fitnessCerts": {"rolling": "2024-12-24", "signalling": "2024-12-26", "telecom": "2024-12-23"},
        "jobCards": ["JC-221"], "openJobCards": 1,
        "brandingContract": {"advertiser": "Kerala Tourism", "hoursRequired": 6, "hoursCompleted": 6},
        "mileageTarget": 2500, "lastCleaning": "2024-12-19", "stablingBay": "A3"
    },
    {
        "trainId": "KMTR-310", "setSize": 4, "lastMileage": 500, "inIBL": True,
        "fitnessCerts": {"rolling": "2024-12-18", "signalling": "2024-12-20", "telecom": "2024-12-19"},
        "jobCards": ["JC-310", "JC-311", "JC-312"], "openJobCards": 3,
        "brandingContract": {"advertiser": "None", "hoursRequired": 0, "hoursCompleted": 0},
        "mileageTarget": 1000, "lastCleaning": "2024-12-10", "stablingBay": "IBL-1"
    },
    {
        "trainId": "KMTR-412", "setSize": 4, "lastMileage": 2500, "inIBL": False,
        "fitnessCerts": {"rolling": "2024-12-27", "signalling": "2024-12-29", "telecom": "2024-12-26"},
        "jobCards": [], "openJobCards": 0,
        "brandingContract": {"advertiser": "Flipkart", "hoursRequired": 10, "hoursCompleted": 2},
        "mileageTarget": 2800, "lastCleaning": "2024-12-17", "stablingBay": "B1"
    }
]

SCHEDULES = []
CLEANING_SLOTS = {"available": 3, "total": 5, "schedule": ["06:00", "14:00", "22:00"]}
STABLING_BAYS = {"A1": True, "A2": False, "A3": True, "B1": True, "B2": False, "IBL-1": True, "IBL-2": True}

# AI-Enhanced Multi-Objective Scoring Engine
def compute_ai_score(train_data: dict, operational_context: dict = None):
    if operational_context is None:
        operational_context = {}
    
    # 1. Fitness Certificate Validation
    fitness_score = validate_fitness_certificates(train_data.get('fitnessCerts', {}))
    
    # 2. Job Card Analysis
    jobcard_score = analyze_job_cards(train_data.get('openJobCards', 0))
    
    # 3. Branding Priority Assessment
    branding_score = assess_branding_priority(train_data.get('brandingContract', {}))
    
    # 4. Mileage Balancing Optimization
    mileage_score = optimize_mileage_balance(train_data.get('lastMileage', 0), train_data.get('mileageTarget', 0))
    
    # 5. Cleaning Slot Availability
    cleaning_score = check_cleaning_availability(train_data.get('lastCleaning', ''), operational_context.get('date', ''))
    
    # 6. Stabling Geometry Optimization
    stabling_score = optimize_stabling_geometry(train_data.get('stablingBay', ''), train_data.get('inIBL', False))
    
    # AI Conflict Detection
    conflicts = detect_conflicts(train_data)
    conflict_penalty = len(conflicts) * 0.1
    
    # Weighted Multi-Objective Score
    weights = {"fitness": 0.25, "jobcard": 0.20, "branding": 0.15, "mileage": 0.15, "cleaning": 0.15, "stabling": 0.10}
    
    total_score = (
        fitness_score * weights["fitness"] +
        jobcard_score * weights["jobcard"] +
        branding_score * weights["branding"] +
        mileage_score * weights["mileage"] +
        cleaning_score * weights["cleaning"] +
        stabling_score * weights["stabling"]
    ) - conflict_penalty
    
    final_score = max(0, min(100, round(total_score * 100)))
    
    return {
        "score": final_score,
        "breakdown": {
            "fitness": round(fitness_score * 100),
            "jobcard": round(jobcard_score * 100),
            "branding": round(branding_score * 100),
            "mileage": round(mileage_score * 100),
            "cleaning": round(cleaning_score * 100),
            "stabling": round(stabling_score * 100)
        },
        "conflicts": conflicts,
        "recommendation": get_ai_recommendation(final_score, conflicts)
    }

def validate_fitness_certificates(certs):
    today = datetime.now().date()
    valid_count = 0
    for cert_type, expiry_str in certs.items():
        expiry = datetime.strptime(expiry_str, "%Y-%m-%d").date()
        if expiry > today:
            valid_count += 1
    return valid_count / len(certs) if certs else 0

def analyze_job_cards(open_cards):
    return max(0, 1 - (open_cards / 5))  # Penalty increases with open job cards

def assess_branding_priority(contract):
    if not contract or contract.get('advertiser') == 'None':
        return 1.0
    required = contract.get('hoursRequired', 0)
    completed = contract.get('hoursCompleted', 0)
    if required == 0:
        return 1.0
    return min(1.0, completed / required)

def optimize_mileage_balance(current, target):
    if target == 0:
        return 1.0
    deviation = abs(current - target) / target
    return max(0, 1 - deviation)

def check_cleaning_availability(last_cleaning_str, current_date_str):
    if not last_cleaning_str or not current_date_str:
        return 0.8  # Default moderate score
    
    last_cleaning = datetime.strptime(last_cleaning_str, "%Y-%m-%d").date()
    current_date = datetime.strptime(current_date_str, "%Y-%m-%d").date() if current_date_str else datetime.now().date()
    
    days_since_cleaning = (current_date - last_cleaning).days
    
    if days_since_cleaning <= 3:
        return 1.0
    elif days_since_cleaning <= 7:
        return 0.8
    else:
        return 0.4

def optimize_stabling_geometry(bay, in_ibl):
    if in_ibl:
        return 0.2  # Low score for IBL trains
    
    bay_efficiency = {
        "A1": 0.9, "A2": 0.8, "A3": 0.85,
        "B1": 0.9, "B2": 0.7, "B3": 0.75
    }
    
    return bay_efficiency.get(bay, 0.6)

def detect_conflicts(train_data):
    conflicts = []
    
    # Check fitness certificate expiry
    today = datetime.now().date()
    for cert_type, expiry_str in train_data.get('fitnessCerts', {}).items():
        expiry = datetime.strptime(expiry_str, "%Y-%m-%d").date()
        if expiry <= today:
            conflicts.append(f"{cert_type.title()} certificate expired")
    
    # Check critical job cards
    if train_data.get('openJobCards', 0) > 2:
        conflicts.append("Multiple open job cards")
    
    # Check IBL status
    if train_data.get('inIBL', False):
        conflicts.append("Train in IBL - maintenance required")
    
    return conflicts

def get_ai_recommendation(score, conflicts):
    if conflicts:
        return "HOLD - Resolve conflicts before induction"
    elif score >= 80:
        return "PRIORITY - Optimal for immediate induction"
    elif score >= 60:
        return "READY - Good candidate for induction"
    elif score >= 40:
        return "CAUTION - Consider alternatives"
    else:
        return "AVOID - Poor induction candidate"

@app.route('/api/trains', methods=['GET'])
def get_trains():
    return jsonify(TRAINS)

@app.route('/api/compute', methods=['POST'])
def api_compute():
    payload = request.get_json() or {}
    train_id = payload.get('trainId')
    
    # Find train data
    train_data = next((t for t in TRAINS if t['trainId'] == train_id), None)
    if not train_data:
        return jsonify({"error": "Train not found"}), 404
    
    operational_context = payload.get('operationalContext', {})
    res = compute_ai_score(train_data, operational_context)
    return jsonify(res)

@app.route('/api/schedule', methods=['POST'])
def api_schedule():
    payload = request.get_json() or {}
    required = ['trainId','station','route','date','time']
    if not all(k in payload for k in required):
        return jsonify({"error":"missing fields"}), 400
    
    # Find train data for AI scoring
    train_data = next((t for t in TRAINS if t['trainId'] == payload['trainId']), None)
    if not train_data:
        return jsonify({"error": "Train not found"}), 404
    
    # AI-enhanced scoring
    operational_context = {"date": payload['date'], "time": payload['time']}
    ai_result = compute_ai_score(train_data, operational_context)
    
    entry = {
        "id": str(uuid4()),
        "trainId": payload['trainId'],
        "station": payload['station'],
        "route": payload['route'],
        "date": payload['date'],
        "time": payload['time'],
        "score": ai_result['score'],
        "breakdown": ai_result['breakdown'],
        "conflicts": ai_result['conflicts'],
        "recommendation": ai_result['recommendation'],
        "status": "scheduled" if ai_result['score'] >= 60 else "pending_review",
        "createdAt": datetime.utcnow().isoformat()
    }
    
    SCHEDULES.append(entry)
    return jsonify(entry), 201

@app.route('/api/rank', methods=['POST'])
def ai_rank_trains():
    payload = request.get_json() or {}
    operational_context = payload.get('operationalContext', {})
    
    results = []
    for train in TRAINS:
        ai_result = compute_ai_score(train, operational_context)
        results.append({
            "trainId": train['trainId'],
            "score": ai_result['score'],
            "breakdown": ai_result['breakdown'],
            "conflicts": ai_result['conflicts'],
            "recommendation": ai_result['recommendation'],
            "inIBL": train.get('inIBL', False)
        })
    
    # AI-powered ranking with conflict prioritization
    ranked = sorted(results, key=lambda r: (len(r['conflicts']) == 0, r['score']), reverse=True)
    return jsonify(ranked)

@app.route('/api/schedules', methods=['GET'])
def get_schedules():
    return jsonify(SCHEDULES)

@app.route('/api/trains/<train_id>/details', methods=['GET'])
def get_train_details(train_id):
    train = next((t for t in TRAINS if t['trainId'] == train_id), None)
    if not train:
        return jsonify({"error": "Train not found"}), 404
    return jsonify(train)

@app.route('/api/ai/optimize', methods=['POST'])
def ai_optimize_fleet():
    payload = request.get_json() or {}
    target_date = payload.get('date', datetime.now().strftime('%Y-%m-%d'))
    
    # AI Fleet Optimization
    available_trains = [t for t in TRAINS if not t.get('inIBL', False)]
    optimization_results = []
    
    for train in available_trains:
        ai_result = compute_ai_score(train, {'date': target_date})
        optimization_results.append({
            "trainId": train['trainId'],
            "score": ai_result['score'],
            "recommendation": ai_result['recommendation'],
            "conflicts": ai_result['conflicts']
        })
    
    # Sort by AI score
    optimization_results.sort(key=lambda x: x['score'], reverse=True)
    
    return jsonify({
        "date": target_date,
        "totalTrains": len(TRAINS),
        "availableTrains": len(available_trains),
        "recommendations": optimization_results[:10],  # Top 10
        "summary": {
            "optimal": len([r for r in optimization_results if r['score'] >= 80]),
            "good": len([r for r in optimization_results if 60 <= r['score'] < 80]),
            "caution": len([r for r in optimization_results if 40 <= r['score'] < 60]),
            "avoid": len([r for r in optimization_results if r['score'] < 40])
        }
    })

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)