# Sports Center Management System

## Mục tiêu

Sports Center Management System là hệ thống quản lý trung tâm thể thao. Hệ thống hỗ trợ quản lý hội viên, gói tập, lớp học, lịch tập, huấn luyện viên, thu ngân, thanh toán và báo cáo.

## Công nghệ

- Frontend: React 18, Vite và JavaScript.
- Backend: ASP.NET Core Web API trên .NET 10.
- Cơ sở dữ liệu: SQL Server, Entity Framework Core 10; Dapper được dùng cho truy vấn báo cáo vận hành cần gộp dữ liệu hiệu năng cao.
- Xác thực: JWT Bearer.
- Tích hợp tùy chọn: Google Login, Gemini AI, VNPay và MoMo.

## Vai trò người dùng

- System Admin: quản lý vai trò, quyền và audit log toàn hệ thống.
- Manager: quản lý nhân sự, hội viên, gói tập, lớp học, phòng tập, báo cáo và nghiệp vụ thuộc trung tâm được phân công.
- Receptionist: tra cứu hội viên, thu ngân, đăng ký gói tại quầy và check-in.
- Coach: xem lịch dạy, học viên, điểm danh, giáo án và tiến độ tập luyện.
- Member: quản lý hồ sơ, mua gói, xem lịch, đặt hoặc hủy chỗ, theo dõi tiến độ và gửi yêu cầu hỗ trợ.

## Chức năng chính

- Đăng ký, đăng nhập, xác thực email OTP, đổi và đặt lại mật khẩu.
- Quản lý trung tâm, nhân sự, hội viên, gói tập, môn thể thao, phòng, lớp và lịch học.
- Đặt chỗ, danh sách chờ, hủy chỗ, check-in và điểm danh.
- Thanh toán tại quầy hoặc trực tuyến qua VNPay/MoMo; hỗ trợ hoàn tiền và đối soát.
- Báo cáo doanh thu, hội viên, lớp học và vận hành.
- Thông báo, yêu cầu hỗ trợ, giáo án, theo dõi tiến độ và tính năng AI khi đã cấu hình nhà cung cấp.

## Kiến trúc

```text
Frontend React/Vite
        |
ASP.NET Core Web API
        |
BLL: nghiệp vụ và DTO
        |
DAL: EF Core/Dapper, SQL Server
```

Backend chia thành ba layer: API, BLL và DAL. Dữ liệu được bảo vệ bằng JWT, kiểm tra quyền và phạm vi trung tâm ở backend. Thông tin bí mật không được lưu trong source code.

## Chạy local

1. Cài .NET SDK 10, Node.js và SQL Server/LocalDB.
2. Cấu hình `ConnectionStrings__SportsCenter` và `Jwt__Key` (ít nhất 32 byte). Không commit secret thật.
3. Chạy backend:

   ```powershell
   dotnet restore .\Backend\SportsCenterManagement.API\SportsCenterManagement.API.csproj
   dotnet run --project .\Backend\SportsCenterManagement.API\SportsCenterManagement.API.csproj
   ```

4. Chạy frontend:

   ```powershell
   cd .\Frontend
   npm ci
   npm run dev
   ```

Frontend mặc định chạy ở `http://localhost:3004`; API dùng launch profile cấu hình cho môi trường local.

## Kiểm tra cơ bản

```powershell
dotnet build .\Backend\SportsCenterManagement.API\SportsCenterManagement.API.csproj

cd .\Frontend
npm test
npm run build
```

## Ghi chú nộp bài

Tài liệu này là tài liệu duy nhất trong thư mục `docs/` phục vụ mô tả tổng quan khi nộp bài. Hướng dẫn chi tiết nội bộ, log kiểm thử, audit, checklist và lịch sử sửa lỗi đã được loại bỏ để giữ workspace gọn nhẹ.
