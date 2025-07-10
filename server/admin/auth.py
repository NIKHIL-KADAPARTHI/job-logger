from flask import Blueprint, render_template, request, redirect, url_for, session, send_file
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from .zip_utils import generate_zip_for_date, get_past_utc_dates

# ✅ Load .env variables
load_dotenv()

# ✅ Define Blueprint
auth_bp = Blueprint(
    'auth',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/admin/static'  # Makes /admin/static/styles.css work
)

# ✅ Admin credentials
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# ✅ Session lifetime: 24 hours
@auth_bp.before_app_request
def make_session_permanent():
    session.permanent = True
    session.permanent_session_lifetime = timedelta(hours=24)

# ✅ Login route
@auth_bp.route('/admin/login', methods=['GET', 'POST'])
def admin_login():  # 🔁 FIXED function name (was `login`, must match in `url_for`)
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['logged_in'] = True  # 🔁 FIXED: use 'logged_in', not 'admin_logged_in'
            return redirect(url_for('auth.admin_dashboard'))  # 🔁 FIXED: match function name
        else:
            return render_template('login.html', error="Invalid credentials")

    return render_template('login.html')

# ✅ Dashboard route
@auth_bp.route('/admin/dashboard')
def admin_dashboard():
    if not session.get("logged_in"):  # 🔁 FIXED: match key set in login
        return redirect(url_for("auth.admin_login"))

    today_str = datetime.utcnow().date().isoformat()
    past_dates = get_past_utc_dates(7)  # Last 7 completed UTC days

    return render_template(
        "dashboard.html",
        today=today_str,
        past_dates=past_dates
    )

# ✅ Download route
@auth_bp.route('/admin/download/<date_str>')
def download_zip(date_str):
    if not session.get("logged_in"):
        return redirect(url_for("auth.admin_login"))

    zip_path = generate_zip_for_date(date_str)
    if zip_path and os.path.exists(zip_path):
        return send_file(zip_path, as_attachment=True)
    else:
        return f"No data found for {date_str}", 404

# ✅ Logout
@auth_bp.route('/admin/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.admin_login'))  # 🔁 FIXED: correct login redirect
