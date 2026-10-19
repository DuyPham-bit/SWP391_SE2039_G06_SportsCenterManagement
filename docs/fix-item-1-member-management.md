# Biên bản sửa mục 1 — Quản lý thành viên

Ngày hoàn tất: 17/10/2026

## Phạm vi

Chỉ xử lý mục 1 trong `Fix_item.txt`:

1. Manager không được sửa email của thành viên.
2. Lịch sử gói phải trực quan, dễ theo dõi.
3. Sắp xếp họ tên phải dựa trên tên gọi (từ cuối), không dựa trên họ.

Các mục từ 2 đến 9 chưa được sửa trong lượt này.

## Thay đổi đã thực hiện

### Email thành viên

- Email trong form cập nhật được hiển thị dạng read-only, có biểu tượng khóa và giải thích rõ đây là email định danh tài khoản.
- Payload cập nhật hồ sơ không chứa trường `email`.
- API dùng `UpdateMemberAtCenterRequest` riêng, không có trường email và bật `JsonUnmappedMemberHandling.Disallow`; request cố chèn email sẽ bị từ chối tại biên API.
- BLL khi Manager cập nhật thành viên luôn truyền email bằng `null`, vì vậy không có đường cập nhật email xuống DAL.
- Form tạo thành viên mới vẫn cho nhập email như trước.

### Lịch sử gói

- Bổ sung bốn ô tổng hợp: tổng gói, đang hiệu lực, sắp tới/chờ thanh toán và đã kết thúc.
- Chuyển danh sách thành timeline theo thứ tự mới nhất trước.
- Mỗi gói hiển thị riêng trạng thái, ngày bắt đầu, ngày kết thúc, giá, thời hạn và thời điểm tạo giao dịch.
- Có fallback cho dữ liệu thiếu/sai và trạng thái chưa biết.
- Giữ đầy đủ loading, empty state, lỗi API và nút thử lại.
- Chống response cũ ghi đè khi Manager mở lịch sử của thành viên khác trong lúc request trước chưa hoàn tất.

### Sắp xếp theo tên

- Nhãn bộ lọc đổi từ “Họ tên” thành “Tên”.
- FE tách từ cuối của họ tên Việt Nam để sắp A→Z/Z→A; chuẩn hóa khoảng trắng, hỗ trợ tên một từ và luôn đưa tên trống xuống cuối.
- FE gửi `sortBy=givenName` và `sortDirection=asc|desc` đến API.
- Controller chỉ nhận query và chuyển tiếp vào BLL.
- BLL kiểm tra whitelist tham số, tạo khóa tên từ cuối bằng biểu thức LINQ được dịch sang SQL Server `REVERSE`, sắp xếp trước khi `Skip/Take`; vì vậy thứ tự đúng trên toàn bộ dữ liệu phân trang.
- DAL chỉ khai báo ánh xạ hàm SQL built-in `REVERSE`; không chứa logic nghiệp vụ và không cần migration/schema mới.
- Tài khoản đang hoạt động vẫn đứng trước tài khoản bị khóa; tên đầy đủ và `ProfileId` được dùng làm tie-breaker để thứ tự ổn định.

## Happy case đã kiểm tra

- Tên `Nguyễn Văn An`, `Lê Thị Bình`, `Lê Hoàng Dũng` được sắp theo `An`, `Bình`, `Dũng`.
- Cả chiều A→Z và Z→A đều hoạt động; API nhận đúng tham số server-side.
- Form sửa hiển thị email nhưng không cho nhập và không gửi email lên API.
- Lịch sử gói hợp lệ hiển thị đầy đủ tổng hợp, timeline, giá và thời gian.
- Trang thành viên render được ở viewport mobile.

## Unhappy case đã kiểm tra

- Tên có nhiều khoảng trắng, tên một từ, tên trống/null và hai người trùng tên gọi đều có thứ tự ổn định.
- Hàm sort không mutate mảng nguồn; input không phải mảng trả về danh sách rỗng.
- Giá/ngày/thời hạn thiếu hoặc sai có nội dung fallback.
- Trạng thái gói lạ/null không làm hỏng giao diện và được tính vào nhóm đã kết thúc.
- API lịch sử lỗi hiển thị thông báo; retry thành công render lại dữ liệu.
- Payload cố chèn email bị DTO Manager từ chối.
- `sortBy`/`sortDirection` ngoài whitelist bị BLL từ chối.

## File đã thay đổi cho mục 1

- `Frontend/src/features/manager/MemberManagement.jsx`
- `Frontend/src/features/manager/memberManagementView.js`
- `Frontend/src/services/backendApi.js`
- `Frontend/tests/member-management.test.cjs`
- `Frontend/tests/manager-merge.browser.cjs`
- `Backend/Backend/SportsCenterManagement.API/Controllers/MembersController.cs`
- `Backend/Backend/SportsCenterManagement.BLL/Interfaces/IMemberService.cs`
- `Backend/Backend/SportsCenterManagement.BLL/Services/MemberService.cs`
- `Backend/Backend/SportsCenterManagement.DAL/Context/SportsCenterDbContext.cs`

## Kết quả xác minh

- `node --test tests/member-management.test.cjs`: 6/6 test đạt.
- `npm.cmd test`: 49/49 test đạt.
- `npm.cmd run build`: production frontend build thành công, 197 modules được transform.
- `dotnet build ... -c Release --no-restore`: Backend API/BLL/DAL build thành công, 0 lỗi.
- `node tests/manager-merge.browser.cjs`: 12/12 browser check đạt; không có JavaScript exception hoặc API ngoài dự kiến.
- `git diff --check`: không có lỗi whitespace.

## Ghi chú ngoài phạm vi

- Backend build báo các cảnh báo dependency có sẵn cho `System.Security.Cryptography.Pkcs 9.0.11` (NU1902/NU1903) và cảnh báo API Google credential đã obsolete. Không tự ý nâng package trong mục sửa nghiệp vụ này.
- Debug build ban đầu không copy được DLL vì tiến trình API của người dùng đang chạy và khóa file. Không dừng tiến trình; build Release độc lập đã thành công.
