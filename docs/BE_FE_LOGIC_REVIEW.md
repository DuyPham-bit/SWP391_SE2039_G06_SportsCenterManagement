# Rà soát logic BE/FE — 18/10/2026

Repository `SWP391_SE2039_G06_SportsCenterManagement`, nhánh `feature/update-frontend`. Giữ React/Vite, ASP.NET Core/.NET 10, EF Core và SQL Server. Migration mới chỉ thêm hai cột phục vụ thu hồi JWT và giới hạn thử OTP. Các sửa đổi dưới đây dựa trên luồng dữ liệu và ca tái hiện, không xác nhận hệ thống đã hết mọi lỗi.

| Lỗi | Nguyên nhân gốc | Sửa trực tiếp | Bằng chứng |
|---|---|---|---|
| Hủy hóa đơn của người khác/trung tâm khác | Bỏ qua kiểm tra khi không có MemberProfile; chỉ kiểm tra có StaffProfile | Service kiểm tra chủ sở hữu, role, permission, phân công trung tâm và chính sách thu hồi quyền | SQL và HTTP: trường hợp bị cấm, chủ hóa đơn hợp lệ và nhân viên đúng trung tâm |
| Hủy nhầm hội viên khi chỉ truyền packageId | Tự lấy hóa đơn chờ mới nhất của bất kỳ hội viên | Nhân viên phải chỉ định hội viên, kiểm tra quyền trước truy vấn đơn chờ | SQL/HTTP: thiếu hội viên bị từ chối |
| Mua lại có thể void hóa đơn đã thu một phần | Nhánh CancelPendingIfAny gọi hàm nội bộ bỏ qua kiểm tra payment thành công | Đưa kiểm tra trạng thái/số tiền đã thu vào hàm hủy chung, cùng transaction | Tái hiện trước sửa thất bại; sau sửa trả conflict |
| Đơn chờ lệch thời hạn và dư nợ | Đọc thời hạn gói hiện tại và tổng hóa đơn | Đọc snapshot subscription/invoice item; trừ khoản Succeeded | Gói đổi 90→180 ngày vẫn trả 90; hóa đơn 1.000.000 đã thu 250.000 còn 750.000 |
| Gói trên FE thay đổi theo đồng hồ máy | FE tự suy luận trạng thái hiệu lực | Dùng packageStatus từ members/me; BE bổ sung effectiveStatus cho lịch sử gói | Test đồng hồ FE năm 2030 vẫn giữ trạng thái BE; SQL/HTTP xác minh SCHEDULED |
| Member thấy lịch trung tâm khác; thiếu tên phòng | MEMBER không được scope center; DTO thiếu roomName | Dùng center từ JWT được DB cập nhật; bổ sung tên phòng theo session hoặc lớp | HTTP với token chứa role/center sai vẫn chỉ nhận dữ liệu trung tâm trong DB |
| Lệch ngày lịch, báo cáo tính ca đã hủy | Dùng ngày UTC ở FE; cộng cả session Cancelled | Dùng ngày Việt Nam; loại ca hủy khỏi công suất | Test ranh giới ngày UTC và công suất 20% |
| UI hiện dữ liệu tài khoản cũ sau đổi phiên | Chỉ bảo vệ phản hồi 401, chưa bảo vệ phản hồi thành công đến muộn | HTTP client kiểm tra authVersion sau đọc body và cả 204; giữ AbortError | Regression FE: phản hồi cũ bị AUTH_SUPERSEDED, 401 cũ không xóa phiên mới |
| Form reset gửi trùng, giữ dữ liệu cũ và nhận phản hồi của lần mở trước | State sống qua các lần đóng/mở, không hủy request; chỉ khóa nút submit | Mỗi lần mở có state riêng; AbortController và kiểm tra request hiện tại; khóa các trường/back khi chờ; chặn submit bằng ref đồng bộ; API client truyền signal, endpoint public không kèm JWT | Chrome tái hiện trước sửa gửi 2 request; sau sửa chỉ 1; đóng lúc xin OTP/xác nhận rồi mở lại không nhận phản hồi cũ, lỗi 503 vẫn thử lại được |
| Quyền FE khác BE | localStorage ghi đè capability, UI báo lưu quyền cá nhân dù BE không hỗ trợ | Bỏ UI và persistence quyền cá nhân; lấy capability từ API; lỗi tải ma trận được hiển thị | Regression FE và Chrome: lưu quyền vai trò qua PUT API, không còn tab quyền từng người |
| SystemAdmin gọi sai API audit | FE chỉ nhận diện ADMIN | SYSTEMADMIN dùng admin/audit-logs | Regression FE với tài khoản không có center |
| KPI/thu nhập HLV tính ca tương lai | Đếm mọi ca trong tháng chưa hủy | Chỉ đếm ca đã kết thúc theo giờ Việt Nam | SQL với thời gian cố định: ca đã qua tính 1, ca tương lai không tính |
| Trùng lịch HLV qua nửa đêm, ca Declined vẫn chiếm chỗ | So sánh giờ trong cùng ngày; lọc trạng thái quá rộng | So sánh đầy đủ ngày/giờ, chỉ giữ ca Confirmed/PendingMemberConfirmation | SQL: ca 23:00–01:00 trùng ca ngày sau bị từ chối; Declined giải phóng chỗ |
| Lịch hủy chuyển thành Completed, cạnh tranh tạo lịch/nghỉ phép | Thiếu kiểm tra chuyển trạng thái và transaction bao trùm | Kiểm tra trạng thái cuối/thời điểm; Serializable cho tạo/đổi lịch, yêu cầu/duyệt nghỉ và thông báo liên quan | SQL: cấm hồi sinh ca hủy; hai request đồng thời chỉ commit một lịch/đơn nghỉ |
| Doanh số HLV gắn subscription trung tâm khác | Khi thiếu memberId, chỉ kiểm tra subscription tồn tại | Kiểm tra member và package cùng trung tâm; suy ra memberId từ DB | SQL: subscription khác trung tâm bị từ chối |
| Báo cáo bỏ sót booking theo buổi, phân bổ sai doanh thu bộ môn | Chỉ truy vấn ClassEnrollment | Thêm SessionBooking vào số đếm và nguồn truy vết subscription→sport, khử trùng sport | SQL: booking được đếm; khoản thu 1.000.000 được phân bổ, 250.000 còn chưa phân bổ |
| Báo cáo coi gói Pending/Scheduled là hết hạn, tính giá đăng ký thành doanh thu | Lấy mọi member chưa có gói hiện hành làm expired; cộng giá subscription theo CreatedAt | Kiểm tra ngày hết hạn thực; số bán theo invoice PaidAt, doanh thu theo payment/refund thành công và kỳ xử lý | SQL: pending không thành sale; thu một phần ghi đúng 250.000; refund kỳ sau chỉ trừ kỳ sau |
| Báo cáo lỗi API vẫn hiện dữ liệu rỗng như thành công | catch trả [] cho nguồn phòng/lớp | Truyền lỗi về UI; dùng đúng roomType/locationDescription | Regression FE: nguồn phòng lỗi làm report thất bại |
| Reset mật khẩu production báo gửi OTP dù không gửi | Controller chưa có bộ gửi email | Gửi qua gateway Email theo contract ExternalCommunications hiện có; 503 khi thiếu cấu hình/gateway lỗi, vô hiệu OTP gửi thất bại; FE dùng thông báo BE | HTTP production với gateway localhost: gửi đúng địa chỉ, không trả OTP; thiếu gateway không tạo token, gateway lỗi trả 503 |
| OTP có thể thử liên tục, dùng lại hoặc cạnh tranh reset | Không đếm số lần sai và chưa giới hạn request | Tối đa 5 lần sai/token trong DB; 10 request/phút/IP dùng chung hai endpoint; Serializable; OTP hết hạn/dùng rồi bị từ chối | HTTP: malformed, sai 5 lần, hết hạn, cấp lại, replay, 429 và hai reset đồng thời chỉ một lần đổi thành công |
| JWT/OTP cũ còn hiệu lực sau đổi mật khẩu | JWT không có phiên bản bảo mật gắn trạng thái tài khoản; chưa hủy mã reset cũ | Thêm users.auth_version, so với DB trên mỗi xác thực; tăng version và hủy OTP trong transaction đổi/reset mật khẩu | HTTP: JWT cũ 401, JWT mới dùng được; OTP cấp trước đổi mật khẩu bị từ chối |
| Mật khẩu dài bị lệch giữa đăng ký và đổi/reset | DTO nhận tối đa 128 ký tự, nhưng hai endpoint dùng BCrypt giới hạn 72 byte; BE/FE khác quy tắc ký tự | Đổi/reset dùng PasswordHashing PBKDF2 sẵn có; vẫn xác minh hash cũ; BE thống nhất ASCII với FE | HTTP: mật khẩu 128 ký tự đổi được, mật khẩu chung 72 ký tự đầu nhưng khác đuôi không khớp; mật khẩu yếu/ngoài ASCII bị từ chối |
| Khóa bí mật được lưu trong file Git theo dõi | appsettings và credentials.json chứa khóa thật | Di chuyển giá trị cục bộ sang .NET user-secrets/file credentials.local.json được ignore; xóa private key khỏi template; loại file cục bộ khỏi publish | Regression kiểm tra cấu hình; kiểm tra artifact publish; không in giá trị khóa trong ca kiểm tra |
| Dependency có advisory và API Google bị deprecated | Pkcs bắc cầu 9.0.11; dùng GoogleCredential.FromFile | Pin Pkcs 9.0.21; dùng CredentialFactory với loại ServiceAccount tường minh | Build BE 0 warning/0 error; NuGet audit không báo gói dễ tổn thương theo nguồn hiện tại |

