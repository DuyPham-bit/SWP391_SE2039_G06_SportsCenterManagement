# Bộ test case chi tiết — Center Manager

## 1. Mục tiêu và phạm vi

Tài liệu này dùng để kiểm thử role **Manager** của một trung tâm trong Sports Center Management System (SCMS). Phạm vi được đối chiếu từ route frontend, màn hình Manager, API backend và các quy tắc nghiệp vụ hiện có trong repository.

Các mục phải kiểm thử:

1. Đăng nhập, phiên làm việc, điều hướng và phân quyền.
2. Dashboard trung tâm.
3. Quản lý hội viên.
4. Quản lý nhân sự (Coach/Receptionist).
5. Lớp học, bộ môn, phòng và lịch.
6. Gói hội viên.
7. Phân công HLV.
8. Vận hành HLV: nghỉ phép, bù giờ, tài nguyên và sự cố thiết bị.
9. Hóa đơn, thanh toán và hoàn tiền.
10. Lương và báo cáo lương.
11. Báo cáo, thống kê và xuất CSV.
12. Phân quyền theo vai trò và theo người dùng.
13. Nhật ký hệ thống.
14. Hỗ trợ và thông báo.
15. Nội dung trang chủ và thư viện ảnh.
16. Bảo mật, cách ly dữ liệu trung tâm, đồng thời, hiệu năng và responsive.

Ngoài phạm vi: quản trị toàn hệ thống như tạo trung tâm hoặc tạo tài khoản Manager mới; đây là nghiệp vụ của Admin.

## 2. Quy ước

- Mức ưu tiên: **P0** = chặn phát hành/an toàn dữ liệu; **P1** = nghiệp vụ chính; **P2** = phụ trợ/UX.
- Loại: `UI`, `API`, `DB`, `Security`, `Integration`, `Performance`.
- Kết quả chung cho mọi API lỗi: đúng HTTP status, response lỗi có thông điệp dễ hiểu; không thay đổi DB một phần; UI không báo thành công giả.
- Với mọi thao tác ghi thành công: dữ liệu còn đúng sau reload/đăng nhập lại và audit log được tạo nếu nghiệp vụ yêu cầu.
- Manager chỉ được đọc/ghi dữ liệu của `CenterId` được phân công, trừ nội dung trang chủ là dữ liệu dùng chung theo thiết kế hiện tại.

## 3. Dữ liệu và môi trường chuẩn bị

| Mã | Dữ liệu |
|---|---|
| MGR-A | Manager đang Active thuộc Center A, có đầy đủ capability |
| MGR-A-LIMITED | Manager/phiên thử nghiệm thiếu từng capability cần kiểm tra |
| MGR-B | Manager đang Active thuộc Center B |
| USER-LOCKED | Manager bị khóa/ngừng hoạt động nhưng còn token cũ |
| MEM-A1/A2 | Hội viên Center A; một Active, một Locked; có/không có gói |
| MEM-B1 | Hội viên Center B |
| COACH-A1/A2 | HLV Center A; đúng/sai chuyên môn; có lịch và ngày nghỉ |
| COACH-B1 | HLV Center B |
| REC-A1 | Lễ tân Center A |
| CLASS-A | Lớp Draft/Open/Cancelled/Completed tại Center A |
| ROOM-A | Phòng Active/Maintenance/Inactive với sức chứa xác định |
| PKG-A | Gói Active/Inactive, có và không có người đang sử dụng |
| FIN-A | Hóa đơn Paid/Pending/Cancelled và yêu cầu hoàn tiền các trạng thái |

Nên dùng database test riêng, cố định múi giờ `Asia/Ho_Chi_Minh`, và giữ ảnh chụp/request-response cho các case thất bại.

## 4. Test case chi tiết

### A. Xác thực, điều hướng và phân quyền

