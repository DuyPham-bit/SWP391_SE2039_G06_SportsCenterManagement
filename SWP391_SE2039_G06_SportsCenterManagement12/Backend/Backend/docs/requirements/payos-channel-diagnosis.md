# Chẩn đoán lỗi tạo link PayOS — 2026-10-13

## Bằng chứng

- Người dùng nhận thông báo: `Chưa xác định được kết quả tạo giao dịch PayOS. Hệ thống giữ Pending; quản lý cần đối soát trước lần thử mới.`
- Backend đang chạy có route đồng bộ PayOS mới; các khóa PayOS đã có trong User Secrets. Không in hoặc sao chép giá trị khóa vào tài liệu.
- Chẩn đoán chỉ đọc tìm thấy payment `35` đang `Pending` và chưa lưu link; `32`, `14` đã `Voided`.
- Gọi `GET /v2/payment-requests/{id}` với cấu hình hiện tại cho cả ba mã trên đều nhận HTTP 200, `code = 214`, `desc = Cổng thanh toán không tồn tại hoặc đã tạm dừng, vui lòng chọn cổng khác`.
- Đây là phản hồi trạng thái tại thời điểm chẩn đoán, xác nhận kênh ứng với bộ khóa hiện tại không sử dụng được. Không có log phản hồi POST ban đầu, nên không suy diễn trạng thái lịch sử của từng giao dịch.
- Chẩn đoán không tạo link, chuyển tiền, đổi khóa hay sửa dữ liệu database ứng dụng. Bộ test 72 ca ở lần ghép trước dùng gateway giả và không kiểm tra tình trạng kênh PayOS thật.

## Thay đổi backend

`PayOsService.CreatePaymentLinkAsync` nhận diện phản hồi tạo link bị từ chối với mã `214`, trả lỗi HTTP 503 có `code = PAYOS_CHANNEL_UNAVAILABLE`, thông báo rõ kênh không tồn tại hoặc đang tạm dừng và hướng xử lý cấu hình.

`PaymentService` đánh dấu riêng lần tạo bị từ chối rõ ràng này là `Failed`, không ghi nhận tiền hoặc kích hoạt gói. Các kết quả không chắc chắn, lỗi mạng, phản hồi thiếu dữ liệu và mã lỗi khác tiếp tục giữ `Pending` theo quy trình đối soát hiện có. Không tự thay trạng thái payment `35` có trước, vì truy vấn trạng thái thất bại hiện tại không chứng minh kết quả tạo link trong quá khứ.

Test hồi quy tái hiện phản hồi `214` và lỗi thông báo trước khi sửa. Sau sửa, kiểm tra thêm phản hồi API đến frontend, trạng thái payment/invoice/subscription và bảo toàn `Pending` với lỗi chưa xác định.

Kiểm chứng sau sửa: **33/33 test payment liên quan đạt**, không bỏ qua ca nào. Bao gồm 5 ca mới cho lỗi tạo link và các ca có sẵn về chữ ký, đối soát, đồng bộ, chống trùng, dữ liệu biên nhận và thông báo. Lệnh chạy:

```powershell
dotnet test SportsCenterManagement.Tests/SportsCenterManagement.Tests.csproj --no-restore --filter 'FullyQualifiedName~PayOs|FullyQualifiedName~MemberCanSyncPaidPayOs|FullyQualifiedName~MemberCannotSyncAnotherMembersPayOs|FullyQualifiedName~SyncedPayment|FullyQualifiedName~LoginJwtMapsUserToMemberAndPreservesIdempotency|FullyQualifiedName~DifferentRetryKeyCannotReplacePendingPayment|FullyQualifiedName~OldPendingInvoice' -p:OutputPath=bin/PaymentValidation/ --logger trx
```

## Việc cần thực hiện ở PayOS

1. Mở [trang quản trị PayOS](https://my.payos.vn), kiểm tra kênh thanh toán tồn tại và đang hoạt động.
2. Kiểm tra `Client ID`, `API Key`, `Checksum Key` trong User Secrets thuộc cùng kênh đang hoạt động; cập nhật tại máy local nếu sai. Ba khóa được cấp theo kênh, theo [hướng dẫn PayOS](https://payos.vn/docs/checkout/quick-start-payos-hosted-page/).
3. Build và khởi động lại backend để nạp code/cấu hình mới. Đối soát payment cũ còn `Pending` trước khi tạo lần thanh toán thay thế.

Kênh PayOS cần chủ tài khoản kiểm tra; chưa thể xác nhận tạo link thật thành công khi API vẫn trả `214`.