Đã chạy trên trạng thái sau sửa:

| Lệnh | Kết quả |
|---|---|
| `npm.cmd test` tại Frontend | **62/62 đạt**, exit 0; có warning Node MODULE_TYPELESS_PACKAGE_JSON ở hai module HLV hiện có |
| `npm.cmd run build` tại Frontend | **Đạt**, exit 0 |
| `npm.cmd run build:api` tại Frontend | **Đạt**, tạo lại wwwroot từ source FE |
| `npm.cmd run test:manager:browser` tại Frontend | **13/13 kiểm tra Chrome headless đạt**, desktop 1280×800/mobile 375×812; gồm form reset và các màn manager, dùng API fixture cục bộ |
| `dotnet build Backend/Backend/SportsCenterManagement.API/SportsCenterManagement.API.csproj --no-restore -o tmp/audit-api -v quiet` | **Đạt**, exit 0 |
| `dotnet build Backend/Backend/verification/LogicAudit/LogicAudit.csproj --no-restore -o tmp/logic-audit-runner -v quiet` | **Đạt**, 0 warning/0 error, exit 0; biên dịch cả API/BLL/DAL |
| `dotnet tmp/logic-audit-runner/LogicAudit.dll` | **51/51 đạt**, exit 0: service/SQL Server thật, HTTP/controller/JWT thật, có request đồng thời, cổng Email giả và hủy request đang gửi Email; database tách biệt tự xóa |
| `dotnet publish Backend/Backend/SportsCenterManagement.API/SportsCenterManagement.API.csproj --no-restore -c Audit -o tmp/audit-reset-publish -v quiet` | **Đạt**, exit 0; artifact cục bộ dùng FE vừa build; đối chiếu SHA-256 các file FE và loại trừ private credential |
| `dotnet list Backend/Backend/SportsCenterManagement.API/SportsCenterManagement.API.csproj package --vulnerable --include-transitive` | **Đạt**, exit 0; nguồn NuGet hiện tại không báo gói dễ tổn thương |
| `git diff --check` | **Đạt**; chỉ có thông báo Git sẽ chuẩn hóa LF/CRLF |

