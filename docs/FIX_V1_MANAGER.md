# FIX V1 MANAGER

## Mục 1 — Quản lý thành viên

Trạng thái: **Đã hoàn thành ngày 14/10/2026**.

### Nội dung đã sửa

- Manager chỉ xem email ở chế độ đọc; payload cập nhật không còn gửi email và API chặn overposting email bằng HTTP 400.
- Bảo vệ quyền thao tác theo Manager đang hoạt động và đúng trung tâm; hội viên không thể dùng endpoint quản lý trung tâm để sửa hồ sơ của mình.
- Thiết kế lại lịch sử gói tập theo thẻ responsive, có trạng thái tiếng Việt, số tiền, thời hạn, tải/rỗng/lỗi/thử lại và xử lý dữ liệu thiếu an toàn.
- Sắp xếp thành viên Active trước, sau đó theo tên và ID ổn định xuyên phân trang; trạng thái khóa/mở khóa có nhãn, màu và icon rõ ràng.

### Kiểm thử

- Happy/unhappy case gồm cập nhật không gửi email, cố chèn email, phân quyền sai, trạng thái lạ, lịch sử rỗng/lỗi và trùng tên đã được kiểm tra.
- Frontend test, production build, 3 test tích hợp Member Management và toàn bộ backend suite tại thời điểm thực hiện đều đạt.

## Mục 2 — Gói tập hội viên

Trạng thái: **Đã hoàn thành ngày 14–15/10/2026**.

### Nội dung đã sửa

- Bỏ ràng buộc giá phải là bội số 50.000; form và backend chấp nhận giá hợp lệ theo `decimal(12,2)`.
- Bổ sung kiểm tra giá rỗng, không phải số, không dương, vượt giới hạn hoặc quá 2 chữ số thập phân ở FE và BE.
- Danh sách gói đưa gói Active lên trước, Inactive xuống cuối; thứ tự vẫn ổn định khi API trả dữ liệu chưa sắp xếp.

### Kiểm thử

- Happy/unhappy case tạo/sửa giá không phải bội số 50.000, giá âm/0/quá giới hạn/quá 2 chữ số thập phân và trạng thái inactive không phân biệt hoa thường đã được kiểm tra.
- Frontend test, production build, test tích hợp Membership Package và backend suite tại thời điểm thực hiện đều đạt.

## Mục 3 — Lớp, Bộ môn & Phòng

Trạng thái: **Đã hoàn thành ngày 15/10/2026**.

### Bổ sung quản lý chuyên môn Coach

- Dùng danh sách **Bộ môn** do Manager quản lý làm catalog chuyên môn cố định; Manager có thể thêm nhanh chuyên môn ngay trong form bổ nhiệm HLV.
- Thay ô nhập chuyên môn tự do bằng lựa chọn nhiều bộ môn và bắt buộc Coach có ít nhất một chuyên môn.
- Thêm quan hệ dữ liệu `CoachSport` để kiểm tra phân công theo ID bộ môn, không còn phụ thuộc `Contains` trên tên nhập tay.
- Backend từ chối chuyên môn không tồn tại, ngừng hoạt động hoặc không thuộc trung tâm; dữ liệu chuyên môn cũ được backfill trong migration.
- Khi phân công HLV hoặc đổi bộ môn lớp, backend xác minh trực tiếp quan hệ Coach–Bộ môn; frontend hiển thị tương thích theo cùng quy tắc.

### Nội dung đã sửa

