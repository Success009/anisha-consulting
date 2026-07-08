#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "========================================="
echo "🚀 Starting Verification and Push Script"
echo "========================================="

# 1. Compile and build the React application
echo "📦 Compiling and building React application..."
if npm run build; then
    echo "✅ Build compiled successfully with no errors!"
else
    echo "❌ Build failed. Aborting git commit and push."
    exit 1
fi

# 2. Stage all changed files
echo "⚙️ Staging files with git..."
git add .

# 3. Prompt user or auto-commit
COMMIT_MSG="Auto-compile check and deploy: $(date '+%Y-%m-%d %H:%M:%S')"
echo "💾 Committing changes with message: '$COMMIT_MSG'..."
git commit -m "$COMMIT_MSG" || {
    echo "ℹ️ No changes to commit or commit failed."
}

# 4. Push to remote repository
echo "📤 Pushing to remote repository..."
if git push; then
    echo "========================================="
    echo "🎉 Successfully compiled, checked, and pushed!"
    echo "========================================="
else
    echo "❌ Git push failed. Please check your credentials or remote status."
    exit 1
fi
