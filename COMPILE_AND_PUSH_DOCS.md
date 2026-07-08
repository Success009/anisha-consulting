# Automated Build, Deploy, and Push Script Documentation

This project includes a shell utility script, `compile_and_push.sh`, designed to automate the process of building, deploying to GitHub Pages, and pushing source changes to GitHub. This eliminates the need for developers (or subsequent AI agents) to manually run compile commands, verify build success, deploy static assets, and type out repetitive Git commands.

## How the Script Works

The `compile_and_push.sh` script executes the following sequential steps:

1. **Compilation Check:** Runs `npm run build` using the project's Vite bundler to verify there are no compilation errors.
2. **Auto-Deployment:** If the compilation is successful, it runs `npm run deploy` (which triggers `gh-pages -d dist`) to deploy the production build to the `gh-pages` branch. This triggers the GitHub Pages deployment process on GitHub, which hosts your live site at `anisha.success0.com.np`.
3. **Build Failure Prevention:** If the build or deploy fails, the script aborts immediately to prevent bad/broken code from being pushed to the remote repository.
4. **Git Staging:** Stages all source changes with `git add .`.
5. **Git Committing:** Commits the staged source changes with a timestamped message: `Auto-compile check and deploy: YYYY-MM-DD HH:MM:SS`.
6. **Git Push:** Executes `git push` to push the certified source code directly to the `main` branch of your GitHub repository.

## Instructions for Use

### 1. Make the Script Executable (Already Done)
To ensure the script can run on any Unix/Linux/macOS environment:
```bash
chmod +x compile_and_push.sh
```

### 2. Running the Script
Simply execute the script from the root of the project directory:
```bash
./compile_and_push.sh
```

### 3. Usage by AI Agents
Subsequent AI models or local agents working on this project do not need to run `npm run build` or `npm run deploy` manually. They can directly invoke:
```bash
./compile_and_push.sh
```
If the script succeeds, they can be confident that the code builds, is live, and has been pushed to both `main` and `gh-pages` branches on GitHub.