Chương trình hồi quy được lưu ở [verification/LogicAudit](../Backend/Backend/verification/LogicAudit/README.md), không thêm vào solution production và không khôi phục bộ test BE đã xóa. Chrome dùng fixture chỉ chứng minh hành vi FE; các ca SQL/HTTP riêng chứng minh các điểm tích hợp BE được liệt kê, chưa chứng minh toàn bộ hành trình FE→BE production. Có ca tái hiện lỗi trước sửa cho thanh toán, trạng thái gói/đồng hồ, phản hồi muộn, local permission override, lịch/KPI HLV và báo cáo.

Migration `20261018064013_AddAccountSecurityState` thêm `users.auth_version` và `password_reset_tokens.failed_attempts`, mặc định 0 cho dữ liệu cũ. Bộ kiểm chứng áp dụng đầy đủ chuỗi migration lên DB trống đến `20261016175228_AddCoachProfessionalWorkspace`, chèn tài khoản trước nâng cấp rồi áp dụng migration mới và xác minh dữ liệu được giữ.

Theo yêu cầu tiếp tục sửa trực tiếp, đã xác minh cấu hình ứng dụng trỏ SQL Server trên chính máy này (`Server=.`), DB `SportsCenterManagement`, Windows Authentication. Đã áp dụng migration mới bằng `dotnet ef database update 20261018064013_AddAccountSecurityState --configuration Audit --no-build` với project/startup-project và connection chỉ rõ DB cục bộ. EF chỉ chạy hai ALTER TABLE ADD và ghi lịch sử migration. SQL hậu kiểm: vẫn 15 tài khoản, cả hai cột có kiểu int, auth_version của các tài khoản hiện có bằng 0, không có dòng OTP có failed_attempts sai mặc định. Không reset database hoặc sửa mật khẩu/tài khoản. Đã build FE mới vào wwwroot; BE cần chạy từ source/binary mới để dùng toàn bộ sửa đổi.