| ID | Test case | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi | Ưu tiên/Loại |
|---|---|---|---|---|---|
| MGR-AUTH-01 | Đăng nhập Manager hợp lệ | MGR-A Active | Đăng nhập đúng tài khoản/mật khẩu | Vào `#/manager/dashboard`; hiển thị đúng tên, role, trung tâm | P0/UI/API |
| MGR-AUTH-02 | Sai mật khẩu | Có MGR-A | Đăng nhập với mật khẩu sai | Từ chối; không tạo phiên; thông báo không làm lộ tài khoản có tồn tại hay không | P0/Security |
| MGR-AUTH-03 | Manager bị khóa | USER-LOCKED | Đăng nhập | Bị từ chối; không truy cập được route/API Manager | P0/Security |
| MGR-AUTH-04 | Token hết hạn | Đã đăng nhập, token hết hạn | Mở màn hình hoặc gọi API | Nhận 401; xóa phiên cục bộ; điều hướng về đăng nhập | P0/Integration |
| MGR-AUTH-05 | Token bị vô hiệu sau khi khóa tài khoản | MGR-A đang đăng nhập, Admin khóa tài khoản | Gọi lại API bằng token cũ | API từ chối 401/403; không tiếp tục thao tác | P0/Security |
| MGR-AUTH-06 | Người chưa đăng nhập mở URL trực tiếp | Chưa có token | Mở `#/manager/members` | Điều hướng đăng nhập; không ló dữ liệu bảo vệ | P0/UI |
| MGR-AUTH-07 | Role khác mở route Manager | Đăng nhập Member/Coach/Receptionist | Nhập trực tiếp URL Manager | Bị RoleGuard chặn; API tương ứng cũng trả 403 | P0/Security |
| MGR-AUTH-08 | Thiếu capability | Phiên thiếu `manage_staff` | Mở staff bằng menu và URL trực tiếp | Menu/route bị hạn chế phù hợp; API ghi trả 403 | P0/Security |
| MGR-AUTH-09 | Cách ly Center qua sửa URL/payload | MGR-A; có ID Center B | Gọi API với `centerId` B hoặc entity của B | 403/404; không tiết lộ hoặc thay đổi dữ liệu Center B | P0/Security/API |
| MGR-AUTH-10 | Đăng xuất | Đang đăng nhập | Đăng xuất, Back trình duyệt, gọi API cũ | Token bị xóa; trang bảo vệ không hiển thị; API từ chối | P0/UI/API |

### B. Dashboard

| ID | Test case | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi | Ưu tiên/Loại |
|---|---|---|---|---|---|
| MGR-DASH-01 | Tải dashboard có dữ liệu | Center A có dữ liệu | Mở dashboard | KPI, biểu đồ, hoạt động gần đây hiển thị đúng Center A | P1/UI/API |
| MGR-DASH-02 | Đối chiếu KPI | Có dữ liệu DB đã biết | So tổng hội viên, lớp, nhân sự, doanh thu với truy vấn DB | Số liệu và định nghĩa KPI khớp; không đếm dữ liệu Center B | P0/DB |
| MGR-DASH-03 | Trung tâm chưa có dữ liệu | Center test rỗng | Mở dashboard | Hiển thị 0/empty state, không NaN, không crash | P1/UI |
| MGR-DASH-04 | API dashboard lỗi/chậm | Giả lập 500/timeout | Mở/tải lại | Có trạng thái loading, lỗi và thử lại; không hiển thị số cũ như dữ liệu mới | P1/Integration |
| MGR-DASH-05 | Điều hướng từ KPI | Dashboard tải xong | Nhấn KPI/link chi tiết | Đến đúng màn hình và bộ lọc liên quan | P2/UI |

### C. Quản lý hội viên

