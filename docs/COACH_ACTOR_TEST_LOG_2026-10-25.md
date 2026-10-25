# Báo cáo kiểm thử Actor Coach

> Cập nhật: các lỗi trong báo cáo này đã được xử lý. Xem kết quả mới tại `docs/COACH_ACTOR_RETEST_LOG_2026-10-25.md`.

- Ngày kiểm thử: 2026-10-25
- Nhánh: `feature/rbac-admin-manager-integrated`
- Commit: `3d8417f` (`feat(ai): integrate AI workout recommendation, medical NLP engine and coach portal fixes`)
- Phạm vi: các chức năng nghiệp vụ của Huấn luyện viên (Coach)
- Môi trường: Frontend Vite tại `http://127.0.0.1:3004`, Backend ASP.NET Core tại `http://localhost:54162`

## 1. Kết luận tổng quan

| Nhóm chức năng | Kết quả | Kết luận ngắn |
|---|---|---|
| Xem lịch dạy và lớp/học viên phụ trách | PASS | API trả dữ liệu thật và chặn truy cập lớp không được phân công. |
| Xem thông tin cơ bản, mục tiêu và trình độ học viên | PASS | Dữ liệu mục tiêu, trình độ, chiều cao và cân nặng có đầy đủ trong phản hồi. |
| Tạo kế hoạch cá nhân hoặc cả lớp | PARTIAL | Có API, màn hình và dữ liệu kế hoạch; validation lỗi hoạt động. Chưa tạo bản ghi hợp lệ mới để tránh làm bẩn CSDL dùng chung. |
| Ghi nhận kết quả sau buổi tập | PARTIAL / UI FAIL | Trang chuyên dụng dùng API thật, nhưng nút lưu nhanh trong Dashboard chỉ báo thành công giả và không gọi API. |
| Đánh giá tiến độ và ghi nhận nhận xét | PARTIAL / UI FAIL | Có API và dữ liệu tiến độ/nhận xét; form Dashboard không lưu xuống backend. |
| Điểm danh từng buổi | PARTIAL / UI FAIL | Trang điểm danh chuyên dụng và ràng buộc backend có hoạt động; thao tác nhanh trong Dashboard không gọi API. Không có buổi hợp lệ trong ngày để kiểm thử ghi thành công. |
| Gửi thông báo hoặc bài tập về nhà | PARTIAL | API đọc và validation/phân quyền hoạt động; không gửi dữ liệu hợp lệ mới để tránh gửi thông báo thật cho dữ liệu dùng chung. |
| AI gợi ý bài tập | FAIL | Runtime có thể sinh phác đồ hợp lệ, nhưng frontend hiện làm rơi `subjectiveTags`; AI cũng chỉ thử một lần nên có thể trả 422 ngẫu nhiên khi kết quả đầu tiên vi phạm bộ kiểm tra an toàn. |

Tổng hợp theo 8 nhóm yêu cầu: **2 PASS, 5 PARTIAL, 1 FAIL**.

## 2. Ma trận test case chi tiết

### 2.1. Xác thực, lịch dạy và lớp phụ trách

| ID | Test case | Kỳ vọng | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| COACH-AUTH-01 | Đăng nhập tài khoản Coach và đọc profile/capabilities | HTTP 200, đúng role Coach | HTTP 200; profile và capabilities hợp lệ | PASS |
| COACH-CLASS-01 | Lấy danh sách lớp được phân công | HTTP 200, chỉ trả lớp của Coach | HTTP 200; trả 2 lớp, ID 3 và 4 | PASS |
| COACH-SCHEDULE-01 | Lấy lịch dạy trong khoảng 2026-10-01 đến 2026-11-30 | HTTP 200, có lịch được phân công | HTTP 200; trả 2 buổi, ID 1 và 2 | PASS |
| COACH-ROSTER-01 | Lấy danh sách học viên trong lớp được phân công | HTTP 200 | HTTP 200; trả học viên của lớp | PASS |
| COACH-SCOPE-01 | Truy cập lớp không được phân công | Bị từ chối | HTTP 403, mã nghiệp vụ `CO-02` | PASS |

### 2.2. Hồ sơ và mục tiêu học viên

| ID | Test case | Kỳ vọng | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| COACH-MEMBER-01 | Đọc thông tin học viên trong lớp | Có dữ liệu cơ bản và mục tiêu | Có `fitnessGoal`, `fitnessLevel`, `height`, `weight` | PASS |
| COACH-MEMBER-02 | Đọc ngữ cảnh AI của học viên | Có BMI, bệnh lý/lịch sử sức khỏe và mục tiêu | HTTP 200; dữ liệu BMI và hồ sơ sức khỏe có mặt | PASS |

