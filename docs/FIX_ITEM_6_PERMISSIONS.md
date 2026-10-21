# Fix item 6 — Phân quyền

Ngày hoàn tất: 21/10/2026

## Kết quả

- Áp dụng mô hình **hai tầng** thay vì buộc cấu hình từng tài khoản:
  - **Quyền nền theo vai trò** dùng để sửa chung một lần cho toàn bộ Hội viên, HLV hoặc Lễ tân.
  - **Ngoại lệ theo từng người** chỉ dùng cho tài khoản cần giới hạn khác với quyền nền.
- Bổ sung thao tác **Đồng bộ tất cả theo vai trò**. Sau bước xác nhận, hệ thống xóa toàn bộ ngoại lệ cá nhân của vai trò đang chọn để mọi tài khoản quay về cùng quyền nền; không cần mở và sửa từng người.
- Bổ sung tab **Theo từng người** làm màn hình mặc định: Manager chọn trực tiếp một Hội viên, HLV hoặc Lễ tân rồi bật/tắt chức năng và phạm vi dữ liệu riêng cho tài khoản đó.
- Quyền cá nhân là lớp giới hạn trên quyền của vai trò: không thể cấp vượt quyền nền hiện tại. Có thể khôi phục một tài khoản về quyền mặc định theo vai trò.
- Manager không thể tự thay đổi quyền: API phân quyền theo trung tâm chỉ liệt kê và chỉ nhận cập nhật cho Member, Coach và Receptionist. Target role khác nhận lỗi `403`.
- Giao diện không còn hiển thị Manager như một vai trò có thể cấp/thu hồi quyền. Ma trận chỉ gồm Hội viên, HLV và Lễ tân; có ghi rõ quyền Manager cố định theo hệ thống.
- Các capability/permission ID kỹ thuật như `view_teaching_schedule` không còn hiển thị, tìm kiếm hoặc xuất hiện trong chú thích. Người dùng chỉ thấy tên và mô tả nghiệp vụ.
- Phần “quyền dữ liệu” được đổi ngôn ngữ sang phạm vi truy cập dữ liệu thay cho thuật ngữ API/database kỹ thuật.

## Kiến trúc và bảo mật

- `CenterPermissionsController` kiểm tra phạm vi trung tâm từ JWT và giới hạn role đích ngay trên truy vấn SQL (`Member`, `Coach`, `Receptionist`).
- `CenterRolePolicy.Capabilities` giới hạn capability được cấp theo đúng boundary của role; Manager/System Admin/Admin không bị policy trung tâm ghi đè.
- Override từng người được lưu trong `system_settings` theo khóa center/user, được áp dụng ở cả `CenterCapabilityAttribute`, permission authorization handler và API `access/me/capabilities`.
- Khi quyền nền bị thu hồi, quyền hiệu lực của mọi tài khoản cũng bị thu hồi ngay nhờ phép giao với quyền nền. Khi cần áp dụng toàn bộ cấu hình nền, endpoint đồng bộ theo vai trò xóa các override trong đúng trung tâm và đúng vai trò.
- Các thao tác thay quyền cá nhân, thay quyền vai trò và đồng bộ hàng loạt đều được ghi audit; API đồng bộ trả về số ngoại lệ đã xóa.
- UI chỉ phản ánh contract này, không dựa vào việc ẩn nút để bảo mật.

## Kiểm chứng

- Test giao diện kiểm tra Manager không có trong ma trận ủy quyền, capability ID không bị render, có API sửa riêng và API đồng bộ hàng loạt.
- Kịch bản test trình duyệt đã được cập nhật để bao phủ dữ liệu quyền từng người và endpoint đồng bộ theo vai trò. Lần chạy cuối chưa hoàn tất do Chrome headless dừng phản hồi trong test harness; không ghi nhận sai là đã đạt.
- Frontend build đạt; Backend Release build đạt với 0 lỗi, 0 cảnh báo.
- Bộ test logic/phân quyền đạt `9/9`; `git diff --check` đạt.

## Cách sử dụng

1. Muốn sửa chung: mở **Quyền nền theo vai trò**, chọn vai trò, chỉnh quyền rồi lưu.
2. Muốn tạo ngoại lệ: mở **Theo từng người**, chọn tài khoản và lưu cấu hình riêng.
3. Muốn tất cả tài khoản của một vai trò giống nhau hoàn toàn: lưu quyền nền mong muốn rồi bấm **Đồng bộ tất cả theo vai trò** và xác nhận.

## Phạm vi

Chỉ xử lý mục 6 của `Fix_item.txt`; không đổi schema/tên mã permission nội bộ vì các mã này là hợp đồng ổn định giữa API authorization và database. Chúng chỉ được ẩn và thay bằng nhãn nghiệp vụ trên giao diện.
