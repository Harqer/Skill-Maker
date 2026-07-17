"""
conftest.py — pytest configuration for agent tests.

Imports config FIRST so that the Infisical SDK bootstrap runs (or CLI-injected
env vars are validated) before any test module is collected. This mirrors the
exact environment that production processes see.
"""
import sys
import os

# Make the agent package root importable without a package install.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import config  # noqa — runs _bootstrap_infisical() and validates required secrets