Development tiếp tục dùng UserSecretsId hiện có; giá trị cục bộ đã được bảo toàn, không ghi vào tài liệu. Production cần biến môi trường hoặc secret store, gồm ConnectionStrings__SportsCenter, Jwt__Key và các provider đã bật. Xem [cấu hình mẫu](../Backend/Backend/.env.example) cho gateway Email và đường dẫn credential. File `.env.example` chỉ là mẫu tên biến, không tự được .NET nạp.

Khóa Google/OAuth từng nằm trong source/lịch sử Git và đã xuất hiện trong đầu ra công cụ ở một lượt đọc cấu hình trước khi loại bỏ. Xóa khỏi file hiện tại không thu hồi được khóa; chủ tài khoản cần thay mới các khóa/token đó. Phiên này chưa rotate/revoke khóa và chưa sửa lịch sử Git.

Giới hạn và phần chưa xác minh:

- Chưa chạy cổng VNPay/MoMo thật, Google/AI, gửi email/SMS/Push thật, dữ liệu production hoặc toàn bộ tổ hợp E2E. Email reset đã kiểm tra bằng gateway HTTP loopback giả; việc gateway thật chuyển tiếp đến hộp thư chưa được xác minh.
- Kiểm chứng migration trên DB SQL Server tách biệt và schema liền trước; đồng thời đã nâng schema DB ứng dụng cục bộ như ghi ở trên. Chưa kiểm chứng mọi bản schema legacy hoặc backup dữ liệu production; không thay nội dung tài khoản/nghiệp vụ.
- Báo cáo trạng thái booking theo kỳ dùng BookedAt và trạng thái hiện tại; chưa có lịch sử đầy đủ mọi lần chuyển trạng thái để tái dựng báo cáo tại một thời điểm quá khứ.
- Frontend chưa có script lint/typecheck riêng trong package.json; chưa chạy các kiểm tra đó. Không có bằng chứng SonarQube hay bao phủ toàn bộ codebase.
- Build BE vào output riêng vì build mặc định ban đầu lỗi MSB3021/MSB3027 do DLL đang được tiến trình khác sử dụng. Vite trong sandbox ban đầu bị chặn đọc thư mục cha; build ngoài sandbox đã đạt.
- Các thay đổi UI đồng thời ở AI popup, sidebar/dashboard, landing page, favicon và CSS được giữ nguyên, không tính là phần sửa logic của đợt rà soát này.

Contract bổ sung `effectiveStatus` và `roomName` tương thích với FE cũ. Khi triển khai riêng, cập nhật BE/schema trước FE mới. Không commit/push/release trong đợt này. Migration Down xóa hai cột bảo mật; rollback làm mất bộ đếm/phiên bản thu hồi, nên không coi rollback schema là thao tác giữ nguyên trạng thái bảo mật.

Nguồn đối chiếu dependency: [advisory Pkcs GHSA-2fmv-rv2c-59x7](https://github.com/dotnet/runtime/security/advisories/GHSA-2fmv-rv2c-59x7), [GHSA-846f-f764-76mx](https://github.com/dotnet/runtime/security/advisories/GHSA-846f-f764-76mx); API [Google CredentialFactory](https://docs.cloud.google.com/dotnet/docs/reference/Google.Apis/latest/Google.Apis.Auth.OAuth2.CredentialFactory).
