@echo off
chcp 65001 >nul
title Fanqie Rank Dashboard
cd /d "%~dp0"

echo ============================================
echo   Fanqie dashboard: http://localhost:8000
echo   - female channel: http://localhost:8000/
echo   - male   channel: http://localhost:8000/?gender=male
echo   Switch channel with the button in the page header.
echo   Close this window to stop the server.
echo ============================================
echo.

if exist venv (call venv\Scripts\activate.bat)

rem 先等本地服务起来，再打开浏览器，避免看到"无法连接"
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:8000/"

python -m http.server 8000
pause
