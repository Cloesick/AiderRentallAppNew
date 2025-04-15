from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, send_from_directory
import webbrowser
import threading
import time
import os
import json
import uuid
import base64
import shutil
from datetime import datetime
from functools import wraps
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# Configure upload folders
UPLOAD_FOLDER = os.path.join('static', 'uploads')
HOME_ICON_FOLDER = os.path.join(UPLOAD_FOLDER, 'home_icon')
CAROUSEL_FOLDER = os.path.join(UPLOAD_FOLDER, 'carousel')
DESTINATIONS_FOLDER = os.path.join(UPLOAD_FOLDER, 'destinations')
PROPERTY_IMAGES_FOLDER = os.path.join(UPLOAD_FOLDER, 'properties')
API_CONFIG_FILE = os.path.join('data', 'api_config.json')

# Create upload folders if they don't exist
os.makedirs(HOME_ICON_FOLDER, exist_ok=True)
os.makedirs(CAROUSEL_FOLDER, exist_ok=True)
os.makedirs(DESTINATIONS_FOLDER, exist_ok=True)
os.makedirs(PROPERTY_IMAGES_FOLDER, exist_ok=True)
os.makedirs(os.path.join('data'), exist_ok=True)
os.makedirs(os.path.join('data', 'ad_profiles'), exist_ok=True)

