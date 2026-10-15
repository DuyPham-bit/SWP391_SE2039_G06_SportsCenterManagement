# Lưu thay đổi vào SQL Server — 13/10/2026

## Yêu cầu và hiện trạng

Người dùng yêu cầu tài khoản mới và dữ liệu nghiệp vụ đã lưu tồn tại trong SQL, có thể đọc lại từ máy khác dùng cùng database. Giữ React/Vite + ASP.NET Core/EF Core/SQL Server và JWT trong bộ nhớ riêng từng tab. Trạng thái nhập form, bộ lọc và JWT không phải dữ liệu nghiệp vụ cần đồng bộ; các thao tác lưu hợp lệ gửi API và chỉ báo thành công sau khi API lưu xong.

Đã đọc trực tiếp SQL `DESKTOP-M1NP3N6 / SportsCenterManagement`: 12 bản ghi `users`, 7 `member_profiles`, 4 `membership_packages`; center đang hoạt động có ID 15. Không xuất mật khẩu, JWT hoặc danh sách thông tin tài khoản vào báo cáo. Chưa có địa chỉ backend/database khác được người dùng xác nhận, nên giữ nguyên kết nối hiện tại.

## Nguyên nhân

- `DbInitializer.SeedAsync` trước đây chạy đồng bộ dữ liệu mẫu mỗi lần Development khởi động: ghi lại giá/thời hạn/mô tả/trạng thái gói, email/điện thoại/trạng thái/lockout/hồ sơ demo; một số đoạn còn đặt lại mật khẩu mẫu. Đổi tên đối tượng có thể làm mẫu cũ được tạo lại, hủy subscription có thể được bổ sung subscription Active mới. Dữ liệu từng ghi SQL sau đó bị seed thay đổi, gây cảm giác không lưu.
- “Duyệt ngoại lệ check-in” ở frontend tự tạo đối tượng bằng `Date.now()` và thêm vào React state, không gọi API; lời thông báo mở cửa/audit thành công không có bằng chứng SQL.
- Đăng ký, hồ sơ và CRUD hiện có đã đi qua API; tài khoản nằm ở `users` và `member_profiles`, không phải localStorage. `dbStorage.js`/`mockData.js` là mã cũ không được import vào ứng dụng hiện tại. localStorage hoạt động hiện tại chỉ ghi nhớ email đăng nhập tùy chọn.

## Bản sửa

- Backend chỉ tạo demo cho database Development mới, có marker `seed.demo-data.v1` trong `system_settings`. Database đã có tài khoản/trung tâm không bị bổ sung/ghi đè demo; marker cũng ngăn tái tạo dữ liệu sau khi đổi tên/xóa mẫu. Bỏ các đoạn đặt lại dữ liệu và mật khẩu đã có.
- Khởi tạo catalog vai trò/quyền tách khỏi seed nghiệp vụ, giữ các quyền và kiểm soát truy cập cần thiết. Không thay schema, migration hoặc connection string.
- Có cấu hình `Database:SeedDemoData` để tắt demo khi chạy dùng chung; mặc định vẫn theo environment.
- Ngoại lệ check-in tạo yêu cầu hỗ trợ thật qua API, lưu lý do/người được đề nghị xử lý vào `support_requests`, có audit và thông báo theo service hiện có. Không tạo check-in giả, không coi tên approver nhập tay là phê duyệt và không bỏ qua kiểm tra gói/tài khoản/lượt vào. Lỗi tải nhật ký được hiển thị thay vì âm thầm coi như danh sách trống.
- `start-shared.ps1` build giao diện nhúng dùng `/api`, giữ SQL/JWT hiện có, tắt demo và chạy backend cho LAN. Không tự mở firewall, triển khai Internet, reset SQL, commit hoặc push.

## Rà luồng lưu

| Dữ liệu | Nơi lưu hiện tại |
|---|---|
| Đăng ký, thông tin liên hệ, mật khẩu, khóa tài khoản | API auth/profile/member/staff → `users`, `member_profiles`, `staff_profiles`, `coach_profiles` |
| Giá, nội dung, quyền lợi, trạng thái gói | API membership-packages → `membership_packages` |
| Bộ môn, phòng, lớp, lịch, phân công | API sports/rooms/classes/schedules/coaches → SQL tương ứng |
| Đặt/hủy chỗ, chờ, điểm danh | API session-bookings/waitlist/attendance → SQL tương ứng |
| Giáo án, kết quả/nhận xét tập luyện, gợi ý đã áp dụng | API coaches/training-plans/progress → SQL tương ứng |
| Phân quyền | API role/capability → SQL và cấu hình quyền theo trung tâm |
| Hóa đơn, thanh toán, hoàn tiền | API payment/invoice → SQL; online vẫn phải được gateway xác minh |
| Thông báo, hỗ trợ, lý do ngoại lệ check-in | API notification/support → SQL, audit và thông báo |
| Trò chuyện AI | API ai/chat → conversations/messages trong SQL; model cần cấu hình riêng |

