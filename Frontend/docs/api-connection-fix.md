# Khôi phục kết nối API — 15/10/2026

## Nguyên nhân và thay đổi

FE `http://localhost:3004` gọi `/api` qua Vite đến `http://localhost:54162`. Lỗi `Yêu cầu API thất bại (500)` đã tái hiện bằng `/api/health`: Vite trả HTTP 500 rỗng khi backend không chạy. Database Development trỏ tới `SQLEXPRESS`, trong khi máy này chạy instance SQL Server mặc định.

- Đã sửa server Development thành `.` và giữ database `SportsCenterManagement`, trung tâm ID `15`.
- Khởi động backend với seed demo tắt; migration `20261015090000_AddCoachSports` đã bổ sung bảng/chuyên môn còn thiếu trong database hiện tại.
- Thêm `SCMS_API_PROXY_TARGET` để cấu hình đích proxy; mặc định vẫn là `http://localhost:54162`.
- Khi backend không kết nối được, proxy trả Problem Details HTTP 503 với mã `API_UNAVAILABLE` và hướng xử lý.
- Vite bỏ qua `tmp/` và `.validation/`, tránh lỗi Windows `EBUSY` do file Chrome kiểm thử đang bị khóa làm dừng FE.

## Kiểm chứng

- `/api/health` gọi trực tiếp BE và qua FE đều HTTP 200.
- `npm.cmd run test:api:live`: 42/42 kiểm tra, 89 request HTTP 200 qua service FE/proxy/backend/SQL Server hiện tại, cho Manager, Receptionist và Coach.
- Chrome headless mở 24 màn hình thật của 3 vai trò trên: không có API HTTP lỗi hoặc exception JavaScript. Báo cáo tạm: `Frontend/tmp/api-browser-live/report.json`.
- Hai `SqlServerPersistenceTests` đạt trên database SQL Server riêng: đọc API theo 4 vai trò nghiệp vụ (gồm Member), và ghi/đọc dữ liệu sau khi backend khởi động lại.
- Test persistence đã bổ sung `sportIds` theo hợp đồng tạo/sửa Coach mới; không nới validation hoặc phân quyền để làm test đạt.
- Test proxy xác nhận backend tắt trả JSON HTTP 503 và FE vẫn truy cập được.
- FE production build và 25 test regression đạt. Bộ backend hiện có trước thay đổi test SQL đạt 98 test; lượt SQL riêng chạy 2/2, không skip.

Tài khoản Member demo trên database hiện tại không đăng nhập được bằng mật khẩu seed. Không thay đổi tài khoản đó: Member được xác minh trên database kiểm thử riêng. Các cổng thanh toán, Google và AI vẫn dùng endpoint hiện có; lần kiểm tra này không xác minh giao dịch hoặc dịch vụ bên ngoài thực tế.

## Chạy và kiểm tra lại

Từ workspace, chạy backend; lệnh sử dụng cấu hình Development và giữ seed demo tắt:

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Database__SeedDemoData = 'false'
dotnet run --project Backend/Backend/SportsCenterManagement.API/SportsCenterManagement.API.csproj --no-launch-profile --urls http://localhost:54162
```

Trong terminal khác:

```powershell
cd Frontend
npm.cmd run dev
```

Kiểm tra service FE với database hiện tại, chọn các tài khoản demo đã xác minh:

```powershell
$env:SCMS_TEST_ROLES = 'MANAGER,RECEPTIONIST,COACH'
npm.cmd run test:api:live
npm.cmd run test:api:proxy
```

`test:api:live` mặc định kiểm tra cả 4 vai trò. Có thể thay tài khoản bằng biến `SCMS_TEST_<ROLE>_EMAIL` và `SCMS_TEST_<ROLE>_PASSWORD`, hoặc đổi API bằng `SCMS_TEST_API_BASE_URL`. Script chỉ đăng nhập/đọc dữ liệu và không ghi JWT/mật khẩu vào báo cáo.

Chạy hai test SQL từ workspace; chúng tự tạo và dọn database tên `SCMS_Persistence_Test_<GUID>`, không dùng database nghiệp vụ:

```powershell
$env:SCMS_TEST_SQL_CONNECTION = 'Server=.;Database=master;Integrated Security=True;TrustServerCertificate=True'
dotnet test Backend/Backend/SportsCenterManagement.Tests/SportsCenterManagement.Tests.csproj --filter FullyQualifiedName~SqlServerPersistenceTests
```

Nhánh Manager đã có trong merge commit `7c801e9` của `feature/fe-be-integration`. Các thay đổi proxy/test trong lượt này chưa commit hoặc push.