# Configure allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'svg'}

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
    visitors_db_file = 'data/visitors_db.json'
    
    try:
        # Create directory if it doesn't exist
        os.makedirs('data', exist_ok=True)
        
        # Load existing tracking data
        existing_data = []
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                existing_data = json.load(f)
        
        # Append new tracking data
        existing_data.append(tracking_data)
        
        # Save updated tracking data
        with open(filename, 'w') as f:
            json.dump(existing_data, f, indent=4)
        
        # Update visitors database
        visitors_db = {
            'visitors': [],
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        if os.path.exists(visitors_db_file):
            try:
                with open(visitors_db_file, 'r') as f:
                    visitors_db = json.load(f)
            except:
                pass
        
        # Find or create visitor record
        visitor_id = tracking_data.get('visitor_id')
        visitor = next((v for v in visitors_db['visitors'] if v.get('visitor_id') == visitor_id), None)
        
        if not visitor:
            visitor = {
                'visitor_id': visitor_id,
                'first_seen': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'last_seen': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'user_id': tracking_data.get('user_id'),
                'page_views': 0,
                'actions': [],
                'interests': [],
                'locations_viewed': [],
                'property_types_viewed': []
            }
            visitors_db['visitors'].append(visitor)
        else:
            # Update existing visitor
            visitor['last_seen'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            if tracking_data.get('user_id'):
                visitor['user_id'] = tracking_data.get('user_id')
        
        # Update visitor stats
        action = tracking_data.get('action')
        if action == 'page_view':
            visitor['page_views'] = visitor.get('page_views', 0) + 1
        
        # Add action to history (keep last 50)
        visitor_action = {
            'action': action,
            'timestamp': tracking_data.get('timestamp'),
            'data': tracking_data.get('data', {})
        }
        visitor['actions'] = [visitor_action] + visitor.get('actions', [])[:49]
        
        # Update interests
        if 'interests' in tracking_data:
            for interest in tracking_data.get('interests', []):
                if interest not in visitor.get('interests', []):
                    visitor.setdefault('interests', []).append(interest)
        
        # Update locations viewed
        location = tracking_data.get('data', {}).get('location')
        if location and location not in visitor.get('locations_viewed', []):
            visitor.setdefault('locations_viewed', []).append(location)
        
        # Update property types viewed
        prop_type = tracking_data.get('data', {}).get('property_type')
        if prop_type and prop_type not in visitor.get('property_types_viewed', []):
            visitor.setdefault('property_types_viewed', []).append(prop_type)
        
        # Update last updated timestamp
        visitors_db['last_updated'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Save updated visitors database
        with open(visitors_db_file, 'w') as f:
            json.dump(visitors_db, f, indent=4)
        
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
        'session': session,
        'get_home_icon': get_home_icon,
        'get_carousel_images': get_carousel_images,
        'get_destination_images': get_destination_images,
        'get_api_config': get_api_config
    }

# Helper function to check if file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper function to get the current home icon
def get_home_icon():
    icon_files = os.listdir(HOME_ICON_FOLDER)
    if icon_files:
        return os.path.join('uploads', 'home_icon', icon_files[0])
    return None

# Helper function to get carousel images
def get_carousel_images():
    carousel_files = os.listdir(CAROUSEL_FOLDER)
    return [os.path.join('uploads', 'carousel', f) for f in carousel_files if allowed_file(f)]

# Helper function to get destination images
def get_destination_images():
    destinations = {}
    for destination in os.listdir(DESTINATIONS_FOLDER):
        dest_path = os.path.join(DESTINATIONS_FOLDER, destination)
        if os.path.isdir(dest_path):
            images = [os.path.join('uploads', 'destinations', destination, f) 
                     for f in os.listdir(dest_path) if allowed_file(f)]
            if images:
                destinations[destination] = images
    return destinations

# Helper function to get property image based on location
def get_property_image(location):
    # Try to find an image for the exact location
    for destination in os.listdir(DESTINATIONS_FOLDER):
        if location.lower() in destination.lower():
            dest_path = os.path.join(DESTINATIONS_FOLDER, destination)
            if os.path.isdir(dest_path):
                images = [f for f in os.listdir(dest_path) if allowed_file(f)]
                if images:
                    return os.path.join('uploads', 'destinations', destination, images[0])
    
    # If no specific location image found, return a random property image
    property_images = []
    for root, dirs, files in os.walk(PROPERTY_IMAGES_FOLDER):
        for file in files:
            if allowed_file(file):
                property_images.append(os.path.join('uploads', 'properties', file))
    
    if property_images:
        import random
        return random.choice(property_images)
    
    return None

# API configuration functions
def get_api_config():
    if os.path.exists(API_CONFIG_FILE):
        with open(API_CONFIG_FILE, 'r') as f:
            return json.load(f)
    return {
        'google_maps_api_key': '',
        'other_apis': []
    }

def save_api_config(config):
    with open(API_CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=4)
    return True

# Create default users if none exist
@app.before_first_request
def create_default_users():
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
        print("Created default visitor user: visitor@example.com / password")
    
    # Check if we have an admin user
    if not any(u.get('email') == 'admin@realestate.com' for u in users):
        # Create a default admin user
        default_admin = {
            'id': str(uuid.uuid4()),
            'first_name': 'Admin',
            'last_name': 'User',
            'email': 'admin@realestate.com',
            'phone': '+1 234 567 8901',
            'password': 'admin123',  # In a real app, hash the password
            'gender': 'X',
            'address': '456 Admin Street',
            'city': 'Admin City',
            'country': 'Admin Country',
            'vat': '',
            'user_type': 'admin',
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        users.append(default_admin)
        print("Created default admin user: admin@realestate.com / admin123")
    
    save_users(users)

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
        # Ensure each property has an image based on its location
        for prop in properties:
            if not prop.get('images') or len(prop.get('images', [])) == 0:
                location = prop.get('city', '') or prop.get('address', '') or prop.get('country', '')
                image = get_property_image(location)
                if image:
                    prop['images'] = [image]
        
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

@app.route('/account')
def account():
    if not session.get('logged_in'):
        flash('Please log in to access your account')
        return redirect(url_for('login'))
    
    # Track account page view
    if 'visitor_id' in session:
        tracking_data = {
            'visitor_id': session['visitor_id'],
            'user_id': session.get('user_id', None),
            'action': 'account_view',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        save_visitor_tracking(tracking_data)
    
    return render_template('account.html')

@app.route('/account/payment-methods')
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
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'ip_address': request.remote_addr,
        'user_agent': request.headers.get('User-Agent', ''),
        'referrer': request.headers.get('Referer', ''),
        'page': request.headers.get('X-Current-Page', data['data'].get('page', '')),
        'interests': data['data'].get('interests', [])
    }
    
    # Save tracking data for analytics and ad targeting
    save_visitor_tracking(tracking_data)
    
    # Update visitor profile for ad targeting
    update_visitor_ad_profile(tracking_data)
    
    return jsonify({'success': True})

def update_visitor_ad_profile(tracking_data):
    """Update visitor profile for targeted advertising"""
    visitor_id = tracking_data['visitor_id']
    profile_file = os.path.join('data', 'ad_profiles', f'{visitor_id}.json')
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.join('data', 'ad_profiles'), exist_ok=True)
    
    # Load existing profile or create new one
    profile = {}
    if os.path.exists(profile_file):
        try:
            with open(profile_file, 'r') as f:
                profile = json.load(f)
        except:
            profile = {}
    
    # Initialize profile structure if needed
    if 'interests' not in profile:
        profile['interests'] = {}
    if 'locations' not in profile:
        profile['locations'] = {}
    if 'property_types' not in profile:
        profile['property_types'] = {}
    if 'price_range' not in profile:
        profile['price_range'] = {'min': 0, 'max': 0, 'count': 0}
    if 'visits' not in profile:
        profile['visits'] = []
    
    # Update profile based on tracking data
    action = tracking_data['action']
    data = tracking_data['data']
    
    # Add this visit
    profile['visits'].append({
        'timestamp': tracking_data['timestamp'],
        'action': action,
        'page': tracking_data['page']
    })
    
    # Keep only the last 100 visits
    profile['visits'] = profile['visits'][-100:]
    
    # Update interests based on action
    if action == 'property_view':
        # Update property type interest
        prop_type = data.get('property_type', '')
        if prop_type:
            profile['property_types'][prop_type] = profile['property_types'].get(prop_type, 0) + 1
        
        # Update location interest
        location = data.get('location', '')
        if location:
            profile['locations'][location] = profile['locations'].get(location, 0) + 1
        
        # Update price range
        price = data.get('price', 0)
        if price and isinstance(price, (int, float)):
            current_min = profile['price_range']['min']
            current_max = profile['price_range']['max']
            current_count = profile['price_range']['count']
            
            # Update min/max
            if current_min == 0 or price < current_min:
                profile['price_range']['min'] = price
            if price > current_max:
                profile['price_range']['max'] = price
            
            # Update average
            profile['price_range']['count'] = current_count + 1
    
    # Save updated profile
    try:
        with open(profile_file, 'w') as f:
            json.dump(profile, f, indent=4)
    except Exception as e:
        print(f"Error saving ad profile: {e}")

# Admin property management routes
@app.route('/manage')
@admin_required
def manage_properties():
    return render_template('manage.html')

@app.route('/manage/images')
@admin_required
def manage_images():
    return render_template('manage_images.html')

@app.route('/manage/apis')
@admin_required
def manage_apis():
    return render_template('manage_apis.html')

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

# Image management API endpoints
@app.route('/api/upload/home-icon', methods=['POST'])
@admin_required
def upload_home_icon():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and allowed_file(file.filename):
        # Clear existing icons
        for existing_file in os.listdir(HOME_ICON_FOLDER):
            os.remove(os.path.join(HOME_ICON_FOLDER, existing_file))
            
        # Save new icon
        filename = secure_filename(file.filename)
        file.save(os.path.join(HOME_ICON_FOLDER, filename))
        
        return jsonify({
            'success': True,
            'filename': filename,
            'url': url_for('static', filename=f'uploads/home_icon/{filename}')
        })
    
    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/api/upload/carousel', methods=['POST'])
@admin_required
def upload_carousel_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(CAROUSEL_FOLDER, filename))
        
        return jsonify({
            'success': True,
            'filename': filename,
            'url': url_for('static', filename=f'uploads/carousel/{filename}')
        })
    
    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/api/upload/destination/<destination>', methods=['POST'])
@admin_required
def upload_destination_image(destination):
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    # Create destination folder if it doesn't exist
    destination_folder = os.path.join(DESTINATIONS_FOLDER, secure_filename(destination))
    os.makedirs(destination_folder, exist_ok=True)
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(destination_folder, filename))
        
        return jsonify({
            'success': True,
            'filename': filename,
            'url': url_for('static', filename=f'uploads/destinations/{secure_filename(destination)}/{filename}')
        })
    
    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/api/delete/carousel/<filename>', methods=['DELETE'])
