@echo off
REM ============================================================
REM  Audio Converter - start the local server, then open the browser
REM  The server is pure PowerShell (.NET HttpListener).
REM  No Python / Node.js / any other runtime is required.
REM ============================================================
setlocal
title Audio Converter - Local Server
cd /d "%~dp0"

REM --- Step 1: make sure the ffmpeg core (about 32 MB) exists locally ---
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0download-ffmpeg-core.ps1"
if errorlevel 1 goto core_failed

REM --- Step 2: start the local server (runs until this window is closed) ---
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
if errorlevel 1 goto serve_failed
goto done

:core_failed
echo.
echo [ERROR] Failed to download the FFmpeg core. Check your network and retry.
pause
exit /b 1

:serve_failed
echo.
echo [ERROR] Failed to start the local server. See the error messages above.
pause
exit /b 1

:done
endlocal
