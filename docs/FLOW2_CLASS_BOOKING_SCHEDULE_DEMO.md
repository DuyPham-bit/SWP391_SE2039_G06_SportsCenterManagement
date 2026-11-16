# Kịch bản demo Flow 2: Class Booking & Schedule Management

**Thời lượng đề xuất:** 18–22 phút
**Mục tiêu:** Demo đầy đủ luồng quản lý lịch lớp, đặt chỗ, danh sách chờ, hủy chỗ, điểm danh, báo cáo và Audit Log giữa Center Manager, Member, Receptionist và Coach.

## 1. Tổng quan luồng

```text
Manager tạo lớp → Xếp lịch → Phân công HLV → Công bố
       ↓
Member A tự đặt chỗ
       ↓
Receptionist đặt giúp Member B → Lớp đầy
       ↓
Member C vào danh sách chờ
       ↓
Member A hủy sớm → Member C được tự động đôn lên
       ↓
Coach xem lịch, roster và điểm danh
       ↓
Manager kiểm tra báo cáo và Audit Log
```

Flow này chứng minh các nghiệp vụ:

- Manager quản lý lớp, phòng, lịch và huấn luyện viên.
- Member xem lịch, đặt chỗ, vào danh sách chờ và hủy chỗ.
- Receptionist đặt hoặc hủy lớp thay cho hội viên.
- Coach chỉ xem và điểm danh các lớp được phân công.
- Hệ thống kiểm tra gói tập, thời gian đặt, sức chứa và lịch trùng.
- Các thao tác quan trọng được lưu vào Audit Log.
- Member và Coach nhận được thông báo liên quan.

## 2. Dữ liệu cần chuẩn bị trước demo

### 2.1. Tài khoản

| Username | Email đăng nhập | Vai trò | Trạng thái |
|---|---|---|---|
| `flow2.manager` | `flow2.manager@sportscenter.vn` | Center Manager | Active, thuộc trung tâm demo |
| `flow2.coach` | `flow2.coach@sportscenter.vn` | Coach | Active, có chuyên môn Yoga |
| `flow2.reception` | `flow2.reception@sportscenter.vn` | Receptionist | Active, cùng trung tâm |
| `flow2.member.a` | `flow2.member.a@sportscenter.vn` | Member A | Có gói tập Active |
| `flow2.member.b` | `flow2.member.b@sportscenter.vn` | Member B | Có gói tập Active |
| `flow2.member.c` | `flow2.member.c@sportscenter.vn` | Member C | Có gói tập Active |
| `flow2.member.expired` | `flow2.member.expired@sportscenter.vn` | Member D | Gói tập hết hạn |

Mật khẩu dùng chung cho dữ liệu demo local: `Member@123456`. Không sử dụng các tài khoản này trên môi trường production.

Khi đăng nhập trên giao diện, sử dụng email đầy đủ theo mẫu `flow2.manager@sportscenter.vn`, không sử dụng username.

Tất cả tài khoản trong luồng chính thuộc cùng một trung tâm. Tài khoản `flow2.member.expired` dùng để kiểm tra trường hợp gói tập hết hạn.

### 2.2. Lớp chính

| Thuộc tính | Dữ liệu đề xuất |
|---|---|
| Tên lớp | `FLOW2 - Yoga Foundation` |
| Bộ môn | Yoga & Pilates |
| Trình độ | Beginner |
| Phòng | `Studio Flow 2` |
| Sức chứa lớp | 2 |
| Sức chứa phòng | Ít nhất 2 |
| Thời lượng | 60 phút |
| Danh sách chờ | Bật |
| HLV chính | `flow2.coach` |

### 2.3. Hai buổi học cần có

#### Buổi đặt chỗ `BK-01`

- Ngày: D+1.
- Ví dụ nếu demo ngày 29/10/2026: sử dụng ngày 30/10/2026.
- Thời gian: 18:00–19:00.
- Trạng thái session: `Scheduled`.
- Phải còn cách thời điểm demo hơn 2 giờ và không quá 7 ngày.
- Dùng để demo đặt chỗ, danh sách chờ và hủy chỗ.

#### Buổi điểm danh `AT-01`

