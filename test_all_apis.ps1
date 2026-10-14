[CmdletBinding()]
param(
    [string]$BaseUrl = "http://localhost:54162"
)

$ErrorActionPreference = "Stop"

function Test-Endpoint($name, $scriptBlock) {
    try {
        $result = & $scriptBlock
        Write-Host " [PASS] $name" -ForegroundColor Green
        return $result
    } catch {
        Write-Host " [FAIL] $name : $_" -ForegroundColor Red
        return $null
    }
}

Write-Host "================================================="
Write-Host "   COMPREHENSIVE BACKEND API INTEGRATION TEST    "
Write-Host "================================================="

# 1. Health check
Test-Endpoint "GET /api/health" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get
    if ($res.status -ne "ok") { throw "Status is not ok" }
}

# 2. Login as Manager
$mgrToken = $null
Test-Endpoint "POST /api/auth/login (Manager)" {
    $body = @{ email = "manager01@sportscenter.vn"; password = "Manager@123456" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $body
    $script:mgrToken = $res.accessToken
    if (-not $res.accessToken) { throw "Missing accessToken" }
}
$mgrHeaders = @{ Authorization = "Bearer $mgrToken" }

# 3. Manager Profile & Capabilities
Test-Endpoint "GET /api/profile/me (Manager)" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/profile/me" -Headers $mgrHeaders
    if ($res.role -ne "MANAGER") { throw "Role is not MANAGER" }
}

Test-Endpoint "GET /api/access/me/capabilities (Manager)" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/access/me/capabilities" -Headers $mgrHeaders
    if ($res.Count -eq 0) { throw "No capabilities returned" }
}

# 4. Manager - Packages
Test-Endpoint "GET /api/centers/1/membership-packages/all" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/centers/1/membership-packages/all" -Headers $mgrHeaders
    if ($res.Count -eq 0) { throw "No packages returned" }
}

# 5. Manager - Staff
Test-Endpoint "GET /api/centers/1/staff" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/centers/1/staff" -Headers $mgrHeaders
    if ($res.Count -eq 0) { throw "No staff returned" }
}

# 6. Manager - Rooms & Sports
Test-Endpoint "GET /api/centers/1/rooms" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/centers/1/rooms" -Headers $mgrHeaders
    if ($res.Count -eq 0) { throw "No rooms returned" }
}

Test-Endpoint "GET /api/centers/1/sports" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/centers/1/sports" -Headers $mgrHeaders
    if ($res.Count -eq 0) { throw "No sports returned" }
}

Test-Endpoint "GET /api/centers/1/sports/all" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/centers/1/sports/all" -Headers $mgrHeaders
    if ($res.Count -eq 0) { throw "No sports returned" }
}

# 7. Manager - Classes
Test-Endpoint "GET /api/centers/1/classes/all" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/centers/1/classes/all" -Headers $mgrHeaders
    if ($res.Count -eq 0) { throw "No classes returned" }
}

# 8. Manager - Reports
Test-Endpoint "GET /api/reports/checkins" {
    $today = (Get-Date).ToString("yyyy-MM-dd")
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/reports/checkins?from=$today&to=$today" -Headers $mgrHeaders
    if ($null -eq $res.count) { throw "Count is null" }
}

Test-Endpoint "GET /api/reports/revenue" {
    $from = (Get-Date).AddMonths(-1).ToString("yyyy-MM-dd")
    $to = (Get-Date).ToString("yyyy-MM-dd")
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/reports/revenue?from=$from&to=$to&groupBy=day&centerId=1" -Headers $mgrHeaders
    if ($null -eq $res.net) { throw "Net revenue is null" }
}

Test-Endpoint "GET /api/reports/membership" {
    $from = (Get-Date).AddMonths(-1).ToString("yyyy-MM-dd")
    $to = (Get-Date).ToString("yyyy-MM-dd")
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/reports/membership?from=$from&to=$to&groupBy=day&centerId=1" -Headers $mgrHeaders
    if ($null -eq $res.totalMembers) { throw "Total members is null" }
}

Test-Endpoint "GET /api/reports/classes" {
    $from = (Get-Date).AddMonths(-1).ToString("yyyy-MM-dd")
    $to = (Get-Date).ToString("yyyy-MM-dd")
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/reports/classes?from=$from&to=$to&groupBy=day&centerId=1" -Headers $mgrHeaders
    if ($null -eq $res.currentStatusCounts) { throw "Status counts is null" }
}

# 9. Manager - Audit Logs & Roles/Permissions
Test-Endpoint "GET /api/centers/1/audit-logs" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/centers/1/audit-logs?page=1&pageSize=10" -Headers $mgrHeaders
    if ($null -eq $res.items) { throw "No audit logs returned" }
}

Test-Endpoint "GET /api/centers/1/roles" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/centers/1/roles" -Headers $mgrHeaders
    if ($res.Count -eq 0) { throw "No roles returned" }
}

# 10. Login as Receptionist
$recToken = $null
Test-Endpoint "POST /api/auth/login (Receptionist)" {
    $body = @{ email = "reception01@sportscenter.vn"; password = "Reception@123456" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $body
    $script:recToken = $res.accessToken
    if (-not $res.accessToken) { throw "Missing accessToken" }
}
$recHeaders = @{ Authorization = "Bearer $recToken" }

# 11. Receptionist - Member lookup & Check-in
Test-Endpoint "GET /api/centers/1/members?query=member" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/centers/1/members?query=member&page=1&pageSize=10" -Headers $recHeaders
    if ($null -eq $res.items) { throw "Items is null" }
}