Rà source không thay thế kiểm thử runtime cho từng field và tất cả trường hợp lỗi. Kiểm thử SQL tự động tập trung vào tài khoản/hồ sơ/mật khẩu, gói, phòng, bộ môn, lớp, nhân viên, yêu cầu hỗ trợ và việc đọc lại sau restart.

## Kiểm chứng

- Regression khởi tạo đã thất bại trước sửa: email chỉnh thành `edited@example.test` bị đặt lại; database đang có trung tâm bị chèn tài khoản demo. Sau sửa, kiểm tra giữ nguyên hồ sơ, giá, trạng thái, mật khẩu, khóa tài khoản, dữ liệu đổi tên và subscription đã hủy.
- Frontend contract kiểm tra đăng ký phải gọi API; lỗi API không được báo thành công; yêu cầu check-in ngoại lệ phải có đúng member, phải POST support API và không giả lập mở cổng.
- SQL integration tạo database `SCMS_Persistence_Test_<GUID>` riêng trên SQL Server, chạy API thật/EF SQL Server, đăng ký và cập nhật dữ liệu; đọc bằng DbContext mới, dừng host rồi tạo host/client độc lập trên cùng SQL và đăng nhập bằng mật khẩu mới. Fixture chỉ được xóa database kiểm thử do chính nó tạo.
- Các kiểm tra browser thanh toán hiện có vẫn dùng fixture API/gateway; không coi chúng là bằng chứng SQL. Chưa kiểm tra bằng hai máy vật lý hoặc triển khai LAN thực tế.
- Kết quả cuối: 81/81 backend đạt, 0 skip (gồm 3 regression khởi tạo và 1 hành trình SQL Server thật); 9/9 frontend contract/unit đạt; 12/12 Chrome đạt. `npm run build`, `npm run build:api`, PowerShell syntax và `git diff --check` đạt. Frontend chưa có lint/typecheck riêng; không tuyên bố đã chạy Playwright/SonarQube MCP.

Lệnh tại `Frontend/`:

```powershell
npm.cmd test
npm.cmd run test:payment:browser
npm.cmd run build
npm.cmd run build:api
```

Lệnh tại `Backend/Backend/` để chạy cả SQL integration (connection bên dưới dùng Windows Authentication, không chứa mật khẩu):

```powershell
$env:SCMS_TEST_SQL_CONNECTION = 'Server=DESKTOP-M1NP3N6;Database=master;Integrated Security=True;TrustServerCertificate=True'
dotnet test SportsCenterManagement.Tests/SportsCenterManagement.Tests.csproj --no-restore -p:OutputPath=bin/PersistenceValidation/ --logger trx
```

Không đặt biến trên thì SQL integration được ghi rõ Skip; các regression khác vẫn chạy. Report `.trx` ở `Backend/Backend/SportsCenterManagement.Tests/TestResults/`.

## Áp dụng và giới hạn

Khởi động lại backend bằng bản code mới; bản backend đang chạy vẫn dùng code cũ cho tới khi restart. Dữ liệu đã bị seed cũ ghi đè trước đây không thể tự khôi phục nếu không có backup/audit chứa giá trị cũ. Đăng ký mới và lưu thay đổi sau khi áp dụng được kiểm tra đọc lại qua SQL. F5 vẫn yêu cầu đăng nhập lại, nhưng không xóa tài khoản hay dữ liệu SQL.

Các máy phải truy cập cùng backend/database. Nếu chạy SQL khác hoặc chỉ chạy lại script tạo bảng, tài khoản/dữ liệu không tự chuyển sang. Cách chạy chung và chuyển database bằng backup/restore nằm trong [DEPLOYMENT.md](../../DEPLOYMENT.md).

Target FE: `SWP391_SE2039_G06_SportsCenterManagement_FE`, nhánh `feature/fe-be-integration`; target BE: `SWP391_SE2039_G06_SportsCenterManagement_BE`, nhánh `feature/member-notification-and-support-fix`. Remote tương ứng là `https://github.com/DuyPham-bit/SWP391_SE2039_G06_SportsCenterManagement_FE.git` và `https://github.com/DuyPham-bit/SWP391_SE2039_G06_SportsCenterManagement_BE.git`. Giữ các thay đổi báo cáo có sẵn và thay đổi báo cáo phát sinh trong lúc kiểm chứng. Không commit, push hoặc deploy. Rollback bằng source/bundle trước bản sửa; không cần migration rollback. Không khuyến nghị rollback về seed cũ nếu cần giữ dữ liệu đã sửa.
