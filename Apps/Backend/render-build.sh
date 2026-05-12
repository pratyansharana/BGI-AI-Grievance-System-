#!/usr/bin/env bash
set -o errexit

pip install --upgrade pip
# Install dependencies without caching to save disk space/RAM
pip install --no-cache-dir -r requirements.txt