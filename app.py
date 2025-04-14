from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import webbrowser
import threading
import time
import os
import json
import uuid
from datetime import datetime
from functools import wraps

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# User data storage
def get_users_file():
    return 'data/users.json'

def load_users():
    filename = get_users_file()
    try:
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                return json.load(f)
        else:
            # Create directory if it doesn't exist
            os.makedirs('data', exist_ok=True)
            # Return empty list if file doesn't exist
            return []
    except Exception as e:
        print(f"Error loading users: {e}")
        return []

def save_users(users):
    filename = get_users_file()
    try:
        with open(filename, 'w') as f:
            json.dump(users, f, indent=4)
        return True
    except Exception as e:
        print(f"Error saving users: {e}")
        return False

# Visitor tracking data storage
def get_visitor_tracking_file():
    return 'data/visitor_tracking.json'

def save_visitor_tracking(tracking_data):
    filename = get_visitor_tracking_file()
    try:
        # Create directory if it doesn't exist
        os.makedirs('data', exist_ok=True)
        
        # Load existing data
        existing_data = []
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                existing_data = json.load(f)
        
        # Append new data
        existing_data.append(tracking_data)
        
        # Save updated data
        with open(filename, 'w') as f:
            json.dump(existing_data, f, indent=4)
        return True
    except Exception as e:
        print(f"Error saving visitor tracking: {e}")
        return False

# Make request and property functions available to templates
@app.context_processor
def inject_context():
    return {
        'request': request,
        'load_properties': load_properties,
        'session': session
    }