Test-Endpoint "GET /api/centers/1/checkins/summary" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/centers/1/checkins/summary" -Headers $recHeaders
    if ($null -eq $res.totalCount) { throw "Total count is null" }
}

Test-Endpoint "GET /api/centers/1/checkins/today" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/centers/1/checkins/today" -Headers $recHeaders
    if ($null -eq $res) { throw "Result is null" }
}

Test-Endpoint "GET /api/centers/1/invoices" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/centers/1/invoices?page=1&pageSize=10" -Headers $recHeaders
    if ($null -eq $res.items) { throw "Invoices items is null" }
}

Test-Endpoint "GET /api/centers/1/support-requests" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/centers/1/support-requests?page=1&pageSize=10" -Headers $recHeaders
    if ($null -eq $res.items) { throw "Support requests items is null" }
}

# 12. Login as Coach
$cchToken = $null
Test-Endpoint "POST /api/auth/login (Coach)" {
    $body = @{ email = "coach01@sportscenter.vn"; password = "Coach@123456" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $body
    $script:cchToken = $res.accessToken
    if (-not $res.accessToken) { throw "Missing accessToken" }
}
$cchHeaders = @{ Authorization = "Bearer $cchToken" }

# 13. Coach - Schedule & Classes
Test-Endpoint "GET /api/coaches/me/teaching-schedule" {
    $today = (Get-Date).ToString("yyyy-MM-dd")
    $end = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/coaches/me/teaching-schedule?from=$today&to=$end" -Headers $cchHeaders
    if ($null -eq $res) { throw "Schedule is null" }
}

Test-Endpoint "GET /api/coaches/me/classes" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/coaches/me/classes" -Headers $cchHeaders
    if ($null -eq $res) { throw "Classes is null" }
}

Test-Endpoint "GET /api/coaches/me/training-plans" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/coaches/me/training-plans" -Headers $cchHeaders
    if ($null -eq $res) { throw "Plans is null" }
}

Test-Endpoint "GET /api/coaches/me/progress" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/coaches/me/progress" -Headers $cchHeaders
    if ($null -eq $res) { throw "Progress is null" }
}

Test-Endpoint "GET /api/coaches/me/notifications" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/coaches/me/notifications" -Headers $cchHeaders
    if ($null -eq $res) { throw "Notifications is null" }
}

# 14. Login as Member
$memToken = $null
Test-Endpoint "POST /api/auth/login (Member)" {
    $body = @{ email = "member@scms.vn"; password = "password123" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $body
    $script:memToken = $res.accessToken
    if (-not $res.accessToken) { throw "Missing accessToken" }
}
$memHeaders = @{ Authorization = "Bearer $memToken" }

# 15. Member - Profile, Subscriptions, Bookings
Test-Endpoint "GET /api/members/me" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/members/me" -Headers $memHeaders
    if ($res.memberCode -ne "MB00001") { throw "Member code is not MB00001" }
}

Test-Endpoint "GET /api/members/1/subscriptions" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/members/1/subscriptions" -Headers $memHeaders
    if ($null -eq $res) { throw "Subscriptions is null" }
}

Test-Endpoint "GET /api/class-sessions" {
    $today = (Get-Date).ToString("yyyy-MM-dd")
    $end = (Get-Date).AddDays(14).ToString("yyyy-MM-dd")
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/class-sessions?from=$today&to=$end&page=1&pageSize=10" -Headers $memHeaders
    if ($null -eq $res.items) { throw "Sessions is null" }
}

Test-Endpoint "GET /api/members/me/session-bookings" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/members/me/session-bookings" -Headers $memHeaders
    if ($null -eq $res) { throw "Bookings is null" }
}

Test-Endpoint "GET /api/members/me/session-waitlist" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/members/me/session-waitlist" -Headers $memHeaders
    if ($null -eq $res) { throw "Waitlist is null" }
}

Test-Endpoint "GET /api/members/me/training-plans" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/members/me/training-plans" -Headers $memHeaders
    if ($null -eq $res) { throw "Plans is null" }
}

Test-Endpoint "GET /api/members/me/progress" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/members/me/progress" -Headers $memHeaders
    if ($null -eq $res) { throw "Progress is null" }
}

Test-Endpoint "GET /api/notifications/me" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/notifications/me" -Headers $memHeaders
    if ($null -eq $res) { throw "Notifications is null" }
}

Test-Endpoint "GET /api/payments/my-pending-invoices" {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/payments/my-pending-invoices" -Headers $memHeaders
    if ($null -eq $res) { throw "Pending invoices is null" }
}

# 10. Registration & Direct Email/Password Auth Flow
Test-Endpoint "POST /api/auth/register (New Member Registration)" {
    $rnd = Get-Random -Minimum 10000 -Maximum 99999
    $newEmail = "member_test_$rnd@sportscenter.vn"
    $newPhone = "0977$rnd"
    $regPayload = @{
        username = "memtest$rnd"
        email = $newEmail
        fullName = "Test Registered Member $rnd"
        password = "Password@123456"
        phone = $newPhone
        centerId = 1
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $regPayload
    if (-not $res.fullName) { throw "Missing fullName in registration response" }

    # Verify logging in with newly registered account
    $loginPayload = @{
        email = $newEmail
        password = "Password@123456"
    } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginPayload
    if (-not $loginRes.accessToken) { throw "Missing accessToken for newly registered member" }
}

Write-Host "================================================="
Write-Host "             TEST SUITE COMPLETE                 "
Write-Host "================================================="
