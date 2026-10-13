# TÀI LIỆU QUY CHUẨN KỸ THUẬT: UNHAPPY CASES & XỬ LÝ NGOẠI LỆ NGHIỆP VỤ (SCMS)
## Sports Center Management System — Core Error & Exception Handling Specification

---

> [!IMPORTANT]
> **Bản nháp đề xuất (Draft Proposal Notice):**
> Các cách xử lý dưới đây chưa phải quy định đã chốt của trung tâm. Những chính sách như **hạn hủy lớp**, **hoàn phí** và **cách tính ngày gia hạn** cần được xác nhận thêm từ Ban Quản Lý trung tâm.

---

## 1. TỔNG QUAN KIẾN TRÚC XỬ LÝ (ARCHITECTURE OVERVIEW)

Happy case và unhappy case được xử lý trong cùng service/màn hình của chức năng. Kiểm tra điều kiện, quyền và xung đột nằm ngay trước bước ghi dữ liệu của flow; không tách thành module, danh mục API hay sổ tay trên giao diện.

Các đường dẫn backend trong bảng tính từ `Backend/Backend/`; frontend tính từ `Frontend/src/`.

| Flow/chức năng | Backend hiện có | Frontend hiện có |
|---|---|---|
| Flow 1 — tài khoản, nhân sự, gói thành viên | `SportsCenterManagement.BLL/Services/AuthService.cs`, `MemberService.cs`, `StaffManagementService.cs`, `MembershipPackageService.cs`, `CoreFlowService.cs` | `features/auth/`, `features/manager/StaffManagement.jsx`, `MemberManagement.jsx`, `PackageManagement.jsx`, `features/member/MemberPackages.jsx`, `features/receptionist/CounterMembership.jsx` |
| Flow 2 — lớp, lịch, phân công, đặt/hủy lớp | `SportsCenterManagement.BLL/Services/ClassManagementService.cs`, `ClassScheduleQueryService.cs`, `SessionBookingService.cs` | `features/manager/ClassesAndRooms.jsx`, `CoachAssignment.jsx`, `features/member/ClassScheduleView.jsx`, `MyBookings.jsx`, `features/receptionist/CounterBooking.jsx` |
| Flow 3 — thanh toán, hóa đơn, báo cáo | `SportsCenterManagement.BLL/Services/PaymentService.cs`, `ReportService.cs` | `features/member/PaymentResult.jsx`, `features/receptionist/CounterInvoices.jsx`, `features/manager/ReportsAnalytics.jsx` |
| Điểm danh tại trung tâm | `SportsCenterManagement.BLL/Services/CheckinService.cs` | `features/receptionist/MemberCheckIn.jsx` |
| Giáo án, tiến độ, thông báo và AI | `SportsCenterManagement.BLL/Services/TrainingService.cs`, `GeminiService.cs`; các controller tương ứng | `features/coach/`, `features/member/MyProgress.jsx`, `MemberNotifications.jsx`, `MemberAIAssistant.jsx` |
| Lỗi dùng chung | Handler trong từng controller và middleware hiện có | `services/http.js`; trạng thái đang xử lý và thông báo lỗi tại từng form |

Mỗi service cung cấp thông báo, HTTP status và metadata ngay tại nhánh lỗi bằng `InvalidOperationException.Data`. Controller của chức năng ánh xạ các lỗi nghiệp vụ đã gắn status sang phản hồi HTTP; lỗi không dự kiến và hủy yêu cầu vẫn đi qua cơ chế xử lý hiện có. Danh sách dưới đây là yêu cầu/đề xuất nghiệp vụ, không phải bằng chứng toàn bộ trường hợp đã được kiểm thử hoặc triển khai đầy đủ.

---

## 2. BẢNG TRA CỨU CHI TIẾT UNHAPPY CASES THEO VAI TRÒ

### 2.1. Center Manager — Quản lý Trung tâm (CM-01 -> CM-08)

