# Đăng nhập nhiều tab bằng JWT

Thiết kế Session của bản sửa trước đã được thay hoàn toàn bằng [cấu trúc JWT hiện tại](jwt-auth-fix.md).

Theo yêu cầu mới ngày 16/10/2026, JWT được lưu trong sessionStorage riêng từng tab để F5 vẫn đăng nhập. Hồ sơ và quyền chỉ nằm trong bộ nhớ, được tải lại từ API sau reload. Logout và HTTP 401 chỉ xóa đăng nhập của tab tương ứng. Không lưu JWT vào localStorage hoặc URL.

Bộ hồi quy hiện tại: `tests/auth-session.test.cjs`. Tab mở qua opener hoặc Duplicate Tab có thể nhận bản sao sessionStorage ban đầu theo hành vi trình duyệt; các tab sau đó giữ trạng thái đăng nhập độc lập.