# Create a default visitor user if none exists
@app.before_first_request
def create_default_visitor():
    users = load_users()
    
    # Check if we have a visitor user
    if not any(u.get('user_type') == 'visitor' for u in users):
        # Create a default visitor user
        default_visitor = {
            'id': str(uuid.uuid4()),
            'first_name': 'Test',
            'last_name': 'Visitor',
            'email': 'visitor@example.com',
            'phone': '+1 234 567 8900',
            'password': 'password',  # In a real app, hash the password
            'gender': 'X',
            'address': '123 Test Street',
            'city': 'Test City',
            'country': 'Test Country',
            'vat': '',
            'user_type': 'visitor',
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        users.append(default_visitor)
        save_users(users)
        print("Created default visitor user: visitor@example.com / password")

# Admin check decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            flash('Please log in to access this page')
            return redirect(url_for('login'))
        
        if not session.get('is_admin'):
            flash('You do not have permission to access this page')
            return redirect(url_for('home'))
            
        return f(*args, **kwargs)
    return decorated_function

# Property data storage
def get_properties_file(category):
    return f'data/{category}_properties.json'

def load_properties(category):
    filename = get_properties_file(category)
    try:
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                return json.load(f)
        else:
            # Create directory if it doesn't exist
            os.makedirs('data', exist_ok=True)
            # Return empty list if file doesn't exist
            return []
    except Exception as e:
        print(f"Error loading properties: {e}")
        return []

def save_properties(category, properties):
    filename = get_properties_file(category)
    try:
        with open(filename, 'w') as f:
            json.dump(properties, f, indent=4)
        return True
    except Exception as e:
        print(f"Error saving properties: {e}")
        return False

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        # Load users
        users = load_users()
        
        # Find user by email
        user = next((u for u in users if u['email'] == email), None)
        
        if user and user['password'] == password:  # In a real app, use password hashing
            session['logged_in'] = True
            session['user_id'] = user['id']
            session['username'] = user['first_name']
            session['email'] = user['email']
            
            # Check if user is admin (email contains @realestate.com)
            if '@realestate.com' in email:
                session['is_admin'] = True
                flash('Welcome, Administrator!')
            else:
                session['is_admin'] = False
                session['is_visitor'] = user.get('user_type') == 'visitor'
                flash('You were successfully logged in')
            
            # Track login
            if 'visitor_id' in session:
                tracking_data = {
                    'visitor_id': session['visitor_id'],
                    'user_id': user['id'],
                    'action': 'login',
                    'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
                save_visitor_tracking(tracking_data)
                
            return redirect(url_for('home'))
        else:
            flash('Invalid credentials')
    
    return render_template('login.html')

@app.route('/register', methods=['POST'])
def register():
    # Get form data
    first_name = request.form['first_name']
    last_name = request.form['last_name']
    email = request.form['email']
    phone = request.form['phone']
    password = request.form['password']
    confirm_password = request.form['confirm_password']
    gender = request.form['gender']
    address = request.form['address']
    city = request.form['city']
    country = request.form['country']
    vat = request.form.get('vat', '')
    
    # Validate data
    if password != confirm_password:
        flash('Passwords do not match')
        return redirect(url_for('login'))
    
    # Load existing users
    users = load_users()
    
    # Check if email already exists
    if any(u['email'] == email for u in users):
        flash('Email already registered')
        return redirect(url_for('login'))
    
    # Create new user
    new_user = {
        'id': str(uuid.uuid4()),
        'first_name': first_name,
        'last_name': last_name,
        'email': email,
        'phone': phone,
        'password': password,  # In a real app, hash the password
        'gender': gender,
        'address': address,
        'city': city,
        'country': country,
        'vat': vat,
        'user_type': 'visitor',
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    # Add user to list
    users.append(new_user)
    
    # Save updated users
    if save_users(users):
        flash('Registration successful! Please log in.')
    else:
        flash('Error during registration. Please try again.')
    
    return redirect(url_for('login'))

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    session.pop('username', None)
    flash('You were logged out')
    return redirect(url_for('home'))

@app.route('/rentals')
def rentals():
    return render_template('rentals.html')

@app.route('/rentals/destination/<location>')
def rentals_by_destination(location):
    # Load all rental properties
    properties = load_properties('rentals')
    
    # Filter properties by location (case-insensitive partial match)
    location_lower = location.lower()
    matching_properties = [
        p for p in properties 
        if location_lower in p.get('address', '').lower() or 
           location_lower in p.get('city', '').lower() or
           location_lower in p.get('country', '').lower()
    ]
    
    # Track this search if analytics is enabled
    if session.get('cookie_preferences', {}).get('analytics', False):
        tracking_data = {
            'visitor_id': session.get('visitor_id', str(uuid.uuid4())),
            'user_id': session.get('user_id', None),
            'action': 'destination_search',
            'data': {'location': location},
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        save_visitor_tracking(tracking_data)
    
    return render_template(
        'rentals.html', 
        destination_search=True,
        location=location,
        properties=matching_properties
    )

@app.route('/purchase')
def purchase():
    return render_template('purchase.html')

@app.route('/leasing')
def leasing():
    return render_template('leasing.html')

@app.route('/visiting')
def visiting():
    return render_template('visiting.html')

@app.route('/payment-methods')
def payment_methods():
    if not session.get('logged_in'):
        flash('Please log in to manage your payment methods')
        return redirect(url_for('login'))
    return render_template('payment-methods.html')

@app.route('/api/cookie-preferences', methods=['POST'])
def cookie_preferences():
    preferences = request.json
    
    # Store cookie preferences in session
    session['cookie_preferences'] = preferences
    
    # If visitor ID doesn't exist, create one
    if 'visitor_id' not in session:
        session['visitor_id'] = str(uuid.uuid4())
    
    # Track cookie preferences
    tracking_data = {
        'visitor_id': session['visitor_id'],
        'action': 'cookie_preferences',
        'preferences': preferences,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    save_visitor_tracking(tracking_data)
    
    return jsonify({'success': True})

@app.route('/api/track-visitor', methods=['POST'])
def track_visitor():
    # Get tracking data
    data = request.json
    
    # If visitor ID doesn't exist, create one
    if 'visitor_id' not in session:
        session['visitor_id'] = str(uuid.uuid4())
    
    # Add visitor ID to data
    tracking_data = {
        'visitor_id': session['visitor_id'],
        'user_id': session.get('user_id', None),
        'action': data['action'],
        'data': data['data'],
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    # Save tracking data
    save_visitor_tracking(tracking_data)
    
    return jsonify({'success': True})

# Admin property management routes
@app.route('/manage')
@admin_required
def manage_properties():
    return render_template('manage.html')

@app.route('/api/properties/<category>', methods=['GET'])
@admin_required
def get_properties(category):
    if category not in ['rentals', 'purchase', 'leasing', 'visiting']:
        return jsonify({'error': 'Invalid category'}), 400
        
    properties = load_properties(category)
    return jsonify(properties)

@app.route('/api/properties/<category>', methods=['POST'])
@admin_required
def add_property(category):
    if category not in ['rentals', 'purchase', 'leasing', 'visiting']:
        return jsonify({'error': 'Invalid category'}), 400
        
    properties = load_properties(category)
    
    # Get property data from form
    property_data = request.json
    
    # Add unique ID and timestamp
    property_data['id'] = str(int(datetime.now().timestamp()))
    property_data['created_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Ensure the property has the correct category
    property_data['category'] = category
    
    # Handle images (in a real app, you'd save these to a file system or cloud storage)
    if 'images' in property_data and property_data['images']:
        # Limit to 8 images
        property_data['images'] = property_data['images'][:8]
        
        # In a real app, you'd process and store these images
        # For this demo, we'll just keep the base64 data
        print(f"Received {len(property_data['images'])} images for property {property_data['name']}")
    else:
        property_data['images'] = []
    
    # Add to properties list
    properties.append(property_data)
    
    # Save updated properties
    if save_properties(category, properties):
        return jsonify({'success': True, 'property': property_data})
    else:
        return jsonify({'error': 'Failed to save property'}), 500

@app.route('/api/properties/<category>/<property_id>', methods=['PUT'])
@admin_required
def update_property(category, property_id):
    if category not in ['rentals', 'purchase', 'leasing', 'visiting']:
        return jsonify({'error': 'Invalid category'}), 400
        
    properties = load_properties(category)
    
    # Find property by ID
    for i, prop in enumerate(properties):
        if prop.get('id') == property_id:
            # Update property data
            updated_data = request.json
            updated_data['id'] = property_id  # Ensure ID remains the same
            updated_data['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            properties[i] = updated_data
            
            # Save updated properties
            if save_properties(category, properties):
                return jsonify({'success': True, 'property': updated_data})
            else:
                return jsonify({'error': 'Failed to update property'}), 500
    
    return jsonify({'error': 'Property not found'}), 404

@app.route('/api/properties/<category>/<property_id>', methods=['DELETE'])
@admin_required
def delete_property(category, property_id):
    if category not in ['rentals', 'purchase', 'leasing', 'visiting']:
        return jsonify({'error': 'Invalid category'}), 400
        
    properties = load_properties(category)
    
    # Find property by ID
    for i, prop in enumerate(properties):
        if prop.get('id') == property_id:
            # Remove property
            del properties[i]
            
            # Save updated properties
            if save_properties(category, properties):
                return jsonify({'success': True})
            else:
                return jsonify({'error': 'Failed to delete property'}), 500
    
    return jsonify({'error': 'Property not found'}), 404

def open_browser():
    """Open browser after a short delay"""
    time.sleep(1)
    # Use the default browser without specifying a command
    webbrowser.open('http://localhost:5000/', new=2)

if __name__ == '__main__':
    # Start a thread to open the browser
    threading.Thread(target=open_browser).start()
    # Run the Flask app
    print("Starting Flask server... Browser will open automatically.")
    app.run(debug=True, host='0.0.0.0')