@admin_required
def delete_carousel_image(filename):
    file_path = os.path.join(CAROUSEL_FOLDER, secure_filename(filename))
    
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({'success': True})
    
    return jsonify({'error': 'File not found'}), 404

@app.route('/api/delete/destination/<destination>/<filename>', methods=['DELETE'])
@admin_required
def delete_destination_image(destination, filename):
    file_path = os.path.join(DESTINATIONS_FOLDER, secure_filename(destination), secure_filename(filename))
    
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({'success': True})
    
    return jsonify({'error': 'File not found'}), 404

@app.route('/api/destinations', methods=['GET'])
def get_destinations():
    destinations = []
    
    for destination in os.listdir(DESTINATIONS_FOLDER):
        dest_path = os.path.join(DESTINATIONS_FOLDER, destination)
        if os.path.isdir(dest_path):
            images = [os.path.join('uploads', 'destinations', destination, f) 
                     for f in os.listdir(dest_path) if allowed_file(f)]
            if images:
                destinations.append({
                    'name': destination,
                    'images': images
                })
    
    return jsonify(destinations)

# Visitor ad profile endpoint
@app.route('/api/visitor-ad-profile', methods=['GET'])
def get_visitor_ad_profile():
    # If visitor ID doesn't exist, create one
    if 'visitor_id' not in session:
        session['visitor_id'] = str(uuid.uuid4())
        return jsonify({
            'success': True,
            'profile': {},
            'available_ads': get_default_ads()
        })
    
    visitor_id = session['visitor_id']
    profile_file = os.path.join('data', 'ad_profiles', f'{visitor_id}.json')
    
    # Load profile if it exists
    if os.path.exists(profile_file):
        try:
            with open(profile_file, 'r') as f:
                profile = json.load(f)
                
            # Get ads that match this profile
            available_ads = get_matching_ads(profile)
            
            return jsonify({
                'success': True,
                'profile': profile,
                'available_ads': available_ads
            })
        except Exception as e:
            print(f"Error loading ad profile: {e}")
    
    # Return default ads if no profile exists
    return jsonify({
        'success': True,
        'profile': {},
        'available_ads': get_default_ads()
    })

