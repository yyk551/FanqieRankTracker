@echo off
chcp 65001 >nul
title Fanqie MALE Rank Updater
cd /d "%~dp0"

echo ============================================
echo   Fanqie MALE New-Book Rank - One-Click Update
echo   Channel: male   (writes data\*_male.json + api\lastest_male\)
echo ============================================
echo.

if not exist venv (
    echo [1/3] Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo [1/3] Checking dependencies...
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
    echo         Copy .env.example to .env and fill in your API key to enable AI.
)

echo [2/3] Scraping Fanqie MALE new-book ranks, 19 categories, 4-8 min...
python scrape_fanqie_ranks.py --gender male
if errorlevel 1 (
    echo.
    echo [ERROR] Scrape failed. Check your network and run this script again.
    pause
    exit /b 1
)

echo [3/3] Building trend dashboard data for MALE...
python scripts\build_latest.py --gender male

echo.
echo ============================================
echo   Update complete! MALE data saved to
echo     data\latest_ranks_male.json
echo     data\market_summary_male.json
echo     data\trends_male\
echo     api\lastest_male\
echo   Female data is NOT touched.
echo   Next step: double-click "启动看板.bat" then switch channel in the page.
echo ============================================
pause
