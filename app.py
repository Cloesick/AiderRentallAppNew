from flask import Flask, render_template, request, redirect, url_for, flash, session
import webbrowser
import threading
import time
import os
import webbrowser
import threading
import time
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# Make request available to templates
@app.context_processor
def inject_request():
    return {'request': request}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        # This is a simple example - in a real app, you'd check against a database
        # and use proper password hashing
        if username == 'admin' and password == 'password':
            session['logged_in'] = True
            session['username'] = username
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
