# Báo cáo sửa mục 3 — Lớp, Bộ môn & Phòng

Ngày hoàn tất: 17/10/2026

## Kết quả

Luồng nghiệp vụ đã được làm rõ: **không cần tạo nhân viên trước khi tạo bộ môn hoặc mở lớp**.

## Frontend

- Đã xóa khối “Quy trình mở lớp rõ ràng” theo phản hồi, tránh làm màn hình chính dài và dư thông tin.
- Form **Mở Lớp Đào Tạo Mới** được chia thành ba nhóm trực quan: Thông tin lớp, Thiết lập vận hành, Mô tả & chính sách đăng ký.
- Trường bắt buộc, trường có thể bổ sung sau, trạng thái bản nháp và đơn vị sức chứa/thời lượng được thể hiện rõ.
- Trong form mở lớp có nút **Tạo bộ môn mới** ngay cạnh danh sách bộ môn.
- Khi tạo bộ môn từ form lớp:
  - Giữ nguyên toàn bộ dữ liệu lớp đang nhập.
  - Tạo bộ môn ở trạng thái `Active` để có thể dùng ngay.
  - Quay lại form lớp và tự chọn bộ môn vừa tạo.
  - Nếu hủy, quay lại đúng bản nháp lớp trước đó.
- Khi chưa có bộ môn đang hoạt động, giao diện hiển thị hướng dẫn rõ thay vì để danh sách trống khó hiểu.
- Giao diện tiếp tục sử dụng màu sắc, modal, typography và component theo style hiện tại của trang Manager.

## Backend theo 3-layer

Phần nghiệp vụ bộ môn đã được tách khỏi API Controller:

- Presentation: `ClassResourcesController` chỉ kiểm tra phạm vi trung tâm, nhận/trả HTTP và gọi service.
- BLL contract: `ISportManagementService`, `SaveSportRequest`, `ManagedSportResponse`.
- BLL implementation: `SportManagementService` xử lý validate, kiểm tra trùng, transaction, trạng thái lớp liên quan và audit log.
- DAL: truy cập dữ liệu qua `IUnitOfWork`/EF Core.
- Service được đăng ký dependency injection trong `Program.cs`.

Không cần migration database vì không thay đổi schema.

## Quy tắc nghiệp vụ

- Tên bộ môn bắt buộc, sau khi trim dài tối đa 100 ký tự.
- Mô tả sau khi trim dài tối đa 500 ký tự.
- Trạng thái chỉ nhận `Active` hoặc `Inactive`.
- Không cho tạo tên trùng với bộ môn dùng chung hoặc bộ môn riêng đã có tại trung tâm.
- Không cho sửa bộ môn dùng chung/toàn hệ thống từ trung tâm.
- Không cho ngừng bộ môn vẫn còn lớp chưa `Cancelled` hoặc `Completed`.
- Tạo/cập nhật chạy trong transaction `Serializable` và ghi audit log.

## Happy case đã kiểm tra

- Mở form lớp, nhập dữ liệu, tạo bộ môn mới ngay trong modal.
- Sau khi tạo, tên lớp và các trường đang nhập được giữ nguyên.
- Bộ môn mới được chọn tự động và xuất hiện trong danh mục.
- Có thể tạo bộ môn độc lập từ tab Bộ môn như trước.
- Các chức năng lớp, lịch, phòng và phân công HLV hiện có vẫn hoạt động.

## Unhappy case đã kiểm tra

- Tên bộ môn trùng trả lỗi rõ ràng và không đóng modal.
- Sau lỗi trùng, người dùng có thể quay lại form lớp mà không mất bản nháp hoặc bộ môn đã chọn.
- Phản hồi tạo bộ môn thiếu ID hợp lệ không được âm thầm tiếp tục mở lớp.
- Dữ liệu tên/mô tả/trạng thái không hợp lệ bị BLL từ chối.
- Không thể ngừng bộ môn đang có lớp hoạt động.

## Kết quả xác minh

- `npm.cmd test`: **55/55 test pass**.
- `node tests/manager-merge.browser.cjs`: **16/16 kiểm tra trình duyệt pass**, gồm kiểm tra form mới trên desktop và mobile.
- `dotnet build Backend/Backend/SportsCenterManagement.API/SportsCenterManagement.API.csproj -c Release --no-restore`: **build thành công, 0 lỗi**.
- Build còn 6 cảnh báo bảo mật có sẵn của `System.Security.Cryptography.Pkcs 9.0.11`; không thay đổi dependency ngoài phạm vi mục 3.

## File liên quan

- `Frontend/src/features/manager/ClassesAndRooms.jsx`
- `Frontend/src/features/manager/classManagementView.js`
- `Frontend/tests/class-management.test.cjs`
- `Frontend/tests/manager-merge.browser.cjs`
- `Backend/Backend/SportsCenterManagement.API/Controllers/ClassResourcesController.cs`
- `Backend/Backend/SportsCenterManagement.API/Program.cs`
- `Backend/Backend/SportsCenterManagement.BLL/DTOs/Classes/Requests.cs`
- `Backend/Backend/SportsCenterManagement.BLL/DTOs/Classes/Responses.cs`
- `Backend/Backend/SportsCenterManagement.BLL/Interfaces/IFlow2Services.cs`
- `Backend/Backend/SportsCenterManagement.BLL/Services/SportManagementService.cs`

Mục 3 đã hoàn tất. Chưa thực hiện mục 4.
