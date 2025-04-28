@echo off
echo ----------------------------------------
echo 📦 Aider Rental App - Setup Script
echo ----------------------------------------

:: Step 1: Create virtual environment
if exist venv (
    echo ✅ Virtual environment already exists.
) else (
    echo 🚧 Creating virtual environment...
    python -m venv venv
)

:: Step 2: Activate virtual environment
echo 🔄 Activating virtual environment...
call venv\Scripts\activate

:: Step 3: Install dependencies
echo 📥 Installing requirements...
pip install -r requirements.txt

:: Step 4: Launch the Flask app
echo 🚀 Starting Flask app...
python app.py

pause
