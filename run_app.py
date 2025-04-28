import os
import socket
import webbrowser
from flask import Flask
import sys
import time
import threading

def get_ip():
    """Get the local IP address"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def print_server_urls(port=5000):
    """Print the server URLs in a visually appealing way"""
    local_ip = get_ip()
    
    # Clear terminal
    os.system('cls' if os.name == 'nt' else 'clear')
    
    # Print header
    print("\n" + "=" * 70)
    print(" 🏠 REAL ESTATE APP SERVER RUNNING".center(70))
    print("=" * 70)
    
    # Print URLs
    print("\n 🌐 Access the application at:")
    print(f"\n   📌 Local:   \033[1;36mhttp://localhost:{port}/\033[0m")
    print(f"   📌 Network: \033[1;36mhttp://{local_ip}:{port}/\033[0m")
    
    # Print instructions
    print("\n 🛠️  Press CTRL+C to stop the server")
    print("\n" + "=" * 70 + "\n")
    
    # Return the local URL
    return f"http://localhost:{port}/"

def open_browser(url, delay=1.5):
    """Open the browser after a short delay"""
    def _open_browser():
        time.sleep(delay)
        webbrowser.open(url)
    
    browser_thread = threading.Thread(target=_open_browser)
    browser_thread.daemon = True
    browser_thread.start()

if __name__ == "__main__":
    # Import the app from your main application file
    try:
        from app import app
    except ImportError:
        print("Error: Could not import 'app' from app.py")
        sys.exit(1)
    
    # Default port
    port = 5000
    
    # Check if port is specified in command line arguments
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port number: {sys.argv[1]}")
            sys.exit(1)
    
    # Print server URLs
    url = print_server_urls(port)
    
    # Open browser automatically
    open_browser(url)
    
    # Run the app
    app.run(host='0.0.0.0', port=port, debug=True)