- Thiết kế lại màn hình quản lý thành 4 tab rõ ràng: **Lớp đang quản lý**, **Lớp đã hủy**, **Phòng tập**, **Bộ môn**; có số lượng từng nhóm và ô tìm kiếm lớp theo tên, bộ môn, HLV, phòng, cấp độ.
- Thiết kế lại thẻ lớp để hiển thị trực quan trạng thái, bộ môn, HLV, phòng, số học viên/sức chứa, thời lượng và cấp độ.
- Thiết kế lại form tạo/sửa lớp: phân nhóm trường, nhãn rõ ràng, nút tạo lớp nổi bật có icon `+`, hỗ trợ desktop/mobile và thông báo lỗi ngay trong form.
- Chuyển phần lịch học sang bố cục calendar tuần 7 ngày. Mỗi ca hiển thị giờ bắt đầu–kết thúc, phòng thực tế (hoặc phòng mặc định), khoảng ngày hiệu lực và trạng thái.
- Thêm validate phía FE cho các unhappy case: thiếu tên/bộ môn, sức chứa hoặc thời lượng không hợp lệ, thiếu ngày, ngày kết thúc trước ngày bắt đầu, giờ kết thúc không sau giờ bắt đầu. Các kiểm tra nghiệp vụ trùng phòng/lịch HLV và dữ liệu đã có người đặt vẫn do BE bảo vệ.
- Khi hủy lớp, lớp không còn nằm trong danh sách đang quản lý mà chuyển sang tab **Lớp đã hủy**. Modal xác nhận giải thích rõ ảnh hưởng tới lịch, buổi học, đăng ký, booking và waitlist.
- Thêm API `POST /api/classes/{classId}/restore` và nút **Mở lại lớp**. Lớp được mở lại dưới trạng thái `Draft`, không tự động công bố.
- Lịch, buổi học, đăng ký và booking đã hủy **không được khôi phục tự động** khi mở lại lớp nhằm bảo toàn lịch sử và tránh tự tạo lại cam kết với học viên. Manager cần tạo lịch mới, kiểm tra HLV rồi công bố lại.
- Chặn unhappy case mở lại một lớp chưa ở trạng thái `Cancelled` bằng HTTP `409 Conflict`; lớp không tồn tại vẫn trả `404` theo cơ chế hiện có.
- Bổ sung audit log `class.restored` khi mở lại lớp.

### Trả lời quyết định nghiệp vụ về lớp đã hủy

Không nên bắt lớp bị hủy phải đóng vĩnh viễn, vì manager có thể cần tái sử dụng cấu hình lớp. Tuy nhiên cũng không nên khôi phục nguyên trạng lịch/đăng ký/booking cũ vì học viên đã nhận trạng thái hủy và lịch cũ có thể đã xung đột. Giải pháp đã áp dụng là: **cho phép mở lại thành bản nháp, giữ nguyên toàn bộ lịch sử đã hủy, rồi cấu hình lịch mới và công bố lại**.

### Happy case đã kiểm tra

- Danh sách lớp đang quản lý và lớp đã hủy được tách, sắp xếp theo tên và không làm thay đổi dữ liệu gốc.
- Tìm kiếm lớp hoạt động theo các trường vận hành.
- Lịch được nhóm đúng thứ trong tuần và sắp xếp theo giờ bắt đầu.
- Manager hủy lớp rồi mở lại thành `Draft` thành công.
- Lịch và buổi học cũ vẫn là `Cancelled` sau khi mở lại.
- Form lớp và lịch hợp lệ vượt qua validate phía FE.

### Unhappy case đã kiểm tra

- Form lớp thiếu dữ liệu hoặc có sức chứa/thời lượng không hợp lệ bị chặn trước khi gọi API.
- Khoảng ngày ngược hoặc giờ kết thúc không sau giờ bắt đầu bị chặn.
- API từ chối mở lại lớp đang ở trạng thái khác `Cancelled` với HTTP 409.
- Lớp đã hủy chỉ cho xem lịch sử lịch; không cho sửa hoặc tạo lịch trực tiếp cho đến khi được mở lại.

### Kiểm thử

- `npm.cmd test`: **16/16 test pass** (gồm 4 test mới cho mục 3).
- `npm.cmd run build`: **pass**, Vite build thành công 111 modules.
- `dotnet test ... -c Release --filter FullyQualifiedName~ClassManagementRestoreIntegrationTests`: **2/2 test pass**.
- `git diff --check`: **pass**; chỉ có cảnh báo line ending LF/CRLF theo cấu hình Windows.

### Ghi chú môi trường

- Lần chạy Debug đầu tiên không thực thi được vì tiến trình API hiện có đang khóa DLL; kiểm tra được chuyển sang cấu hình Release và đã build/test thành công.
- Bộ test phát hiện cảnh báo dependency có sẵn cho `System.Security.Cryptography.Pkcs 9.0.11` (NU1902/NU1903). Đây không phải thay đổi của mục 3 và chưa được sửa ngoài phạm vi yêu cầu.

---

## Mục 4 — Phân công HLV

Trạng thái: **Đã hoàn thành ngày 15/10/2026**.

### Nguyên nhân

API phân công HLV bắt buộc lớp phải có ít nhất một lịch đang hoạt động. Trong khi đó lớp mới luôn được tạo ở trạng thái `Draft` và thường chưa có lịch, nên thao tác phân công HLV cho lớp mới luôn bị từ chối dù dữ liệu lớp và HLV đều hợp lệ.

