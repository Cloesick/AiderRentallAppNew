from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import webbrowser
import threading
import time
import os
import json
from datetime import datetime
from functools import wraps

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# Make request and property functions available to templates
@app.context_processor
def inject_context():
    return {
        'request': request,
        'load_properties': load_properties
    }

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
        
        # This is a simple example - in a real app, you'd check against a database
        # and use proper password hashing
        if password == 'password':  # Simple password check for demo
            session['logged_in'] = True
            session['username'] = email.split('@')[0]  # Use part before @ as username
            session['email'] = email
            
            # Check if user is admin (email contains @realestate.com)
            if '@realestate.com' in email:
                session['is_admin'] = True
                flash('Welcome, Administrator!')
            else:
                session['is_admin'] = False
                flash('You were successfully logged in')
                
            return redirect(url_for('home'))
        else:
            flash('Invalid credentials')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    session.pop('username', None)
    flash('You were logged out')
    return redirect(url_for('home'))

@app.route('/rentals')
def rentals():
    return render_template('rentals.html')

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