| ID | Test case | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi | Ưu tiên/Loại |
|---|---|---|---|---|---|
| MGR-MEM-01 | Danh sách và phân trang | >1 trang hội viên Center A | Mở trang, chuyển trang | Đúng tổng số, không trùng/thiếu; chỉ Center A | P0/UI/API |
| MGR-MEM-02 | Tìm kiếm | Có tên/SĐT/mã thẻ xác định | Tìm từ khóa đầy đủ và một phần | Kết quả đúng, giữ phân trang/bộ lọc hợp lý | P1/UI |
| MGR-MEM-03 | Tạo hội viên hợp lệ | Email/SĐT chưa dùng | Nhập đủ dữ liệu và lưu | Tạo một bản ghi; hiển thị trong danh sách; audit đúng | P1/Integration |
| MGR-MEM-04 | Dữ liệu bắt buộc/định dạng | — | Bỏ trống tên; nhập email sai; SĐT không đủ 10 số | FE chặn hoặc API 400; chỉ rõ trường lỗi | P1/UI/API |
| MGR-MEM-05 | Trùng định danh | Email/SĐT đã tồn tại | Tạo mới với dữ liệu trùng | 409; không sinh tài khoản/hồ sơ dở dang | P0/API/DB |
| MGR-MEM-06 | Cập nhật hồ sơ hợp lệ | MEM-A1 | Sửa tên/SĐT/ngày sinh hợp lệ | Lưu đúng; reload vẫn đúng; email chỉ đọc | P1/Integration |
| MGR-MEM-07 | Overposting email | MEM-A1 | Chèn `email` vào payload cập nhật | API 400 hoặc bỏ qua theo contract; email DB không đổi | P0/Security |
| MGR-MEM-08 | Khóa và mở khóa | MEM-A1/A2 | Khóa rồi thử đăng nhập; mở lại | Trạng thái đồng bộ UI/DB; khóa vô hiệu phiên; mở lại đăng nhập được | P0/Integration |
| MGR-MEM-09 | Xem lịch sử gói | MEM-A1 có nhiều gói | Mở chi tiết/lịch sử | Đúng gói, thời hạn, trạng thái và thanh toán của người đó | P1/UI/API |
| MGR-MEM-10 | Race khi mở chi tiết | Hai thành viên; API đầu chậm | Mở A rồi nhanh chóng mở B | Response A không ghi đè nội dung B | P1/UI |
| MGR-MEM-11 | Truy cập hội viên Center B | MGR-A, MEM-B1 | Sửa ID/payload để đọc/sửa/khóa MEM-B1 | 403/404; MEM-B1 không đổi | P0/Security |

### D. Quản lý nhân sự

| ID | Test case | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi | Ưu tiên/Loại |
|---|---|---|---|---|---|
| MGR-STAFF-01 | Danh sách đầy đủ và sắp xếp | Nhiều trang staff | Tải danh sách | Tải đủ trang; tên sắp xếp đúng; tài khoản khóa ở cuối | P1/UI/API |
| MGR-STAFF-02 | Tạo Coach hợp lệ | Dữ liệu duy nhất | Tạo Coach cùng chuyên môn/chứng chỉ | Tạo user và staff profile trong một giao dịch | P1/Integration |
| MGR-STAFF-03 | Tạo Receptionist hợp lệ | Dữ liệu duy nhất | Tạo Receptionist | Đúng role, Center A, trạng thái và khả năng đăng nhập | P1/Integration |
| MGR-STAFF-04 | Bổ nhiệm Member thành staff | MEM-A1 hợp lệ | Chọn Member và role mới | Hồ sơ staff được tạo đúng; không tạo user trùng | P1/Integration |
| MGR-STAFF-05 | Dữ liệu nhân sự không hợp lệ/trùng | — | Email/SĐT trùng, role lạ, trường bắt buộc rỗng | 400/409; không tạo một phần | P0/API/DB |
| MGR-STAFF-06 | Sửa chuyên môn/chứng chỉ/kinh nghiệm | COACH-A1 | Cập nhật dữ liệu hợp lệ | UI và DB đồng bộ; audit có before/after | P1/Integration |
| MGR-STAFF-07 | Tự sửa tại màn staff | MGR-A | Chọn chính tài khoản đang đăng nhập và sửa | Bị chặn với hướng dẫn dùng hồ sơ cá nhân/nhờ Manager khác | P1/UI/API |
| MGR-STAFF-08 | Tự khóa | MGR-A | Khóa chính mình | Bị chặn; phiên và tài khoản không đổi | P0/Security |
| MGR-STAFF-09 | Khóa staff có phân công active | COACH-A1 đang dạy | Khóa tài khoản | 409 và yêu cầu xử lý phân công trước; lịch sử giữ nguyên | P0/Business |
| MGR-STAFF-10 | Thao tác staff Center B | MGR-A, COACH-B1 | Đọc/sửa/khóa bằng ID trực tiếp | 403/404; dữ liệu không đổi | P0/Security |

