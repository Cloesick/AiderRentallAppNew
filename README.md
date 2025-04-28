## 🚀 Setup Instructions

Clone the repo:

```bash
git clone https://github.com/your/repo.git
cd your-project-folder

=======================
python -m venv venv
venv\Scripts\activate

================================
pip install -r requirements.txt
================================

> 💡 Pro Tip: If you ever use Linux/macOS too, add that version with `source venv/bin/activate`.

---

## ✅ Option 2: Save it as a `setup.sh` or `setup.bat` script

If you want it as a runnable script:

### For Windows:

```bat
:: setup.bat
@echo off
echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt
=================================