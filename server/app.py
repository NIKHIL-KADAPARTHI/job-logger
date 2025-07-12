from flask import Flask, request, jsonify, send_file
import os
from datetime import datetime
import hashlib
import json
from domains_config import get_active_domains, get_domain_by_id, suggest_domain_from_text
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from flask_cors import CORS
from admin.auth import auth_bp

# Create Flask app
app = Flask(__name__)
CORS(app)
load_dotenv()
NEON_DB_URL = os.getenv("NEON_DB_URL")
app.register_blueprint(auth_bp)
app.secret_key = os.getenv("SECRET_KEY")

def get_db_connection():
    return psycopg2.connect(NEON_DB_URL, cursor_factory=RealDictCursor)

# Configuration
PORT = int(os.environ.get('PORT', 5001))  # Using 5001 for Mac compatibility

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
        "database": "connected",
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

@app.route('/api/log_job', methods=['POST'])
def log_job():
    try:
        data = request.get_json()
        required_fields = ['user_id', 'company_name', 'job_title', 'location', 'job_description', 'job_url', 'domain', 'timestamp']
        if not all(field in data for field in required_fields):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        user_id = data['user_id']
        job_title = data['job_title'].strip()
        company_name = data['company_name'].strip()
        job_url = data['job_url'].strip()

        conn = get_db_connection()
        cur = conn.cursor()

        # 1️⃣ Check today's job count for the user
        today_utc = datetime.utcnow().date().isoformat()
        count_query = """
            SELECT COUNT(*) FROM jobs
            WHERE user_id = %s AND DATE(timestamp AT TIME ZONE 'UTC') = %s;
        """
        cur.execute(count_query, (user_id, today_utc))
        current_count = cur.fetchone()['count']

        if current_count >= 50:
            cur.close()
            conn.close()
            return jsonify({
                "status": "limit_reached",
                "message": "You have reached the daily limit of 50 job logs."
            }), 403

        # 2️⃣ Check for duplicate job within past 7 days
        check_query = """
            SELECT id FROM jobs
            WHERE job_title = %s AND company_name = %s AND job_url = %s
            AND timestamp >= NOW() - INTERVAL '7 days'
            LIMIT 1;
        """
        cur.execute(check_query, (job_title, company_name, job_url))
        duplicate = cur.fetchone()

        if duplicate:
            cur.close()
            conn.close()
            return jsonify({
                "status": "duplicate",
                "duplicate_job_id": duplicate["id"],
                "message": "Duplicate job entry detected"
            }), 200

        # 3️⃣ Proceed with insert
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

@app.route('/api/user_job_count')
def get_user_job_count():
    user_id = request.args.get('user_id')
    date = request.args.get('date')  # Expecting UTC YYYY-MM-DD

    if not user_id or not date:
        return jsonify({"status": "error", "message": "Missing user_id or date"}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        query = """
            SELECT COUNT(*) FROM jobs
            WHERE user_id = %s AND DATE(timestamp AT TIME ZONE 'UTC') = %s;
        """
        cur.execute(query, (user_id, date))
        count = cur.fetchone()['count']
        cur.close()
        conn.close()

        return jsonify({"status": "success", "count": count})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 5001))
    print("🚀 Starting Job Logger Server...")
    print(f"📍 Server will run on: http://localhost:{PORT}")
    app.run(host='0.0.0.0', port=PORT)
