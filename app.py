from flask import Flask, render_template, request
import webbrowser
import threading
import time

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

def open_browser():
    """Open browser after a short delay"""
    time.sleep(1)
    webbrowser.open('http://localhost:5000/')

if __name__ == '__main__':
    # Start a thread to open the browser
    threading.Thread(target=open_browser).start()
    # Run the Flask app
    print("Starting Flask server... Browser will open automatically.")
    app.run(debug=True, host='0.0.0.0')