### E. Lớp, bộ môn, phòng và lịch

| ID | Test case | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi | Ưu tiên/Loại |
|---|---|---|---|---|---|
| MGR-CLS-01 | Tạo lớp Draft hợp lệ | Sport/Room hợp lệ | Nhập form và lưu | Lớp Draft tạo đúng Center A | P1/Integration |
| MGR-CLS-02 | Validation lớp | — | Bỏ tên; sức chứa <=0; ngày kết thúc trước bắt đầu | Chặn lưu/400, hiển thị đúng lỗi | P1/UI/API |
| MGR-CLS-03 | Công bố lớp hợp lệ | Draft đủ thông tin | Publish | Chuyển Open; thành viên nhìn thấy theo thiết kế | P1/Integration |
| MGR-CLS-04 | Hủy lớp | Lớp có lịch/đăng ký | Xác nhận hủy | Lớp, lịch, session/booking liên quan được cập nhật nhất quán; có thông báo/audit | P0/Integration |
| MGR-CLS-05 | Mở lại lớp đã hủy | Lớp Cancelled | Reopen | Về Draft; lịch/booking/đăng ký cũ không tự khôi phục | P0/Business |
| MGR-CLS-06 | Tạo/sửa phòng | Dữ liệu hợp lệ | Tạo rồi sửa tên/sức chứa/trạng thái | Lưu đúng Center A; audit đúng | P1/Integration |
| MGR-CLS-07 | Phòng bảo trì/inactive | ROOM-A Maintenance/Inactive | Xếp lịch vào phòng | Bị từ chối; không sinh schedule/session | P0/Business |
| MGR-CLS-08 | Quá sức chứa phòng | Lớp capacity > phòng | Tạo/sửa lớp hoặc lịch | 400; nêu rõ vượt sức chứa | P0/Business |
| MGR-CLS-09 | Trùng phòng | Có lịch cùng phòng/giờ | Tạo lịch chồng lấn | 409; lịch cũ và mới không bị sửa dở dang | P0/Business |
| MGR-CLS-10 | Biên giờ hoạt động | Giờ hoạt động 05:00–22:00 | Test 05:00, 22:00 và ngoài biên | Biên hợp lệ theo contract; ngoài biên bị từ chối | P1/API |
| MGR-CLS-11 | Tạo/sửa/ngừng bộ môn riêng | Sport thuộc Center A | Thực hiện từng thao tác | Thành công và ghi audit | P1/Integration |
| MGR-CLS-12 | Sửa bộ môn dùng chung | Global sport | Sửa/ngừng hoạt động | Bị từ chối; dữ liệu chung không đổi | P0/Security |
| MGR-CLS-13 | Ngừng bộ môn có lớp mở | Sport có lớp Open | Ngừng hoạt động | 409; hướng dẫn đóng/xử lý lớp trước | P0/Business |

### F. Gói hội viên

| ID | Test case | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi | Ưu tiên/Loại |
|---|---|---|---|---|---|
| MGR-PKG-01 | Xem cả gói Active/Inactive | Có hai trạng thái | Mở danh sách/bộ lọc | Hiển thị đúng và chỉ Center A | P1/UI/API |
| MGR-PKG-02 | Tạo gói hợp lệ | Tên/mã duy nhất | Nhập giá, thời hạn, quyền lợi | Tạo đúng; member nhìn thấy nếu Active | P1/Integration |
| MGR-PKG-03 | Giá/thời hạn biên | — | Giá âm/0; thời hạn <=0; số quá lớn | Bị chặn/400; không lưu | P0/UI/API |
| MGR-PKG-04 | Trùng tên/mã | Đã có PKG-A | Tạo tên/mã trùng (kể cả khác hoa thường/khoảng trắng) | 409 theo quy tắc chuẩn hóa | P1/API |
| MGR-PKG-05 | Sửa giá gói đang dùng | PKG-A có người sở hữu | Đổi giá | Giá cũ của đăng ký đã mua giữ nguyên; giá mới chỉ áp dụng giao dịch mới | P0/DB |
| MGR-PKG-06 | Ngừng bán và mở lại | PKG-A Active | Tắt rồi bật trạng thái | Không mất lịch sử; gói tắt không mua mới được | P1/Integration |
| MGR-PKG-07 | Xóa cứng gói đang dùng | Gói có subscription | Gọi DELETE nếu endpoint tồn tại | Bị từ chối; chỉ cho inactive | P0/Business |