Ghi nhận dữ liệu kiểm thử đáng chú ý:

- Học viên ID 2: BMI 19.6, mức bình thường; có mục tiêu và trình độ.
- Học viên ID 3: BMI 11.8, thiếu cân nghiêm trọng; có ghi nhận gù/sai lệch tư thế và cổ tay yếu.

### 2.3. Kế hoạch tập luyện

| ID | Test case | Kỳ vọng | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| COACH-PLAN-READ-01 | Đọc danh sách kế hoạch | HTTP 200 | HTTP 200; có ít nhất 1 kế hoạch đã lưu | PASS |
| COACH-PLAN-VALIDATE-01 | Tạo kế hoạch rỗng/không hợp lệ | HTTP 400 | HTTP 400 | PASS |
| COACH-PLAN-WRITE-01 | Tạo kế hoạch hợp lệ cho cá nhân/lớp | Bản ghi được lưu | Không thực hiện trên CSDL dùng chung | NOT RUN |

Đánh giá: chức năng và validation hiện diện, nhưng chưa có bằng chứng ghi thành công mới trong đợt kiểm thử này.

### 2.4. Kết quả tập luyện và đánh giá tiến độ

| ID | Test case | Kỳ vọng | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| COACH-PROGRESS-READ-01 | Đọc lịch sử tiến độ | HTTP 200 | HTTP 200; có ít nhất 1 bản ghi | PASS |
| COACH-PROGRESS-VALIDATE-01 | Gửi ngày ghi nhận ở tương lai | HTTP 400 | HTTP 400 | PASS |
| COACH-PROGRESS-UI-01 | Lưu kết quả từ form nhanh trong Coach Dashboard | Gọi API và lưu backend | UI chỉ đổi trạng thái thành “đã lưu”, không gọi API | FAIL |
| COACH-PROGRESS-WRITE-01 | Ghi bản tiến độ hợp lệ mới | Bản ghi được lưu | Không thực hiện trên CSDL dùng chung | NOT RUN |

### 2.5. Điểm danh

| ID | Test case | Kỳ vọng | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| COACH-ATTENDANCE-ROSTER-01 | Đọc danh sách điểm danh của buổi được phân công | HTTP 200 | HTTP 200 | PASS |
| COACH-ATTENDANCE-PAST-01 | Sửa điểm danh buổi đã qua | Backend khóa theo quy tắc nghiệp vụ | HTTP 409 | PASS |
| COACH-ATTENDANCE-BOUNDARY-01 | Kiểm thử biên logic thời gian | Tất cả case hợp lệ | 3/3 test frontend PASS | PASS |
| COACH-ATTENDANCE-UI-01 | Bấm “Confirm & Save” ở Dashboard | Gọi API điểm danh và lưu | Chỉ `setTimeout` rồi hiện thông báo thành công, không gọi API | FAIL |
| COACH-ATTENDANCE-WRITE-01 | Điểm danh hợp lệ cho buổi trong ngày | Lưu thành công | Không có buổi đủ điều kiện trong dữ liệu hiện tại | BLOCKED BY DATA |

### 2.6. Thông báo và bài tập về nhà

| ID | Test case | Kỳ vọng | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| COACH-NOTIFICATION-READ-01 | Đọc thông báo đã gửi | HTTP 200 | HTTP 200 | PASS |
| COACH-NOTIFICATION-VALIDATE-01 | Gửi thông báo có tiêu đề rỗng | HTTP 400 | HTTP 400 | PASS |
| COACH-HOMEWORK-DUE-01 | Tạo bài tập có hạn nộp trong quá khứ | HTTP 400 | HTTP 400 | PASS |
| COACH-BROADCAST-SCOPE-01 | Gửi broadcast tới lớp không phụ trách | HTTP 403 | HTTP 403 | PASS |
| COACH-NOTIFICATION-WRITE-01 | Gửi thông báo/bài tập hợp lệ | Lưu và gửi đúng người nhận | Không thực hiện để tránh gửi dữ liệu thật vào môi trường dùng chung | NOT RUN |

### 2.7. AI gợi ý bài tập

