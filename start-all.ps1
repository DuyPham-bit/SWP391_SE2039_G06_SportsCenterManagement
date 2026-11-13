# =============================================================================
# SCMS - Sports Center Management System
# Full-Stack Automated Launcher (Backend .NET 10/PostgreSQL + Frontend Vite/React)
# =============================================================================
[CmdletBinding()]
param(
    [int]$BackendPort = 5000,
    [int]$FrontendPort = 3004,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$root = $PSScriptRoot
$backendDir = Join-Path $root 'Backend\SportsCenterManagement.API'
$frontendDir = Join-Path $root 'Frontend'
$startBackendBat = Join-Path $root 'start-backend.bat'
$startFrontendBat = Join-Path $root 'start-frontend.bat'
$startPgBat = Join-Path $root 'start-postgres.bat'

function Test-PortOpen {
    param([string]$Address = '127.0.0.1', [int]$Port = 5432, [int]$TimeoutMs = 800)
    $tcp = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $tcp.BeginConnect($Address, $Port, $null, $null)
        $wait = $iar.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
        if (-not $wait) {
            $tcp.Close()
            return $false
        }
        $tcp.EndConnect($iar)
        $tcp.Close()
        return $true
    } catch {
        try { $tcp.Close() } catch { }
        return $false
    }
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "   KHOI DONG HE THONG SPORTS CENTER MANAGEMENT (BE & FE)" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kiem tra co so du lieu PostgreSQL (Port 5432)
Write-Host "[1/5] Kiem tra dich vu co so du lieu PostgreSQL (Port 5432)..." -ForegroundColor Yellow
$pgReady = Test-PortOpen -Address '127.0.0.1' -Port 5432

if (-not $pgReady) {
    # Kiem tra Docker Desktop co dang chay khong
    $dockerRunning = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match "docker" }
    if (-not $dockerRunning) {
        $dockerExe = "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe"
        if (-not (Test-Path $dockerExe)) {
            $dockerExe = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
        }
        if (Test-Path $dockerExe) {
            Write-Host "  -> Docker Desktop chua chay. Dang tu dong bat Docker Desktop..." -ForegroundColor Yellow
            Start-Process $dockerExe -WindowStyle Minimized -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 6
        }
    }

    Write-Host "  -> Dang khoi dong container PostgreSQL (Docker)..." -ForegroundColor Yellow
    if (Test-Path $startPgBat) {
        try {
            Start-Process "cmd.exe" -ArgumentList "/c `"`"$startPgBat`"`"" -Wait -WindowStyle Minimized -ErrorAction SilentlyContinue
        } catch { }
    }
    
    # Kiem tra lai port 5432 trong toi da 15 giay
    $deadline = (Get-Date).AddSeconds(15)
    while (-not $pgReady -and (Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 1
        $pgReady = Test-PortOpen -Address '127.0.0.1' -Port 5432
    }
}

if ($pgReady) {
    Write-Host "  -> PostgreSQL (127.0.0.1:5432) da san sang!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=====================================================================" -ForegroundColor Red
    Write-Host "  [LOI] KHONG THE KET NOI DEN POSTGRESQL (127.0.0.1:5432)!" -ForegroundColor Red
    Write-Host "=====================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Nguyen nhan: Ung dung Docker Desktop tren may chua duoc mo." -ForegroundColor Yellow
    Write-Host "  Cac buoc xu ly:" -ForegroundColor Cyan
    Write-Host "    1. Hay mo ung dung 'Docker Desktop' tren Windows." -ForegroundColor White
    Write-Host "    2. Doi Docker hien thong bao 'Engine running' (bieu tuong mau xanh)." -ForegroundColor White
    Write-Host "    3. Nhan chay lai file: start-all.bat" -ForegroundColor White
    Write-Host ""
    Write-Host "  He thong tam dung de tranh crash Backend khi thieu Database." -ForegroundColor DarkGray
    Write-Host "=====================================================================" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# 2. Giai phong cong 5000 va 3004 neu co tien trinh cu
Write-Host "[2/5] Kiem tra cong ket noi ($BackendPort & $FrontendPort)..." -ForegroundColor Yellow
$portsToCheck = @($BackendPort, $FrontendPort)
foreach ($port in $portsToCheck) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns.OwningProcess | Select-Object -Unique
        foreach ($pidToKill in $pids) {
            $p = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
            if ($p) {
                Write-Host "  -> Dang giai phong cong $port tu tien trinh cu: $($p.ProcessName) (PID: $pidToKill)..." -ForegroundColor DarkGray
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            }
        }
    }
}
Write-Host "  -> Cong $BackendPort va $FrontendPort da san sang." -ForegroundColor Green

# 3. Kiem tra file cau hinh Frontend (.env / .env.local)
Write-Host "[3/5] Cau hinh moi truong Frontend..." -ForegroundColor Yellow
$frontendEnvLocal = Join-Path $frontendDir '.env.local'
$frontendEnv = Join-Path $frontendDir '.env'