### G. Phân công và vận hành HLV

| ID | Test case | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi | Ưu tiên/Loại |
|---|---|---|---|---|---|
| MGR-COACH-01 | Danh sách HLV phù hợp | CLASS-A có bộ môn/lịch | Mở phân công | Hiển thị chuyên môn, trạng thái, tải và cờ phù hợp lịch chính xác | P1/UI/API |
| MGR-COACH-02 | Phân công HLV đúng chuyên môn | COACH-A1 hợp lệ | Phân công làm HLV chính | Thành công; tải lớp và audit cập nhật | P1/Integration |
| MGR-COACH-03 | Phân công lớp Draft chưa có lịch | Draft mới | Phân công HLV | Thành công; kiểm tra xung đột khi lịch được tạo sau | P1/Business |
| MGR-COACH-04 | Sai chuyên môn | COACH-A2 không phù hợp | Cố phân công | Bị từ chối/cảnh báo đúng | P0/Business |
| MGR-COACH-05 | Trùng lịch | HLV có lớp cùng giờ | Phân công hoặc tạo lịch sau phân công | 409; không ghi phân công/lịch một phần | P0/Business |
| MGR-COACH-06 | HLV nghỉ phép/inactive | Có đơn nghỉ được duyệt hoặc bị khóa | Phân công vào thời gian nghỉ | Bị từ chối | P0/Business |
| MGR-COACH-07 | Lớp Cancelled/Completed | Có lớp hai trạng thái | Phân công/thay HLV | Bị từ chối theo trạng thái lớp | P1/Business |
| MGR-COACH-08 | Thay/gỡ HLV chính | Lớp đang có HLV | Thay rồi gỡ theo điều kiện hợp lệ | Trạng thái nhất quán; audit ghi người cũ/mới | P1/Integration |
| MGR-COACH-09 | Giới hạn giờ/ngày | HLV gần/ngang/vượt giới hạn | Phân công các trường hợp biên | Đúng quy tắc biên; vượt giới hạn bị từ chối | P0/API |
| MGR-COACH-10 | Duyệt/từ chối đơn nghỉ | Có đơn Pending | Duyệt và test lại với đơn khác | Đúng trạng thái, ghi chú, thông báo HLV; không duyệt lặp | P1/Integration |
| MGR-COACH-11 | Bù giờ/tài nguyên/sự cố thiết bị | Có dữ liệu hợp lệ | Tạo bù giờ, đăng tài nguyên, cập nhật sự cố | Đúng phạm vi trung tâm, trạng thái và audit/thông báo | P1/Integration |

### H. Hóa đơn, hoàn tiền và lương

