#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "========================================="
echo "🚀 Starting Verification, Deploy, and Push Script"
echo "========================================="

# 1. Compile and build the React application to check for errors
echo "📦 Verifying compilation and building React application..."
if npm run build; then
    echo "✅ Build compiled successfully with no errors!"
else
    echo "❌ Build failed. Aborting git commit, deploy and push."
    exit 1
fi

# 2. Deploy compiled files to GitHub Pages (gh-pages branch)
echo "🚀 Deploying to GitHub Pages..."
if npm run deploy; then
    echo "✅ Successfully deployed built assets to gh-pages branch!"
else
    echo "❌ Deployment to gh-pages failed. Aborting source push."
    exit 1
fi

# 3. Stage all changed files
echo "⚙️ Staging files with git..."
git add .

# 4. Prompt user or auto-commit
COMMIT_MSG="Auto-compile check and deploy: $(date '+%Y-%m-%d %H:%M:%S')"
echo "💾 Committing changes with message: '$COMMIT_MSG'..."
git commit -m "$COMMIT_MSG" || {
    echo "ℹ️ No changes to commit or commit failed."
}

# 5. Push to remote repository
echo "📤 Pushing main branch source code to remote repository..."
if git push; then
    echo "========================================="
    echo "🎉 Successfully compiled, deployed to GitHub Pages, and pushed to main!"
    echo "========================================="
else
    echo "❌ Git push failed. Please check your credentials or remote status."
    exit 1
fi
