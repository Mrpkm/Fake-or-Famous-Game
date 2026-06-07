@echo off
REM ============================================================
REM  Fake or Famous? — START THE AI (double-click this on the DESKTOP)
REM  Starts Ollama + a public https tunnel and prints/copies the
REM  one-click link to open on your laptop (any network).
REM ============================================================
title Fake or Famous - AI server
echo Starting the AI server... this opens a couple of windows. Keep them open while you play.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Mrpkm/Fake-or-Famous-Game/main/start.ps1 | iex"
echo.
echo Done. Copy the green link above and open it on your laptop.
pause
