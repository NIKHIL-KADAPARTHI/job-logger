from flask import Blueprint, render_template, request, redirect, url_for, session
from datetime import timedelta
import os
from dotenv import load_dotenv
# Load environment variables
load_dotenv()
auth_bp = Blueprint(
    'auth',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/admin/static'  # <-- important for CSS path
)


# Admin credentials (for simplicity, stored in environment variables)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD") 

@auth_bp.before_app_request
def make_session_permanent():
    session.permanent = True
    session.permanent_session_lifetime = timedelta(hours=24)

@auth_bp.route('/admin/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['admin_logged_in'] = True
            return redirect(url_for('auth.dashboard'))
        else:
            return render_template('login.html', error="Invalid credentials")

    return render_template('login.html')

@auth_bp.route('/admin/dashboard')
def dashboard():
    if not session.get('admin_logged_in'):
        return redirect(url_for('auth.login'))
    
    # For now, just show basic page – we'll enhance later
    return render_template('dashboard.html', stats=None)

@auth_bp.route('/admin/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.login'))
