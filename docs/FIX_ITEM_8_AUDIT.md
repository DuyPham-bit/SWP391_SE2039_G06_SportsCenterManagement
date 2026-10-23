# Fix item 8 — Audit

Ngày hoàn tất: 21/10/2026

## Kết quả

- Bỏ hoàn toàn phần “Giá trị trước / sau” khỏi màn hình Audit.
- API Audit không còn trả `OldValues` và `NewValues`; việc ẩn dữ liệu không chỉ phụ thuộc Frontend.
- Thay cột chi tiết bằng **Đối tượng tác động**, chỉ hiển thị loại đối tượng và mã định danh.
- Dữ liệu audit gốc vẫn được lưu trong database để không phá cơ chế truy vết nội bộ hiện có.

## Happy case

- Manager/System Admin tải danh sách audit và vẫn xem được thời gian, người thao tác, hành động, loại đối tượng và mã đối tượng.
- Tìm kiếm trong trang vẫn hoạt động theo hành động, người thực hiện, loại và mã đối tượng.

## Unhappy case và bảo mật

- Client không thể đọc payload trước/sau qua API Audit vì hai trường đã bị loại khỏi response DTO và truy vấn BLL.
- Phân trang và kiểm tra quyền theo trung tâm/System Admin giữ nguyên.

## Kiểm chứng

- Backend Release build: đạt, 0 lỗi và 0 cảnh báo.
- Frontend production build: đạt.
- Regression test xác nhận API, BLL, adapter và UI không còn sử dụng giá trị trước/sau.
