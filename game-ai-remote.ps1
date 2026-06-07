# game-ai-remote.ps1 - play from ANYWHERE (laptop on a different network).
#
# Runs three things on this desktop and prints ONE link to open on the laptop:
#   1. Ollama (kept on localhost - never exposed directly).
#   2. game-ai-proxy.py - a keyed gateway in front of Ollama (adds CORS + a key).
#   3. a Cloudflare tunnel - gives the proxy a public https URL, reachable anywhere.
#
# The printed link is the github.io game with the address + key baked in, so the
# laptop connects with one click. https end-to-end (no mixed-content), keyed
# (only you can use your GPU), and Ollama stays private.

$ErrorActionPreference = 'Stop'
$Root      = $PSScriptRoot
$ProxyPort = 11500
$Model     = 'qwen3:4b'
$GamePages = 'https://mrpkm.github.io/Fake-or-Famous-Game/'

# --- access key (generated once, kept out of git) ----------------------------
$keyFile = Join-Path $Root '.game-ai-key'
$key = if (Test-Path $keyFile) { (Get-Content $keyFile -Raw).Trim() } else { '' }
if (-not $key) { $key = [guid]::NewGuid().ToString('N'); Set-Content -Path $keyFile -Value $key -Encoding ascii }

# --- locate ollama + python --------------------------------------------------
$ollama = (Get-Command ollama -ErrorAction SilentlyContinue).Source
if (-not $ollama) {
    foreach ($p in @("$env:LOCALAPPDATA\Programs\Ollama\ollama.exe","D:\AI experiment\ollama\ollama.exe")) {
        if (Test-Path $p) { $ollama = $p; break }
    }
}
if (-not $ollama) { Write-Host "[remote] Ollama not found. Install it or start your powerhouse's .\llm.ps1." -ForegroundColor Red; exit 1 }
$py = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $py) { $py = (Get-Command py -ErrorAction SilentlyContinue).Source }
if (-not $py) { $py = "D:\AI experiment\python\python.exe" }

# --- 1) Ollama on localhost --------------------------------------------------
if (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port 11434 -InformationLevel Quiet)) {
    Write-Host "[remote] starting Ollama (localhost)..." -ForegroundColor Cyan
    Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit','-Command',"& '$ollama' serve")
    Start-Sleep -Seconds 2
}
Write-Host "[remote] ensuring model '$Model'..." -ForegroundColor Cyan
& $ollama pull $Model

# --- 2) keyed proxy ----------------------------------------------------------
Write-Host "[remote] starting the keyed proxy on :$ProxyPort..." -ForegroundColor Cyan
Start-Process -FilePath 'powershell' -ArgumentList @(
    '-NoExit','-Command',
    "`$env:GAME_AI_KEY='$key'; `$env:PROXY_PORT='$ProxyPort'; & '$py' '$(Join-Path $Root 'game-ai-proxy.py')'"
)
Start-Sleep -Seconds 2

# --- 3) Cloudflare tunnel (download once if missing) -------------------------
$cf = Join-Path $Root 'cloudflared.exe'
if (-not (Test-Path $cf)) {
    Write-Host "[remote] downloading cloudflared (one-time)..." -ForegroundColor Cyan
    Invoke-WebRequest -UseBasicParsing -OutFile $cf `
        -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
}
$log = Join-Path $env:TEMP 'faf-cf.err.log'
$out = Join-Path $env:TEMP 'faf-cf.out.log'
Remove-Item $log,$out -ErrorAction SilentlyContinue
Write-Host "[remote] opening the public tunnel..." -ForegroundColor Cyan
Start-Process -FilePath $cf -WindowStyle Hidden -RedirectStandardError $log -RedirectStandardOutput $out `
    -ArgumentList @('tunnel','--no-autoupdate','--url',"http://localhost:$ProxyPort")

$pub = $null
for ($i = 0; $i -lt 40 -and -not $pub; $i++) {
    Start-Sleep -Seconds 1
    $txt = ''
    if (Test-Path $log) { $txt += Get-Content $log -Raw -ErrorAction SilentlyContinue }
    if (Test-Path $out) { $txt += Get-Content $out -Raw -ErrorAction SilentlyContinue }
    $m = [regex]::Match($txt, 'https://[a-z0-9-]+\.trycloudflare\.com')
    if ($m.Success) { $pub = $m.Value }
}

Write-Host ""
if ($pub) {
    $enc  = [uri]::EscapeDataString($pub)
    $link = "$GamePages?aihost=$enc&aikey=$key"
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  OPEN THIS ON THE LAPTOP (any network) - auto-connects:" -ForegroundColor Green
    Write-Host "    $link" -ForegroundColor White
    Write-Host ""
    Write-Host "  Or connect manually on the start screen:" -ForegroundColor Green
    Write-Host "    Address: $pub" -ForegroundColor White
    Write-Host "    Key:     $key" -ForegroundColor White
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  Keep this window + the proxy/Ollama windows open while playing." -ForegroundColor DarkGray
    Write-Host "  Note: the free tunnel URL changes each run - re-share the link." -ForegroundColor DarkGray
} else {
    Write-Host "[remote] Couldn't read the tunnel URL yet. Check $out / $log," -ForegroundColor Yellow
    Write-Host "         then use the https://<id>.trycloudflare.com line with key $key." -ForegroundColor Yellow
}
