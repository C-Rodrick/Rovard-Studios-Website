@echo off
title ROVARD STUDIOS V2 preview
cd /d "%~dp0"
echo.
echo  ROVARD STUDIOS V2 preview running at http://localhost:8000
echo  Keep this window open. Close it to stop the preview.
echo.
start "" http://localhost:8000
python -m http.server 8000