| ID | Test case | Kỳ vọng | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| COACH-AI-LIVE-01 | Sinh gợi ý cho học viên BMI 11.8 có gù lưng/cổ tay yếu | HTTP 200, có cảnh báo và bài an toàn | HTTP 200; 5 bài tập, 1 xung đột được nhận diện | PASS |
| COACH-AI-SAFETY-01 | AI sinh bài không đạt safety validator | Fail closed, không trả bài nguy hiểm | HTTP 422 `AI_SAFETY_CHECK_FAILED`, đúng về an toàn | PASS SAFETY / FAIL AVAILABILITY |
| COACH-AI-CONTRACT-01 | Frontend gửi `subjectiveTags` đã chuẩn hóa | Trường này được giữ trong payload | Trường bị loại trong service hiện tại | FAIL |
| COACH-AI-TESTS-01 | Chạy bộ test AI frontend | Tất cả test PASS | 25/26 PASS; 1 test contract `subjectiveTags` FAIL | FAIL |

## 3. Nhật ký lỗi và chức năng thiếu

### COACH-F01 — Dashboard báo lưu tiến độ thành công nhưng không lưu backend

- Mức độ: **HIGH**
- Khu vực: `Frontend/src/features/coach/CoachDashboard.jsx`
- Bằng chứng: `handleSaveProgress` chỉ kiểm tra dữ liệu rồi gọi `setProgressSaved(true)`; không gọi `coachApi.recordWorkoutProgress`.
- Ảnh hưởng: Coach có thể tin rằng kết quả và nhận xét đã được lưu, nhưng dữ liệu mất khi tải lại trang.
- Phạm vi: form nhanh trên Dashboard. Trang `WorkoutProgress.jsx` vẫn dùng API thật.
- Đề xuất: thay trạng thái giả bằng request API, chỉ hiển thị thành công sau HTTP 2xx; hiển thị lỗi backend khi request thất bại.

### COACH-F02 — Dashboard báo điểm danh thành công nhưng không lưu backend

- Mức độ: **HIGH**
- Khu vực: `Frontend/src/features/coach/CoachDashboard.jsx`
- Bằng chứng: nút “Confirm & Save” chỉ chạy `setTimeout` và hiển thị thông báo; không gọi `coachApi.takeAttendance`.
- Ảnh hưởng: điểm danh có thể bị mất trong khi giao diện báo đã hoàn tất.
- Phạm vi: thao tác nhanh trên Dashboard. Trang `Attendance.jsx` vẫn gọi API thật và các test biên thời gian đang PASS.
- Đề xuất: dùng cùng service/API với trang Attendance và vô hiệu hóa nút khi buổi tập không đủ điều kiện điểm danh.

### COACH-F03 — Frontend làm rơi `subjectiveTags` khi gọi AI

- Mức độ: **HIGH**
- Khu vực: `Frontend/src/services/api.js`
- Bằng chứng: component AI truyền `subjectiveTags: selectedTagIds`, nhưng service không đưa trường này vào payload cuối. Test `AI recommendation sends normalized subjective tag identifiers to the backend` thất bại.
- Ảnh hưởng: thông tin Coach chọn về thể trạng, chấn thương hoặc định hướng không đến backend; phác đồ có thể thiếu ngữ cảnh hoặc không áp dụng đúng luật xung đột dữ liệu.
- Đề xuất: khôi phục trường `subjectiveTags` trong payload và giữ test contract này làm regression test bắt buộc.

### COACH-F04 — Lịch trên Dashboard ánh xạ sai DTO và dùng dữ liệu giả khi API rỗng

- Mức độ: **MEDIUM**
- Khu vực: `Frontend/src/features/coach/CoachDashboard.jsx`
- Bằng chứng:
  - Backend trả `sessionId`, `className`, `sessionStatus`.
  - Dashboard đọc `s.id`, `s.name`, `s.status`.
  - Nếu backend không có lịch, Dashboard thay bằng `defaultSessions` và số lượng điểm danh cố định.
- Ảnh hưởng: tên lớp/trạng thái/ID có thể rỗng hoặc sai; Coach có thể nhìn thấy lịch và số liệu không tồn tại trong hệ thống.
- Đề xuất: chuẩn hóa DTO tại service hoặc map đúng tên trường; khi dữ liệu rỗng cần hiển thị empty state, không hiển thị dữ liệu mẫu trong runtime.

### COACH-F05 — AI không retry khi kết quả đầu tiên bị safety validator từ chối

