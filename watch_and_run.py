import os
import sys
import time
import subprocess
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Configuration
PORT = 5000
HOST = '0.0.0.0'
WATCH_DIRECTORIES = ['.', 'templates', 'static']
WATCH_EXTENSIONS = ['.py', '.html', '.css', '.js']
IGNORE_DIRECTORIES = ['__pycache__', '.git', 'data']

class ChangeHandler(FileSystemEventHandler):
    def __init__(self):
        self.process = None
        self.last_modified = time.time()
        self.is_running = False
        
    def on_any_event(self, event):
        # Skip directories and non-matching extensions
        if event.is_directory:
            return
        
        # Check if the file extension is one we care about
        _, ext = os.path.splitext(event.src_path)
        if ext.lower() not in WATCH_EXTENSIONS:
            return
            
        # Skip ignored directories
        for ignore_dir in IGNORE_DIRECTORIES:
            if f'\\{ignore_dir}\\' in event.src_path or f'/{ignore_dir}/' in event.src_path:
                return
        
        # Avoid duplicate events (some editors trigger multiple events)
        if time.time() - self.last_modified < 1:
            return
            
        self.last_modified = time.time()
        print(f"\nChange detected in {event.src_path}")
        self.restart_app()
        
    def start_app(self):
        """Start the Flask application"""
        if self.is_running:
            return
            
        self.is_running = True
        print("\nStarting Flask application...")
        
        # Start the Flask app as a subprocess
        self.process = subprocess.Popen([sys.executable, 'app.py'])
        
        # Open browser
        self.open_browser()
        
    def restart_app(self):
        """Restart the Flask application"""
        if self.process:
            print("Stopping Flask application...")
            # On Windows, we need to use taskkill to terminate the process tree
            if os.name == 'nt':
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(self.process.pid)])
            else:
                self.process.terminate()
                self.process.wait()
            
            self.process = None
            self.is_running = False
            
        # Start the app again
        self.start_app()
        
    def open_browser(self):
        """Open browser after a short delay"""
        def _open_browser():
            time.sleep(2)  # Wait a bit longer for Flask to start
            url = f'http://localhost:{PORT}/'
            print(f"Opening browser to {url}")
            
            # Use the default browser with specific handling for Windows
            if os.name == 'nt':  # Windows
                try:
                    # Use cmd.exe's start command directly
                    os.system(f'cmd /c start {url}')
                except Exception as e:
                    print(f"Error opening browser with cmd: {e}")
                    # Fall back to webbrowser module
                    import webbrowser
                    webbrowser.open(url, new=2)
            else:
                import webbrowser
                webbrowser.open(url, new=2)
                
        threading.Thread(target=_open_browser).start()

def main():
    # Create event handler and observer
    event_handler = ChangeHandler()
    observer = Observer()
    
    # Schedule watching directories
    for directory in WATCH_DIRECTORIES:
        if os.path.exists(directory):
            observer.schedule(event_handler, directory, recursive=True)
            print(f"Watching directory: {directory}")
    
    # Start the observer
    observer.start()
    
    try:
        # Start the app initially
        event_handler.start_app()
        
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        # Stop the app when Ctrl+C is pressed
        if event_handler.process:
            event_handler.process.terminate()
        observer.stop()
    
    observer.join()

if __name__ == "__main__":
    print("Flask Auto-Reloader")
    print("Press Ctrl+C to exit")
    main()
