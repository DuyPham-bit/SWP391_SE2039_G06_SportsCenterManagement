# Để mọi máy dùng chung

## Deploy một domain cho Wi-Fi và 4G

Compose đã sẵn sàng cho mô hình một domain: trình duyệt chỉ mở `https://app.example.com`; Nginx của Frontend chuyển `/api/*` và `/uploads/*` tới Backend trong mạng Docker. Vì API không được gọi trực tiếp từ trình duyệt, người dùng dùng Wi-Fi hay 4G đều truy cập cùng một URL, không cần biết IP hoặc cổng API.

1. Tạo DNS cho domain trỏ tới máy chủ, rồi cấu hình reverse proxy/hosting quản lý TLS để chuyển toàn bộ `https://app.example.com` tới `http://127.0.0.1:3004`. Không mở cổng SQL Server hoặc Backend ra Internet.
2. Sao chép `docker/.env.example` thành `docker/.env` và thay toàn bộ placeholder. Giá trị `FRONTEND_ORIGIN` phải đúng bằng domain HTTPS công khai, không có dấu `/` cuối. Giữ `DATABASE_BASELINE_LEGACY_SCHEMA=false` cho SQL Server Docker mới; chỉ bật `true` khi trỏ vào database SCMS cũ có schema legacy.
3. Nếu dùng email OTP, điền SMTP host, sender, username và password/app-password của nhà cung cấp bạn chọn vào các biến `EMAIL_SMTP_*`. Nếu để trống, ứng dụng vẫn chạy nhưng chức năng OTP email trả về 503.
4. Trên máy chủ, chạy từ thư mục gốc dự án:

   ```powershell
   docker compose --env-file docker/.env -f docker/docker-compose.yml up -d --build
   ```

5. Kiểm tra `https://app.example.com/api/health` trả `{"status":"ok"}`, sau đó thử đăng ký bằng một email mới để nhận OTP. Nếu SMTP key có ký tự `$`, đặt giá trị trong `docker/.env` bằng dấu nháy đơn để Docker Compose không nội suy nó.

Backend và SQL Server chỉ bind vào `127.0.0.1`; reverse proxy HTTPS trên máy chủ là điểm vào công khai duy nhất. Nếu nhà cung cấp SMTP có chặn IP, chỉ cho phép IP công khai của **máy chủ**, không phải IP Wi-Fi/4G của khách dùng website.

1. Đưa Frontend, Backend và một SQL Server lên cùng dịch vụ máy chủ.
2. Gắn tên miền và bật HTTPS.
3. Cấu hình web server để `/api` chuyển tới Backend. Frontend đã dùng `/api` tự động.
4. Cấu hình Backend trỏ tới SQL Server đó, rồi tạo tài khoản quản trị đầu tiên.

Nếu backend phục vụ cả giao diện, chạy `npm.cmd run build:api` trong `Frontend/` trước khi publish backend. Thư mục `wwwroot` là đầu ra build tự tạo; giữ tài nguyên nguồn trong `Frontend/public/`. Nếu triển khai frontend riêng, chạy `npm.cmd run build` và phục vụ `Frontend/dist`.

Xác thực dùng JWT Bearer; backend cần khóa ký JWT riêng và frontend giữ JWT trong bộ nhớ từng tab. Không cấu hình Session đăng nhập hoặc cookie xác thực. F5 cần đăng nhập lại, mỗi tab có thể dùng tài khoản khác nhau.

Mọi người mở cùng tên miền và đăng nhập bằng tài khoản riêng. Dữ liệu lưu ở SQL Server chung. Không cần cài Backend hay database trên từng máy.

Để đưa hệ thống lên thật, cần có dịch vụ máy chủ và tên miền. Hiện workspace chưa kết nối với dịch vụ nào.

## Dùng chung SQL trong mạng LAN

Chạy một backend trên máy giữ kết nối SQL, rồi mọi máy mở cùng địa chỉ backend. Không chạy frontend/API riêng với database riêng trên từng máy.

Từ workspace, dừng bản backend đang giữ cổng 54162 rồi chạy:

```powershell
.\Backend\start-shared.ps1
```

Script build frontend với `/api`, giữ cấu hình SQL/JWT hiện có và lắng nghe ở cổng 54162 trên các giao diện mạng. Dữ liệu demo được tắt. Script không thay file cấu hình, không tự mở firewall và không xóa/reset database. Các máy trong LAN mở `http://DESKTOP-M1NP3N6:54162` hoặc `http://<IP-máy-chạy-backend>:54162`; nếu không truy cập được, kiểm tra kết nối LAN và inbound rule của cổng này trên máy backend. Đây là cách chạy trong mạng nội bộ; triển khai Internet dùng HTTPS theo phần trên.

Nếu cần trỏ backend tới SQL Server khác bằng Windows Authentication:

```powershell
.\Backend\start-shared.ps1 -SqlServer 'TEN-SQL-SERVER' -Database 'SportsCenterManagement'
```

SQL Authentication được cung cấp bằng `ConnectionStrings__SportsCenter` hoặc User Secrets, không đưa mật khẩu vào source. Tài khoản chạy backend phải có quyền truy cập SQL đã chọn. Frontend đăng ký cần `VITE_SPORTS_CENTER_ID` trùng một center đang hoạt động trong database đó; database hiện tại có center 15. Build lại frontend nếu đổi center.

**Cùng một database mới chia sẻ dữ liệu.** Cài SQL Server cùng phiên bản, tạo database cùng tên hoặc chạy lại script tạo bảng trên máy khác không chép các tài khoản/bản ghi đã lưu. Nếu chuyển hẳn database sang máy khác, cần backup/restore cả dữ liệu rồi cấu hình backend trỏ tới bản đã restore. Không ghi đè database đang dùng bằng script reset.

Chi tiết nguyên nhân, bản sửa và kiểm chứng: [lưu dữ liệu SQL](Frontend/docs/sql-persistence-fix.md).