def get_matching_ads(profile):
    # In a real app, this would query a database of ads
    # For this demo, we'll return some sample ads based on the profile
    
    ads = []
    
    # Add property type specific ads
    if 'property_types' in profile:
        for prop_type, count in profile['property_types'].items():
            if count > 0:
                ads.append({
                    'id': f'ad-{prop_type}-{len(ads) + 1}',
                    'title': f'Exclusive {prop_type.title()} Properties',
                    'description': f'Discover our premium selection of {prop_type} properties.',
                    'image': f'/static/img/ads/{prop_type.lower()}.jpg',
                    'url': f'/properties?type={prop_type}',
                    'property_type': prop_type,
                    'cta': 'View Properties'
                })
    
    # Add location specific ads
    if 'locations' in profile:
        for location, count in profile['locations'].items():
            if count > 0:
                ads.append({
                    'id': f'ad-location-{len(ads) + 1}',
                    'title': f'Properties in {location.title()}',
                    'description': f'Explore our exclusive listings in {location}.',
                    'image': f'/static/img/ads/{location.lower().replace(" ", "-")}.jpg',
                    'url': f'/properties?location={location}',
                    'location': location,
                    'cta': 'Explore Area'
                })
    
    # Add price range specific ads
    if 'price_range' in profile and profile['price_range']['count'] > 0:
        min_price = profile['price_range']['min']
        max_price = profile['price_range']['max']
        
        ads.append({
            'id': f'ad-price-{len(ads) + 1}',
            'title': 'Properties in Your Budget',
            'description': f'Find properties in the {min_price} - {max_price} range.',
            'image': '/static/img/ads/budget.jpg',
            'url': f'/properties?min_price={min_price}&max_price={max_price}',
            'price': (min_price + max_price) / 2,
            'cta': 'View Listings'
        })
    
    # If we don't have enough ads, add some generic ones
    while len(ads) < 5:
        ads.append(get_default_ads()[len(ads) % len(get_default_ads())])
    
    return ads

def get_default_ads():
    # Default ads when no profile exists
    return [
        {
            'id': 'default-ad-1',
            'title': 'Luxury Properties',
            'description': 'Discover our exclusive collection of luxury properties.',
            'image': '/static/img/ads/luxury.jpg',
            'url': '/properties?category=luxury',
            'cta': 'View Luxury Properties'
        },
        {
            'id': 'default-ad-2',
            'title': 'New Developments',
            'description': 'Be the first to own in our newest developments.',
            'image': '/static/img/ads/new-development.jpg',
            'url': '/properties?category=new',
            'cta': 'Explore New Homes'
        },
        {
            'id': 'default-ad-3',
            'title': 'Investment Opportunities',
            'description': 'Find high-yield investment properties in prime locations.',
            'image': '/static/img/ads/investment.jpg',
            'url': '/properties?category=investment',
            'cta': 'Invest Now'
        }
    ]

# API configuration endpoints
@app.route('/api/config', methods=['GET'])
@admin_required
def get_api_config_endpoint():
    return jsonify(get_api_config())

@app.route('/api/config', methods=['POST'])
@admin_required
def update_api_config():
    config = request.json
    
    if save_api_config(config):
        return jsonify({'success': True})
    
    return jsonify({'error': 'Failed to save API configuration'}), 500

@app.route('/api/config/add', methods=['POST'])
@admin_required
def add_api_config():
    api_data = request.json
    
    config = get_api_config()
    
    if 'api_name' in api_data and 'api_key' in api_data:
        # For Google Maps API
        if api_data['api_name'] == 'google_maps':
            config['google_maps_api_key'] = api_data['api_key']
        else:
            # For other APIs
            if 'other_apis' not in config:
                config['other_apis'] = []
                
            config['other_apis'].append({
                'name': api_data['api_name'],
                'key': api_data['api_key'],
                'url': api_data.get('api_url', ''),
                'description': api_data.get('description', '')
            })
        
        if save_api_config(config):
            return jsonify({'success': True})
    
    return jsonify({'error': 'Invalid API data'}), 400

if __name__ == '__main__':
    # Run the Flask app
    print("Starting Flask server...")
    app.run(debug=True, host='0.0.0.0')