| Mã | Chức năng | Unhappy case dễ gặp | Xử lý đề xuất | Trạng thái chính sách | Mã lỗi / Vị trí code |
|:---|:---|:---|:---|:---|:---|
| **CM-01** | Quản lý thành viên, HLV, nhân viên | Tạo hồ sơ trùng email hoặc số điện thoại đang được dùng làm định danh. | Kiểm tra trùng trước khi lưu; thông báo rõ trường bị trùng và cho người có quyền mở hồ sơ hiện có. | Đã áp dụng | `InvalidOperationException (HTTP 409, CM-01)` trong `StaffManagementService.cs`; kiểm tra định danh trong `MemberService.cs` |
| **CM-02** | Xóa/ngừng hoạt động tài khoản | Ngừng hoạt động HLV đang phụ trách các buổi học sắp tới. | Hiển thị các buổi bị ảnh hưởng; yêu cầu phân công người thay hoặc xử lý lịch trước khi hoàn tất. Giữ lịch sử giảng dạy. | Đã áp dụng | `InvalidOperationException (HTTP 409, CM-02)` trong `StaffManagementService.cs` |
| **CM-03** | Quản lý lớp, phòng và lịch | Hai lớp dùng cùng phòng trong khoảng thời gian giao nhau; phòng đang bảo trì. | Chặn lưu lịch bị xung đột; chỉ rõ lớp/phòng/thời gian liên quan để đổi lịch hoặc phòng. | Đã áp dụng | `InvalidOperationException (HTTP 409, CM-03)` trong `ClassManagementService.cs` |
| **CM-04** | Phân công HLV | HLV đã có lịch dạy trùng giờ hoặc đã ngừng hoạt động. | Kiểm tra lại khi lưu; từ chối phân công và hiển thị nguyên nhân. | Đã áp dụng | `InvalidOperationException (HTTP 409, CM-04)` trong `ClassManagementService.cs` |
| **CM-05** | Xem báo cáo | Khoảng ngày không hợp lệ, không có dữ liệu hoặc tải báo cáo thất bại. | Kiểm tra khoảng ngày; phân biệt rõ “không có dữ liệu” với “không tải được dữ liệu”. Không hiển thị doanh thu bằng 0 khi truy vấn bị lỗi. | Đã áp dụng | `ReportService.cs`, `ReportsAnalytics.jsx` |
| **CM-06** | Quản lý gói, học phí, thời hạn | Sửa giá hoặc thời hạn gói làm thay đổi quyền lợi của thành viên đã mua. | Giữ điều kiện của giao dịch đã xác nhận; thay đổi áp dụng cho lần mua/gia hạn sau theo ngày hiệu lực. | ⚠️ **Dự thảo** (Cần phê duyệt ngày hiệu lực) | `MembershipPackageService.cs`, `PackageManagement.jsx` |
| **CM-07** | Phân quyền | Thu hồi quyền khiến hệ thống không còn quản lý nào có quyền quản trị. | Chặn thao tác; yêu cầu có một tài khoản quản trị thay thế còn hoạt động. | Đã áp dụng | `InvalidOperationException (HTTP 409, CM-07)` trong `StaffManagementService.cs` |
| **CM-08** | Xem lịch sử thao tác | Không tải được nhật ký hoặc bộ lọc không trả về kết quả. | Hiển thị đúng trạng thái lỗi/rỗng; giữ bộ lọc để thử lại. Không kết luận “không có thao tác” khi hệ thống chưa tải được nhật ký. | Đã áp dụng | `AuditLogs.jsx` |

---

### 2.2. Coach — Huấn luyện viên (CO-01 -> CO-08)

