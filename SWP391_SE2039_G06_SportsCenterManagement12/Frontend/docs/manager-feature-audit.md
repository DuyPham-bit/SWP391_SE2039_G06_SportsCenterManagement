# Đối chiếu chức năng Center Manager

Phạm vi: FE React/Vite hiện có và API .NET/SQL Server hỗ trợ các màn hình quản lý. Giữ các thay đổi Member đã có, không thay stack hoặc schema.

| Yêu cầu | Hiện trạng trước kiểm tra | Thay đổi / tiêu chí nghiệm thu |
| --- | --- | --- |
| Thành viên, HLV, nhân viên | Có nhân sự; thiếu danh sách thành viên | Danh sách thành viên phân trang tại server, tìm kiếm, tạo, cập nhật và khóa/mở tài khoản; xem gói đã mua. Nhân sự tải đủ các trang. |
| Lớp, bộ môn, phòng, lịch | Có lớp/phòng/lịch; bộ môn chỉ đọc | Thêm tab bộ môn: tạo/sửa/ngừng sử dụng bộ môn riêng trung tâm; bộ môn dùng chung chỉ đọc. Chặn ngừng bộ môn đang có lớp mở. Thêm sửa lịch học bằng API sẵn có. |
| Phân công HLV | Có thao tác API; hiển thị trường chưa được API trả về | Hiển thị sức chứa, trạng thái và chuyên môn thực; bỏ lịch và chứng chỉ giả định; giữ kiểm tra xung đột ở server. |
| Báo cáo theo thời gian | Chỉ kỳ hiện tại; chưa trình bày trạng thái đăng ký và biến động hội viên | Chọn khoảng ngày và nhóm ngày/tháng, thể hiện doanh thu, hội viên mới, đăng ký theo trạng thái; CSV cùng kỳ. Tổng thành viên bao gồm người chưa mua gói. |
| Gói, học phí, thời hạn | Đã có CRUD, giá, số ngày, trạng thái | Giữ màn hình hiện có, kiểm tra hồi quy. |
| Phân quyền | Đã có ma trận quyền theo trung tâm | Giữ API giới hạn vai trò/quyền và kiểm tra hồi quy. |
| Nhật ký | Chỉ 50 bản ghi, suy đoán vai trò từ hành động | Phân trang server để đọc toàn bộ lịch sử; ghi rõ tìm/lọc trong trang; bỏ vai trò suy đoán, xem giá trị trước/sau theo giờ Việt Nam. Phân công/gỡ HLV và thay đổi bộ môn ghi nhật ký cùng transaction. |

Decision: cho Manager tải danh sách thành viên không cần từ khóa; Receptionist vẫn phải nhập 2–100 ký tự. Mọi truy vấn lọc trung tâm trước khi phân trang. Khóa tài khoản thay cho xóa để giữ lịch sử.

Assumption: lịch hoạt động trong phạm vi này là lịch lớp và các buổi học, theo cấu trúc ClassSchedule/ClassSession hiện có.

Constraint: chỉ Manager của trung tâm được sửa hồ sơ/trạng thái thành viên. Bộ môn dùng chung không được sửa bởi Manager. Báo cáo tổng/hoạt động và trạng thái đăng ký là ảnh chụp hiện tại; số mới, sự kiện và doanh thu áp dụng khoảng ngày. Không suy ra tỷ lệ tăng trưởng khi chưa có dữ liệu đối chiếu.

Kiểm chứng ngày 11/10/2026:

- `npm.cmd test`: 37/37 kiểm thử FE đạt.
- `npm.cmd run build`: build production đạt; còn cảnh báo bundle trên 500 kB và Vite CJS của cấu hình hiện có.
- `dotnet build Backend/tests/ApiIntegration.Regression/ApiIntegration.Regression.csproj --artifacts-path <workspace>/.validation/manager-build`: build BE đạt, 0 warning/error.
- `ApiIntegration.Regression --sql --browser`: 106 kiểm tra JWT/SQL/HTTP và kết quả browser đạt; 31 kịch bản Chrome, gồm luồng Member/Coach và Manager. Mỗi lượt dùng database `SCMS_ApiIntegration_Test_<guid>` riêng.
- `Flow2.Regression`: 10 kiểm tra đầu vào lịch và 4 kiểm tra giới hạn phân quyền đạt.
- Chrome kiểm tra tạo/sửa/khóa/mở thành viên, danh sách trang 2, tạo/ngừng bộ môn, tạo/sửa lịch, phân công HLV, tạo gói, lưu phân quyền, nhật ký trang 2, báo cáo lịch sử và CSV. Có ảnh chụp mobile/desktop trong `<workspace>/.validation/browser`.

Vận hành: cần khởi động lại backend để nạp API bộ môn và thay đổi service. Không cần migration database. Cấu hình `.env.local` được giữ nguyên; bản build kiểm thử dùng chế độ riêng rồi xóa file cấu hình tạm.
