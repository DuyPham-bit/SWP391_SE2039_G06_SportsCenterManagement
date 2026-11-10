# Database Setup - SportsCenterDB

Cơ sở dữ liệu SCMS sử dụng **SQL Server 2019/2022** và Entity Framework Core.

## Khởi tạo nhanh bằng 1 file SQL duy nhất

File [`SportsCenterDB.sql`](./SportsCenterDB.sql) chứa **toàn bộ**:
- Schema DDL (tạo bảng, index, constraints)
- EF Core Migrations
- Seed Data (Admin, HLV, Hội viên, Lớp học, Lịch tập)
- Demo Data (subscriptions, invoices, payments, check-ins, attendance)
- Revenue Distribution (phân bố doanh thu thực tế)

### Cách chạy:

1. Mở file `Backend/database/SportsCenterDB.sql` trong **SSMS** hoặc **Azure Data Studio**.
2. Kết nối tới SQL Server.
3. Nhấn **Execute (F5)**. File sẽ tự động tạo database `SportsCenterDB`, toàn bộ bảng và nạp dữ liệu mẫu hoàn chỉnh.

### Tài khoản mẫu sau khi chạy:
- **System Admin**: `admin` / `Admin@SCMS2026!Secure` (hoặc `Admin@123456`)
- **Manager**: `manager01` / `Member@123456`
- **Coach / Trainer**: `coach01` / `Member@123456`
- **Hội viên**: `FLOW2-MEM-001` / `Member@123456`

---

## Quản lý Migrations bằng EF Core (Dành cho Lập trình viên)

Từ thư mục `Backend`:

```powershell
# Cập nhật database theo Migration mới nhất
dotnet ef database update --project .\SportsCenterManagement.DAL\SportsCenterManagement.DAL.csproj --startup-project .\SportsCenterManagement.API\SportsCenterManagement.API.csproj

# Thêm Migration mới khi sửa Model
dotnet ef migrations add <TenMigration> --project .\SportsCenterManagement.DAL\SportsCenterManagement.DAL.csproj --startup-project .\SportsCenterManagement.API\SportsCenterManagement.API.csproj --output-dir Migrations
```