| Mã | Chức năng | Unhappy case dễ gặp | Xử lý đề xuất | Trạng thái chính sách | Mã lỗi / Vị trí code |
|:---|:---|:---|:---|:---|:---|
| **CO-01** | Xem lịch dạy, danh sách lớp | Lớp bị hủy hoặc đổi lịch nhưng HLV đang xem thông tin cũ. | Hiển thị trạng thái mới nhất; cảnh báo thay đổi và chặn điểm danh trên buổi đã hủy. | Đã áp dụng | `TeachingSchedule.jsx`, `Attendance.jsx` |
| **CO-02** | Xem thông tin học viên | HLV truy cập học viên không thuộc phạm vi được phân công, kể cả bằng đường dẫn trực tiếp. | Kiểm tra quyền ở mỗi yêu cầu; từ chối truy cập và không trả về dữ liệu học viên. | Đã áp dụng | `InvalidOperationException (HTTP 403, CO-02)` trong `TrainingService.cs` |
| **CO-03** | Tạo kế hoạch tập luyện | Thiếu mục tiêu/trình độ hoặc chọn nhầm cá nhân, nhầm lớp. | Yêu cầu bổ sung thông tin cần thiết; hiển thị rõ đối tượng nhận trước khi giao kế hoạch. Cho lưu nháp khi chưa đủ thông tin. | Đã áp dụng | `InvalidOperationException (HTTP 400, CO-03)` trong `TrainingService.cs`, `TrainingPlan.jsx` |
| **CO-04** | Ghi kết quả tập luyện | Nhập số lần, thời lượng hoặc mức tạ không hợp lệ; lưu nhầm học viên/buổi. | Kiểm tra dữ liệu và hiển thị học viên, buổi tập trước khi lưu. Khi sửa kết quả đã lưu, giữ lịch sử chỉnh sửa. | Đã áp dụng | `TrainingService.cs`, `WorkoutProgress.jsx` |
| **CO-05** | Đánh giá tiến độ | Chưa có đủ dữ liệu hoặc dữ liệu các buổi không thể so sánh. | Hiển thị “Chưa đủ dữ liệu đánh giá”; không tự kết luận học viên tiến bộ hoặc sa sút. | Đã áp dụng | `WorkoutProgress.jsx` (Hiển thị `Chưa đủ dữ liệu đánh giá`) |
| **CO-06** | Điểm danh | Điểm danh hai lần hoặc chọn học viên không có trong danh sách buổi học. | Mỗi học viên chỉ có một trạng thái điểm danh cho một buổi; từ chối người không thuộc danh sách. Sửa điểm danh phải có quyền và lý do. | Đã áp dụng | `Attendance.jsx`, `CheckinService.cs` |
| **CO-07** | Gửi thông báo/bài tập | Gửi thất bại cho một phần học viên; bấm gửi lại làm người khác nhận trùng. | Theo dõi kết quả theo người nhận; chỉ gửi lại cho các trường hợp thất bại và hiển thị số người chưa nhận được. | Đã áp dụng | `CoachNotifications.jsx` |
| **CO-08** | AI gợi ý bài tập | Thiếu dữ liệu, AI không phản hồi hoặc đề xuất không phù hợp với giới hạn tập luyện đã khai báo. | Nêu rõ dữ liệu còn thiếu/lỗi dịch vụ; không tự giao bài tập. HLV phải xem và xác nhận trước khi áp dụng gợi ý AI. | Đã áp dụng | `AIRecommendation.jsx`, `AiController.cs` |

---

### 2.3. Member — Học viên / Thành viên (ME-01 -> ME-10)

| Mã | Chức năng | Unhappy case dễ gặp | Xử lý đề xuất | Trạng thái chính sách | Mã lỗi / Vị trí code |
|:---|:---|:---|:---|:---|:---|
| **ME-01** | Đăng ký, cập nhật tài khoản | Email/số điện thoại bị trùng hoặc nhập thiếu thông tin bắt buộc. | Báo lỗi tại trường tương ứng, giữ dữ liệu đã nhập hợp lệ; hướng dẫn đăng nhập/khôi phục tài khoản khi phù hợp. | Đã áp dụng | `AuthService.cs`, `MemberDashboard.jsx` |
| **ME-02** | Mua/gia hạn gói | Đã thanh toán nhưng gói chưa được kích hoạt, hoặc chưa xác định được kết quả thanh toán. | Hiển thị trạng thái “Chờ xác nhận”; cho tra cứu bằng mã giao dịch và chuyển xử lý đối soát. Không yêu cầu thanh toán lại khi kết quả chưa rõ. | ⚠️ **Dự thảo** (Cần phê duyệt quy trình đối soát/hoàn phí) | `PaymentResult.jsx`, `MemberPackages.jsx`, `PaymentService.cs` |
| **ME-03** | Xem lớp và lịch học | Lớp vừa đổi giờ, đổi phòng hoặc bị hủy sau khi thành viên mở danh sách. | Cập nhật trạng thái và kiểm tra lại khi đăng ký; nếu thông tin thay đổi, hiển thị lịch mới để thành viên xác nhận. | Đã áp dụng | `ClassScheduleView.jsx` |
| **ME-04** | Đăng ký lớp | Lớp đã đầy, đăng ký trùng hoặc trùng giờ với lớp đã đăng ký. | Kiểm tra tại thời điểm xác nhận; từ chối với lý do cụ thể. Hai người tranh suất cuối chỉ một người được xác nhận. | Đã áp dụng | `InvalidOperationException (HTTP 409, ME-04)` trong `SessionBookingService.cs` |
| **ME-05** | Đăng ký lớp theo gói | Gói hết hạn trước ngày diễn ra buổi học hoặc không bao gồm bộ môn đó. | Kiểm tra quyền sử dụng tại thời điểm buổi học; thông báo điều kiện chưa đáp ứng và hướng dẫn chọn gói/lớp phù hợp. | Đã áp dụng | `InvalidOperationException (HTTP 403, ME-05)` trong `SessionBookingService.cs` |
| **ME-06** | Hủy đăng ký lớp | Hủy sau thời hạn cho phép hoặc buổi học đã bắt đầu. | Áp dụng chính sách hủy đã công bố; hiển thị rõ ảnh hưởng đến lượt tập/phí trước khi xác nhận. Nếu không được hủy, hướng dẫn liên hệ hỗ trợ. | ⚠️ **Dự thảo** (Cần chốt hạn hủy tối thiểu 2h hay 24h) | `SessionBookingService.cs`, `MyBookings.jsx` |
| **ME-07** | Xem lịch cá nhân, thông tin HLV | HLV được thay thế hoặc lịch cá nhân chưa cập nhật theo lịch lớp. | Đồng bộ lịch cá nhân với lịch chính thức; đánh dấu buổi có thay đổi và hiển thị HLV hiện tại. | Đã áp dụng | `MyBookings.jsx` |
| **ME-08** | Xem điểm danh, kết quả, kế hoạch và nhận xét | Thiếu kết quả, sai điểm danh hoặc chưa có kế hoạch được giao. | Phân biệt “chưa được cập nhật” với lỗi tải dữ liệu; cho gửi yêu cầu kiểm tra tới HLV/lễ tân. Thành viên không tự sửa kết quả chính thức. | Đã áp dụng | `MyAttendance.jsx`, `MyProgress.jsx` |
| **ME-09** | Hỏi AI | AI không có thông tin mới nhất về lịch, học phí hoặc gói thành viên. | Chỉ trả lời thông tin trung tâm từ nguồn được xác nhận; nếu không kiểm chứng được thì nói rõ và dẫn tới màn hình chính thức hoặc lễ tân. | Đã áp dụng | `MemberAIAssistant.jsx` |
| **ME-10** | Nhận thông báo | Email/thông báo đẩy thất bại khiến thành viên bỏ lỡ đổi lịch hoặc hạn gói. | Lưu thông báo trong hệ thống để xem lại; hiển thị trạng thái gửi phù hợp và hỗ trợ gửi lại. Không coi gửi yêu cầu thành công là người dùng đã đọc. | Đã áp dụng | `MemberNotifications.jsx` |

