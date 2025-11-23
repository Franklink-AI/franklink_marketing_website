import os
import sys

# Add the current directory to sys.path to ensure imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Use a relative import to get the app
# This is more robust when the execution context varies
try:
    from .main import app
except ImportError:
    # Fallback for different execution contexts
    from main import app
