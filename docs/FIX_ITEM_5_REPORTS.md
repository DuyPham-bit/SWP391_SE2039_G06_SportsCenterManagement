# Fix item 5 — Báo cáo thống kê

Ngày thực hiện: 20/10/2026

## Đã xử lý

- Thay phần trình bày mang tính “top performers/leaderboard” bằng **Tổng quan vận hành trung tâm**. Ba thẻ còn lại diễn đạt theo dữ liệu nghiệp vụ: nhu cầu lớp, cơ cấu doanh thu và mức khai thác sân/phòng.
- Đợt chỉnh giao diện tiếp theo: thay nền tối bằng bố cục thẻ nền sáng theo style dashboard chung; dùng màu phân nhóm nhất quán (lớp, doanh thu, cơ sở vật chất), bỏ icon/huy hiệu xếp hạng và giữ khả năng đọc tốt ở dark mode.
- Bổ sung KPI **nhân sự đang hoạt động**, kèm số HLV và lễ tân. Báo cáo hiện có các chỉ số hội viên, doanh thu, check-in, nhân sự và vận hành cơ sở vật chất.
- Frontend gọi `GET /api/reports/operations` và dùng dữ liệu BLL/DAL đã tổng hợp theo `centerId`, `from`, `to` làm nguồn chuẩn cho lớp, bộ môn, sân/phòng và nhân sự. Không suy đoán số nhân sự tại client.
- Sửa truy vấn check-in phía client để luôn gửi `centerId`; trường hợp Admin xem báo cáo không còn thiếu phạm vi trung tâm.
- CSV được mở rộng thành báo cáo đối soát có phần tổng quan nhân sự và hiệu suất HLV, ngoài doanh thu, hội viên, lớp, bộ môn và sân/phòng. CSV tiếp tục có BOM UTF-8 và chống công thức bảng tính từ dữ liệu nhãn.
- Bổ sung fixture/kiểm tra regression bảo đảm overview nhận đúng số nhân sự từ endpoint operations.

## Kiến trúc và logic

- API controller chỉ kiểm tra phạm vi center theo JWT.
- `IReportService`/`ReportService` (BLL) tổng hợp nghiệp vụ từ DAL/EF Core; endpoint `reports/operations` đã có sẵn và hiện được Frontend sử dụng.
- Với dữ liệu rỗng, UI giữ các giá trị `0`/trạng thái “chưa có dữ liệu”; với lỗi API, giao diện hiển thị `BusinessAlert` và cho phép thử lại, không tự tạo báo cáo giả.

## Kiểm chứng

- `npm.cmd run build` trong `Frontend/`: thành công.
- `dotnet build SportsCenterManagement.API/SportsCenterManagement.API.csproj --no-restore` trong `Backend/Backend/`: thành công, 0 warning, 0 error.
- `npm.cmd test` trong `Frontend/`: 73/74 kiểm thử qua. Kiểm thử còn lại không liên quan mục 5 và đã thất bại từ cấu hình đang có: `appsettings.Development.json` chứa `VnPay:HashSecret` không rỗng. File này không được chỉnh sửa trong mục 5 để tránh tự ý thay đổi credential/cấu hình cục bộ.

## Chưa thực hiện

Chỉ mục 5 đã được xử lý theo yêu cầu. Không thay đổi các mục 0–4 hoặc 6–9 của `Fix_item.txt`.