| ID | Test case | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi | Ưu tiên/Loại |
|---|---|---|---|---|---|
| MGR-FIN-01 | Danh sách hóa đơn Center A | Có nhiều trạng thái | Tìm/lọc/phân trang | Tổng và dữ liệu đúng; không có Center B | P0/UI/API |
| MGR-FIN-02 | Xem/in/xuất lại hóa đơn | Hóa đơn Paid | Mở chi tiết và xuất/in lại | Nội dung đúng; không tạo giao dịch mới | P1/Integration |
| MGR-FIN-03 | Chống gửi thanh toán lặp | Có request hợp lệ | Double-click/gửi cùng idempotency key | Chỉ một hóa đơn/thanh toán được tạo | P0/API/DB |
| MGR-FIN-04 | Duyệt hoàn tiền hợp lệ | Yêu cầu Pending | Xem bằng chứng, duyệt | Trạng thái, số tiền, bill hoàn và thông báo đồng bộ | P0/Integration |
| MGR-FIN-05 | Từ chối hoàn tiền | Yêu cầu Pending | Nhập lý do và từ chối | Lý do bắt buộc; member nhận trạng thái/thông báo | P1/Integration |
| MGR-FIN-06 | Hoàn vượt số tiền/hoàn hai lần | Đã hoàn một phần/toàn phần | Gửi số tiền quá mức hoặc duyệt lại | 400/409; tổng hoàn không vượt tiền đã thu | P0/DB |
| MGR-FIN-07 | Xem bảng lương Center A | Có kỳ lương | Chọn kỳ, lọc nhân viên | Công thức/tổng đúng; chỉ nhân sự Center A | P0/DB |
| MGR-FIN-08 | Kỳ không dữ liệu và xuất báo cáo | Kỳ rỗng/có dữ liệu | Xem và xuất | Empty state đúng; file xuất khớp bộ lọc và số liệu UI | P1/UI |

### I. Báo cáo và phân tích

| ID | Test case | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi | Ưu tiên/Loại |
|---|---|---|---|---|---|
| MGR-RPT-01 | Khoảng ngày hợp lệ | Có dữ liệu chuẩn | Chọn from/to và nhóm ngày | KPI, biểu đồ, bảng đúng khoảng và Center A | P0/DB |
| MGR-RPT-02 | Nhóm theo tháng | Dữ liệu qua nhiều tháng | Chọn monthly | Mốc tháng, tổng và timezone đúng | P1/DB |
| MGR-RPT-03 | Khoảng ngày sai | from > to hoặc >365 ngày | Gửi bộ lọc | FE chặn/API 400; giữ bộ lọc để sửa | P1/UI/API |
| MGR-RPT-04 | Ngày biên và múi giờ | Giao dịch sát 00:00 ICT | Báo cáo đúng ngày | Không lệch ngày do UTC; mỗi giao dịch chỉ được đếm một lần | P0/DB |
| MGR-RPT-05 | Không có dữ liệu | Khoảng rỗng | Tải báo cáo | Empty state, 0 hợp lý; không vẽ số giả/NaN | P1/UI |
| MGR-RPT-06 | Định nghĩa chỉ số | Dataset kiểm soát | Đối chiếu tổng thành viên, mới, doanh thu, đăng ký | Tổng member gồm người chưa mua gói; số mới/doanh thu theo kỳ; snapshot đúng mô tả | P0/DB |
| MGR-RPT-07 | Xuất CSV | Đang áp dụng bộ lọc | Xuất file, mở bằng UTF-8 | Tên cột/tiếng Việt đúng; dữ liệu và tổng khớp UI/API | P1/Integration |
| MGR-RPT-08 | Formula injection CSV | Tên dữ liệu bắt đầu `=`, `+`, `-`, `@` | Xuất và mở file | Nội dung được escape; không thực thi công thức | P0/Security |
| MGR-RPT-09 | API chậm/timeout | Dataset lớn | Tải báo cáo | Loading hợp lý; timeout có lỗi/thử lại; UI không treo | P1/Performance |

### J. Phân quyền và audit log

