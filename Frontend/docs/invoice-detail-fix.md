# Xem chi tiết hóa đơn tại quầy — 20/10/2026

## Nguyên nhân

Nút View đã gọi `GET /api/invoices/{invoiceNumber}`, nhưng `CounterInvoices.jsx` đặt phần chi tiết, trạng thái tải và lỗi bên dưới bảng 20 dòng. Người dùng đang xem các dòng phía trên không thấy nội dung mới và tưởng nút không hoạt động.

Backend đã có `InvoicesController`, `PaymentService.GetInvoiceAsync` và dữ liệu SQL trong `invoices`, `invoice_items`, `payments`, `payment_refunds`. Không cần thêm backend lưu hóa đơn cho lỗi hiển thị này.

## Thay đổi

- Mở cửa sổ chi tiết ngay khi chọn đơn, hiển thị mã đơn và trạng thái tải trước khi API trả về.
- Dùng Modal hiện có qua React portal vào `document.body` để cửa sổ không bị giữ trong phần bảng/khối có animation khi trang cuộn.
- Lỗi và nút Thử lại hiển thị trong cùng cửa sổ; thử lại đúng mã đã chọn.
- Đóng bằng nút, nền hoặc Escape; Modal giữ focus bên trong và trả focus về nút View khi đóng.
- Đóng trong lúc tải làm mất hiệu lực phản hồi cũ, tránh ghi đè khi chọn đơn khác. Không đóng trong lúc đang ghi nhận khoản thu.
- Giữ nguyên API, phân quyền, thu tiền, chống trùng thanh toán, in/PDF và xuất CSV. Không sửa database, schema hoặc tạo giao dịch để kiểm thử.

## Kiểm chứng

- API thật với tài khoản Lễ tân local: danh sách có 41 hóa đơn; 3 đơn đầu trong ảnh trả chi tiết thành công, mỗi đơn có 1 mặt hàng và 1 giao dịch. Trạng thái lần lượt Paid, Voided, Voided; tổng tiền 1.800.000 VNĐ. Không ghi nhận khoản thu.
- Regression Chrome với API fixture riêng: bản trước sửa thất bại vì nội dung đã tải nhưng không có dialog; bản sau sửa đạt 5 kiểm tra: hiển thị ngay/đúng đơn, đóng và focus, lỗi/thử lại, phản hồi cũ, kích thước điện thoại và chỉ GET API.
- `npm.cmd test`: 74/74 đạt.
- `npm.cmd run build`: đạt.

Chạy frontend ở `http://localhost:3004`, sau đó `npm.cmd run test:invoices:browser`. Có thể đổi URL bằng `SCMS_TEST_BASE_URL` và đường dẫn Chrome bằng `CHROME_PATH`. Browser test chặn toàn bộ API trong profile riêng và không đăng nhập hoặc ghi dữ liệu lên backend thật.

Bản mã trước sửa: `tmp/invoice-detail-20261020/CounterInvoices.before.jsx`. Ảnh desktop/mobile và báo cáo regression: `Frontend/tmp/invoices-browser/`. Hai thư mục tạm được Git bỏ qua. Chỉ hoàn tác phần sửa liên quan nếu cần; không reset các thay đổi khác trong workspace.
