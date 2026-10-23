# Mục 10 — Xử lý thanh toán, hoàn tiền và đối soát

## Kết quả

Đã sửa đầy đủ luồng xử lý thanh toán/hoàn tiền ở Backend và Frontend, gồm cả happy case và unhappy case. Không cần migration mới vì bảng `payment_refunds` và các trường trạng thái hiện tại đã đủ cho nghiệp vụ.

## Backend

- Sửa lỗi hoàn tiền thành công nhưng hóa đơn/gói tập chưa chuyển sang `Refunded`: trạng thái refund được lưu trong transaction trước khi truy vấn tổng tiền đã hoàn từ DB.
- Giữ cập nhật refund, hóa đơn, gói tập và audit log trong cùng transaction để tránh trạng thái dở dang.
- Endpoint đối soát refund tiếp tục kiểm soát theo trung tâm, chỉ cho `MANAGER`/`ADMIN`, chỉ chấp nhận refund `Pending`, bắt buộc bằng chứng tối thiểu 10 ký tự và bắt buộc mã refund nhà cung cấp khi xác nhận VNPay/MoMo thành công.
- Backend tính số tiền còn có thể hoàn bằng cách giữ chỗ cả refund `Pending` và `Succeeded`, ngăn hoàn vượt số tiền đã thu.
- Bổ sung kiểm thử tích hợp cho:
  - Hoàn tiền mặt toàn phần cập nhật đồng thời invoice và subscription.
  - Đối soát refund cổng thanh toán thiếu mã nhà cung cấp bị từ chối.
  - Đối soát hợp lệ cập nhật refund, invoice và subscription thành công.

## Frontend

- Không còn hiển thị thành công giả khi API trả refund `Pending`; giao diện hiện cảnh báo cần đối soát.
- Thêm nút và modal “Đối soát hoàn tiền” cho refund `Pending`, hỗ trợ xác nhận `Succeeded` hoặc `Failed`, nhập mã refund cổng và bằng chứng.
- Số tiền có thể hoàn trừ cả các lệnh `Pending` lẫn `Succeeded`, đồng nhất với Backend.
- Idempotency key được giữ ổn định khi retry cùng một yêu cầu refund; client không tự sinh key mới ở tầng API.
- Refund POS bắt buộc mã hoàn tiền/ngân hàng trên cả validation và giao diện.
- Trang tài chính theo trung tâm chỉ cho `MANAGER`/`ADMIN`; `SYSTEMADMIN` không còn thấy menu hoặc truy cập route này khi không có center scope.
- Chuẩn hóa nội dung thành ba cơ chế: đối soát thanh toán, hoàn tiền, hủy hóa đơn chưa thanh toán; bỏ từ ngữ và số thứ tự không phù hợp.

## Bảo mật cấu hình

- Các connection string, JWT key, mật khẩu bootstrap và secret cổng thanh toán trong file cấu hình được để trống.
- Khi chạy local cần cấp qua .NET User Secrets hoặc biến môi trường, ví dụ `ConnectionStrings__SportsCenter`, `Jwt__Key`, `VnPay__HashSecret`, `Bootstrap__SystemAdmin__Password`.
- Giữ nguyên cấu hình Google Drive không nhạy cảm; `ClientSecret` và `RefreshToken` vẫn để trống.

## Xác minh

- `dotnet build verification/LogicAudit/LogicAudit.csproj --no-restore -c Release`: thành công, 0 warning, 0 error.
- LogicAudit với SQL Server LocalDB: **53/53 passed**; database kiểm thử cô lập đã được xóa.
- Frontend focused tests cho payment resolution và secrets: **6/6 passed**.
- Toàn bộ Frontend tests: **84/84 passed**.
- `npm run build`: production build thành công, 214 modules transformed.
- `git diff --check`: không có lỗi whitespace.

## File chính đã thay đổi

- `Backend/Backend/SportsCenterManagement.BLL/Services/PaymentService.cs`
- `Backend/Backend/verification/LogicAudit/Program.cs`
- `Frontend/src/services/backendApi.js`
- `Frontend/src/features/receptionist/CounterInvoices.jsx`
- `Frontend/src/App.jsx`
- `Frontend/src/components/layout/Sidebar.jsx`
- `Frontend/tests/payment-resolution.test.cjs`
- `Backend/Backend/SportsCenterManagement.API/appsettings.Development.json`
