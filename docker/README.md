# SCMS - Hướng Dẫn Chạy Docker (Docker Deployment Guide)

Thư mục này chứa toàn bộ cấu hình container hóa cho hệ thống **Sports Center Management System (SCMS)** gồm 3 dịch vụ đồng bộ:
1. **sqlserver**: Microsoft SQL Server 2022.
2. **backend**: ASP.NET Core 10 Web API.
3. **frontend**: React (Vite) + Nginx Alpine reverse proxy.

---

## 📁 Cấu trúc thư mục `docker/`

```text
docker/
├── docker-compose.yml       # File điều phối khởi động cả 3 container
├── .env.example             # Biến môi trường mẫu
├── .env                     # Biến môi trường đang áp dụng
├── backend/
│   ├── Dockerfile           # Multi-stage build cho ASP.NET Core 10
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile           # Build Vite và chạy bằng Nginx
│   ├── nginx.conf           # Cấu hình reverse proxy /api/ và SPA routing
│   └── .dockerignore
└── sqlserver/
    └── README.md            # Thông tin cơ sở dữ liệu
```

---

## 🚀 Cách khởi chạy

### Cách 1: Chạy trực tiếp từ thư mục `docker/`
```bash
cd docker
docker compose up -d --build
```

### Cách 2: Chạy từ thư mục gốc của dự án (Root)
```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --build
```
*(Hoặc dùng trực tiếp `docker compose up -d --build` tại thư mục gốc vì đã đồng bộ sẵn)*

---

## 🌐 Các cổng truy cập sau khi khởi chạy:
- **Frontend App:** [http://localhost:3004](http://localhost:3004)
- **Backend API & Swagger:** [http://localhost:5000/swagger](http://localhost:5000/swagger)
- **SQL Server:** `localhost,1433` (User: `sa`, Mật khẩu mặc định: `YourStrong@Password123`)

---

## 🔑 Tài khoản Admin mặc định hệ thống:
- **Username:** `admin`
- **Mật khẩu:** `Admin@SCMS2026!Secure`
- **Email:** `admin@sportscenter.vn`

---

## 🛑 Các lệnh quản trị thường dùng:
```bash
# Xem trạng thái các container
docker compose ps

# Xem log thời gian thực
docker compose logs -f

# Dừng hệ thống
docker compose down

# Dừng và xóa toàn bộ dữ liệu volume SQL
docker compose down -v
```