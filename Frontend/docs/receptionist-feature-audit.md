# Đối chiếu chức năng Lễ tân

Ngày: 2026-10-11. Phạm vi: FE React hiện có và API .NET/SQL Server phục vụ nghiệp vụ tại quầy.

| Yêu cầu | Hiện trạng | Tiêu chí hoàn thành |
| --- | --- | --- |
| Tìm kiếm, xem thành viên | Có, giới hạn 50 kết quả; lỗi lịch sử gói bị ẩn | Tra cứu đầy đủ kết quả trong trung tâm, xem liên hệ, trạng thái tài khoản/gói và lịch sử có lỗi/thử lại |
| Đăng ký thành viên mới | Có API lưu thật và form tại quầy | Tạo tài khoản, tìm lại hồ sơ vừa tạo |
| Đăng ký/gia hạn gói | Có checkout Cash/POS | Ghi nhận số tiền nhận, giữ khóa chống giao dịch trùng khi thử lại; chỉ hủy hóa đơn chờ khi chọn hành động rõ ràng |
| Trạng thái và thời hạn gói | Có, chưa xét ngày bắt đầu và ngày Việt Nam | Phân biệt đang hiệu lực, chưa bắt đầu, hết hạn và chờ thanh toán; hiển thị khoảng ngày |
| Điểm danh tại trung tâm | Có, lọc ngày UTC và thiếu kiểm tra ngày bắt đầu | Chỉ nhận gói đang hiệu lực; ngày UTC+7; tổng lượt chính xác kể cả trên 100 lượt; lịch sử/lỗi/thử lại |
| Đặt/hủy lớp cho thành viên | Có | Chọn đúng hồ sơ, không hiển thị dữ liệu thành viên trước khi tải lỗi; chỉ hủy chỗ sắp tới; dùng quy tắc đặt/hủy của API |
| Thu tiền, in/xuất hóa đơn | Checkout có; thiếu tra cứu/in/xuất và thu tiếp | Danh sách có phân trang, xem dòng dịch vụ và lịch sử thanh toán; thu tiếp tiền mặt/POS theo số dư; in/lưu PDF qua trình duyệt và tải CSV |
| Tiếp nhận yêu cầu hỗ trợ | Đã có bảng dữ liệu, chưa có API/FE | Tạo yêu cầu gắn thành viên, lưu mức ưu tiên, trạng thái, ghi chú xử lý; tìm lại sau tải trang |

Decision: dùng quyền `lookup_member` cho hỗ trợ/đặt lớp; `register_counter_package` cho hóa đơn/thu tiền; `checkin_member` cho check-in. API giới hạn trung tâm và vai trò, kiểm tra quyền trước truy cập/ghi. Dùng bảng support_requests/support_request_messages có sẵn, không đổi stack và không cần migration mới.

Decision: hóa đơn xuất từ số liệu đã lưu; in/lưu PDF bằng hộp thoại trình duyệt, CSV Unicode có chống công thức và HTML được escape. Đây là chứng từ thu tiền của hệ thống, không triển khai tích hợp hóa đơn điện tử thuế. Thanh toán POS ghi nhận mã chuẩn chi từ máy POS, không tự thực hiện quẹt thẻ.

Constraint: lịch sử check-in trả tối đa 100 lượt gần nhất; dashboard lấy tổng lượt riêng theo ngày Việt Nam. Không giả lập trạng thái cổng vật lý hoặc số liệu hoạt động. Không gọi nhà cung cấp thanh toán/AI thật trong kiểm thử.

## Bằng chứng kiểm tra

Sẽ cập nhật từ lần chạy kiểm tra sau triển khai.
