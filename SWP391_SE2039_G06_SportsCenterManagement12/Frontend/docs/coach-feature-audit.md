# Đối chiếu chức năng Coach

Phạm vi: bổ sung FE Coach và các hợp đồng API cần thiết trên React/Vite, .NET và SQL Server hiện có. Giữ thay đổi Member/Manager và cấu hình của người dùng.

| Yêu cầu | Thiếu trước kiểm tra | Tiêu chí nghiệm thu |
| --- | --- | --- |
| Lịch dạy và danh sách lớp | Dashboard suy đoán HLV theo tên, đếm buổi thành lớp; chỉ tải lịch tương lai | Dashboard dùng danh sách lớp được phân công; lịch chọn khoảng ngày, hiển thị phòng và trạng thái thật, liên kết đúng ca/lớp. |
| Hồ sơ và mục tiêu học viên | Có cột mục tiêu/trình độ; chưa có chi tiết hồ sơ/thể trạng | Xem hồ sơ cơ bản, mục tiêu/trình độ, thể trạng đã lưu; không tự điền thông tin mẫu. Chỉ học viên trong lớp được phân công. |
| Giáo án cá nhân/cả lớp | Có API và màn hình; giáo án cá nhân tự điền thể trạng giả định | Giữ tạo giáo án lớp, lưu/cập nhật/hủy giáo án cá nhân; nhập dữ liệu thật và báo lỗi có thể thử lại. |
| Kết quả sau từng buổi | Chưa truyền sessionId dù database có cột | Chọn buổi đã kết thúc, xác thực lớp/học viên đã đặt buổi tại server; lưu ngày theo buổi và hiển thị lại. Giữ bản ghi cũ không có sessionId. Chỉ số cơ thể có thể bỏ trống. |
| Tiến độ và nhận xét | Lịch sử trộn các lớp; thiếu so sánh chỉ số | Lọc đúng học viên và lớp, nhận xét lưu bền; so sánh hai lần đo có dữ liệu, không suy đoán tiến bộ từ tăng/giảm cân. |
| Điểm danh | Không chọn buổi quá khứ, lỗi tải không rõ; thiếu muộn/có phép | Chọn ngày/ca, tải lại bản ghi, chọn đủ 4 trạng thái; chặn ca chưa bắt đầu/bị hủy và giữ dữ liệu khi lưu lỗi. |
| Thông báo/bài tập về nhà | Có gửi thật, lịch sử hiển thị trường người gửi không được API trả; chưa có số người nhận | Giữ gửi theo lớp/toàn bộ học viên được phân công, hiển thị số người nhận và thời gian thật; thử lại khi tải lỗi. |
| AI theo mục tiêu/trình độ/lịch sử | Tự điền mục tiêu, trình độ/chấn thương mẫu; server chỉ gửi nội dung form | Dùng hồ sơ và tối đa 10 kết quả gần nhất của đúng học viên/lớp, xem ngữ cảnh trước khi yêu cầu; server tự truy vấn lại. HLV xem xét rồi mới lưu giáo án. Lỗi cấu hình/nhà cung cấp hiển thị rõ. |

Decision: sử dụng cột `TrainingResult.SessionId` và các trường hồ sơ đã tồn tại; không thay schema. API tiến độ cũ vẫn chấp nhận bản ghi tổng quát không gắn buổi; FE mới ghi kết quả theo buổi đã kết thúc. Lịch sử AI giới hạn trong lớp đang phụ trách, không truyền các trường tên/mã thẻ/email/điện thoại.

Constraint: không gọi nhà cung cấp AI bằng khóa thật để kiểm thử. Kiểm tra ngữ cảnh SQL, giới hạn truy cập và phản hồi 503 khi chưa cấu hình; không tuyên bố chất lượng gợi ý từ nhà cung cấp khi chưa chạy thực tế.

Kiểm chứng ngày 11/10/2026:

- `npm.cmd test`: 43/43 kiểm thử FE đạt; bao gồm múi giờ Việt Nam, thời điểm mở điểm danh/ghi kết quả, chỉ số bỏ trống và hợp đồng sessionId/ngữ cảnh AI.
- `npm.cmd run build`: build production đạt. Còn cảnh báo Vite CJS và bundle trên 500 kB của cấu hình hiện có.
- Build `ApiIntegration.Regression` tại `<workspace>/.validation/coach-build`: 0 warning/error.
- `ApiIntegration.Regression --sql --browser`: 130 kiểm tra đạt trên database SQL Server LocalDB riêng; 39 kịch bản Chrome đạt, không có JavaScript exception. Có hồi quy Member/Manager.
- API kiểm tra ngày/phòng thật, lịch sử buổi đã kết thúc, tương thích truy vấn lịch cũ; ghi kết quả gắn buổi; chặn buổi tương lai/bị hủy/không có đặt chỗ/sai ngày và học viên/lớp ngoài phân công. Kiểm tra lịch sử AI giới hạn 10 kết quả, đúng học viên/lớp, không có trường định danh trong ngữ cảnh.
- Chrome kiểm tra cập nhật/tải lại giáo án cá nhân và lớp, hồ sơ mobile, điểm danh muộn và ghi chú, chặn điểm danh tương lai, kết quả theo buổi với chỉ số để trống, lỗi tải và thử lại, ngữ cảnh AI và lỗi thiếu cấu hình; gửi thông báo/bài tập thật.
- `Flow2.Regression`: 10 kiểm tra đầu vào lịch và 4 kiểm tra giới hạn phân quyền đạt.
- Đã xem ảnh desktop dashboard/điểm danh/AI và mobile hồ sơ/tiến độ tại `<workspace>/.validation/browser`.

Vận hành: cần khởi động lại backend để nạp API mới. Không cần migration. Không sửa appsettings hoặc `.env.local`; file cấu hình chế độ kiểm thử tạm đã được xóa. Gợi ý AI thực tế phụ thuộc cấu hình/nhà cung cấp Gemini; lượt kiểm chứng này không gọi dịch vụ thật.
