# Báo cáo sửa lỗi và kiểm thử lại Actor Coach

- Ngày: 2026-10-25
- Nhánh: `feature/rbac-admin-manager-integrated`
- Phạm vi: các lỗi COACH-F01 đến COACH-F06 trong báo cáo kiểm thử ban đầu
- Báo cáo gốc: `docs/COACH_ACTOR_TEST_LOG_2026-10-25.md`

## Kết luận

Các lỗi chức năng Coach đã được sửa ở production code. Frontend test, frontend build, backend build và live Coach API đều đạt. Live AI với hồ sơ BMI 11.8, gù lưng và cổ tay yếu trả phác đồ an toàn, không còn dừng ở lỗi safety đầu tiên.

| Finding | Trạng thái sau sửa | Bằng chứng |
|---|---|---|
| COACH-F01 — Dashboard báo lưu tiến độ giả | RESOLVED | Dashboard gọi `recordWorkoutProgress`; chỉ báo thành công sau khi API hoàn tất. |
| COACH-F02 — Dashboard báo điểm danh giả | RESOLVED | Dashboard tải roster thật theo session và gọi `takeAttendance` với status backend. |
| COACH-F03 — Mất `subjectiveTags` | RESOLVED | Service giữ mảng tag trong payload; regression test PASS. |
| COACH-F04 — Dữ liệu lịch/học viên mẫu | RESOLVED | Bỏ toàn bộ `defaultStudents`, `defaultSessions`, số điện thoại/số liệu mẫu; map session theo `classId` và lọc ngày/tuần/tháng. |
| COACH-F05 — AI chỉ thử một lần | RESOLVED | Tối đa 3 lượt sinh lại với feedback từ validator; nếu vẫn lỗi dùng deterministic safe fallback và kiểm tra lại safety. |
| COACH-F06 — Audit kiểm sai processor | RESOLVED | `AiSafetyAudit` tham chiếu API, gọi đúng processor runtime và đạt 19/19 checks sau khi hợp nhất nhánh. |

## Thay đổi nghiệp vụ chính

- Form tiến độ nhanh gửi đúng `classId`, `memberId`, cân nặng, kết quả, mức tạ và nhận xét xuống backend.
- Checkbox gửi báo cáo cho học viên nay truyền `notifyMember`; backend chỉ tạo notification khi Coach chọn gửi.
- Điểm danh nhanh tải đúng roster của buổi học, chuẩn hóa `PRESENT`, `ABSENT`, `LATE`, `EXCUSED` và khóa lưu ngoài thời gian hợp lệ.
- Dashboard không còn thay dữ liệu API rỗng bằng học viên/lịch/số liệu giả.
- AI giữ `subjectiveTags`, nhận diện chấn thương nặng, ghi đè mục tiêu sang phục hồi và cấm squat/lunge/deadlift/chạy/nhảy khi cần.
- Runtime processor áp dụng lại quy tắc BMI một cách xác định, không tin nutrition/heart-rate do provider trả nếu mâu thuẫn.
- Fallback cho lưng/chấn thương có Chest-Supported Row, Face Pull và Dead Bug; không dùng Goblet Squat cho hồ sơ lưng.

## Kết quả kiểm thử lại

| Kiểm thử | Kết quả |
|---|---|
| Toàn bộ frontend test | **102/102 PASS** |
| Frontend production build | **PASS** |
| Backend Release build | **PASS — 0 error** |
| `AiSafetyAudit` build | **PASS — 0 error** |
| `AiSafetyAudit` execution | **19/19 PASS** |
| Live Coach API suite | **10/10 PASS, 13 requests** |
| Contract `notifyMember=false` với ngày tương lai | **HTTP 400 đúng validation, không tạo dữ liệu** |
| Live AI hồ sơ BMI 11.8 + gù lưng + cổ tay yếu | **HTTP 200, PASS safety** |

Chi tiết live AI cuối:

- 5 bài tập.
- Có bài ổn định core.
- Có Face Pull.
- Không có Back Squat, Deadlift, Overhead Press hoặc Military Press.
- Vùng nhịp tim: Zone 1-2.
- Dinh dưỡng: thặng dư 300-500 kcal/ngày.
- `subjectiveTags` được gửi và xuất hiện trong ngữ cảnh kết quả.
- Một lượt trước đó đã kích hoạt `deterministic_safe_fallback` thành công thay vì trả 422.

## Giới hạn và cảnh báo còn lại

- Không thực hiện ghi tiến độ hoặc điểm danh hợp lệ mới trên CSDL dùng chung để tránh tạo dữ liệu nghiệp vụ giả; contract/wiring được xác nhận bằng regression tests và live read/validation API.
- Backend vẫn có NU1902/NU1903 cho `System.Security.Cryptography.Pkcs 10.0.0` và CS8604 tại SMTP host. Đây là cảnh báo phụ thuộc/cấu hình tồn tại ngoài phạm vi lỗi Coach.
- Frontend build vẫn cảnh báo circular chunk và vendor chunk lớn; build không thất bại.

## Dịch vụ sau kiểm thử

- Frontend: `http://127.0.0.1:3004/`
- Backend: `http://localhost:54162`
