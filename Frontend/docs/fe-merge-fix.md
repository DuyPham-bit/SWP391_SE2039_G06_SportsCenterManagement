# Sửa lỗi FE sau merge — 15/10/2026

Nguyên nhân build thất bại là dấu xung đột Git còn trong 6 file Manager: `AnalyticsCharts.jsx`, `ClassesAndRooms.jsx`, `CoachAssignment.jsx`, `MemberManagement.jsx`, `ReportsAnalytics.jsx`, `StaffManagement.jsx`.

Giữ stack React 18/JavaScript/Vite và giao diện hiện tại, ghép các thay đổi nghiệp vụ từ nhánh Manager:

- Bỏ modal HLV bị ghép trùng; kiểm tra chuyên môn theo ID bộ môn, loại lớp đã đóng khỏi danh sách phân công và giữ `replacePrimary`.
- Bổ sung state/import còn thiếu cho chuyên môn nhân viên; chọn và lưu `sportIds` khi tạo, bổ nhiệm hoặc sửa HLV.
- Email hội viên chỉ đọc khi sửa và không được gửi trong payload cập nhật. Lịch sử gói có trạng thái tải, lỗi, thử lại và nhãn tiếng Việt.
- Tách lớp đã hủy, cho phép mở lại thành bản nháp; giữ calendar tuần và kiểm tra form lớp/lịch trước khi gọi API. Nếu lưu lớp thành công nhưng phân công HLV thất bại, hiển thị kết quả từng bước và giữ ID lớp để tránh tạo trùng khi thử lại.
- Ghép đủ export/import biểu đồ; doanh thu bộ môn lấy từ API. Xếp hạng phòng dùng số ca/lượt khách thực tế, bỏ suy đoán doanh thu từ tỷ lệ lượt đặt chỗ.

Các lệnh kiểm tra từ `Frontend/`:

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run test:manager:browser
```

Kết quả: production build đạt; 25/25 test regression đạt; 8/8 kiểm tra Chrome headless đạt, gồm các thao tác trên và mở 6 route Manager ở viewport mobile. Báo cáo browser được ghi vào `Frontend/tmp/manager-merge/report.json` (thư mục tạm được Git bỏ qua).

Browser test dùng API fixture cục bộ và tắt CDN để chạy offline; xác minh hành vi React/request, không xác nhận giao diện CSS từ CDN hoặc kết nối backend/SQL Server thật. Có thể đặt `CHROME_PATH` nếu Chrome không nằm ở đường dẫn mặc định của Windows.

Không sửa BE trong lần sửa này; không commit, push hoặc release. Các thay đổi BE/FE đã tồn tại trước đó được giữ nguyên.
