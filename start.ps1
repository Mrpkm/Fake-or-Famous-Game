# start.ps1 — ONE command to play from anywhere.
#
# Run on the DESKTOP (it has the GPU). It starts everything and prints a single
# link to open on the laptop (any network):
#   1. Ollama (local AI, kept on localhost)
#   2. game-ai-proxy.py  (keyed gateway: CORS + access key)
#   3. a Cloudflare tunnel (public https URL, reachable anywhere)
#
# Designed to be run straight from GitHub — no clone required:
#   irm https://raw.githubusercontent.com/Mrpkm/Fake-or-Famous-Game/main/start.ps1 | iex

$ErrorActionPreference = 'Stop'
$Raw       = 'https://raw.githubusercontent.com/Mrpkm/Fake-or-Famous-Game/main'
$GamePages = 'https://mrpkm.github.io/Fake-or-Famous-Game/'
$Root      = Join-Path $env:USERPROFILE 'Fake-or-Famous-Game'
$ProxyPort = 11500
$Model     = 'qwen3:4b'
New-Item -ItemType Directory -Force -Path $Root | Out-Null

# --- access key (made once, kept locally, never shared publicly) --------------
$keyFile = Join-Path $Root '.game-ai-key'
$key = if (Test-Path $keyFile) { (Get-Content $keyFile -Raw).Trim() } else { '' }
if (-not $key) { $key = [guid]::NewGuid().ToString('N'); Set-Content -Path $keyFile -Value $key -Encoding ascii }

# --- fetch the proxy (always grab the latest) --------------------------------
$proxy = Join-Path $Root 'game-ai-proxy.py'
Write-Host "[start] fetching the proxy..." -ForegroundColor Cyan
Invoke-WebRequest -UseBasicParsing -Uri "$Raw/game-ai-proxy.py" -OutFile $proxy

# --- locate ollama + python --------------------------------------------------
$ollama = (Get-Command ollama -ErrorAction SilentlyContinue).Source
if (-not $ollama) {
    foreach ($p in @("$env:LOCALAPPDATA\Programs\Ollama\ollama.exe","D:\AI experiment\ollama\ollama.exe")) {
        if (Test-Path $p) { $ollama = $p; break }
    }
}
if (-not $ollama) { Write-Host "[start] Ollama not found. Install it (https://ollama.com) and re-run." -ForegroundColor Red; return }
$py = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $py) { $py = (Get-Command py -ErrorAction SilentlyContinue).Source }
if (-not $py) { $py = "D:\AI experiment\python\python.exe" }

# --- 1) Ollama (localhost) ---------------------------------------------------
if (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port 11434 -InformationLevel Quiet)) {
    Write-Host "[start] starting Ollama (localhost)..." -ForegroundColor Cyan
    Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit','-Command',"& '$ollama' serve")
    Start-Sleep -Seconds 2
}
Write-Host "[start] ensuring model '$Model' (first run downloads it)..." -ForegroundColor Cyan
& $ollama pull $Model

# --- 2) keyed proxy ----------------------------------------------------------
Write-Host "[start] starting the keyed proxy on :$ProxyPort..." -ForegroundColor Cyan
Start-Process -FilePath 'powershell' -ArgumentList @(
    '-NoExit','-Command',
    "`$env:GAME_AI_KEY='$key'; `$env:PROXY_PORT='$ProxyPort'; & '$py' '$proxy'"
)
Start-Sleep -Seconds 2

# --- 3) Cloudflare tunnel (download once) ------------------------------------
$cf = Join-Path $Root 'cloudflared.exe'
if (-not (Test-Path $cf)) {
    Write-Host "[start] downloading cloudflared (one-time)..." -ForegroundColor Cyan
    Invoke-WebRequest -UseBasicParsing -OutFile $cf `
        -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
}
$errLog = Join-Path $env:TEMP 'faf-cf.err.log'
$outLog = Join-Path $env:TEMP 'faf-cf.out.log'
Remove-Item $errLog,$outLog -ErrorAction SilentlyContinue
Write-Host "[start] opening the public tunnel..." -ForegroundColor Cyan
Start-Process -FilePath $cf -WindowStyle Hidden -RedirectStandardError $errLog -RedirectStandardOutput $outLog `
    -ArgumentList @('tunnel','--no-autoupdate','--url',"http://localhost:$ProxyPort")

$pub = $null
for ($i = 0; $i -lt 40 -and -not $pub; $i++) {
    Start-Sleep -Seconds 1
    $txt = ''
    if (Test-Path $errLog) { $txt += Get-Content $errLog -Raw -ErrorAction SilentlyContinue }
    if (Test-Path $outLog) { $txt += Get-Content $outLog -Raw -ErrorAction SilentlyContinue }
    $m = [regex]::Match($txt, 'https://[a-z0-9-]+\.trycloudflare\.com')
    if ($m.Success) { $pub = $m.Value }
}

Write-Host ""
if ($pub) {
    $enc  = [uri]::EscapeDataString($pub)
    $link = "$GamePages?aihost=$enc&aikey=$key"
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  OPEN THIS ON THE LAPTOP (any network) — auto-connects:" -ForegroundColor Green
    Write-Host "    $link" -ForegroundColor White
    Write-Host ""
    Write-Host "  Manual connect (start screen) if you prefer:" -ForegroundColor Green
    Write-Host "    Address: $pub" -ForegroundColor White
    Write-Host "    Key:     $key" -ForegroundColor White
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  Keep this + the Ollama/proxy windows open while playing." -ForegroundColor DarkGray
    Write-Host "  The free tunnel URL changes each run — re-share the link." -ForegroundColor DarkGray
    try { Set-Clipboard -Value $link; Write-Host "  (link copied to your clipboard)" -ForegroundColor DarkGray } catch {}
} else {
    Write-Host "[start] Couldn't read the tunnel URL. Check $outLog / $errLog," -ForegroundColor Yellow
    Write-Host "        then use the https://….trycloudflare.com line with key $key." -ForegroundColor Yellow
}
