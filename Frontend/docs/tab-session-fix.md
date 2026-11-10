# Đăng nhập nhiều tab bằng JWT

Thiết kế Session của bản sửa trước đã được thay hoàn toàn bằng [cấu trúc JWT hiện tại](jwt-auth-fix.md).

Theo yêu cầu bảo mật cập nhật, JWT nằm trong cookie HttpOnly `scms.session.<id>`, không trả về JSON khi frontend gửi header `X-SCMS-Session`. Cookie có `SameSite=Strict`, `Path=/api`, không đặt Domain và bật Secure khi request dùng HTTPS. JWT vẫn được kiểm tra chữ ký, hạn dùng và tài khoản/quyền trong DB như trước.

Mỗi tab chỉ lưu mã chọn phiên ngẫu nhiên 32 ký tự tại `sessionStorage['scms.auth.tab.v1']`; mã này không thể đăng nhập nếu thiếu cookie tương ứng. F5 khôi phục mã rồi tải lại hồ sơ/quyền từ API. Mỗi lần đăng nhập tạo mã mới, nên kể cả tab được Duplicate cũng có thể đăng nhập tài khoản khác mà không ghi đè tab gốc. Logout xóa mã và yêu cầu API xóa đúng cookie; HTTP 401 chỉ xóa trạng thái của phiên hiện tại. JWT cũ trong sessionStorage được xóa khi tải bản mới và cần đăng nhập lại một lần.

Frontend mặc định dùng `/api` cùng origin (Vite proxy hoặc frontend nhúng trong API). Khi gọi API khác origin nhưng cùng site, cấu hình đúng `Cors:AllowedOrigins`; API chỉ cho phép credentials với các origin đã cấu hình. Cookie SameSite=Strict không hỗ trợ frontend/API ở hai site không liên quan. Cookie đơn lẻ, thiếu header chọn phiên, không được dùng để xác thực. API client ngoài trình duyệt vẫn dùng Bearer JWT như trước.

Bộ hồi quy: `tests/auth-session.test.cjs`, `tests/security-auth.browser.cjs` (Chrome và API fixture riêng). Không thay đổi schema hoặc dữ liệu ứng dụng.