- Ngày: đúng ngày demo.
- Giờ bắt đầu: trước thời điểm demo khoảng 15 phút.
- Giờ kết thúc: sau thời điểm demo khoảng 45 phút.
- Có sẵn Member A và Member B trong roster.
- Trạng thái session: `Scheduled`.
- Dùng để Coach điểm danh mà không phải chờ đến giờ học.

> Nên mở mỗi vai trò bằng một browser profile hoặc cửa sổ ẩn danh riêng để không bị ghi đè phiên đăng nhập.

## 3. Kịch bản demo chi tiết

### Cảnh 1 — Manager tạo và công bố lớp

**Thời lượng:** 4–5 phút.

#### Bước 1.1: Tạo lớp học

Đăng nhập bằng `flow2.manager` và truy cập:

```text
Quản lý vận hành
→ Lớp, bộ môn & phòng
#/manager/classes-rooms
```

Chọn **Mở lớp đào tạo mới** và nhập:

- Tên lớp: `FLOW2 - Yoga Foundation`.
- Bộ môn: Yoga & Pilates.
- Phòng mặc định: Studio Flow 2.
- Trình độ: Beginner.
- Sức chứa: 2.
- Thời lượng: 60 phút.
- Bật **Cho phép hội viên đăng ký hàng chờ**.
- Chưa công bố ngay.

**Kết quả mong đợi:**

- Lớp được tạo với trạng thái `Draft`.
- Lớp chưa xuất hiện trong lịch đăng ký của Member.

**Lời thoại:**

> Lớp mới luôn được tạo ở trạng thái bản nháp. Hội viên chưa thể đặt chỗ cho đến khi lớp có lịch hợp lệ, có huấn luyện viên chính và được Manager công bố.

#### Bước 1.2: Phân công huấn luyện viên

Truy cập:

```text
Quản lý vận hành
→ Phân công HLV
#/manager/coach-assignment
```

Thao tác:

1. Chọn lớp `FLOW2 - Yoga Foundation`.
2. Chọn `flow2.coach`.
3. Xác nhận phân công.

**Kết quả mong đợi:**

- HLV được hiển thị là HLV phụ trách chính của lớp.
- Hệ thống từ chối nếu HLV không cùng trung tâm, không Active hoặc bị trùng lịch.
- Các session tương lai của lớp sẽ gắn với HLV này.

**Lời thoại:**

> Hệ thống kiểm tra HLV thuộc đúng trung tâm, đang hoạt động và không bị xung đột lịch trước khi cho phép phân công.

#### Bước 1.3: Tạo lịch hoạt động

Quay lại `#/manager/classes-rooms`, mở **Lịch học** của lớp và thêm lịch:

- Ngày trong tuần: ngày tương ứng với D+1.
- Bắt đầu: 18:00.
- Kết thúc: 19:00.
- Ngày hiệu lực: D+1 đến D+1.
- Phòng: Studio Flow 2.

**Kết quả mong đợi:**

- Lịch có trạng thái `Active`.
- Một session tương lai được sinh ra ở trạng thái `Scheduled`.
- Hệ thống từ chối nếu phòng đã có lịch trùng giờ.
- Sức chứa lớp không được lớn hơn sức chứa phòng.

#### Bước 1.4: Công bố lớp

Bấm **Công bố**.

**Kết quả mong đợi:**

- Trạng thái lớp đổi từ `Draft` sang `Published`.
- Buổi học xuất hiện trong lịch của Member và Receptionist.

**Lời thoại:**

> Manager không thể công bố một lớp chưa có lịch hoạt động, chưa có HLV chính hoặc không có buổi học tương lai. Đây là kiểm tra nghiệp vụ bắt buộc nhằm tránh xuất hiện lớp không thể vận hành.

### Cảnh 2 — Member A tự đặt lớp

**Thời lượng:** 2 phút.

Đăng nhập bằng `flow2.member.a` và truy cập:

```text
Lịch học
→ Thời khóa biểu
#/member/schedule
```

Thao tác:

1. Chọn ngày D+1.
2. Lọc bộ môn Yoga & Pilates nếu cần.
3. Mở lớp `FLOW2 - Yoga Foundation`.
4. Kiểm tra HLV, phòng, thời gian và số chỗ còn lại.
5. Bấm **Đặt chỗ**.

