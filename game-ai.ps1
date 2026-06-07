# game-ai.ps1 - run ONCE on the desktop, then play on the laptop.
#
# It does three things:
#   1. Starts your local AI (Ollama) so OTHER devices on your Wi-Fi can reach it
#      (OLLAMA_HOST=0.0.0.0) and the game is allowed to call it (OLLAMA_ORIGINS=*).
#   2. Serves the game over http from this folder so the laptop can open it.
#   3. Prints the exact address to open on the laptop.
#
# On the laptop, open the http://<this-pc-ip>:8088 link it prints (NOT the
# github.io link - a secure https page can't call a plain-http AI without a
# tunnel). The game's AI address auto-fills to this desktop, so just press
# "Connect to AI" on the start screen.

$ErrorActionPreference = 'Stop'
$Root    = $PSScriptRoot
$GameDir = Join-Path $Root 'English-summative-AI_integrated'
$Port    = 8088
$Model   = 'qwen3:4b'

# --- find ollama -------------------------------------------------------------
$ollama = (Get-Command ollama -ErrorAction SilentlyContinue).Source
if (-not $ollama) {
    foreach ($p in @("$env:LOCALAPPDATA\Programs\Ollama\ollama.exe",
                     "D:\AI experiment\ollama\ollama.exe")) {
        if (Test-Path $p) { $ollama = $p; break }
    }
}
if (-not $ollama) {
    Write-Host "[game-ai] Ollama not found. Install it (https://ollama.com) or start it via your powerhouse's .\llm.ps1, then re-run." -ForegroundColor Red
    exit 1
}

# --- find python (to serve the static game) ---------------------------------
$py = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $py) { $py = (Get-Command py -ErrorAction SilentlyContinue).Source }
if (-not $py) { $py = "D:\AI experiment\python\python.exe" }

# --- this PC's LAN address ---------------------------------------------------
$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
       Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
       Select-Object -First 1).IPAddress
if (-not $ip) { $ip = '127.0.0.1' }

Write-Host "[game-ai] Starting the AI (Ollama) on all interfaces + allowing the game..." -ForegroundColor Cyan
Start-Process -FilePath 'powershell' -ArgumentList @(
    '-NoExit','-Command',
    "`$env:OLLAMA_HOST='0.0.0.0:11434'; `$env:OLLAMA_ORIGINS='*'; & '$ollama' serve"
)
Start-Sleep -Seconds 2

Write-Host "[game-ai] Making sure the model '$Model' is present (first time downloads it)..." -ForegroundColor Cyan
$env:OLLAMA_HOST = '127.0.0.1:11434'
& $ollama pull $Model

if (Test-Path (Join-Path $GameDir 'index.html')) {
    Write-Host "[game-ai] Serving the game on port $Port..." -ForegroundColor Cyan
    Start-Process -FilePath 'powershell' -ArgumentList @(
        '-NoExit','-Command',
        "Set-Location '$GameDir'; & '$py' -m http.server $Port --bind 0.0.0.0"
    )
} else {
    Write-Host "[game-ai] Game folder not found at $GameDir - serving skipped." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  ON YOUR LAPTOP (same Wi-Fi), open:" -ForegroundColor Green
Write-Host "      http://$ip`:$Port/" -ForegroundColor White
Write-Host ""
Write-Host "  Then on the start screen press 'Connect to AI'." -ForegroundColor Green
Write-Host "  (AI address auto-fills to  http://$ip`:11434 )" -ForegroundColor DarkGray
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Leave this window + the two it opened running while you play." -ForegroundColor DarkGray