### Nội dung đã sửa

- Cho phép manager phân công HLV chính cho lớp mới ở trạng thái `Draft` trước khi tạo lịch.
- Không bỏ các bảo vệ nghiệp vụ: lớp `Cancelled`/`Completed`, HLV bị khóa hoặc ngừng hoạt động, HLV khác cơ sở và HLV sai chuyên môn vẫn bị từ chối.
- Khi lớp đã có lịch, quy trình phân công vẫn kiểm tra trùng lịch, giới hạn giờ dạy và ngày nghỉ đã duyệt như trước.
- Khi HLV được phân công trước rồi manager tạo/sửa lịch sau, `ClassManagementService` vẫn kiểm tra lịch của HLV; lịch trùng bị từ chối với HTTP 409 và mã `CM-04`.
- Giao diện hiển thị đúng ngữ cảnh: lớp chưa có HLV dùng nút **Phân công HLV** với icon thêm người; lớp đã có HLV dùng nút **Đổi HLV**.
- Modal dùng nhãn “HLV phụ trách” cho lớp mới và giải thích rằng có thể phân công trước khi tạo lịch nhưng hệ thống vẫn kiểm tra xung đột khi lịch được thêm/sửa.
- Sau khi phân công thành công, danh sách lớp được tải lại hoàn tất trước khi kết thúc trạng thái xử lý.

### Happy case đã kiểm tra

- Manager phân công HLV cho lớp mới `Draft` chưa có lịch thành công.
- Assignment được lưu với đúng `ClassId`, `CoachId` và `IsPrimary = true`.
- Luồng đổi HLV cho lớp đã có lịch tiếp tục sử dụng toàn bộ kiểm tra nghiệp vụ hiện có.

### Unhappy case đã kiểm tra

- Không thể phân công HLV cho lớp đã hủy.
- Sau khi phân công sớm, nếu tạo lịch trùng với lịch lớp khác của HLV thì API trả HTTP 409, mã `CM-04` và không lưu lịch xung đột.
- Các kiểm tra HLV không hoạt động/bị khóa, khác cơ sở, sai chuyên môn, vượt giới hạn giờ dạy hoặc trùng ngày nghỉ vẫn được giữ nguyên.

### Kiểm thử

- `dotnet test ... -c Release --filter FullyQualifiedName~CoachAssignmentIntegrationTests`: **3/3 test pass**.
- `npm.cmd test`: **16/16 test pass**.
- `npm.cmd run build`: **pass**, Vite build thành công 111 modules.
- `git diff --check`: **pass**; chỉ có cảnh báo line ending LF/CRLF của file mục 3 theo cấu hình Windows.

### File chính đã thay đổi

- `Backend/Backend/SportsCenterManagement.BLL/Services/ClassService.cs`
- `Backend/Backend/SportsCenterManagement.Tests/CoachAssignmentIntegrationTests.cs`
- `Frontend/src/features/manager/CoachAssignment.jsx`

### Rà soát bổ sung — giao diện và logic phân công HLV

Theo phản hồi giao diện chưa trực quan, màn hình mục 4 đã được thiết kế lại và BE được audit thêm.

#### Cải thiện giao diện

- Thêm 4 thẻ tổng quan: tổng lớp cần quản lý, lớp đã có HLV, lớp chưa có HLV và lớp bản nháp.
- Lớp chưa có HLV được đánh dấu đỏ và tự động đưa lên đầu danh sách.
- Thêm tìm kiếm theo tên lớp/bộ môn/phòng/HLV và bộ lọc **Tất cả – Chưa có HLV – Đã phân công**.
- Mỗi thẻ lớp hiển thị ngay số lịch tuần, phòng, số học viên/sức chứa, thời lượng, cấp độ, trạng thái và HLV chính.
- Thêm bảng tải lớp theo từng HLV để manager cân bằng phân công.
- Thay dropdown HLV bằng danh sách thẻ chọn trực quan: tên, chuyên môn, số lớp đang phụ trách, HLV hiện tại và trạng thái sai chuyên môn.
- HLV sai chuyên môn bị vô hiệu hóa ngay trên FE; quy tắc so khớp được đồng bộ với BE.
- Modal hiển thị 3 chính sách kiểm tra trước khi lưu: chuyên môn, xung đột/ngày nghỉ và giới hạn 8 giờ/ngày.
- API danh sách lớp bổ sung `ActiveScheduleCount` để giao diện thể hiện mức độ hoàn thiện lịch.

