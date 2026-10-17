# Báo cáo sửa mục 2 — Quản lý nhân viên

Ngày hoàn tất: 17/10/2026

## Phạm vi đã sửa

### 1. Luôn đưa tài khoản nhân viên bị khóa xuống cuối danh sách

- Frontend áp dụng quy tắc trạng thái trước mọi kiểu sắp xếp: nhân viên `ACTIVE` ở trên, tài khoản bị khóa/ngừng hoạt động ở cuối.
- Quy tắc vẫn đúng khi lọc, sắp xếp theo tên, sắp xếp giảm dần hoặc theo vai trò.
- Backend cũng sắp trạng thái trước khi `Skip/Take`, nên thứ tự đúng trên toàn bộ dữ liệu phân trang, không chỉ trong một trang.

### 2. Sắp xếp theo tên gọi thay vì họ

- Tách từ cuối cùng trong họ tên làm tên gọi tiếng Việt. Ví dụ `Nguyễn Văn An` được xếp theo `An`, không theo `Nguyễn`.
- Hỗ trợ tăng dần, giảm dần, tên một từ, khoảng trắng thừa và dữ liệu thiếu tên.
- Đổi nhãn giao diện từ `Họ tên: A → Z/Z → A` thành `Tên: A → Z/Z → A` để đúng với hành vi.
- API nhận `sortBy=givenName` và `sortDirection=asc|desc`; BLL thực hiện sắp xếp trước phân trang.

### 3. Thông báo rõ khi Manager thao tác trên chính tài khoản đang đăng nhập

- BLL chặn riêng hai trường hợp và trả mã nghiệp vụ:
  - `STAFF-SELF-EDIT`: không cho sửa chính Manager tại màn hình Quản lý nhân viên; hướng dẫn dùng Hồ sơ cá nhân hoặc nhờ Manager khác.
  - `STAFF-SELF-LOCK`: không cho khóa Manager đang đăng nhập; hướng dẫn nhờ Manager khác.
- Quy tắc chỉ áp dụng cho role Manager, không vô tình chặn System Admin.
- Controller giữ nội dung lỗi phân quyền trong response `403` thay vì trả body rỗng. Frontend vì vậy hiển thị câu lỗi cụ thể thay cho `Yêu cầu API thất bại`.
- Transaction không ghi dữ liệu khi thao tác bị từ chối.

## Cấu trúc triển khai

- Presentation/UI: `StaffManagement.jsx` chỉ lọc dữ liệu và gọi helper hiển thị.
- View logic: `staffManagementView.js` chứa quy tắc sắp xếp thuần, không mutate dữ liệu nguồn.
- API/Controller: nhận tham số sắp xếp và chuyển lỗi có thông điệp đúng về client.
- BLL: kiểm tra quyền, self-action, sắp xếp toàn cục trước phân trang.
- DAL/EF Core: dùng ánh xạ SQL `REVERSE` hiện có để tách tên gọi ngay trong truy vấn.

## Happy case đã kiểm tra

- Danh sách nhân viên tải và chỉnh sửa nhân viên khác bình thường.
- Chuyên môn của Coach vẫn được giữ khi lưu.
- Sắp xếp tên tăng/giảm theo tên gọi tiếng Việt.
- Sắp xếp theo vai trò vẫn hoạt động.
- Tài khoản khóa luôn nằm cuối danh sách.

## Unhappy case đã kiểm tra

- Danh sách `null` hoặc tên thiếu không làm vỡ giao diện.
- Sắp xếp không làm thay đổi mảng dữ liệu nguồn.
- Manager sửa chính mình nhận thông báo cụ thể.
- Manager khóa chính mình nhận thông báo cụ thể.
- Tham số sort/direction không hợp lệ bị BLL từ chối bằng validation error.
- Các lỗi phân quyền khác trả nội dung lỗi thay vì response `403` rỗng.

## Kết quả xác minh

- `npm.cmd test`: **53/53 test pass**.
- `node tests/manager-merge.browser.cjs`: **14/14 kiểm tra trình duyệt pass**, gồm sắp xếp tên, tài khoản khóa ở cuối, self-edit và self-lock.
- `dotnet build Backend/Backend/SportsCenterManagement.API/SportsCenterManagement.API.csproj -c Release --no-restore`: **build thành công, 0 lỗi**.
- Build còn 7 cảnh báo có sẵn: cảnh báo bảo mật của `System.Security.Cryptography.Pkcs 9.0.11` và API `GoogleCredential.FromFile` đã obsolete; không thay đổi dependency ngoài phạm vi mục 2.

## File liên quan

- `Frontend/src/features/manager/StaffManagement.jsx`
- `Frontend/src/features/manager/staffManagementView.js`
- `Frontend/src/services/backendApi.js`
- `Backend/Backend/SportsCenterManagement.API/Controllers/StaffController.cs`
- `Backend/Backend/SportsCenterManagement.BLL/Interfaces/IStaffManagementService.cs`
- `Backend/Backend/SportsCenterManagement.BLL/Services/StaffManagementService.cs`
- `Frontend/tests/staff-management.test.cjs`
- `Frontend/tests/manager-merge.browser.cjs`

Mục 2 đã hoàn tất. Chưa thực hiện mục 3.
