@echo off
chcp 65001 >nul
title Fanqie BOTH Channels Updater
cd /d "%~dp0"

echo ============================================
echo   Fanqie New-Book Rank - Update BOTH Channels
echo   female -> data\latest_ranks.json
echo   male   -> data\latest_ranks_male.json
echo   Total time: about 10-18 min
echo ============================================
echo.

if not exist venv (
    echo [0/4] Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo [0/4] Checking dependencies...
python -c "import playwright, openai" 2>nul
if errorlevel 1 (
    echo   First run: installing playwright + openai, 1-3 min...
    python -m pip install -q --upgrade pip
    python -m pip install -q playwright openai
) else (
    echo   Dependencies ready, skip install
)

python -c "from playwright.sync_api import sync_playwright; p=sync_playwright().start(); p.chromium.launch(headless=True); p.stop(); print('browser-ok')" >nul 2>nul
if errorlevel 1 (
    echo   First run: downloading Chromium, 2-5 min...
    python -m playwright install chromium
) else (
    echo   Browser ready, skip download
)

if exist .env (
    echo   AI config found: .env
) else (
    echo   [TIP] No .env found - AI summaries disabled, rule-based text only.
)

echo [1/4] Scraping FEMALE ranks...
python scrape_fanqie_ranks.py --gender female
if errorlevel 1 (
    echo [WARN] Female scrape failed, continue with male...
)

echo [2/4] Building FEMALE dashboard data...
python scripts\build_latest.py --gender female

echo [3/4] Scraping MALE ranks...
python scrape_fanqie_ranks.py --gender male
if errorlevel 1 (
    echo [WARN] Male scrape failed, continue...
)

echo [4/4] Building MALE dashboard data...
python scripts\build_latest.py --gender male

echo.
echo ============================================
echo   Both channels updated!
echo   Next step: double-click "启动看板.bat",
echo   then use the 女频 / 男频 switch in the page header.
echo ============================================
pause
