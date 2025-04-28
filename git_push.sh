#!/bin/bash

# Set your commit message (ask if not provided)
read -p "Enter commit message: " commit_message

# Stage all changes
git add .

# Commit with your message
git commit -m "$commit_message"

# Pull latest changes first (to avoid conflicts)
git pull --rebase

# Push to your remote
git push

echo "✅ Code pushed successfully!"
