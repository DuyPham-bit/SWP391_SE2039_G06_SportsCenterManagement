# Kiểm thử và sửa lỗi nghiệp vụ Actor Coach

- Ngày kiểm tra: 2026-10-25
- Nhánh: `feature/rbac-admin-manager-integrated`
- HEAD nền: `90efe4b`
- Phạm vi: 8 nhóm chức năng Coach theo yêu cầu
- Trạng thái thay đổi: đã sửa và kiểm thử trong working tree, chưa commit/push

## Kết luận

Tám nhóm chức năng Coach đã được rà theo các luồng thành công, dữ liệu biên, dữ liệu mâu thuẫn, phân quyền và tính nguyên tử. Các lỗi nghiệp vụ phát hiện trong vòng này đã được sửa. Bộ kiểm thử frontend, audit quy tắc Coach, audit an toàn AI và hai bản build đều đạt.

Kiểm thử tích hợp dùng SQL Server cục bộ chưa thể chạy lại trên máy hiện tại vì không có SQL Server LocalDB runtime (`error 52 - Unable to locate a Local Database Runtime installation`). Vì vậy báo cáo này không tuyên bố một lượt ghi dữ liệu live mới; phần đó được ghi rõ là giới hạn môi trường, không được tính là PASS.

## Ma trận 8 chức năng

| Nhóm chức năng | Test case trọng tâm | Kết quả |
|---|---|---|
| Lịch dạy và danh sách học viên | HLV chính, HLV dạy thay, lớp không thuộc phạm vi, booking hợp lệ, ghi danh lớp còn hiệu lực, tài khoản ngừng hoạt động | PASS ở rule/source regression; live DB bị giới hạn môi trường |
| Thông tin và mục tiêu học viên | Chỉ trả học viên thuộc lớp phụ trách; có mục tiêu, trình độ và dữ liệu sức khỏe cho AI | PASS regression |
| Giáo án cá nhân/cả lớp | Tiêu đề rỗng, ngày đảo ngược, 0 hoặc hơn 50 bài, tên bài rỗng, tuần/ngày tập sai | PASS 14/14 Coach audit |
| Kết quả sau buổi tập | Chỉ ghi sau khi buổi kết thúc; hỗ trợ buổi qua đêm; booking hoặc enrollment hợp lệ; cập nhật thay vì tạo trùng | PASS rule/source regression |
| Tiến độ và nhận xét | Chặn kết quả rỗng, ngày tương lai và chỉ số cơ thể phi thực tế; thông báo đúng khi tạo/cập nhật | PASS rule/source regression |
| Điểm danh | HLV hiệu lực của session, trạng thái hợp lệ, không trùng học viên, lớp đã hủy/chưa bắt đầu/quá ngày, roster đầy đủ | PASS regression |
| Thông báo và bài tập về nhà | Một hoặc nhiều lớp, một học viên, toàn bộ học viên; chống target mơ hồ/rỗng; khử trùng người nhận; giao dịch nguyên tử | PASS Coach audit và frontend regression |
| AI gợi ý bài tập | BMI, bệnh lý/chấn thương ghi đè tag chủ quan; fail-closed với bài nguy hiểm; schema NLP | PASS 19/19 AI safety audit |

## Nhật ký lỗi và phần thiếu đã xử lý

