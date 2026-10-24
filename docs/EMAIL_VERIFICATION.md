# Xác thực email đăng ký và khôi phục mật khẩu

## Phạm vi và quyết định

- Yêu cầu: tài khoản tự đăng ký chỉ được tạo sau khi nhập OTP gửi tới email; reset mật khẩu cũng nhận OTP qua email.
- Giữ React/Vite, ASP.NET Core .NET 10, EF Core và SQL Server của monorepo hiện tại. Không đổi dữ liệu tài khoản cũ hoặc luồng tạo hội viên có nhân viên xác thực tại quầy.
- FE gửi `POST /api/auth/request-email-verification` với email, rồi `POST /api/auth/register` với dữ liệu hiện có và `emailOtp`. Sau đăng ký thành công, giữ hành vi đăng nhập hiện tại.
- BE lưu bảng `email_verification_tokens` riêng: email chuẩn hóa, hash OTP, hạn 10 phút, số lần sai, thời điểm đã dùng. OTP đăng ký không sử dụng được để reset và ngược lại.
- Tạo tài khoản và tiêu thụ OTP trong cùng transaction. Sai 5 lần khóa mã; gửi lại vô hiệu mã cũ; giới hạn IP và thời gian gửi lại theo email. Không tạo User/MemberProfile trước xác thực, không trả OTP qua API hoặc lưu mã trong inbox/log.
- Reset giữ API hiện có, thu hồi JWT và OTP cũ sau khi đổi mật khẩu; bỏ cơ chế trả mã Development và yêu cầu cấu hình gửi mail ở mọi môi trường.
- Gửi email bằng webhook HTTPS hiện có hoặc SMTP STARTTLS. Cấu hình bí mật chỉ ở backend. Khi chưa cấu hình hoặc gửi thất bại: trả 503, không báo gửi thành công.

## Kiểm chứng và vận hành

Dùng chương trình `Backend/Backend/verification/LogicAudit` với SQL Server LocalDB riêng và email gateway loopback; bổ sung ca đăng ký chưa xác thực, sai/hết hạn/replay/cấp lại OTP, token khác mục đích và gửi mail lỗi. Build FE/BE và chạy hồi quy FE. Chạy Chrome cho bước nhập OTP, thông báo lỗi và màn hình điện thoại. Gateway giả kiểm tra hợp đồng gửi mail, không chứng minh email đã tới hộp thư thật.

Rollback: trả code về phiên bản trước; bảng token mới có thể giữ lại, không cần xóa dữ liệu người dùng. Migration chỉ thêm bảng và chỉ mục, không thay trạng thái tài khoản hiện hữu.

## Bật gửi mail thật

Nếu giao diện báo **“Hiện chưa thể gửi email xác thực”**, API chưa nhận được SMTP Host/From hợp lệ hoặc WebhookUrl hợp lệ. Các ô cấu hình có sẵn trong source là mẫu trống, chưa phải hộp thư gửi thật.

Thiết lập nhanh trên Windows: mở PowerShell ở thư mục gốc dự án và chạy:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Backend\configure-email.ps1
```

Script hỏi SMTP host, email **gửi**, SMTP login và mật khẩu/app-password ở ô nhập ẩn. Không cần sửa source hoặc gửi bí mật qua chat. Script lưu SMTP vào .NET User Secrets qua stdin, giữ các secret khác và để trống email webhook để chọn SMTP. Script không gửi email và không khởi động lại backend. `ExecutionPolicy Bypass` chỉ áp dụng cho tiến trình chạy lệnh, không đổi chính sách PowerShell của máy.

Dùng Gmail: bật Xác minh 2 bước rồi [tạo mật khẩu ứng dụng](https://myaccount.google.com/apppasswords) cho SCMS và chạy script với `-SmtpHost smtp.gmail.com -SmtpUsername <gmail-gui>`. Nhập App Password thay vì mật khẩu đăng nhập. Nút đăng nhập Google trên form SCMS không tự cấp quyền gửi mail cho backend. Với SMTP khác, truyền `-SmtpHost smtp.example.com -SmtpPort 587 -SenderEmail sender@example.com -SmtpUsername <username>`.

Kiểm tra đã lưu đủ giá trị, chỉ in trạng thái và không hiện mật khẩu:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Backend\configure-email.ps1 -CheckOnly
```

Sau đó khởi động lại backend ở môi trường **Development** và thử lại form. User Secrets chỉ được nạp ở môi trường này theo cấu hình mặc định. Nếu chạy Production, dùng các biến môi trường bên dưới. File `.env.example` chỉ là mẫu, ASP.NET Core của dự án không tự nạp file `.env`.

