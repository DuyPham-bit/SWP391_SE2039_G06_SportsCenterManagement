# Fix item 9 — Tiếp nhận yêu cầu hỗ trợ và gửi thông báo

Ngày hoàn tất: 21/10/2026

## Kết quả

- Tạo màn hình riêng **Hỗ trợ & Thông báo** cho Manager gồm hai tab:
  - Tiếp nhận, xem chi tiết, phản hồi và cập nhật trạng thái yêu cầu hỗ trợ.
  - Soạn và gửi thông báo cho toàn bộ trung tâm hoặc các vai trò được chọn.
- Manager không còn nút tạo hộ yêu cầu mới; Backend cũng chặn Manager gọi endpoint tạo yêu cầu. Lễ tân vẫn giữ nghiệp vụ tiếp nhận hộ hội viên.
- Hỗ trợ gửi theo các vai trò: Hội viên, HLV, Lễ tân và Manager.
- API trả số tài khoản thực nhận để giao diện xác nhận kết quả gửi.

## Kiến trúc Backend

- Controller chỉ tiếp nhận request và ủy quyền cho `ICenterNotificationService`.
- `CenterNotificationService` tại BLL chịu trách nhiệm kiểm tra Manager, trung tâm, nội dung, role đích, dựng danh sách người nhận và ghi audit.
- `FlowNotificationWriter` tiếp tục phụ trách tạo `Notification` và các liên kết `UserNotification`.
- Không nhận danh sách user ID từ Frontend và không cần thay đổi schema database.

## Happy case

- Gửi toàn trung tâm: Backend chọn mọi tài khoản đang hoạt động thuộc trung tâm, trừ chính người gửi.
- Gửi theo role: có thể chọn một hoặc nhiều role và nhận lại đúng số người đã gửi.
- Manager cập nhật trạng thái/ghi chú yêu cầu; người gửi yêu cầu nhận thông báo cập nhật như luồng hiện có.

## Unhappy case và bảo mật

- Từ chối tài khoản không phải Manager, Manager bị khóa/ngừng hoạt động hoặc Manager không thuộc trung tâm.
- Từ chối role lạ, thiếu role khi gửi theo nhóm, tiêu đề/nội dung rỗng hoặc vượt giới hạn.
- Tự loại tài khoản bị khóa, ngừng hoạt động, hồ sơ không hoạt động và tài khoản ngoài trung tâm.
- Trả `409` khi nhóm được chọn không có người nhận phù hợp; không tạo thông báo rỗng.
- Mỗi lần gửi thành công được ghi audit `CENTER_NOTIFICATION_SENT`.

## Quy ước phạm vi

“Toàn bộ” được hiểu là toàn bộ tài khoản trong **trung tâm mà Manager được phân công**, không gửi chéo sang trung tâm khác. Đây là ranh giới tenant an toàn của hệ thống.

## Kiểm chứng

- Backend Release build: đạt, 0 lỗi và 0 cảnh báo.
- Frontend production build: đạt.
- Bộ regression liên quan Audit, hỗ trợ, thông báo và phân quyền: 15/15 test đạt.
