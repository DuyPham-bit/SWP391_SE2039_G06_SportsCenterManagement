# Đăng nhập nhiều tab bằng JWT

Thiết kế Session của bản sửa trước đã được thay hoàn toàn bằng [cấu trúc JWT hiện tại](jwt-auth-fix.md).

JWT và hồ sơ/quyền chỉ giữ trong bộ nhớ của từng tab. F5 hoặc mở tab mới cần đăng nhập lại; logout và HTTP 401 chỉ tác động tab tương ứng. Không đọc/ghi dữ liệu xác thực vào browser storage hoặc cookie.

Bộ hồi quy hiện tại: `tests/jwt-auth.test.cjs`. Tài liệu liên kết ở trên ghi cấu trúc FE/API, lệnh build frontend nhúng và bằng chứng kiểm thử mới nhất.