**Kết quả mong đợi:**

- Hiển thị thông báo đặt thành công.
- Booking có trạng thái `Booked`.
- Chỗ còn lại giảm từ 2 xuống 1.
- Lớp xuất hiện tại `#/member/bookings`.
- Member nhận thông báo đặt lớp thành công.
- Coach nhận thông báo có học viên mới đặt lịch.

**Lời thoại:**

> Hệ thống chỉ cho phép đặt trước tối thiểu 30 phút và tối đa 7 ngày. Gói tập của hội viên phải còn hiệu lực vào đúng ngày diễn ra buổi học.

#### Kiểm tra đặt lặp

Bấm đặt lại cùng session để trình bày tính idempotent.

**Kết quả mong đợi:**

- Hệ thống thông báo Member đã đặt buổi này trước đó.
- Không sinh thêm booking thứ hai.
- Sĩ số không tăng hai lần.

### Cảnh 3 — Receptionist đặt giúp Member B

**Thời lượng:** 2 phút.

Đăng nhập bằng `flow2.reception` và truy cập:

```text
Hội viên & Đặt chỗ
→ Đặt / Hủy chỗ tại quầy
#/receptionist/bookings
```

Thao tác:

1. Tìm Member B bằng mã hội viên, email hoặc số điện thoại.
2. Chọn đúng Member B.
3. Kiểm tra trạng thái gói tập còn hiệu lực.
4. Tìm session `FLOW2 - Yoga Foundation`.
5. Bấm **Đặt chỗ**.

**Kết quả mong đợi:**

- Booking của Member B có trạng thái `Booked`.
- Số chỗ còn lại giảm từ 1 xuống 0.
- Session hiển thị đã đầy chỗ.
- Member B nhận thông báo xác nhận.
- Audit Log xác định Receptionist là người thực hiện thay cho Member B.

**Lời thoại:**

> Receptionist có thể hỗ trợ hội viên đặt lớp tại quầy, nhưng vẫn phải tuân thủ toàn bộ điều kiện về gói tập, khung giờ đặt, trung tâm và lịch trùng giống như khi Member tự đặt.

### Cảnh 4 — Member C vào danh sách chờ

**Thời lượng:** 2 phút.

Đăng nhập bằng `flow2.member.c`, truy cập `#/member/schedule`, mở cùng session và bấm **Danh sách chờ**.

**Kết quả mong đợi:**

- Hệ thống không tạo booking chính thức.
- Tạo waitlist entry có trạng thái `Waiting`.
- Hiển thị thông báo lớp đã đầy và Member đã được đưa vào danh sách chờ.
- Member C xem được tại `#/member/bookings`, tab **Hàng chờ**.
- Member nhận thông báo đã tham gia danh sách chờ.

**Lời thoại:**

> Vì sức chứa hiệu dụng đã đạt 2 trên 2 và lớp cho phép waitlist, hệ thống chuyển Member C vào danh sách chờ thay vì từ chối hoàn toàn.

### Cảnh 5 — Member A hủy và hệ thống tự đôn Member C

**Thời lượng:** 3 phút.

Quay lại tài khoản Member A và truy cập `#/member/bookings`.

Thao tác:

1. Chọn booking của `FLOW2 - Yoga Foundation`.
2. Bấm **Hủy chỗ**.
3. Đọc chính sách hủy.
4. Xác nhận hủy.

Điều kiện: buổi học chưa bắt đầu. Nếu hủy trước ít nhất 2 giờ, Member A được hoàn lượt tập; nếu hủy muộn, lượt tập vẫn bị tính nhưng chỗ vật lý vẫn được giải phóng cho waitlist.

**Kết quả mong đợi:**

- Booking của Member A chuyển từ `Booked` sang `Cancelled`.
- Hệ thống giải phóng một chỗ.
- Waitlist của Member C chuyển từ `Waiting` sang `Promoted`.
- Hệ thống tạo booking `Booked` cho Member C.
- Sĩ số vẫn là 2: Member B và Member C.
- Member A nhận thông báo đã hủy.
- Member C nhận thông báo đã được xác nhận từ danh sách chờ.
- Coach nhận thông báo thay đổi roster.

