import os
import zipfile
import pandas as pd
from datetime import datetime, timedelta, date
from io import BytesIO
from psycopg2.extras import RealDictCursor
from flask import send_file
from dotenv import load_dotenv
import psycopg2

# Load environment variables
load_dotenv()
NEON_DB_URL = os.getenv("NEON_DB_URL")

# Directory to store generated ZIPs
EXPORTS_DIR = os.path.join(os.path.dirname(__file__), "exports")
os.makedirs(EXPORTS_DIR, exist_ok=True)

# Database connection helper
def get_db_connection():
    return psycopg2.connect(NEON_DB_URL, cursor_factory=RealDictCursor)

# Last 7 complete UTC dates (excluding today)
def get_past_utc_dates(num_days=7):
    today = datetime.utcnow().date()
    return [(today - timedelta(days=i)).isoformat() for i in range(1, num_days + 1)]

import os
import zipfile
import pandas as pd
from datetime import datetime, timedelta
from io import BytesIO
from psycopg2.extras import RealDictCursor
from flask import send_file
from dotenv import load_dotenv
import psycopg2

# Load environment variables
load_dotenv()
NEON_DB_URL = os.getenv("NEON_DB_URL")

# Folder to store generated ZIPs
EXPORTS_DIR = os.path.join(os.path.dirname(__file__), "exports")
os.makedirs(EXPORTS_DIR, exist_ok=True)

def get_db_connection():
    return psycopg2.connect(NEON_DB_URL, cursor_factory=RealDictCursor)

def get_past_utc_dates(num_days=7):
    today = datetime.utcnow().date()
    return [(today - timedelta(days=i)).isoformat() for i in range(1, num_days+1)]

from datetime import date

def generate_zip_for_date(date_str):
    zip_path = os.path.join(EXPORTS_DIR, f"{date_str}.zip")

    # ✅ Only use cached file if it's not for today's date
    is_today = (date_str == date.today().isoformat())
    if os.path.exists(zip_path) and not is_today:
        return zip_path  # Return cached version if date is not today

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Get all jobs logged on the given UTC date
        query = """
        SELECT * FROM jobs
        WHERE DATE(timestamp AT TIME ZONE 'UTC') = %s;
        """
        cur.execute(query, (date_str,))
        jobs = cur.fetchall()

        if not jobs:
            cur.close()
            conn.close()
            return None  # ❌ No jobs found

        # Group jobs by domain
        domain_groups = {}
        for job in jobs:
            domain = job['domain'] or 'other'
            domain_groups.setdefault(domain, []).append(job)

        # Write Excel files and summary into memory
        buffer = BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
            total_jobs = 0
            summary_lines = []

            for domain, domain_jobs in domain_groups.items():
                # ✅ Filter only required fields
                filtered_jobs = [
                    {
                        'company_name': job.get('company_name', ''),
                        'job_title': job.get('job_title', ''),
                        'location': job.get('location', ''),
                        'job_description': job.get('job_description', ''),
                        'job_url': job.get('job_url', '')
                    }
                    for job in domain_jobs
                ]

                df = pd.DataFrame(filtered_jobs)
                filename = f"jobs_{domain}_{date_str}.xlsx"
                file_path = os.path.join(EXPORTS_DIR, filename)
                df.to_excel(file_path, index=False)
                zipf.write(file_path, arcname=f"{domain}/{filename}")
                os.remove(file_path)  # Cleanup

                summary_lines.append(f"{domain.capitalize()}: {len(domain_jobs)} jobs")
                total_jobs += len(domain_jobs)

            summary = f"""
Job Logger Summary - {date_str}
===============================

Total Jobs: {total_jobs}
Domains: {len(domain_groups)}

Domain Breakdown:
------------------
""" + "\n".join(summary_lines)

            zipf.writestr("summary.txt", summary)

        # Save ZIP file to disk
        with open(zip_path, "wb") as f:
            f.write(buffer.getvalue())

        cur.close()
        conn.close()
        return zip_path

    except Exception as e:
        print(f"❌ Error generating ZIP: {e}")
        return None
