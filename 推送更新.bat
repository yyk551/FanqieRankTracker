@echo off
chcp 65001 >nul
title Push Fanqie Rank Tracker to GitHub
cd /d "%~dp0"

echo ============================================
echo   Push local changes to GitHub
echo   Repo: https://github.com/wen1701/FanqieRankTracker
echo   (After a successful push, GitHub Actions will
echo    scrape BOTH female and male channels daily.)
echo ============================================
echo.

echo [1/3] Commits waiting to be pushed:
git log --oneline origin/main..HEAD
echo.

echo [2/3] Pushing to origin/main ...
git push -u origin main
if errorlevel 1 goto failed

echo.
echo [3/3] Done. Check the Actions tab on GitHub in a few minutes.
echo.
pause
exit /b 0

:failed
echo.
echo [FAILED] The push was rejected.
echo.
echo   If the message says "Permission to ... denied to XXX", the GitHub
echo   account saved on this PC cannot write to this repository. Fix it by
echo   EITHER of these:
echo.
echo   A^) Log in with the repository owner account:
echo      1. Open Windows "Credential Manager"
echo         (Control Panel - User Accounts - Credential Manager)
echo      2. Click "Windows Credentials"
echo      3. Remove the entry named  git:https://github.com
echo      4. Run this script again and sign in as the owner account
echo.
echo   B^) Add the current account as a collaborator:
echo      GitHub repo - Settings - Collaborators - Add people
echo      then run this script again
echo.
echo   C^) Use a Personal Access Token:
echo      git remote set-url origin https://OWNER:TOKEN@github.com/wen1701/FanqieRankTracker.git
echo      git push -u origin main
echo      git remote set-url origin https://github.com/wen1701/FanqieRankTracker.git
echo.
pause
exit /b 1