#### Lỗi logic BE đã sửa

- Khi chọn **Đổi HLV**, coach chính cũ trước đây chỉ bị hạ thành coach phụ nên vẫn giữ quyền thấy lớp và tiếp tục bị tính xung đột. FE nay gửi `ReplacePrimary = true`; BE gỡ assignment chính cũ sau khi coach mới vượt qua toàn bộ kiểm tra.
- Giữ tương thích cho client cũ: `ReplacePrimary` mặc định `false`, nên API vẫn hỗ trợ mô hình nhiều coach/coach phụ nếu consumer khác cần.
- Khi HLV được phân công trước rồi mới tạo lịch, BE nay kiểm tra đủ:
  - Trùng lịch ở lớp khác.
  - Trùng hai lịch trong chính cùng một lớp dù sử dụng phòng khác.
  - Ngày nghỉ đã được duyệt (`CM-05`).
  - Tổng thời lượng vượt 8 giờ/ngày (`CM-06`).
- Khi thay HLV chính, các `ClassSession` tương lai tiếp tục được cập nhật sang coach mới trong cùng transaction.

#### Kiểm thử bổ sung

- Backend `CoachAssignmentIntegrationTests`: **7/7 pass**, bao phủ lớp mới chưa có lịch, lớp đã hủy, trùng lớp khác, thay coach chính, trùng trong cùng lớp, ngày nghỉ và giới hạn giờ/ngày.
- Backend kiểm tra tích hợp mục 3–4: **8/8 pass** trước khi thêm case giới hạn giờ; sau đó suite mục 4 **7/7 pass**.
- Frontend: **20/20 test pass**, gồm 4 test mới cho tổng quan, lọc/sắp xếp, khớp chuyên môn và tải lớp HLV.
- Vite production build: **pass**, 112 modules.

## Mục 5 — Báo cáo thống kê

Trạng thái: **Đã hoàn thành ngày 15/10/2026**.

### Nội dung đã sửa

- “Doanh thu thuần” lấy trực tiếp từ giao dịch thành công trừ hoàn tiền thành công; hiển thị cả doanh thu gộp và hoàn tiền để đối soát.
- “Thành viên mới” đếm từ hồ sơ hội viên tạo trong đúng khoảng thời gian và múi giờ báo cáo, không dùng số giả lập.
- Bổ sung lựa chọn nhanh **Hôm nay / Tuần này / Tháng này / Quý này / Năm nay** và khoảng ngày tùy chỉnh.
- Thêm API và biểu đồ doanh thu theo bộ môn. Doanh thu gói được phân bổ đều cho các bộ môn mà subscription thực tế đã sử dụng; phần chưa có dữ liệu sử dụng được ghi rõ là **Chưa phân bổ**.
- “Bộ môn doanh thu cao nhất” được tính từ doanh thu thuần trong kỳ, thay cho xếp hạng lượt đặt chỗ.
- Loại bỏ khuyến nghị gắn cứng tên môn/phòng; khuyến nghị hiện dùng dữ liệu thật hoặc thông báo chưa đủ dữ liệu.
- CSV được chia rõ tổng quan, đối soát theo kỳ, doanh thu theo bộ môn, lớp, phòng, thành viên và trạng thái đăng ký; có BOM UTF-8 và chống CSV formula injection.

### Happy case

- Đổi ngày, tuần, tháng, quý, năm hoặc khoảng tùy chỉnh tải lại toàn bộ chỉ số theo cùng phạm vi.
- Doanh thu gộp, hoàn tiền và thuần khớp công thức; biểu đồ theo môn có xếp hạng và tỷ trọng.
- CSV chứa đủ số liệu doanh thu và phân bổ theo môn, mở đúng tiếng Việt.

### Unhappy case

- Khoảng ngày đảo ngược, không hợp lệ, quá giới hạn hoặc `groupBy` sai bị từ chối ở FE và BE.
- Hóa đơn chưa có dữ liệu sử dụng môn được đưa vào “Chưa phân bổ”, tránh báo cáo sai.
- Kỳ không có giao dịch hoặc hội viên mới hiển thị trạng thái rỗng và số 0, không sinh số mẫu.
- Nội dung có ký tự công thức bảng tính trong CSV được vô hiệu hóa.
