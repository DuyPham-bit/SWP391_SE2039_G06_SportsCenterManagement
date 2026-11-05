# Triển khai frontend lên Vercel

`vercel.json` ở thư mục gốc đã cấu hình Vercel build ứng dụng React/Vite trong
`Frontend/`. Vercel chỉ phục vụ frontend tĩnh; API ASP.NET Core và SQL Server
phải được triển khai riêng trên một máy chủ hỗ trợ .NET.

## Chuẩn bị API production

1. Triển khai `Backend/SportsCenterManagement.API` cùng SQL Server, qua HTTPS.
   Kiểm tra endpoint `https://api.example.com/health/live` trả kết quả thành công.
2. Dùng hai subdomain cùng site, ví dụ `app.example.com` (Vercel) và
   `api.example.com` (API). Cách này tương thích với cookie phiên `SameSite=Strict`
   hiện có. Nếu dùng hai tên miền khác site, đăng nhập bằng cookie sẽ không hoạt động.
3. Trên môi trường API, đặt các biến tối thiểu sau (không đưa secret vào Vercel):

   ```text
   ConnectionStrings__SportsCenter=<chuỗi kết nối SQL Server production>
   Jwt__Key=<khóa bí mật dài tối thiểu 32 byte>
   Cors__AllowedOrigins__0=https://app.example.com
   ```

   Đồng thời thay các URL callback thanh toán (`VnPay__ReturnUrl`,
   `Momo__ReturnUrl`, `Momo__NotifyUrl`) bằng URL HTTPS production nếu các cổng
   thanh toán được sử dụng. Xem `Backend/.env.example` để biết các cấu hình backend
   còn lại như email, Google và AI.

## Tạo project trên Vercel

1. Đẩy repository lên GitHub và import repository đó trong Vercel.
2. Giữ **Root Directory** là `.`. Vercel sẽ đọc `vercel.json`; không cần đổi Build
   Command hay Output Directory trên giao diện.
3. Trong **Settings → Environment Variables**, thêm cho cả Production (và Preview
   khi có API preview tương ứng):

   ```text
   VITE_API_BASE_URL=https://api.example.com/api
   VITE_SPORTS_CENTER_ID=<ID trung tâm đang dùng>
   VITE_GOOGLE_CLIENT_ID=<Google OAuth Web Client ID, nếu bật đăng nhập Google>
   ```

   `VITE_*` được đóng gói vào JavaScript phía trình duyệt, vì vậy không đặt JWT key,
   mật khẩu SQL Server, API key AI, SMTP hay khóa thanh toán ở đây.
4. Deploy. Sau khi có domain Vercel thật, thay `Cors__AllowedOrigins__0` trên API
   bằng đúng origin đó (không có dấu `/` cuối) và khởi động lại API.

## Kiểm tra sau deploy

1. Mở frontend, đăng nhập và tải lại trang để xác nhận cookie phiên còn hiệu lực.
2. Kiểm tra Network: yêu cầu API phải đi tới `https://api.example.com/api/...`,
   không phải `/api` trên domain Vercel.
3. Kiểm tra luồng đăng ký, upload và thanh toán nếu các tính năng này được bật.

## Rollback

Trong Vercel, chọn deployment trước đó rồi **Promote to Production**. Giữ API
backward-compatible với frontend đang được rollback; nếu URL API hoặc CORS thay đổi,
khôi phục giá trị biến môi trường/API tương ứng trước khi promote.
