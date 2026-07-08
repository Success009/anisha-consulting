# Automated Build & Push Script Documentation

This project includes a shell utility script, `compile_and_push.sh`, designed to automate the process of building, verifying, and committing/pushing changes to GitHub. This eliminates the need for developers (or subsequent AI agents) to manually run compile commands, verify build success, and type out repetitive Git commands.

## How the Script Works

The `compile_and_push.sh` script executes the following sequential steps:

1. **Compilation Check:** Runs `npm run build` using the project's Vite bundler.
2. **Build Failure Prevention:** If the build fails (exits with non-zero status), the script aborts immediately to prevent bad/broken code from being pushed to the remote repository.
3. **Git Staging:** If the build succeeds, it automatically stages all changes with `git add .`.
4. **Git Committing:** Automatically commits the staged changes with a timestamped message: `Auto-compile check and deploy: YYYY-MM-DD HH:MM:SS`.
5. **Git Push:** Executes `git push` to push the certified, successfully built code directly to your GitHub repository.

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
Subsequent AI models or local agents working on this project do not need to run `npm run build` manually or run individual git commands. They can directly invoke:
```bash
./compile_and_push.sh
```
If the script succeeds, they can be confident that the code builds correctly and has been pushed to GitHub.
