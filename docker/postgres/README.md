# PostgreSQL Container Configuration

- Image: `postgres:17-alpine` (extension `citext` dùng cho các cột chuỗi không phân biệt hoa thường)
- Cổng: `127.0.0.1:${POSTGRES_PORT:-5432}`
- Database: `SportsCenterDB`
- Tài khoản: `postgres`, mật khẩu lấy từ `POSTGRES_PASSWORD` trong `docker/.env`
- Volume dữ liệu: `scms_postgres_data`

Backend tự tạo database (nếu chưa có) và áp EF Core migrations khi khởi động.
Muốn nạp sẵn dữ liệu mẫu: `psql -U postgres -d SportsCenterDB -f Backend/database/SportsCenterDB.sql` trên database trống.