Migration `20261020082633_AddEmailVerificationTokens` được áp dụng qua `DbInitializer` khi API khởi động như các migration hiện có. Nếu cập nhật thủ công, chạy trong `Backend/Backend`:

```powershell
dotnet ef database update --project SportsCenterManagement.DAL --startup-project SportsCenterManagement.API
```

Đặt các giá trị sau bằng User Secrets ở thư mục `Backend/Backend/SportsCenterManagement.API` khi chạy Development. Thay placeholder bằng cấu hình từ nhà cung cấp SMTP của bạn; `Password` là mật khẩu SMTP/mật khẩu ứng dụng nếu nhà cung cấp yêu cầu:

```powershell
dotnet user-secrets set "ExternalCommunications:Email:Smtp:Host" "<smtp-host>"
dotnet user-secrets set "ExternalCommunications:Email:Smtp:Port" "587"
dotnet user-secrets set "ExternalCommunications:Email:Smtp:EnableSsl" "true"
dotnet user-secrets set "ExternalCommunications:Email:Smtp:From" "<email-gui>"
dotnet user-secrets set "ExternalCommunications:Email:Smtp:Username" "<tai-khoan-smtp>"
dotnet user-secrets set "ExternalCommunications:Email:Smtp:Password" "<mat-khau-smtp>"
```

Ở Production, dùng biến môi trường cùng tên với `:` thay bằng `__`, ví dụ `ExternalCommunications__Email__Smtp__Password`. Không đưa cấu hình SMTP vào biến `VITE_*`. Khởi động lại API sau khi cấu hình. SMTP dùng STARTTLS, không phải TLS ngầm định cổng 465. Tắt TLS chỉ được hỗ trợ với máy chủ loopback để kiểm thử.

Nếu đã có gateway email, cấu hình `ExternalCommunications:Email:WebhookUrl` và `ExternalCommunications:Email:BearerToken`. Webhook hợp lệ được ưu tiên hơn SMTP, vì vậy để trống WebhookUrl khi dùng SMTP. Gateway nhận JSON `to`, `title`, `message`, `notificationType`, `createdAt`, `expiresAt` và header `Idempotency-Key`. Loại `EmailVerification` dùng khóa `email-verification-<id>`, loại `PasswordReset` dùng `password-reset-<id>`. Gateway cần chuyển nội dung này thành email. Trạng thái 2xx/SMTP accepted chứng minh nhà cung cấp đã nhận yêu cầu, chưa chứng minh thư vào inbox.

Nếu API đang phục vụ giao diện nhúng, chạy `npm.cmd run build:api` trong `Frontend` trước khi khởi động/publish để thay bundle. Vite dev dùng source trực tiếp.

## Kết quả xác minh ngày 20/10/2026

| Hạng mục | Lệnh | Kết quả |
| --- | --- | --- |
| Hồi quy frontend | `npm.cmd test` tại `Frontend` | 76/76 đạt |
| Build frontend | `npm.cmd run build` tại `Frontend` | Đạt; cảnh báo chunk lớn và circular chunk hiện có |
| Build API và runner | `dotnet build Backend/Backend/verification/LogicAudit/LogicAudit.csproj -o tmp/email-audit-runner --no-restore` | Đạt, 0 warning/error |
| API + SQL + webhook + SMTP | `dotnet tmp/email-audit-runner/LogicAudit.dll` | 67/67 đạt; tự xóa database kiểm thử |
| Chrome | `node tests/email-verification.browser.cjs` tại `Frontend` | 5 nhóm kiểm tra đạt; ảnh desktop/tablet/mobile và report ở `Frontend/tmp/email-verification` |

SMTP được kiểm chứng bằng máy chủ SMTP loopback thật nhận MIME, gồm nhận mã đăng ký và tạo account, nhận mã reset, từ chối gửi và vô hiệu token. Chưa kiểm chứng STARTTLS/SMTP AUTH với nhà cung cấp thật hoặc thư tới hộp thư thật; cần cấu hình riêng của chủ dự án. Chrome dùng API fixture; bằng chứng persistence/security đến từ runner SQL riêng. Các bước cần LocalDB/Chrome/esbuild đã chạy ngoài sandbox sau khi sandbox không cho truy cập đủ. Không có Stitch/SonarQube MCP trong phiên; dùng build, kiểm thử, xem diff và ảnh Chrome làm bằng chứng thay thế, không có báo cáo quality gate từ hai dịch vụ đó.

Target repository: `DuyPham-bit/SWP391_SE2039_G06_SportsCenterManagement` (monorepo), remote `https://github.com/DuyPham-bit/SWP391_SE2039_G06_SportsCenterManagement.git`, nhánh `feature/sync-tiya-coach-olympic-logo`. Chưa commit/push/deploy hoặc thay đổi database ứng dụng.
