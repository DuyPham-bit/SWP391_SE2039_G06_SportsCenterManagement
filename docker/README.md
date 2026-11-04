# Chạy project bằng Docker

Yêu cầu: Docker Desktop đang chạy Linux containers.
Chạy các lệnh từ thư mục gốc project.

## Cấu hình lần đầu

```powershell
Copy-Item docker/.env.example docker/.env
```

Điền các giá trị thật vào docker/.env.

## Chạy bản đóng gói

```powershell
docker compose --env-file docker/.env -f docker/compose.yml up -d --build
```

## Chạy development có hot reload

```powershell
docker compose --env-file docker/.env -f docker/compose.yml -f docker/compose.dev.yml up -d
```

## Truy cập

Website: http://localhost:3004
API health: http://localhost:3004/api/health

## Dừng hệ thống, giữ database

```powershell
docker compose --env-file docker/.env -f docker/compose.yml down
```

Mỗi máy có database local riêng trong Docker volume.

Backend hiện dùng PostgreSQL (Npgsql), không chạy SQL Server. Source backend ở
`Backend/`; các migration SQL Server cũ chỉ là bản lưu trữ ngoài project.
Deploy Render theo [docs/Deploy.md](../docs/Deploy.md); giữ giá trị bí mật trong
Environment của từng service, không đưa `docker/.env` lên GitHub.
