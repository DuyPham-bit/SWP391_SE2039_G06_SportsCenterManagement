# Đối chiếu chức năng Member

Nguồn: 9 nhóm yêu cầu Member do người dùng cung cấp ngày 11/10/2026. Phạm vi: FE hiện có, dữ liệu đọc và thông báo đổi/hủy lịch tối thiểu cần cho FE. Không push, release hoặc thay đổi schema.

## Decision và thiết kế

- Giữ React 18/JavaScript/Vite, hash router, giao diện hiện có, JWT và backend ASP.NET Core/SQL Server.
- Tái sử dụng đăng ký, ProfileModal, mua/gia hạn, lịch lớp, đặt/hủy, giáo án/tiến độ và AI. Thêm điểm truy cập trực tiếp từ dashboard.
- Bổ sung dữ liệu phòng, HLV, trạng thái buổi và điểm danh vào response GET `members/me/session-bookings`, vẫn giới hạn theo người dùng trong JWT. Các trường mới là tùy chọn để giữ tương thích các response đặt/hủy.
- Thêm `#/member/attendance` và `#/member/notifications`, bảo vệ bằng đăng nhập/vai trò; lịch sử điểm danh dùng quyền đọc đặt chỗ sẵn có (`book_class`). Không suy diễn có mặt từ trạng thái đặt chỗ.
- Nhắc lớp trong 24 giờ và gói sắp hết hạn trong 7 ngày từ dữ liệu thực, tính theo Asia/Ho_Chi_Minh. Thông báo server giữ trạng thái đọc trên server. Buổi bị trung tâm hủy được cảnh báo từ trạng thái buổi thực.
- Backend lưu thông báo `ScheduleChanged` cho hội viên có chỗ đặt bị ảnh hưởng khi đổi phòng kế thừa từ lớp hoặc hủy lớp/lịch. Thông báo và trạng thái lịch cùng transaction; mỗi người nhận một thông báo cho mỗi thao tác.
- Tải độc lập từng nguồn trên dashboard; lỗi một nguồn không biến thành số 0 hoặc che các nguồn còn lại. Hỗ trợ tải lại, trạng thái trống và mobile.
- Rollback: hoàn nguyên các file của thay đổi này; không cần migration hoặc thay đổi dữ liệu.

## Traceability / tiêu chí nghiệm thu

| ID | Yêu cầu | Hiện trạng trước sửa | Thay đổi / điểm kiểm tra |
|---|---|---|---|
| MEM-01 | Đăng ký, sửa thông tin | Đã có Register/ProfileModal | Nút hồ sơ trực tiếp trên dashboard; giữ luồng API |
| MEM-02 | Xem, đăng ký/gia hạn gói | Đã có MemberPackages | Thẻ gói và nhắc hết hạn có liên kết mua/gia hạn |
| MEM-03 | Xem lớp/lịch học | Đã có ClassScheduleView | Liên kết dashboard; giữ lịch theo session |
| MEM-04 | Đăng ký/hủy lớp | Đã có MyBookings | Hiển thị lịch/HLV/phòng; không gợi ý hủy buổi đã bắt đầu |
| MEM-05 | Lịch cá nhân, thông tin HLV | Dashboard đếm cả lịch cũ, thiếu HLV/phòng | Lọc ca Scheduled/Confirmed tương lai, sắp tăng dần; hiện HLV/chuyên môn/phòng |
| MEM-06 | Lịch sử điểm danh, kết quả | Có kết quả; thiếu lịch sử điểm danh | Màn hình điểm danh từ bản ghi thật, có trạng thái chưa điểm danh; kết quả ở MyProgress |
| MEM-07 | Kế hoạch và nhận xét HLV | Đã có MyProgress; có nhãn chỉ số mẫu | Dashboard tóm tắt giáo án/nhận xét; bỏ đánh giá thể lực không có căn cứ |
| MEM-08 | Hỏi AI lịch/bài tập/dịch vụ | Đã có chat qua API | Bổ sung mô tả và ô nhập câu hỏi đúng phạm vi |
| MEM-09 | Thông báo lịch, thay đổi, hạn gói | Inbox chỉ tải khi bấm; thiếu nhắc lịch/hạn gói | Trang thông báo, số chưa đọc, làm mới định kỳ, nhắc lớp/hạn gói và ca bị hủy |

## Constraint