$envLines = @(
    "# Local development uses Vite /api proxy."
    "VITE_API_BASE_URL=/api"
    "# Vite development/preview proxy destination"
    "SCMS_API_PROXY_TARGET=http://localhost:$BackendPort"
    "# Active center ID in the database (Sports Center Quan 1)"
    "VITE_SPORTS_CENTER_ID=1"
    "VITE_GOOGLE_CLIENT_ID="
)
$envContent = $envLines -join [Environment]::NewLine

if (-not (Test-Path $frontendEnvLocal)) {
    [System.IO.File]::WriteAllText($frontendEnvLocal, $envContent, [System.Text.Encoding]::UTF8)
    Write-Host "  -> Da tao file Frontend/.env.local (Center ID = 1)" -ForegroundColor Green
} else {
    Write-Host "  -> Da xac nhan file Frontend/.env.local hop le." -ForegroundColor Green
}

if (-not (Test-Path $frontendEnv)) {
    [System.IO.File]::WriteAllText($frontendEnv, $envContent, [System.Text.Encoding]::UTF8)
}

# 4. Khoi chay Backend API (Port 5000)
Write-Host "[4/5] Dang khoi chay Backend API (ASP.NET Core)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "call `"$startBackendBat`"" -WindowStyle Normal

# Cho Backend API san sang qua health check
Write-Host "  -> Dang cho Backend API khoi dong tai http://localhost:$BackendPort/api/health ..." -NoNewline
$backendReady = $false
$retryCount = 0
$maxRetries = 30

while (-not $backendReady -and $retryCount -lt $maxRetries) {
    Start-Sleep -Milliseconds 1000
    $retryCount++
    if (Test-PortOpen -Port $BackendPort) {
        try {
            $health = Invoke-RestMethod -Uri "http://localhost:$BackendPort/api/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
            if ($health.status -eq 'Healthy') {
                $backendReady = $true
            }
        } catch {
            Write-Host "." -NoNewline
        }
    } else {
        Write-Host "." -NoNewline
    }
}
Write-Host ""

if ($backendReady) {
    Write-Host "  -> Backend API da san sang! (Status: Healthy, DB: Connected)" -ForegroundColor Green
} else {
    Write-Warning "Backend mat nhieu thoi gian hon du kien. Vui long xem cua so cmd 'SCMS Backend API Server'."
}

# 5. Khoi chay Frontend Dev Server (Port 3004)
Write-Host "[5/5] Dang khoi chay Frontend Vite (Port $FrontendPort)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "call `"$startFrontendBat`"" -WindowStyle Normal

# Cho Frontend san sang
Write-Host "  -> Dang cho Frontend khoi dong tai http://localhost:$FrontendPort ..." -NoNewline
$frontendReady = $false
$retryCount = 0
$maxRetries = 20

while (-not $frontendReady -and $retryCount -lt $maxRetries) {
    Start-Sleep -Milliseconds 800
    $retryCount++
    if (Test-PortOpen -Port $FrontendPort) {
        $frontendReady = $true
    } else {
        Write-Host "." -NoNewline
    }
}
Write-Host ""

if ($frontendReady) {
    Write-Host "  -> Frontend Dev Server da san sang!" -ForegroundColor Green
}

# Mo trinh duyet
if (-not $NoBrowser) {
    Write-Host "  -> Dang mo trinh duyet toi http://localhost:$FrontendPort ..." -ForegroundColor Cyan
    Start-Process "http://localhost:$FrontendPort"
}

# In bang thong tin tong ket
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "             HE THONG DA KHOI DONG THANH CONG!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  * Giao dien nguoi dung (FE):   http://localhost:$FrontendPort" -ForegroundColor White
Write-Host "  * Backend API Swagger:          http://localhost:$BackendPort/swagger" -ForegroundColor White
Write-Host "  * Kiem tra trang thai API:      http://localhost:$BackendPort/api/health" -ForegroundColor White
Write-Host ""
Write-Host "---------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  TAI KHOAN TRAI NGHIEM HE THONG:" -ForegroundColor Yellow
Write-Host "  - System Admin:  admin@sportscenter.vn        / Admin@123456" -ForegroundColor White
Write-Host "  - Quan ly:       manager01@sportscenter.vn    / Manager@123456" -ForegroundColor White
Write-Host "  - Le tan quay:   reception01@sportscenter.vn  / Reception@123456" -ForegroundColor White
Write-Host "  - Huan luyen:    coach01@sportscenter.vn      / Coach@123456" -ForegroundColor White
Write-Host "  - Hoi vien:      flow2.member.a@sportscenter.vn / Member@123456" -ForegroundColor White
Write-Host "---------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  * Luu y: Giu nguyen 2 cua so cmd cua Backend va Frontend khi dung." -ForegroundColor Cyan
Write-Host "  * Khi muon tat he thong, chi can chay file: stop-all.bat" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
