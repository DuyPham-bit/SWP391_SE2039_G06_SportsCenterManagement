# SQL Server Container Configuration

- Image: `mcr.microsoft.com/mssql/server:2022-latest`
- Cổng mặc định: `1433`
- Database: `SportsCenterManagement`
- Tài khoản: `sa`
- Mật khẩu: `YourStrong@Password123` (cấu hình qua biến `MSSQL_SA_PASSWORD`)
- Cơ chế khởi tạo: ASP.NET Core API sẽ tự động kết nối, chạy migration/DbInitializer để tạo đầy đủ schema và seed dữ liệu demo khi container backend khởi động.