**Lời thoại:**

> Khi một booking bị hủy trước giờ bắt đầu, hệ thống lấy người vào hàng chờ sớm nhất nhưng vẫn kiểm tra lại tài khoản, gói tập và lịch trùng trước khi tự động xác nhận. Mốc hai giờ chỉ quyết định việc có hoàn lượt tập cho người hủy hay không.

Chuyển sang tài khoản Member C và tải lại `#/member/bookings`.

**Kết quả cần chỉ ra:**

- Member C không còn nằm trong danh sách chờ đang hoạt động.
- Booking mới xuất hiện trong mục **Sắp tới**.
- Trạng thái chính thức là `Booked`.

### Cảnh 6 — Coach xem lịch và danh sách học viên

**Thời lượng:** 2 phút.

Đăng nhập bằng `flow2.coach` và truy cập:

```text
Lịch & Điểm danh
→ Lịch giảng dạy
#/coach/schedule
```

**Kết quả mong đợi:**

- Coach thấy lớp `FLOW2 - Yoga Foundation`.
- Hiển thị đúng ngày, giờ, phòng và trạng thái.
- Coach chỉ thấy lớp được phân công.
- Roster cuối cùng của session tương lai gồm Member B và Member C.
- Member A không còn trong roster booking hiện tại sau khi hủy.

**Lời thoại:**

> Lịch dạy được lấy theo chính tài khoản Coach đăng nhập, không nhận Coach ID từ người dùng. Vì vậy Coach không thể đổi URL để xem lớp của người khác.

### Cảnh 7 — Coach điểm danh buổi đang diễn ra

**Thời lượng:** 3 phút.

Truy cập:

```text
Lịch & Điểm danh
→ Điểm danh học viên
#/coach/attendance
```

Chọn session `AT-01` đã bắt đầu và nhập:

- Member A: `Có mặt`.
- Member B: `Đi muộn`.
- Ghi chú Member B: `Đến muộn 10 phút`.
- Bấm lưu điểm danh.

**Kết quả mong đợi:**

- Hệ thống báo lưu thành công.
- Tải lại trang vẫn giữ nguyên kết quả.
- Member A có trạng thái `PRESENT`.
- Member B có trạng thái `LATE`.
- Thời gian check-in được ghi cho người có mặt hoặc đi muộn.
- Audit Log sinh hành động `SESSION_ATTENDANCE`.

**Lời thoại:**

> Coach chỉ được điểm danh session mình phụ trách. Hệ thống chỉ mở lưu điểm danh khi buổi học đã bắt đầu, không bị hủy và vẫn trong ngày hiện tại.

Có thể thử mở session D+1 và bấm lưu để minh họa hệ thống từ chối điểm danh trước giờ.

### Cảnh 8 — Member kiểm tra kết quả

**Thời lượng:** 1 phút.

Đăng nhập Member A hoặc Member B và truy cập:

```text
Báo cáo học tập
→ Báo cáo điểm danh
#/member/attendance
```

Hoặc mở chi tiết booking trong `#/member/bookings`.

**Kết quả mong đợi:**

- Member A thấy trạng thái **Có mặt**.
- Member B thấy trạng thái **Đi muộn**.
- Member không thể sửa kết quả điểm danh.

### Cảnh 9 — Manager kiểm tra báo cáo và Audit Log

**Thời lượng:** 2–3 phút.

#### Báo cáo

Đăng nhập lại Manager và truy cập `#/manager/reports`.

Chọn thời gian từ ngày demo đến D+1 và kiểm tra:

- Số lượng lượt đăng ký lớp.
- Trạng thái booking và waitlist.
- Hoạt động điểm danh.
- Tình trạng vận hành lớp.

> Việc đặt lớp không trực tiếp làm tăng doanh thu. Doanh thu được ghi nhận khi hội viên mua hoặc gia hạn gói tập và phát sinh thanh toán. Flow 2 chỉ sử dụng quyền lợi của gói đã mua.

#### Audit Log

Truy cập `#/manager/audit-logs` và tìm các hành động:

| Hành động | Ý nghĩa |
|---|---|
| `class.created` | Manager tạo lớp |
| `CLASS_COACH.ASSIGNED` | Manager phân công HLV |
| `class_schedule.created` | Manager tạo lịch |
| `class.published` | Manager công bố lớp |
| `BOOK_SESSION` | Member hoặc Receptionist đặt session |
| `JOIN_SESSION_WAITLIST` | Member vào danh sách chờ |
| `CANCEL_SESSION_BOOKING` | Member hoặc Receptionist hủy booking |
| `SESSION_ATTENDANCE` | Coach lưu điểm danh |

**Kết quả mong đợi:**

- Đúng người thực hiện.
- Đúng trung tâm.
- Đúng entity và thời gian.
- Thao tác Receptionist thực hiện thay vẫn ghi Receptionist là actor.

## 4. Các test case lỗi nên demo thêm

Chỉ nên chọn 2–3 case tiêu biểu nếu thời gian demo hạn chế.

| Mã | Tình huống | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| NEG-01 | Gói hết hạn | Member D đặt lớp | Từ chối `403`, yêu cầu có gói còn hiệu lực |
| NEG-02 | Trùng lịch | Member C đặt session khác 18:30–19:30 cùng ngày | Từ chối `409`, hiển thị tên và giờ lớp bị trùng |
| NEG-03 | Đặt quá sớm | Đặt buổi cách hơn 7 ngày | Từ chối `400` |
| NEG-04 | Đặt quá sát giờ | Đặt buổi còn dưới 30 phút | Từ chối `400` |
| NEG-05 | Lớp đầy, tắt waitlist | Đặt session đã đủ chỗ | Từ chối `409` |
| NEG-06 | Hủy muộn | Hủy khi còn dưới 2 giờ | Trạng thái `CancelledLate`, vẫn tính đã sử dụng buổi; chỗ trống tiếp tục được chuyển cho waitlist hợp lệ |
| NEG-07 | Công bố thiếu lịch | Publish lớp Draft chưa có lịch | Từ chối `409` |
| NEG-08 | Công bố thiếu HLV | Publish lớp chưa có HLV chính | Từ chối `409` |
| NEG-09 | Trùng phòng | Tạo hai lịch cùng phòng và cùng giờ | Từ chối lưu lịch |
| NEG-10 | Trùng lịch HLV | Phân công HLV đang dạy lớp khác cùng giờ | Từ chối phân công |
| NEG-11 | Coach không phụ trách | Coach mở session của người khác | Từ chối `403` |
| NEG-12 | Điểm danh trước giờ | Coach lưu session D+1 | Từ chối `409` |
| NEG-13 | Khác trung tâm | Receptionist thao tác hội viên trung tâm khác | Từ chối `403` |
| NEG-14 | Gửi đặt chỗ hai lần | Double-click hoặc gửi lại request | Chỉ có một booking, không tăng sĩ số hai lần |

## 5. Kết quả pass cuối cùng

- [ ] Lớp chỉ được công bố sau khi có lịch và HLV chính.
- [ ] Member chỉ nhìn thấy lớp `Published` và session `Scheduled`.
- [ ] Member A tự đặt thành công.
- [ ] Receptionist đặt thay Member B thành công.
- [ ] Không vượt quá sức chứa hiệu dụng của lớp hoặc phòng.
- [ ] Member C vào waitlist khi lớp đầy.
- [ ] Member A hủy sớm và Member C được tự động đôn lên.
- [ ] Roster Coach phản ánh đúng Member B và Member C.
- [ ] Coach chỉ điểm danh được session mình phụ trách và đã bắt đầu.
- [ ] Member xem được kết quả điểm danh.
- [ ] Thông báo booking, cancellation và promotion được tạo.
- [ ] Báo cáo cập nhật dữ liệu đăng ký.
- [ ] Audit Log ghi đúng actor và hành động.

## 6. Phạm vi Flow 2

Flow 2 tập trung vào quản lý lớp, lịch học, booking, waitlist, hủy chỗ và điểm danh. Các chức năng AI, giáo án, bài tập về nhà và đánh giá tiến độ nên được trình bày trong flow Coach hoặc Training Management riêng để tránh làm loãng luồng nghiệp vụ chính.