- Mức độ: **MEDIUM**
- Khu vực: `Backend/Backend/SportsCenterManagement.API/Controllers/AiController.cs`
- Bằng chứng: controller gọi AI một lần rồi xử lý safety một lần. Ảnh người dùng cung cấp ghi nhận HTTP 422 do thiếu bài ổn định cơ lõi; một lần chạy lại với hồ sơ tương tự lại trả HTTP 200.
- Ảnh hưởng: chức năng AI có tính ngẫu nhiên; một phác đồ đầu tiên không đạt chuẩn khiến Coach không nhận được gợi ý dù hệ thống có thể tự sinh lại bản an toàn.
- Đề xuất: retry có giới hạn 1–2 lần, đưa danh sách vi phạm vào prompt sửa; nếu vẫn lỗi thì trả fallback an toàn có kiểm soát. Không được bỏ qua safety validator.

### COACH-F06 — Bộ `AiSafetyAudit` không bám đúng processor của runtime

- Mức độ: **MEDIUM — test infrastructure**
- Khu vực: `Backend/Backend/verification/AiSafetyAudit/Program.cs`
- Bằng chứng: runtime `AiController` dùng `MedicalNlpRecommendationProcessor`, trong khi các case mới của audit gọi `AiWorkoutRecommendationProcessor` cũ.
- Kết quả: 14/18 PASS, 4 FAIL; bốn lỗi này không trực tiếp chứng minh endpoint production sai vì test đang đi qua pipeline khác.
- Đề xuất: chuyển audit sang đúng processor/runtime route hoặc tạo integration test trực tiếp cho endpoint AI.

## 4. Kết quả kiểm thử tự động và build

| Lệnh/nhóm kiểm thử | Kết quả |
|---|---|
| Live API suite với role Coach | 10/10 PASS, 13 request |
| Focused frontend tests: attendance, professional, AI, real-data | 25/26 PASS |
| Toàn bộ frontend tests | 96/97 PASS |
| Frontend production build | PASS |
| Backend Release build | PASS, 0 error, 3 warning |
| `AiSafetyAudit` | 14/18 PASS; 4 case lệch processor runtime |
| `LogicAudit` | Không chạy được: Windows Application Control chặn host; chạy DLL tiếp tục thất bại vì LocalDB hard-code không tồn tại trong môi trường |

Các warning backend đáng chú ý:

- `System.Security.Cryptography.Pkcs 10.0.0`: cảnh báo NU1902 và NU1903 về lỗ hổng đã biết.
- Cảnh báo nullable tại cấu hình SMTP host (`CS8604`).
- Frontend build cảnh báo circular chunks và vendor chunk lớn hơn 1000 kB.

## 5. Giới hạn kiểm thử

- Không tạo kế hoạch, tiến độ, thông báo hoặc bài tập hợp lệ mới để tránh làm bẩn/gửi dữ liệu trên CSDL dùng chung.
- Hai buổi hiện có đều đã qua; không có buổi trong ngày đủ điều kiện để thực hiện điểm danh thành công.
- Không đăng nhập được tài khoản Member mẫu hiện tại, nên case xác nhận role Member bị chặn khỏi endpoint Coach chưa có bằng chứng live; các endpoint liên quan vẫn có `[Authorize(Roles = "COACH")]` trong source.
- `LogicAudit` phụ thuộc LocalDB hard-code, không phù hợp với cấu hình SQL đang chạy của dự án.
- Kết quả AI phụ thuộc nhà cung cấp/model; test live thành công không loại trừ lỗi 422 ngẫu nhiên đã quan sát.

## 6. Ưu tiên xử lý đề xuất

1. Sửa hai thao tác “lưu thành công giả” trên Dashboard: tiến độ và điểm danh.
2. Khôi phục `subjectiveTags` trong payload AI và chạy lại toàn bộ frontend test.
3. Sửa ánh xạ DTO lịch dạy, loại bỏ dữ liệu mẫu khỏi runtime Dashboard.
4. Bổ sung retry/fallback an toàn cho AI khi validator trả lỗi.
5. Cập nhật `AiSafetyAudit` để kiểm đúng processor đang được endpoint production sử dụng.
6. Tạo test database cô lập/transaction rollback để chạy đầy đủ các case ghi thành công mà không ảnh hưởng dữ liệu dùng chung.

## 7. Ghi chú thay đổi workspace

- Đợt kiểm thử này không sửa production code và không sửa test code.
- Chỉ thêm báo cáo Markdown này.
- Các thay đổi có sẵn trước kiểm thử trong `Backend/Backend/verification/AiSafetyAudit/Program.cs` và `Frontend/src/services/api.js` được giữ nguyên.
