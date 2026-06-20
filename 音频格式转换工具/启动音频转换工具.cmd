@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0download-ffmpeg-core.ps1"
if errorlevel 1 goto download_failed
where py.exe >nul 2>nul
if not errorlevel 1 goto use_py
where python.exe >nul 2>nul
if not errorlevel 1 goto use_python
echo Python 3 was not found.
echo Install Python 3 or run any static web server in this folder.
pause
exit /b 1

:download_failed
echo.
echo Failed to download vendor\ffmpeg-core\ffmpeg-core.wasm.
echo Check your Internet connection and try again.
pause
exit /b 1

:use_py
start "" "http://127.0.0.1:8765/"
py.exe -m http.server 8765 --bind 127.0.0.1
goto end

:use_python
start "" "http://127.0.0.1:8765/"
python.exe -m http.server 8765 --bind 127.0.0.1

:end
endlocal
