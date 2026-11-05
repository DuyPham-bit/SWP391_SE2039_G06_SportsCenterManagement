# Demo miễn phí: Vercel + Cloudflare Quick Tunnel

Kiến trúc demo này giữ nguyên ASP.NET Core 10 và SQL Server trên máy Windows:

```text
Vercel (React/Vite) -- HTTPS --> Cloudflare Quick Tunnel --> API localhost:5000 --> SQL Server local
```

Máy Windows phải luôn bật, có Internet, SQL Server chạy và API chạy thì demo mới hoạt động.
Không public cổng SQL Server hoặc port 5000 trên router/firewall.

## Một lần trước khi chạy

1. Cài `cloudflared`:

   ```powershell
   winget install --id Cloudflare.cloudflared -e
   ```

2. Vào Vercel, import repository. Giữ Root Directory là `.` để dùng `vercel.json`
   đã có trong repository.
3. Chưa đặt `VITE_API_BASE_URL` vì URL Quick Tunnel chỉ có sau khi chạy Tunnel.

## Mỗi lần demo

1. Mở PowerShell tại thư mục gốc project và khởi động API:

   ```powershell
   .\start-backend-persistent.bat
   ```

2. Mở PowerShell khác, tạo Tunnel:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\Backend\start-cloudflare-quick-tunnel.ps1
   ```

   Script xác thực `http://127.0.0.1:5000/health/live` trước khi tạo tunnel,
   rồi in URL dạng `https://<random>.trycloudflare.com`.

3. Trên Vercel > Settings > Environment Variables, đặt cho Production:

   ```text
   VITE_API_BASE_URL=https://<random>.trycloudflare.com/api
   VITE_SPORTS_CENTER_ID=15
   VITE_GOOGLE_CLIENT_ID=<Google Web Client ID, nếu dùng>
   ```

   Sau đó redeploy frontend. Mỗi khi Quick Tunnel đổi URL, cập nhật biến này và
   redeploy lại.

4. Trên máy chạy API, đặt các biến môi trường trước khi khởi động backend:

   ```powershell
   $env:Cors__AllowedOrigins__0 = 'https://<ten-du-an>.vercel.app'
   $env:Authentication__AllowCrossSiteCookies = 'true'
   ```

   `Authentication__AllowCrossSiteCookies=true` chỉ dành cho Quick Tunnel:
   cookie phải là `SameSite=None; Secure` để Vercel và `trycloudflare.com` trao
   đổi phiên. CORS luôn phải là origin Vercel chính xác, không dùng `*`.

## Kiểm tra

- Mở `https://<random>.trycloudflare.com/health/live`: phải nhận HTTP 200.
- Mở frontend Vercel, đăng nhập rồi refresh trang.
- Trong DevTools > Network, xác nhận request đi tới hostname `trycloudflare.com`.

## Khi dùng domain riêng

Dùng Named Tunnel với `app.tenmien.com` (Vercel) và `api.tenmien.com`
(Cloudflare Tunnel). Khi đó đặt `Authentication__AllowCrossSiteCookies=false` và
`Cors__AllowedOrigins__0=https://app.tenmien.com`; cookie `SameSite=Strict` sẽ
hoạt động do hai hostname cùng site. Cloudflare hướng dẫn tạo Named Tunnel tại
https://developers.cloudflare.com/tunnel/get-started/.