- Nhắc lịch/hạn gói là thông báo trong ứng dụng khi mở trang; không bao gồm email, SMS hoặc web push nền.
- Quy tắc backend hiện tại không cho sửa giờ của lịch đã có lượt đặt sắp tới; trung tâm phải hủy lịch đó. Đổi phòng kế thừa và hủy lịch/lớp phát thông báo lưu server. Thay HLV vẫn cập nhật tên trên lịch cá nhân nhưng chưa phát thông báo riêng.
- AI cần khóa Gemini, thanh toán cần cấu hình cổng. Không tạo câu trả lời hoặc kết quả thanh toán giả.

## Bằng chứng kiểm tra

- `npm.cmd test`: **32/32 đạt**, gồm lọc/sắp lịch tương lai, mốc hết hạn theo ngày Việt Nam, nhắc trước 24 giờ/7 ngày, dữ liệu thiếu và mapping điểm danh/phòng/HLV. Bộ FE cũ 23/23 đạt trước khi sửa.
- `npm.cmd run build`: đạt. Vite vẫn cảnh báo bundle lớn hơn 500 kB và CJS API; không đổi cấu hình bundle trong phạm vi này.
- Build API và bộ tích hợp bằng `dotnet build Backend/tests/ApiIntegration.Regression/ApiIntegration.Regression.csproj --artifacts-path <workspace>/.validation/member-build --ignore-failed-sources -v minimal` từ repository BE: **0 lỗi, 0 warning**. Output riêng vì API local đang giữ DLL của output mặc định.
- Chạy DLL `ApiIntegration.Regression` với `--sql --browser` từ workspace: **77 checks đạt**, trên database mới `SCMS_ApiIntegration_Test_cf09c2393d32473bb5eebf92d2253dcb`; không truy cập dữ liệu nghiệp vụ hiện có.
- Browser Chrome: **19 checks đạt**, gồm dashboard/lịch/HLV/phòng, mở hồ sơ có dữ liệu, lỗi tiến độ 503 có kiểm soát và tải lại, điểm danh/lọc, thông báo đã đọc/chưa đọc, giáo án, AI thiếu cấu hình trả lỗi thật, mobile 390×844 và desktop 1365×900. Không có exception JavaScript ứng dụng; các HTTP lỗi chỉ là lỗi 503 được dự kiến trong test.
- Bộ `Flow2.Regression` sẵn có: **14 checks đạt**, gồm 10 đầu vào truy vấn không hợp lệ và 4 kiểm tra phân quyền/cô lập trung tâm.
- Browser dùng bản build riêng ở `<workspace>/.validation/member-frontend` với Google tắt và API `/api` đi qua proxy fixture. File mode env tạm thời đã xóa; `.env.local` của người dùng giữ nguyên. Hai lần chạy browser đầu không đạt vì test mong Google tắt nhưng bundle còn dùng Client ID local; đã tách cấu hình và sửa assertion theo thông báo thực tế trước lần chạy đạt.
- Ảnh đã xem: [dashboard desktop](../../.validation/browser/member-dashboard-desktop.png), [dashboard mobile](../../.validation/browser/member-dashboard-mobile.png), [điểm danh mobile](../../.validation/browser/member-attendance-mobile.png). [Browser report](../../.validation/browser/report.json) chứa kết quả và HTTP requests.
- Project chưa có script lint/typecheck riêng; FE JavaScript được kiểm tra cú pháp qua Vite và kiểm thử runtime. Không có kết quả SonarQube/Stitch MCP; bằng chứng hiện tại là build, kiểm thử, diff review và ảnh Chrome.

## Trạng thái bàn giao local

- FE: `SWP391_SE2039_G06_SportsCenterManagement_FE`, nhánh `fix_final_v2`; BE: `SWP391_SE2039_G06_SportsCenterManagement_BE`, nhánh `feature/jwt-google-ai-integration`.
- Thay đổi ở working tree, chưa commit/push/merge/release. Không thay đổi database schema hoặc connection string.
- Khởi động lại backend local sau khi dừng phiên đang chạy để build/load các trường đọc mới và thông báo đổi/hủy lịch. Có thể tiếp tục chạy FE bằng `npm.cmd run dev` trong `Frontend`.
- Các luồng đăng ký tài khoản, mua gói, đặt/hủy lớp và gọi Gemini đã có sẵn; thay đổi này giữ nguyên contract và bổ sung kiểm chứng hồi quy liên quan. Không tuyên bố đã thanh toán qua cổng thật hoặc gọi AI thành công khi thiếu cấu hình.
