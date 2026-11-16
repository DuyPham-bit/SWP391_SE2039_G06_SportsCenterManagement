# Sports Center Management (SCMS)

Phần mềm quản lý trung tâm thể thao: hội viên mua gói tập, đặt lớp học; huấn luyện viên (HLV) điểm danh, lên giáo án; lễ tân bán gói, thu tiền tại quầy; quản lý xem báo cáo.

Tài liệu này dành cho **người mới**: làm theo từng bước là chạy được trên máy của bạn.

---

## 1. Dự án gồm những gì?

| Phần | Là gì | Địa chỉ khi chạy |
|---|---|---|
| `Frontend/` | Giao diện web (React) | http://localhost:3004 |
| `Backend/` | Máy chủ API (ASP.NET Core .NET 10) | http://localhost:5000 |
| Database | PostgreSQL, lưu toàn bộ dữ liệu | `localhost:5432` |

Frontend gọi Backend, Backend đọc/ghi Database. Phải có cả ba thì ứng dụng mới chạy được.

---

## 2. Cài đặt công cụ (làm một lần)

| Công cụ | Dùng để | Tải về |
|---|---|---|
| **Git** | Tải mã nguồn | https://git-scm.com |
| **Docker Desktop** | Chạy PostgreSQL (hoặc cả hệ thống) mà không cần cài tay | https://www.docker.com/products/docker-desktop |
| **.NET SDK 10** | Chạy Backend | https://dotnet.microsoft.com/download |
| **Node.js 18+** (kèm npm) | Chạy Frontend | https://nodejs.org |

Kiểm tra đã cài đúng chưa (mở PowerShell):

```powershell
git --version
docker --version
dotnet --version   # phải bắt đầu bằng 10.
node --version     # v18 trở lên
```

> Nếu chỉ dùng **Cách A (Docker)** bên dưới thì chỉ cần Git + Docker Desktop.

---

## 3. Chọn cách chạy

| | Cách A — Docker | Cách B — Chạy từng phần (cho dev) |
|---|---|---|
| Phù hợp | Muốn xem/dùng thử nhanh | Muốn sửa code, thấy thay đổi ngay |
| Cần cài | Git, Docker | Git, Docker, .NET 10, Node.js |
| Số lệnh | 2 | ~6 |

### Cách A — Chạy toàn bộ bằng Docker (dễ nhất)

**Bước 1.** Tạo file cấu hình từ file mẫu:

```powershell
copy docker\.env.example docker\.env
```

**Bước 2.** Mở `docker\.env` và sửa **tối thiểu** các dòng sau (thay `replace-with-...` bằng giá trị của bạn):

| Biến | Ý nghĩa | Ví dụ |
|---|---|---|
| `POSTGRES_PASSWORD` | Mật khẩu database | `MyDbPass#2026` |
| `ADMIN_USERNAME` | Tên đăng nhập quản trị viên đầu tiên | `admin` |
| `ADMIN_EMAIL` | Email quản trị viên | `admin@example.com` |
| `ADMIN_PASSWORD` | Mật khẩu quản trị viên | `Admin#Strong2026` |
| `JWT_KEY` | Chuỗi bí mật ngẫu nhiên, **≥ 32 ký tự** | `k8Jq...` (32+ ký tự bất kỳ) |
| `FRONTEND_ORIGIN` | Chạy trên máy mình thì để | `http://localhost:3004` |