---

### 2.4. Receptionist — Nhân viên Lễ tân (RE-01 -> RE-08)

| Mã | Chức năng | Unhappy case dễ gặp | Xử lý đề xuất | Trạng thái chính sách | Mã lỗi / Vị trí code |
|:---|:---|:---|:---|:---|:---|
| **RE-01** | Tìm kiếm thành viên | Nhiều người trùng tên dẫn đến chọn nhầm hồ sơ. | Hiển thị thêm mã thành viên và thông tin đối chiếu được phép xem; xác nhận đúng người trước khi gia hạn, thu tiền hoặc đăng ký lớp. | Đã áp dụng | `MemberLookup.jsx` |
| **RE-02** | Đăng ký thành viên tại quầy | Người đã có tài khoản trực tuyến được tạo thêm hồ sơ mới. | Kiểm tra định danh trước khi tạo; xác minh rồi sử dụng hồ sơ hiện có. Không tự gộp hai hồ sơ chỉ vì trùng tên. | Đã áp dụng | `MemberService.cs`, `CounterMembership.jsx` |
| **RE-03** | Đăng ký/gia hạn gói | Gói cũ còn hạn nhưng gia hạn làm mất số ngày còn lại hoặc chồng thời gian ngoài ý muốn. | Tính và hiển thị ngày bắt đầu/kết thúc dự kiến theo chính sách; yêu cầu xác nhận trước khi hoàn tất, giữ lịch sử gói cũ. | ⚠️ **Dự thảo** (Cần phê duyệt cách tính nối tiếp hay cộng dồn) | `CounterMembership.jsx` (Dự kiến gia hạn nối tiếp), `CoreFlowService.cs` |
| **RE-04** | Kiểm tra trạng thái gói | Màn hình hiển thị dữ liệu cũ sau khi thành viên vừa gia hạn hoặc bị khóa gói. | Lấy lại trạng thái hiện tại trước khi cho sử dụng dịch vụ; nếu không xác minh được, báo rõ để xử lý theo quy trình ngoại lệ đã chốt. | Đã áp dụng | `MemberCheckIn.jsx` |
| **RE-05** | Điểm danh tại trung tâm | Quét/check-in nhiều lần hoặc thành viên không đủ điều kiện vào tập. | Không tạo bản ghi trùng cho cùng lượt vào; hiển thị lý do không đủ điều kiện. Mọi ngoại lệ cần đúng quyền và có ghi nhận. | Đã áp dụng | `CheckinService.cs` (chặn trùng 15 phút & kiểm tra gói), `MemberCheckIn.jsx` |
| **RE-06** | Hỗ trợ đăng ký/hủy lớp | Lễ tân đăng ký vượt sức chứa hoặc bỏ qua điều kiện gói/hạn hủy. | Áp dụng cùng quy tắc như thành viên tự thao tác; ngoại lệ chỉ được thực hiện nếu có chính sách và quyền tương ứng. | Đã áp dụng | `CounterBooking.jsx` |
| **RE-07** | Thu tiền, xuất hóa đơn | Ghi nhận thanh toán hai lần, sai số tiền hoặc in hóa đơn thất bại. | Kiểm tra số tiền và giao dịch đã tồn tại trước khi ghi nhận. Lỗi in cho phép in lại cùng hóa đơn; không tạo khoản thu mới. Điều chỉnh khoản thu phải có lý do và lịch sử. | ⚠️ **Dự thảo** (Quy định hoàn phí/hủy hóa đơn cần kế toán duyệt) | `PaymentService.cs`, `CounterInvoices.jsx` |
| **RE-08** | Tiếp nhận hỗ trợ | Thiếu thông tin để xử lý hoặc nhiều nhân viên tạo yêu cầu trùng. | Yêu cầu nội dung và đối tượng liên quan tối thiểu; cảnh báo yêu cầu tương tự đang mở. Cấp mã yêu cầu để thành viên theo dõi. | Đã áp dụng | `SupportRequests.jsx` |

