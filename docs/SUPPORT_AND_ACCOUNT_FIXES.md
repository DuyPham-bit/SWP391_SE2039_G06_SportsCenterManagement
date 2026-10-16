# Yêu cầu hỗ trợ và các lỗi tài khoản — 16/10/2026

Nguồn: yêu cầu trực tiếp của người dùng. Repository hiện tại là monorepo React/Vite + ASP.NET Core 10, EF Core và SQL Server; giữ nguyên stack này.

## Phạm vi và điều kiện nghiệm thu

| ID | Yêu cầu | Điều kiện nghiệm thu |
| --- | --- | --- |
| SUP-01 | Member và Coach gửi yêu cầu hỗ trợ | Tài khoản hoạt động gửi tiêu đề/nội dung/mức ưu tiên; backend lấy người gửi và trung tâm từ tài khoản, không nhận danh tính từ client. |
| SUP-02 | Theo dõi và tiếp nhận yêu cầu | Người gửi chỉ xem yêu cầu của mình; Lễ tân/Manager chỉ tiếp nhận yêu cầu thuộc trung tâm được giao và phản hồi cho đúng người gửi. |
| NOT-01 | Đọc tất cả thông báo | Một API cập nhật toàn bộ thông báo chưa đọc của tài khoản hiện tại, kể cả ngoài 200 mục hiển thị; không ảnh hưởng tài khoản khác. |
| PKG-01 | Thông báo đúng gói mua | Tên gói trong thông báo lấy từ subscription/hóa đơn đã thanh toán; không suy ra từ thứ tự danh mục hoặc gói cũ còn hiệu lực. |
| AUTH-01 | F5 giữ đăng nhập | Tab khôi phục JWT còn hạn rồi tải lại hồ sơ/quyền từ API; đăng xuất hoặc JWT hết hiệu lực xóa thông tin lưu của tab. |
| PAY-01 | Gỡ VietQR | Không còn lựa chọn VietQR hoặc API khởi tạo/sync VietQR công khai; lịch sử và xác minh callback của giao dịch đã tạo được bảo toàn. |
| AI-01 | Cố định model Gemini, key ở backend | Model cố định `gemini-3.5-flash-lite`; key chỉ đọc từ cấu hình backend, không đưa vào bundle frontend hoặc log. |

## Thiết kế

- Triển khai backend trước. `support_requests` bổ sung `requester_id`, `center_id`; `member_id` cho phép null để Coach gửi mà không cần giả hồ sơ Member. Migration lấy người gửi/trung tâm cho dữ liệu cũ từ MemberProfile.
- API tự phục vụ: `GET/POST /api/support-requests/me`, `GET /api/support-requests/me/{id}`, `POST /api/support-requests/me/{id}/messages`. API tiếp nhận hiện tại dùng chung bảng và giữ phân quyền trung tâm.
- Thông báo gửi tới UserId; khi tạo yêu cầu, báo Lễ tân/Manager hoạt động của trung tâm; khi cập nhật, báo người gửi.
- `PUT /api/notifications/me/read-all` cập nhật bằng một câu SQL theo UserId, chỉ các mục chưa đọc.
- Decision: JWT lưu bằng sessionStorage riêng từng tab để đáp ứng yêu cầu F5 mới; hồ sơ/quyền vẫn được xác minh từ backend sau reload.
- Decision: gỡ khởi tạo/sync VietQR khỏi API người dùng; giữ xử lý webhook/đối soát giao dịch PayOS cũ, không xóa dữ liệu thanh toán.
- Decision đã được người dùng xác nhận: cố định model, API key nằm trong cấu hình backend. Tài liệu Google xác nhận model: https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite ; hướng dẫn key: https://ai.google.dev/gemini-api/docs/api-key .

## Kiểm chứng và vận hành

Kiểm thử API trên database tách biệt: Member/Coach tạo, xem, phản hồi; chống giả người gửi, đọc chéo tài khoản/trung tâm; validation; thông báo đúng người; đọc tất cả vượt 200 mục; đăng nhập lại sau F5; API cổng thanh toán đã gỡ.

Migration phải giữ dữ liệu hỗ trợ cũ. Downgrade bị từ chối nếu đã có yêu cầu của Coach vì schema cũ không biểu diễn được dữ liệu đó. Không commit/push/release trong phạm vi yêu cầu này.