> Mật khẩu cần ≥ 6 ký tự, có **chữ hoa, chữ thường, số và ký tự đặc biệt**.
> Email, AI, Google Login là **tùy chọn** — để trống vẫn chạy được (xem [mục 6](#6-tính-năng-tùy-chọn)).

**Bước 3.** Khởi động:

```powershell
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --build
```

Lần đầu mất vài phút để tải và build. Xong thì mở **http://localhost:3004**.

Dừng hệ thống: `docker compose -f docker/docker-compose.yml --env-file docker/.env down`

### Cách B — Chạy Backend và Frontend riêng (cho developer)

**Bước 1. Bật database.** Làm Bước 1–2 của Cách A để có `docker\.env`, sau đó:

```powershell
scripts\start-postgres.bat
```

**Bước 2. Cấu hình Backend** (làm một lần trên mỗi máy, lưu bằng User Secrets — không ghi vào code):

```powershell
cd Backend
dotnet user-secrets set "ConnectionStrings:SportsCenter" "Host=localhost;Port=5432;Database=SportsCenterDB;Username=postgres;Password=<POSTGRES_PASSWORD>" --project .\SportsCenterManagement.API
dotnet user-secrets set "Jwt:Key" "<chuỗi bí mật ≥ 32 ký tự>" --project .\SportsCenterManagement.API
cd ..
```

Database mới tinh chưa có quản trị viên → đặt thêm 3 biến này **trong cùng cửa sổ PowerShell** trước khi chạy API (chỉ cần lần đầu):

```powershell
$env:Bootstrap__SystemAdmin__Username = "admin"
$env:Bootstrap__SystemAdmin__Email    = "admin@example.com"
$env:Bootstrap__SystemAdmin__Password = "Admin#Strong2026"
```

**Bước 3. Chạy Backend:**

```powershell
powershell -ExecutionPolicy Bypass -File .\Backend\start-shared.ps1
```

Script tự kiểm tra database, tự cập nhật bảng và chạy API ở http://localhost:5000. Giữ nguyên cửa sổ này.

**Bước 4. Chạy Frontend** (mở cửa sổ PowerShell **mới**):

```powershell
cd Frontend
copy .env.example .env.local
npm ci
npm run dev
```

Mở **http://localhost:3004**. Sửa code frontend sẽ thấy thay đổi ngay.

---

## 4. Lần đầu sử dụng

Database mới chỉ có tài khoản quản trị viên. Làm theo thứ tự:

1. **Đăng nhập System Admin** bằng `ADMIN_USERNAME` / `ADMIN_PASSWORD` đã đặt ở trên.
2. **Tạo trung tâm** (Center) trong trang quản trị. Ghi lại **ID** của trung tâm.
3. **Tạo tài khoản Manager** cho trung tâm đó.
4. Mở `Frontend\.env.local`, đặt `VITE_SPORTS_CENTER_ID=<ID trung tâm>`, rồi chạy lại `npm run dev`. *(Bắt buộc để hội viên tự đăng ký được.)*
5. **Đăng nhập Manager** → tạo gói tập, phòng, lớp học; bổ nhiệm HLV và lễ tân.
6. Hội viên tự **đăng ký** trên trang chủ (cần cấu hình email để nhận OTP), hoặc lễ tân tạo hộ tại quầy.

> Muốn có sẵn dữ liệu mẫu để thử nghiệm: đặt `Database:SeedDemoData=true` cho Backend. **Không bật trên database thật.**

---

## 5. Ai làm được gì?

| Vai trò | Việc chính |
|---|---|
| **Hội viên (Member)** | Mua gói tập (VNPay/MoMo), xem lịch & đặt/hủy lớp, check-in, xem tiến độ, gửi yêu cầu hỗ trợ, hỏi trợ lý AI |
| **HLV (Coach)** | Xem lịch dạy, điểm danh, lên giáo án (có AI gợi ý), theo dõi tiến độ học viên |
| **Lễ tân (Receptionist)** | Tra cứu hội viên, bán gói & thu tiền tại quầy (tiền mặt/POS), đặt lớp hộ, xử lý hỗ trợ |
| **Quản lý (Manager)** | Quản lý gói, lớp, phòng, nhân sự, phân quyền trong trung tâm; xem báo cáo, xuất CSV |
| **System Admin** | Tạo trung tâm & Manager, quản lý quyền toàn hệ thống, xem nhật ký hoạt động |

---

## 6. Tính năng tùy chọn

Không cấu hình thì các tính năng này báo lỗi rõ ràng, phần còn lại vẫn chạy bình thường.

| Tính năng | Cần làm | Hướng dẫn |
|---|---|---|
| Email OTP (đăng ký, quên mật khẩu) | Điền `EMAIL_SMTP_*` (Docker) hoặc chạy `Backend\configure-email.ps1` | [security-config-mail-bootstrap.md](./Backend/docs/security-config-mail-bootstrap.md) |
| Trợ lý AI & gợi ý giáo án | Lấy API key Gemini, điền `AI_API_KEY` / `AI:ApiKey` | [free-google-gemini-setup.md](./Backend/docs/requirements/free-google-gemini-setup.md) |
| Đăng nhập Google | Điền `GOOGLE_CLIENT_ID` và `VITE_GOOGLE_CLIENT_ID` | [free-google-gemini-setup.md](./Backend/docs/requirements/free-google-gemini-setup.md) |
| Thanh toán VNPay / MoMo | Thông tin tài khoản sandbox của cổng | [Backend/README.md](./Backend/README.md) |

---

## 7. Gặp lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| `Khong the khoi dong PostgreSQL` | Mở Docker Desktop, đợi nó chạy xong rồi thử lại. Kiểm tra đã có `docker\.env`. |
| Backend dừng ngay khi khởi động, báo thiếu System Admin | Database chưa có admin → đặt 3 biến `Bootstrap__SystemAdmin__*` ([Cách B, Bước 2](#cách-b--chạy-backend-và-frontend-riêng-cho-developer)). |
| Backend báo lỗi JWT key | `Jwt:Key` / `JWT_KEY` chưa đặt hoặc ngắn hơn 32 ký tự. |
| Port 5000 / 3004 / 5432 đang bị dùng | Tắt chương trình đang chiếm port, hoặc đổi `BACKEND_PORT` / `FRONTEND_PORT` / `POSTGRES_PORT` trong `docker\.env`. |
| Trang web báo lỗi kết nối API / lỗi 500 | Kiểm tra cửa sổ Backend còn chạy. Xem [api-connection-fix.md](./Frontend/docs/api-connection-fix.md). |
| Đăng ký hội viên báo lỗi trung tâm | `VITE_SPORTS_CENTER_ID` trong `Frontend\.env.local` chưa đúng ID trung tâm. |
| Không nhận được email OTP | Chưa cấu hình SMTP (xem [mục 6](#6-tính-năng-tùy-chọn)). |
| Ngày/giờ hiển thị lệch | Hệ thống luôn dùng giờ Việt Nam (UTC+7); kiểm tra đồng hồ máy chủ. |

---

## 8. Lệnh hữu ích

| Việc | Lệnh | Chạy ở |
|---|---|---|
| Build frontend | `npm run build` | `Frontend/` |
| Test frontend | `npm test` | `Frontend/` |
| Build backend | `dotnet build SportsCenterManagement.API/SportsCenterManagement.API.csproj` | `Backend/` |
| Test backend | `dotnet test SportsCenterManagement.Tests` | `Backend/` |
| Xem tài liệu API (Swagger) | Mở http://localhost:5000/swagger | trình duyệt |

---

## 9. Tìm hiểu thêm

- [Ghi chú kỹ thuật](./docs/TECHNICAL_NOTES.md) — bảo mật, phiên đăng nhập, AI, múi giờ, kiểm thử chi tiết
- [Backend/README.md](./Backend/README.md) — kiến trúc backend, danh sách API
- [docker/README.md](./docker/README.md) — chi tiết Docker
- [PROJECT_SUMMARY.md](./docs/PROJECT_SUMMARY.md) — tổng quan & triển khai lên Internet
- [VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md) · [CLOUDFLARE_TUNNEL_DEMO.md](./docs/CLOUDFLARE_TUNNEL_DEMO.md) — đưa lên mạng

## License

[MIT](./LICENSE)
