# Trang chủ dẫn vào đăng ký gói tập — 20/10/2026

Theo yêu cầu người dùng, danh mục bộ môn và cơ sở tập luyện giới thiệu dịch vụ và dẫn vào chức năng gói tập đã có. Giữ bố cục, danh sách, ảnh và nội dung CMS đã khôi phục.

## Hành vi

- Thẻ bộ môn và sân/phòng dùng “Xem chi tiết & Gói tập”. Thay giá thuê theo giờ/lượt/nửa sân bằng liên kết “Xem gói tập”; giá chính thức tiếp tục lấy từ API tại trang gói tập.
- Cửa sổ chi tiết giữ thông số và ảnh. Tab gói tập hướng dẫn chọn gói, thanh toán, chờ gói có hiệu lực rồi đặt ca học còn chỗ theo quyền lợi gói. Mở chi tiết không tạo đơn hay giữ sân.
- Khách chọn xem gói đến `#/login?next=packages`. Chuyển giữa đăng nhập/đăng ký giữ đích này; hội viên đăng nhập thành công được chuyển tới `#/member/packages`.
- Hội viên đã đăng nhập có liên kết trực tiếp tới gói tập và lịch lớp. Trang lịch lớp/API hiện có tiếp tục kiểm tra điều kiện gói và chỗ trống; không suy đoán rằng một gói cho phép học toàn bộ 9 bộ môn.
- Tài khoản nhân viên được dẫn về trang làm việc theo vai trò. Đích đến sau đăng nhập chỉ chấp nhận `packages` hoặc `schedule` cho hội viên; không nhận URL ngoài hoặc trang quản lý từ query.
- Banner quảng bá thuê sân cũ được đổi sang hướng dẫn gói tập khi hiển thị. Nội dung banner tùy chỉnh không liên quan thuê sân được giữ. Không ghi đè cấu hình CMS trong SQL.

## Phạm vi và hoàn tác

Giữ React/Vite, ASP.NET Core và SQL Server. Chỉ sửa phần giới thiệu/chi tiết và tiếp tục sau đăng nhập; không thêm nghiệp vụ thuê sân, không thay thanh toán/đặt lớp hoặc schema. Giữ các thay đổi dịch thuật có sẵn và được bổ sung đồng thời trong workspace.

Mã trước sửa và phản hồi API công khai nằm trong `tmp/membership-entry-20261020/`. Hoàn tác theo từng thay đổi từ các bản sao, không reset toàn bộ workspace đang có nhiều thay đổi khác.

## Kiểm chứng

- `npm.cmd test`: 74/74 đạt, bao gồm đích đến theo vai trò, từ chối URL tùy ý và giữ bản dữ liệu CMS khi đổi cách hiển thị banner.
- `npm.cmd run build`: frontend build đạt.
- `npm.cmd run test:landing:browser`: 10/10 đạt với API fixture riêng cho luồng quản lý nội dung, xem trước, lỗi lưu và media.
- Chrome trên localhost kiểm tra đủ 9 bộ môn, 9 sân/phòng, liên kết gói, modal, chuyển đăng nhập/đăng ký và đích đến của hội viên. Đăng nhập trong phần kiểm thử được chặn và trả fixture trong trình duyệt riêng, không gửi tài khoản giả đến API thật; không tạo giao dịch hay đặt lớp thật.
- Ảnh kiểm tra desktop/tablet/mobile và báo cáo: `tmp/membership-entry-20261020/`. Nội dung API sau kiểm tra được đối chiếu nguyên vẹn với bản sao trước sửa.
