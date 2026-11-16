# Hủy thanh toán quay lại trang gói tập — 13/10/2026

Yêu cầu: hủy ở cổng thanh toán phải quay lại trang gói tập đang sử dụng, giữ đăng nhập.

## Nguyên nhân và quyết định

`MemberPackages.jsx` dùng `window.location.assign(paymentUrl)` trên tab đang đăng nhập. Điều hướng ra ngoài hủy document giữ JWT trong bộ nhớ; quay về tạo document mới không có JWT. Nút quay lại ở `PaymentResult.jsx` tiếp tục tải lại trang và đi vào guard đăng nhập.

Giữ stack React/Vite + ASP.NET Core/SQL Server và quy tắc JWT trong bộ nhớ từng tab. Giữ document gốc bằng cửa sổ thanh toán riêng, mở đồng bộ từ lần click trước khi chờ API. Không đổi API contract, auth/RBAC, database, cấu hình URL cổng hoặc thông tin bí mật.

## Thay đổi

- `paymentCheckout.js`: quản lý cửa sổ thanh toán, handshake trả về, kiểm tra đúng cửa sổ gửi và origin ứng dụng/API; hỗ trợ hai origin local Vite/API. Handshake không chuyển JWT/hồ sơ. Dữ liệu trả về chỉ là gợi ý hiển thị, trạng thái thật được tải từ API.
- `MemberPackages.jsx`: giữ trang gói tập, đóng modal khi mở được cổng; khi hủy/hoàn tất/đóng cửa sổ thì tải lại hóa đơn và hồ sơ. Bị chặn popup thì không gọi API tạo giao dịch. Lỗi tạo link đóng cửa sổ trống. Bỏ qua phản hồi cũ khi checkout đã đóng hoặc có lần mới; dọn cửa sổ khi rời màn hình/logout.
- `PaymentResult.jsx`: vẫn xác minh callback VNPay/MoMo qua API công khai; PayOS vẫn dựa vào webhook. Sau xử lý, báo về đúng tab gốc để đóng cửa sổ và focus trang gói tập. Nút quay lại không tải lại trang đang giữ JWT.
- Hủy trên cổng không tự xóa hóa đơn hoặc tự kích hoạt gói; dùng trạng thái backend và thao tác hủy hóa đơn hiện có.

## Kiểm chứng

- Đã tái hiện trên Chrome trước khi nối bản sửa: sau xác nhận thanh toán, URL của tab gốc chuyển sang gateway thay vì giữ `#/member/packages`; assertion bảo toàn tab gốc thất bại.
- Đã tái hiện và sửa thêm race: đóng cửa sổ khi API đang chờ, mở lần mới, lỗi API lần cũ về muộn đóng nhầm cửa sổ mới. Regression này thất bại trước khi chặn theo đúng đối tượng checkout và đạt sau sửa.
- `npm test`: 6/6 đạt; kiểm tra nguồn gửi/origin, popup bị chặn, đóng thủ công, cleanup, URL không hợp lệ, handshake không mang thông tin đăng nhập.
- `npm run test:payment:browser`: 12 kiểm tra trên Chrome thật với bundle React build, API và gateway giả lập qua HTTP cục bộ. Bao gồm callback khác origin, hủy PayOS, VNPay/MoMo/PayOS quay về, đóng thủ công, chặn popup, lỗi API, phản hồi muộn, giữ nguyên document/JWT trong bộ nhớ và không có JavaScript exception/request API ngoài fixture.
- Report và ảnh: `.validation/payment-checkout/report.json`, `.validation/payment-checkout/returned-packages.png`.
- `npm run build` và `npm run build:api`: đạt; hai bản dùng cùng `index-CsdiB2G2.js` và `paymentCheckout-C9GtbImU.js`. Browser fixture build riêng, không thay cấu hình local hoặc các bản build này.
- `node --check tests/payment-checkout.browser.cjs` và `git diff --check`: đạt. Frontend chưa cấu hình lint/typecheck riêng; không tuyên bố đã chạy các check này hoặc Playwright/SonarQube MCP.

Không sử dụng tài khoản hay chuyển tiền thật trong các kiểm tra này. Chưa kiểm chứng trực tiếp gateway sandbox/live, chính sách cửa sổ của từng cổng hoặc trình duyệt mobile. Nếu cổng cắt liên kết opener, trang gói tập vẫn giữ đăng nhập; người dùng có thể đóng cửa sổ thanh toán để trở về. Nếu đóng/reload tab gốc thì vẫn cần đăng nhập lại theo thiết kế JWT hiện có.

## Áp dụng

Source FE ở `SWP391_SE2039_G06_SportsCenterManagement_FE`, nhánh `feature/fe-be-integration`, remote `https://github.com/DuyPham-bit/SWP391_SE2039_G06_SportsCenterManagement_FE.git`. Workspace cha là repository gộp; chỉ sửa source FE, không sửa production backend.

Build `npm run build` và `npm run build:api` để cập nhật cả bản Vite và bản nhúng backend. Không commit, push hoặc deploy. Rollback bằng frontend trước thay đổi rồi build lại; không có migration/rollback database.