| ID | Lỗi nghiệp vụ | Cách sửa | Trạng thái |
|---|---|---|---|
| COACH-B01 | HLV dạy thay không được xem roster/điểm danh, trong khi HLV chính vẫn có thể thao tác session đã bị thay | Xác định HLV hiệu lực theo `ClassSession.CoachId`; chỉ fallback về HLV của lớp khi session không có override | FIXED |
| COACH-B02 | Roster và eligibility chỉ nhận `SessionBooking`, bỏ học viên ghi danh lớp | Hợp nhất booking với enrollment có trạng thái `Active`, `Confirmed`, `Enrolled`; loại tài khoản không hoạt động | FIXED |
| COACH-B03 | Ghi kết quả lại cùng session có thể tạo bản ghi trùng | Upsert theo `(SessionId, MemberId)`; request giống hệt trở thành idempotent | FIXED |
| COACH-B04 | Buổi tập qua đêm bị hiểu sai ngày kết thúc | Nếu `EndTime <= StartTime`, thời điểm kết thúc được tính sang ngày hôm sau theo giờ Việt Nam | FIXED |
| COACH-B05 | Giáo án và tiến độ thiếu validation nghiệp vụ nhất quán | Tách `CoachWorkflowRules` với validation xác định cho ngày, bài tập, lịch và chỉ số cơ thể | FIXED |
| COACH-B06 | Gửi nhiều lớp bằng nhiều request gây thành công một phần và gửi trùng cho học viên học nhiều lớp | Gửi một request `ClassIds`, backend kiểm tra toàn bộ phạm vi, khử trùng người nhận và commit một giao dịch | FIXED |
| COACH-B07 | Bộ lọc “đã gửi theo lớp” dựa vào chuỗi hiển thị nên không đáng tin cậy | Lưu `target_class_ids`, trả `classIds` có cấu trúc và lọc theo ID; thêm migration | FIXED |
| COACH-B08 | Thông báo gửi riêng học viên bị ghi metadata như gửi toàn bộ lớp | Chỉ lưu metadata lớp khi target thực sự là lớp; target học viên dùng tên người nhận | FIXED |
| COACH-B09 | Bài tập về nhà cho phép chọn đồng thời lớp và học viên, hoặc không có người nhận hoạt động | Bắt buộc đúng một target, kiểm tra recipient hoạt động và bọc assignment + notification trong giao dịch | FIXED |
| COACH-B10 | Có thể đánh dấu bài nộp `Reviewed` dù không có điểm lẫn nhận xét | Yêu cầu ít nhất điểm hoặc feedback; cập nhật và thông báo trong cùng giao dịch | FIXED |
| COACH-B11 | Broadcast/notification chấp nhận target mơ hồ hoặc danh sách rỗng | Từ chối `ClassId` + `ClassIds`/`MemberId`, ID không hợp lệ và mảng rỗng tường minh | FIXED |
| COACH-B12 | Broadcast/chat có thể lưu dở dang nếu bước tạo notification thất bại | Bọc message/broadcast và toàn bộ delivery trong giao dịch; không gửi tới tài khoản ngừng hoạt động | FIXED |
| COACH-B13 | Giới hạn cân nặng ở Dashboard khác backend | Đồng bộ phạm vi 25–300 kg | FIXED |
| COACH-B14 | Bản production tạo vòng phụ thuộc giữa chunk React và thư viện, gây lỗi `createContext` khi mở trang | Bỏ chiến lược `manualChunks` hai nhóm; để Rollup tạo dependency graph an toàn | FIXED |
| COACH-B15 | Lỗi gửi chat chỉ hiện toast chung; vùng chat không hiện lỗi và khó retry | Truyền lỗi về state của form, giữ nguyên bản nháp; kiểm chứng bằng Chrome fixture | FIXED |

## Bằng chứng kiểm thử mới nhất

| Lệnh/nhóm kiểm thử | Kết quả |
|---|---|
| `npm.cmd test` | **109/109 PASS** |
| `npm.cmd run test:chat:browser` | **7/7 PASS** trên Chrome headless với API fixture cô lập |
| `CoachBusinessAudit` | **14/14 PASS** |
| `AiSafetyAudit` | **19/19 PASS** |
| Backend Release build | **PASS, 0 warning, 0 error** |
| Frontend production build | **PASS** |
| EF migration script | **PASS**, có cột `target_class_ids` |
| `git diff --check` | **PASS** |
| Quét key đã lộ và private-key material trong tracked files | **Không phát hiện** |

Frontend production build còn cảnh báo kích thước lớn cho các thư viện xuất PDF/Excel. Đây là vấn đề tối ưu tải trang, không làm build thất bại và không ảnh hưởng tính đúng của nghiệp vụ Coach.

## Giới hạn môi trường và bước triển khai

- `LogicAudit` cần SQL Server LocalDB nhưng máy hiện tại không có runtime, nên integration test DB không chạy được trong vòng này.
- Migration `AddCoachNotificationTargets` phải được áp dụng khi triển khai backend trước khi dùng lịch sử thông báo theo lớp.
- Không có request ghi dữ liệu vào database dùng chung trong vòng kiểm thử này.
- Không commit hoặc push trong vòng này; cần review diff rồi mới tạo commit nếu được yêu cầu.