| ID | Test case | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi | Ưu tiên/Loại |
|---|---|---|---|---|---|
| MGR-PERM-01 | Xem ma trận role | MGR-A | Mở phân quyền | Chỉ Member/Coach/Receptionist; không cho chỉnh Manager/Admin/SystemAdmin | P0/UI/API |
| MGR-PERM-02 | Cập nhật quyền role hợp lệ | Chọn capability hợp lệ | Bật/tắt và lưu | Tài khoản role đó được áp dụng; lưu sau reload; có audit | P0/Integration |
| MGR-PERM-03 | Quyền theo người dùng ghi đè | Chọn user Center A | Thay capability riêng | Chỉ user đó thay đổi, đúng precedence so với role | P0/Integration |
| MGR-PERM-04 | Capability không thuộc role | Payload sửa thủ công | Gửi capability ID không hợp lệ | 400/403; không lưu quyền ngoài boundary | P0/Security |
| MGR-PERM-05 | Sửa quyền người Center B/Manager | MGR-A | Gửi target ID ngoài phạm vi | 403/404; không đổi dữ liệu | P0/Security |
| MGR-PERM-06 | Đồng bộ hàng loạt | Nhiều user cùng role | Cập nhật role và chọn sync | Tất cả target hợp lệ đồng bộ atomically; ngoại lệ cá nhân theo contract | P1/DB |
| MGR-AUD-01 | Danh sách và phân trang audit | >50 log | Chuyển trang | Đọc được toàn lịch sử, tối đa page size quy định, không trùng/thiếu | P1/UI/API |
| MGR-AUD-02 | Lọc/tìm audit | Có action/user/date xác định | Áp dụng từng tổ hợp lọc | Kết quả đúng; scope Center A | P1/UI/API |
| MGR-AUD-03 | Chi tiết before/after và thời gian | Log có thay đổi | Mở chi tiết | Actor/action/entity/ID/before/after đúng; hiển thị giờ Việt Nam | P1/UI/DB |
| MGR-AUD-04 | Audit bất biến | MGR-A | Thử sửa/xóa bằng UI/API | Không có khả năng sửa/xóa; API từ chối | P0/Security |
| MGR-AUD-05 | Thiếu quyền xem audit | Bỏ `view_audit_logs` | Mở route/gọi API | Bị chặn 403; không rò rỉ nội dung log | P0/Security |

### K. Hỗ trợ, thông báo và nội dung trang chủ

| ID | Test case | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi | Ưu tiên/Loại |
|---|---|---|---|---|---|
| MGR-COM-01 | Danh sách yêu cầu hỗ trợ | Có ticket A/B | Mở, lọc trạng thái | Chỉ ticket Center A; đúng người gửi và lịch sử | P0/UI/API |
| MGR-COM-02 | Cập nhật ticket | Ticket Pending | Đổi trạng thái và ghi chú | Lưu đúng; người gửi nhận thông báo; audit có actor | P1/Integration |
| MGR-COM-03 | Manager tạo hộ yêu cầu | MGR-A | Gọi endpoint create support request | Bị từ chối; UI không có nút tạo hộ | P0/Business |
| MGR-COM-04 | Gửi thông báo theo role | Có các role tại A/B | Gửi cho Member/Coach/Receptionist/Manager Center A | Chỉ đúng tài khoản Active thuộc Center A nhận | P0/Integration |
| MGR-COM-05 | Thông báo rỗng/quá dài/gửi lặp | — | Gửi dữ liệu biên và double-click | Validation đúng; không sinh thông báo trùng ngoài ý muốn | P1/UI/API |
| MGR-COM-06 | Manager khóa/không thuộc center gửi thông báo | USER-LOCKED/token không hợp lệ | Gọi API trực tiếp | 401/403; không có notification được tạo | P0/Security |
| MGR-HOME-01 | Sửa nội dung trang chủ | MGR-A | Sửa text/section và lưu | Public page hiển thị nội dung mới sau reload | P1/Integration |
| MGR-HOME-02 | Upload ảnh hợp lệ | Ảnh đúng loại/kích thước | Upload/chọn ảnh và lưu | Preview, URL và public page đúng | P1/Integration |
| MGR-HOME-03 | File nguy hiểm/không hợp lệ | File sai MIME, quá lớn, tên kép | Upload | Bị từ chối; không lưu file/script | P0/Security |
| MGR-HOME-04 | Sanitization nội dung | Nhập HTML/script/URL nguy hiểm | Lưu và xem public page | Script không thực thi; nội dung được sanitize/escape | P0/Security |
| MGR-HOME-05 | Hai Manager sửa đồng thời | Hai phiên mở cùng version | A lưu rồi B lưu dữ liệu cũ | Có xử lý version/xung đột hoặc hành vi last-write được cảnh báo/rõ ràng | P1/Concurrency |

### L. Phi chức năng và hồi quy xuyên suốt