---

### 2.5. Các unhappy case dùng chung cần xử lý xuyên suốt (COMMON-01 -> COMMON-04)

| Mã | Tình huống | Xử lý đề xuất | Cơ chế kỹ thuật |
|:---|:---|:---|:---|
| **COMMON-01** | Mất mạng hoặc hết thời gian chờ sau khi bấm lưu | Thông báo “Chưa xác định kết quả”; kiểm tra trạng thái trước khi thử lại. Tránh tạo hai đăng ký hoặc hai khoản thu. | Interceptor `http.js` bắt network error / timeout; trả lỗi `COMMON-01`; `Idempotency-Key` bảo vệ giao dịch backend. |
| **COMMON-02** | Bấm nút nhiều lần | Khóa nút trong lúc xử lý; hệ thống vẫn phải bảo đảm cùng một yêu cầu chỉ tạo một kết quả nghiệp vụ. | Trạng thái đang xử lý và thuộc tính `disabled` trên từng form; transaction/idempotency tại backend theo flow. Không sử dụng helper từ danh mục lỗi riêng. |
| **COMMON-03** | Hai người cùng sửa một bản ghi | Phát hiện dữ liệu đã thay đổi; yêu cầu tải bản mới để đối chiếu, tránh âm thầm ghi đè. | Middleware ánh xạ lỗi unique constraint thành HTTP 409/`COMMON-03`. Cơ chế này không tự chứng minh đã phát hiện mọi trường hợp ghi đè khi hai người cùng sửa; cần kiểm chứng tại từng flow. |
| **COMMON-04** | Phiên đăng nhập hết hạn hoặc quyền vừa bị thu hồi | Kiểm tra lại quyền trước thao tác; yêu cầu đăng nhập lại khi cần và không tiếp tục lưu bằng quyền cũ. | Interceptor `http.js` bắt HTTP 401, dispatch sự kiện `scms:auth-expired`, thu hồi token trong memory và điều hướng đăng nhập. |

---

## 3. PHẢN HỒI LỖI TRONG API CỦA FLOW

Mỗi API nghiệp vụ xử lý unhappy case ngay trong flow đang thực hiện. Các nhánh dùng handler tại controller hoặc middleware hỗ trợ metadata có thể trả `code`, `message`/`detail`, `proposedHandling` và `isDraftPolicy` cùng HTTP status tương ứng. Frontend hiển thị lỗi tại màn hình đang thao tác.

Ma trận happy/unhappy case của ba flow chính nằm trong [core-flows.md](Backend/Backend/docs/requirements/core-flows.md). API giáo án, tiến độ, thông báo và AI được mô tả trong [api-jwt-integration.md](Backend/Backend/docs/requirements/api-jwt-integration.md).
