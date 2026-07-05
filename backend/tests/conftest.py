"""
conftest.py — global pytest configuration for the backend test suite.
Adds the backend directory to sys.path so 'app' is importable when pytest
is invoked from the project root or from the backend/ directory.
"""
import sys
import os

# Ensure the 'backend' package root is always on sys.path
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)


def pytest_configure(config):
    config.addinivalue_line("markers", "asyncio: mark test as async")