| ID | Test case | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi | Ưu tiên/Loại |
|---|---|---|---|---|---|
| MGR-NF-01 | Responsive | Viewport 375×812, 768×1024, 1280×800 | Đi qua mọi màn/form/modal/bảng | Không tràn ngang bất hợp lý; thao tác chính dùng được | P1/UI |
| MGR-NF-02 | Bàn phím và accessibility cơ bản | — | Tab qua form/modal; Enter/Escape; đọc label | Focus rõ, thứ tự hợp lý, label/role/status đúng, modal giữ focus | P2/UI |
| MGR-NF-03 | Song ngữ | Hỗ trợ VI/EN | Đổi ngôn ngữ trên mọi màn Manager | Không sót chuỗi, không vỡ layout, dữ liệu không reload sai | P2/UI |
| MGR-NF-04 | Double submit | Form tạo/cập nhật bất kỳ | Nhấn lưu nhanh nhiều lần | Nút bị khóa/loading; chỉ một thay đổi được ghi | P0/Integration |
| MGR-NF-05 | Mất mạng giữa thao tác | DevTools offline sau khi gửi | Tạo/cập nhật dữ liệu | Báo trạng thái không xác định/thất bại rõ; reload phản ánh DB thật; không báo thành công giả | P1/Integration |
| MGR-NF-06 | Chuỗi Unicode và ký tự đặc biệt | — | Nhập tiếng Việt, emoji, dấu nháy, `<script>` | Lưu/hiển thị đúng phần hợp lệ; không XSS/SQL injection | P0/Security |
| MGR-NF-07 | Hiệu năng danh sách | Dữ liệu lớn | Tải trang, lọc, đổi trang | Phân trang server; không tải toàn DB; thời gian theo SLA dự án | P1/Performance |
| MGR-NF-08 | Tính nguyên tử | Giả lập lỗi DB giữa workflow nhiều bảng | Tạo member/staff, hủy lớp, hoàn tiền | Rollback toàn bộ; không có bản ghi mồ côi | P0/DB |
| MGR-NF-09 | Không lộ bí mật/PII | API/UI/log trình duyệt | Quan sát response, console, local storage, export | Không lộ mật khẩu, token, connection string; PII chỉ ở nơi được phép | P0/Security |
| MGR-NF-10 | Hồi quy menu/route | MGR-A | Mở tất cả mục sidebar và reload từng URL | Không 404/chunk error; active menu đúng; nút Back/Forward hoạt động | P1/UI |

## 5. Bộ smoke test tối thiểu trước mỗi bản phát hành

Chạy ít nhất các case: `MGR-AUTH-01`, `MGR-AUTH-05`, `MGR-AUTH-09`, `MGR-DASH-02`, `MGR-MEM-03`, `MGR-MEM-08`, `MGR-STAFF-02`, `MGR-STAFF-08`, `MGR-CLS-01`, `MGR-CLS-04`, `MGR-CLS-09`, `MGR-PKG-02`, `MGR-COACH-02`, `MGR-COACH-05`, `MGR-FIN-03`, `MGR-FIN-04`, `MGR-RPT-01`, `MGR-PERM-02`, `MGR-AUD-03`, `MGR-COM-04`, `MGR-HOME-01`, `MGR-NF-04` và `MGR-NF-08`.

## 6. Tiêu chí hoàn tất kiểm thử

- 100% case P0 đã chạy và Pass; không còn defect Critical/High mở.
- Ít nhất 95% case P1 Pass; case chưa chạy phải có lý do và đánh giá rủi ro.
- Các phép tính tài chính/báo cáo đã được đối chiếu độc lập với DB.
- Mỗi API ghi quan trọng đã kiểm tra: quyền role, capability, Center scope, validation, audit và rollback.
- Có bằng chứng test cho desktop và mobile; file export mở được và đúng encoding.
- Defect retest Pass và có regression quanh vùng ảnh hưởng.

## 7. Mẫu ghi kết quả thực thi

| Run date | Build/commit | Environment | Tester | Test case | Result | Evidence/Defect |
|---|---|---|---|---|---|---|
| YYYY-MM-DD | commit SHA | Local/Staging | Tên tester | MGR-... | Pass/Fail/Blocked/Not run | Link ảnh, request-response hoặc mã bug |

