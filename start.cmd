@echo off
chcp 65001 >nul 2>&1

title KKClaw Gateway Console

echo.
echo   +==========================================+
echo   :      KKClaw Desktop Pet  v3.5.1          :
echo   :      Gateway Console - Live Monitor       :
echo   +==========================================+
echo.
echo   [%TIME%] Starting KKClaw...
echo   [%TIME%] Gateway logs will appear below
echo   ------------------------------------------
echo.

cd /d "%~dp0"
"node_modules\.bin\electron.cmd" . %*
