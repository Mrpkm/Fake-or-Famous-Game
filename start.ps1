# start.ps1 - ONE command to play from anywhere (robust, self-healing).
#
# Run on the DESKTOP (it has the GPU). Starts the AI + a public https tunnel and
# prints/copies ONE link to open on the laptop. Run straight from GitHub:
#   irm https://raw.githubusercontent.com/Mrpkm/Fake-or-Famous-Game/main/start.ps1 | iex
#
# Anti-502 design: it prefers the keyed Python proxy, but if Python is missing or
# the proxy doesn't come up, it tunnels STRAIGHT to Ollama (with CORS enabled) so
# the tunnel always has a live origin to reach.

$ErrorActionPreference = 'Stop'
$Raw       = 'https://raw.githubusercontent.com/Mrpkm/Fake-or-Famous-Game/main'
$GamePages = 'https://mrpkm.github.io/Fake-or-Famous-Game/'
$Root      = Join-Path $env:USERPROFILE 'Fake-or-Famous-Game'
$ProxyPort = 11500
$Model     = 'qwen3:4b'
New-Item -ItemType Directory -Force -Path $Root | Out-Null

function Test-Http($url) {
    try { return (Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 3).StatusCode -eq 200 }
    catch { return $false }
}
function Wait-Http($url, $secs) {
    for ($i = 0; $i -lt $secs; $i++) { if (Test-Http $url) { return $true }; Start-Sleep 1 }
    return $false
}

# --- access key (made once, kept local, never published) ---------------------
$keyFile = Join-Path $Root '.game-ai-key'
$key = if (Test-Path $keyFile) { (Get-Content $keyFile -Raw).Trim() } else { '' }
if (-not $key) { $key = [guid]::NewGuid().ToString('N'); Set-Content -Path $keyFile -Value $key -Encoding ascii }

# --- locate Ollama (required) ------------------------------------------------
$ollama = (Get-Command ollama -ErrorAction SilentlyContinue).Source
if (-not $ollama) {
    foreach ($p in @("$env:LOCALAPPDATA\Programs\Ollama\ollama.exe","D:\AI experiment\ollama\ollama.exe")) {
        if (Test-Path $p) { $ollama = $p; break }
    }
}
if (-not $ollama) { Write-Host "[start] Ollama not found. Install it from https://ollama.com and re-run." -ForegroundColor Red; return }

# --- 1) make sure Ollama is up (start it WITH CORS so direct mode can work) ---
if (-not (Test-Http 'http://127.0.0.1:11434/api/tags')) {
    Write-Host "[start] starting Ollama..." -ForegroundColor Cyan
    Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit','-Command',
        "`$env:OLLAMA_ORIGINS='*'; & '$ollama' serve")
    if (-not (Wait-Http 'http://127.0.0.1:11434/api/tags' 20)) {
        Write-Host "[start] Ollama didn't answer on :11434 - check the window it opened." -ForegroundColor Red; return
    }
}
Write-Host "[start] ensuring model '$Model' (first run downloads it)..." -ForegroundColor Cyan
& $ollama pull $Model

# --- 2) try the keyed proxy (optional, needs Python) -------------------------
$py = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $py) { $py = (Get-Command py -ErrorAction SilentlyContinue).Source }
if (-not $py -and (Test-Path "D:\AI experiment\python\python.exe")) { $py = "D:\AI experiment\python\python.exe" }

$useProxy = $false
if ($py) {
    try {
        $proxyPath = Join-Path $Root 'game-ai-proxy.py'
        Invoke-WebRequest -UseBasicParsing -Uri "$Raw/game-ai-proxy.py" -OutFile $proxyPath
        Write-Host "[start] starting the keyed proxy on :$ProxyPort..." -ForegroundColor Cyan
        $proxyCmd = "`$env:GAME_AI_KEY='$key'; `$env:PROXY_PORT='$ProxyPort'; & `"$py`" `"$proxyPath`""
        Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit','-Command',$proxyCmd)
        $useProxy = Wait-Http "http://127.0.0.1:$ProxyPort/healthz" 12
    } catch { $useProxy = $false }
}

if ($useProxy) {
    $originPort = $ProxyPort
    Write-Host "[start] proxy is healthy - using the SECURE keyed gateway." -ForegroundColor Green
} else {
    $originPort = 11434
    Write-Host "[start] proxy unavailable - tunneling straight to Ollama (no key). The game still works." -ForegroundColor Yellow
}

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
Write-Host "[start] opening the public tunnel to :$originPort..." -ForegroundColor Cyan
Start-Process -FilePath $cf -WindowStyle Hidden -RedirectStandardError $errLog -RedirectStandardOutput $outLog `
    -ArgumentList @('tunnel','--no-autoupdate','--url',"http://localhost:$originPort")

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
    $link = if ($useProxy) { "$GamePages?aihost=$enc&aikey=$key" } else { "$GamePages?aihost=$enc" }
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  OPEN THIS ON THE LAPTOP (any network) - auto-connects:" -ForegroundColor Green
    Write-Host "    $link" -ForegroundColor White
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  Keep this + the Ollama/proxy windows open while playing." -ForegroundColor DarkGray
    Write-Host "  The free tunnel URL changes each run - re-share the link." -ForegroundColor DarkGray
    try { Set-Clipboard -Value $link; Write-Host "  (link copied to your clipboard)" -ForegroundColor DarkGray } catch {}
} else {
    Write-Host "[start] Tunnel URL not detected yet. Check $outLog / $errLog." -ForegroundColor Yellow
}
