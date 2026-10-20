# Kết nối SQL Server và loại bỏ dữ liệu demo

Cập nhật 19/10/2026. Giữ nguyên React/Vite, ASP.NET Core/.NET 10, EF Core và SQL Server.

Điều chỉnh 20/10/2026 theo yêu cầu khôi phục trang chủ: danh mục và nội dung CMS đã công bố được hiển thị nguyên trạng; public catalog chỉ cấp danh sách khi phần CMS tương ứng chưa có mục nào. Không thay đổi dữ liệu nghiệp vụ. Xem [nguyên nhân và kiểm chứng khôi phục](homepage-data-recovery.md). Các mô tả bên dưới ghi lại thay đổi ngày 19/10 trước điều chỉnh này.

## Luồng dữ liệu

```text
React → api.js/backendApi.js/http.js → ASP.NET Core API → EF Core → SQL Server
Trang chủ → publicCatalog.js → GET /api/public/centers/{centerId}/catalog
Nội dung biên tập/ảnh → GET/PUT /api/landing-content → system_settings
```

Quyết định: dữ liệu nghiệp vụ và số liệu hiển thị lấy từ API/SQL. Danh sách trống giữ trạng thái trống; lỗi kết nối hiện lỗi, không bổ sung bản ghi mẫu hoặc báo lưu thành công giả.

## Đã gỡ và thay thế

- Gỡ `mockData.js`, `dbStorage.js`, `sportsCatalog.js`, `facilitiesCatalog.js`.
- Gỡ thông báo mẫu và thao tác đánh dấu đọc chỉ lưu trong React state. Hộp thư dùng notification API.
- Gỡ ca PT/học viên/đánh giá/thu nhập mẫu trên dashboard HLV. Lịch và KPI đọc từ `coaches/me/professional`; tạo lịch gọi `POST coaches/me/work-events`. Member ID lấy từ danh sách thật, thời gian gửi UTC theo ngày/giờ Việt Nam, chờ học viên xác nhận theo nghiệp vụ backend.
- Gỡ giá thuê sân, số sao, lượt đánh giá và số lượng khu vực cố định. Trang chủ đọc môn/phòng/lớp Published của trung tâm từ public catalog API. API chỉ chiếu trường công khai, lọc trạng thái Active và trung tâm; trung tâm thiếu trả 404. Không đưa dữ liệu tài khoản/hội viên vào catalog.
- Gỡ các chứng nhận/ưu đãi mặc định không có dữ liệu xác minh. Không có ảnh thì hiện “Chưa có ảnh”. Nội dung biên tập đã lưu trong SQL được giữ; số liệu và danh mục nghiệp vụ được lấy lại từ bảng thật.
- Gỡ form thuê sân báo thành công nhưng không gọi API. Schema hiện chưa có luồng đặt thuê sân cho khách; phần này dùng số điện thoại/email thật của trung tâm. Đặt chỗ lớp học vẫn qua API hiện có sau đăng nhập.
- Gỡ danh mục ảnh có sẵn và fallback tải ảnh thành data URL trên trình duyệt khi API lỗi. Thư viện và upload đi qua backend; lỗi được trả về người dùng.
- Hai tab bộ môn/phòng sân của quản lý nội dung chỉ chọn ảnh và ẩn/hiện theo ID bản ghi SQL. Thêm/sửa môn, lớp, phòng/sân dùng màn hình `#/manager/classes-rooms`, không tạo một danh mục nghiệp vụ riêng trong CMS.
- Xóa toàn bộ mã seed dữ liệu nghiệp vụ khỏi `DbInitializer`. Không còn flag `Database:SeedDemoData`; initializer chỉ đồng bộ schema và quyền bắt buộc. SystemAdmin đầu tiên vẫn dùng cấu hình bootstrap thật theo cơ chế có sẵn.
- `i18nHelper.js` là từ điển dịch văn bản; `authState.js`, `permissions.js`, `http.js` và các module xuất báo cáo/hóa đơn là logic ứng dụng, không phải kho dữ liệu mẫu.

## Cấu hình local đã kiểm tra

User Secrets của project API đang trỏ tới SQL Server instance `.` với Windows Authentication, database `SportsCenterManagement`. Không thay connection string, mật khẩu hoặc JWT key. Frontend hiện dùng:

```dotenv
VITE_API_BASE_URL=/api
SCMS_API_PROXY_TARGET=http://localhost:3003
VITE_SPORTS_CENTER_ID=15
```

ID `15` đã được kiểm tra tồn tại trong DB. Khi chuyển database/trung tâm, sửa ID này tương ứng. Backend đọc `ConnectionStrings:SportsCenter` từ User Secrets hoặc biến môi trường `ConnectionStrings__SportsCenter`. .NET không tự nạp `.env.example`.

Từ workspace, chạy backend:

```powershell
dotnet run --project .\Backend\Backend\SportsCenterManagement.API\SportsCenterManagement.API.csproj
```

Terminal khác:

```powershell
cd .\Frontend
npm.cmd run dev
```

Mở `http://localhost:3004` rồi F5. API hiện chạy ở `3003`. Nếu dùng giao diện nhúng do backend phục vụ, chạy `npm.cmd run build:api` trong `Frontend` để cập nhật bundle.

## Kiểm chứng

- `npm.cmd test`: 68/68 đạt, gồm empty/error state của hộp thư và catalog, không giả thành công khi upload lỗi, danh mục không lấy tên/giá giả từ CMS, lịch theo ngày/tuần/tháng Việt Nam và payload lịch hẹn dùng member ID thật.
- `npm.cmd run build` và `npm.cmd run build:api`: frontend và bundle nhúng backend đều build đạt (210 module). Backend `dotnet build ... --no-restore --verbosity minimal` đạt, 0 warning/error.
- `SCMS_TEST_ROLES=MANAGER,RECEPTIONIST`, `npm.cmd run test:api:live`: 31/31 kiểm tra, 75 request qua service frontend/proxy/API/SQL thật, không ghi nghiệp vụ.
- Kiểm chứng SQL trên DB riêng `SCMS_DefaultSeedCheck_<GUID>`: 3/3 đạt — không seed nghiệp vụ; gọi khởi tạo lại giữ dữ liệu; public catalog không lẫn dữ liệu trung tâm khác hoặc Inactive và trả 404 khi thiếu center. DB kiểm chứng đã được dọn.
- Chrome đọc hệ thống thật: hiện đúng 5 bộ môn, 5 phòng/sân từ SQL; mở chi tiết đúng bản ghi, không có form thành công giả; không có exception JavaScript hoặc API HTTP lỗi. Ảnh desktop/mobile và báo cáo ở `tmp/real-database/`.
- `npm.cmd run test:landing:browser`: 10/10 kiểm tra Chrome đạt cho công bố/xem trước/khôi phục, lỗi lưu, sáu tab CMS, liên hệ và media bằng API fixture riêng. Fixture chỉ dùng để kiểm thử, không nằm trong mã ứng dụng.

Bằng chứng local: `tmp/real-database/SeedCheck/seed-check-report.json`, `tmp/real-database/sql-api-report.json`, `tmp/real-database/sql-catalog-report.json`, `tmp/real-database/frontend-tests.log`, `tmp/real-database/browser-report.json`, `Frontend/tmp/api-live/report.json`. Các thư mục `tmp` không được commit. Các lần build/SQL/Chrome cần chạy ngoài sandbox do quyền đọc đường dẫn esbuild và xác thực Windows SQL Server.

## Dữ liệu được giữ và giới hạn

Không xóa bản ghi sẵn có trong database nghiệp vụ hoặc dữ liệu trình duyệt. Bản ghi được seed từ trước, nếu có, vẫn là bản ghi SQL và chưa bị xóa: schema không có cờ phân biệt demo với dữ liệu đã được người dùng sửa/liên kết giao dịch. Không suy đoán nguồn gốc rồi xóa theo tên. Không tạo tài khoản, đổi mật khẩu, thay schema hay gọi thanh toán thật để kiểm chứng.

Chưa kiểm chứng bằng trình duyệt thao tác ghi lịch PT trên tài khoản HLV thật hoặc thanh toán/Google/AI bên ngoài. Hợp đồng payload và API đã có regression test; SQL kiểm chứng mới tập trung initializer/catalog. Không commit, push hoặc release. Hoàn tác code nếu cần; không cần rollback dữ liệu nghiệp vụ.
