# SCMS Full-Stack Graceful Shutdown
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ports = @(5000, 3004)
foreach ($p in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns.OwningProcess | Select-Object -Unique
        foreach ($id in $pids) {
            $proc = Get-Process -Id $id -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "[STOP] Dang dung tien trinh $($proc.ProcessName) tren cong $p (PID: $id)..." -ForegroundColor Yellow
                Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
            }
        }
    }
}
Write-Host ""
Write-Host "[SUCCESS] He thong BE & FE tren cong 5000 va 3004 da duoc dung hoan toan!" -ForegroundColor Green
