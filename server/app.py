from flask import Flask, request, jsonify, send_file
import sqlite3
import os
from datetime import datetime
import hashlib
import json
from domains_config import get_active_domains, get_domain_by_id, suggest_domain_from_text
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from flask_cors import CORS

# Create Flask app
app = Flask(__name__)
CORS(app)
load_dotenv()
NEON_DB_URL = os.getenv("NEON_DB_URL")

def get_db_connection():
    return psycopg2.connect(NEON_DB_URL, cursor_factory=RealDictCursor)

# Configuration
DATABASE_PATH = 'job_logger.db'
PORT = 5001  # Using 5001 for Mac compatibility

# Basic route to test server
@app.route('/')
def home():
    return jsonify({
        "message": "Job Logger Server is Running!",
        "status": "active",
        "timestamp": datetime.now().isoformat(),
        "total_domains": len(get_active_domains())
    })

# Health check endpoint
@app.route('/api/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "database": "connected" if os.path.exists(DATABASE_PATH) else "not_found",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0",
        "domains_loaded": len(get_active_domains())
    })

# Get all available domains
@app.route('/api/domains')
def get_domains():
    domains = get_active_domains()
    return jsonify({
        "status": "success",
        "total_domains": len(domains),
        "domains": [
            {
                "id": domain["id"],
                "display_name": domain["display_name"],
                "keywords": domain["keywords"][:3]  # Show first 3 keywords only
            }
            for domain in domains
        ]
    })

# Test domain suggestion
@app.route('/api/test_domain_suggestion')
def test_domain_suggestion():
    # Test cases
    test_cases = [
        {"title": "Senior React Developer", "expected": "web_development"},
        {"title": "DevOps Engineer", "expected": "devops"},
        {"title": "Data Scientist", "expected": "data_science"},
        {"title": "Product Manager", "expected": "product_management"},
        {"title": "Cybersecurity Analyst", "expected": "cybersecurity"}
    ]
    
    results = []
    for test in test_cases:
        suggested = suggest_domain_from_text(test["title"])
        results.append({
            "job_title": test["title"],
            "suggested_domain": suggested,
            "expected_domain": test["expected"],
            "match": suggested == test["expected"]
        })
    
    return jsonify({
        "status": "success",
        "test_results": results,
        "accuracy": sum(1 for r in results if r["match"]) / len(results) * 100
    })

@app.route('/api/log_job', methods=['POST'])
def log_job():
    try:
        data = request.get_json()
        job_title = data['job_title'].strip()
        company_name = data['company_name'].strip()
        job_url = data['job_url'].strip()
        required_fields = ['user_id', 'company_name', 'job_title', 'location', 'job_description', 'job_url', 'domain', 'timestamp']
        if not all(field in data for field in required_fields):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        # Check for duplicate job within past 7 days
        check_query = """
            SELECT id FROM jobs
            WHERE job_title = %s AND company_name = %s AND job_url = %s
            AND timestamp >= NOW() - INTERVAL '7 days'
            LIMIT 1;
            """
        cur.execute(check_query, (job_title, company_name, job_url))
        duplicate = cur.fetchone()

        if duplicate:
            return jsonify({
                "status": "duplicate",
                "duplicate_job_id": duplicate["id"],
                "message": "Duplicate job entry detected"
            }), 200
        insert_query = """
        INSERT INTO jobs (user_id, company_name, job_title, location, job_description, job_url, domain, timestamp)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id;
        """
        cur.execute(insert_query, (
            data['user_id'],
            data['company_name'],
            data['job_title'],
            data['location'],
            data['job_description'],
            data['job_url'],
            data['domain'],
            data['timestamp']
        ))

        job_id = cur.fetchone()['id']
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"status": "success", "job_id": job_id}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    print("🚀 Starting Job Logger Server...")
    print(f"📍 Server will run on: http://localhost:{PORT}")
    print(f"🏷️ Loaded {len(get_active_domains())} active domains")
    print("📊 Health check: http://localhost:5001/api/health")
    print("🏷️ View domains: http://localhost:5001/api/domains")
    print("🧪 Test suggestions: http://localhost:5001/api/test_domain_suggestion")
    print("❌ To stop server: Press Ctrl+C")
    
    app.run(host='0.0.0.0', port=PORT, debug=True)