# JWT và đăng nhập nhiều tab — cập nhật 16/10/2026

Yêu cầu: dùng JWT thay Session cho toàn bộ xác thực của project, đồng thời đăng nhập nhiều tài khoản ở các tab cùng trình duyệt mà không ghi đè nhau.

## Thiết kế hiện tại

- API ASP.NET Core đã dùng JWT Bearer, không có `AddSession`, `UseSession`, `HttpContext.Session` hoặc cookie đăng nhập. Giữ cấu hình JWT/RBAC hiện có; xác thực chữ ký, issuer, audience, thuật toán và thời hạn, sau đó kiểm tra tài khoản/quyền/trung tâm trong SQL Server.
- `http.js` giữ JWT trong biến riêng của document, đồng thời lưu vào sessionStorage của tab bằng khóa `scms.auth.token.v1`, và gửi `Authorization: Bearer <JWT>`. Không lưu JWT vào localStorage, cookie hoặc URL. Token hết hạn/sai định dạng không được khôi phục.
- `AuthContext.jsx` không còn đọc/ghi `SCMS_AUTH_SESSION`. `backendApi.js` lấy hồ sơ và capability từ API xác thực, cập nhật `authState.js` trong bộ nhớ. Các adapter chọn trung tâm/endpoint và `permissions.js` dùng thông tin này.
- Login mật khẩu, Google login, đăng ký rồi login và đổi mật khẩu dùng chung helper JWT; logout và HTTP 401 của token hiện tại xóa JWT/hồ sơ/quyền trong tab đó. HTTP 401 của request dùng JWT cũ không được xóa JWT mới.
- Mỗi tab giữ số phiên bản xác thực trong bộ nhớ. Bắt đầu đăng nhập/đăng ký/đổi mật khẩu, thay JWT hoặc logout làm mất hiệu lực thao tác cũ. Phản hồi cũ không được cài JWT, khôi phục hồ sơ, cập nhật React hoặc xóa JWT mới; HTTP 401 cũ cũng không được hủy lần đăng nhập mới đang chờ. Hồ sơ API chỉ được áp dụng vào giao diện khi còn đúng phiên bản và đúng đối tượng đã xác thực.
- F5 khôi phục JWT còn hạn rồi tải lại hồ sơ/quyền từ backend trước khi hiển thị route được bảo vệ. Mỗi tab quản lý đăng nhập riêng; tab mở qua opener hoặc Duplicate Tab có thể nhận bản sao sessionStorage ban đầu theo hành vi trình duyệt. Ghi nhớ email vẫn là tùy chọn riêng.
- Các đối tượng `ClassSession`, `SessionBookingService`, endpoint `class-sessions`/`session-bookings` là buổi tập và đặt chỗ; không thuộc Session đăng nhập.

Không đổi stack React/Vite + .NET/EF Core/SQL Server, schema, migration, connection string hoặc `.env.local`. Giữ các thay đổi thông báo đã có.

## Phạm vi cấu trúc JWT

| Thành phần | Trách nhiệm xác thực hiện tại |
|---|---|
| API `Program.cs` | JWT Bearer là authentication scheme; các endpoint không cho phép anonymous yêu cầu tài khoản đã xác thực |
| `AuthController`, `GoogleAuthController`, `JwtTokenIssuer` | Kiểm tra thông tin đăng nhập/Google credential và phát JWT có chữ ký, thời hạn, user/role/center |
| `JwtAccountValidator`, authorization policies, `FlowControllerBase` | Kiểm chứng JWT, trạng thái tài khoản, quyền và phạm vi; lấy danh tính từ claims đã xác thực |
| `http.js`, `backendApi.js` | JWT trong bộ nhớ/sessionStorage từng tab, gắn Bearer header, tải lại hồ sơ/quyền từ API, xóa JWT khi logout/401 |
| `AuthContext.jsx`, `authState.js`, `permissions.js` | Trạng thái và điều hướng của giao diện dựa trên hồ sơ API; không khôi phục Session từ browser storage |
| `Frontend/dist`, API `wwwroot` | Cùng build từ source JWT hiện tại; frontend nhúng không tiếp tục chạy bundle Session cũ |

Rà soát toàn project không tìm thấy Session đăng nhập ở API, BLL, DTO xác thực hoặc database entities. `sessionStorage` trong bài mẫu `FontMau.txt` là cache emoji của trang tham khảo, không được frontend hiện tại sử dụng. Các test còn ghi dữ liệu theo key cũ để chứng minh ứng dụng bỏ qua chúng.

Phát hiện bổ sung: `wwwroot/index.html` trước đây còn trỏ đến `index-DY7i1vTn.js` có `SCMS_AUTH_SESSION` và event hết hạn cũ. Đã build lại thư mục này; script `build:api` thêm `--emptyOutDir` để thay các bundle build cũ mỗi lần chạy. `wwwroot` đã được xác minh chỉ chứa đầu ra build, tài nguyên nguồn nằm trong `Frontend/public/`. Tài liệu README ở workspace/BE, hướng dẫn triển khai và Flow 1 đã đồng bộ.

## Kiểm chứng

Regression đã tái hiện lỗi đọc trung tâm/quyền từ hồ sơ Session cũ dù API vừa xác thực JWT của tài khoản khác; sau sửa endpoint và quyền lấy đúng theo API. Kiểm tra thêm JWT/role/center riêng từng tab, logout/401 riêng từng tab, không phụ thuộc browser storage, reload không khôi phục đăng nhập.

Đợt triển khai sau báo cáo đã tái hiện bằng promise điều khiển thứ tự: lỗi tải hồ sơ của lần login cũ xóa JWT mới; GET hồ sơ trả về sau logout vẫn trả user; token login/đổi mật khẩu về muộn ghi đè trạng thái; đăng ký hoàn tất sau logout tự login. Đã thêm chặn theo phiên bản và regression cho các trường hợp này, gồm Google login, hai login trả về đảo thứ tự, PATCH hồ sơ khi đổi tài khoản và hồ sơ hoàn tất trước khi React áp dụng. Kiểm tra đổi mật khẩu thành công xác nhận JWT mới và hồ sơ vẫn được cập nhật.

API regression kiểm tra JWT sai chữ ký/issuer/audience/thuật toán/hết hạn, từ chối opaque token cũ, từ chối request thiếu JWT, không tạo cookie khi login và client mới không lưu cookie vẫn dùng JWT truy cập đúng tài khoản.

Browser regression dùng Chrome/CDP thực tế của project, hai tab chung profile và origin. Quan sát Bearer header của từng tab để xác minh lại qua API; không xuất JWT/mật khẩu vào report. Khi kiểm tra 401, proxy của test thay Bearer header của riêng tài khoản Member bằng token sai để backend thực tế từ chối. Kiểm tra F5 cần login lại, tab kia vẫn giữ tài khoản; logout/401 không lan sang tab kia.

Ca trình duyệt bổ sung giữ body phản hồi GET hồ sơ Manager thật sau khi lưu, logout rồi login Member trong cùng tab trước khi thả body. Xác minh header và API vẫn thuộc Member; phản hồi cũ bị từ chối rõ ràng. Proxy gửi header `Cache-Control: no-store` cho riêng phản hồi đang giữ để Chrome không xếp GET hồ sơ tiếp theo chờ cache của cùng URL. Đã xác minh độc lập bằng Chrome/server nội bộ: giữ toàn bộ phản hồi làm request thứ hai chờ; gửi header no-store trước body cho phép hai request chạy đồng thời. Không thay đổi cache hoặc nội dung API production cho ca này.

Trong lần chạy đầu, F5 tab Member tái hiện màn hình khung trống: `ProtectedRoute` đổi hash về login trước khi `AppRouter` đăng ký listener, nên router có thể bỏ lỡ sự kiện. Đã đồng bộ lại URL ngay sau khi đăng ký listener, giữ quy tắc đường dẫn `/payment-result` hiện có. Regression trình duyệt tải lại ba lần cho mỗi tài khoản Manager/Member và yêu cầu luôn hiện lại form đăng nhập.

Lệnh từ `Frontend/`:

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run build:api
node --test tests/jwt-auth.test.cjs
node --check tests/browser-smoke.cjs
git diff --check
```

Build và chạy API regression từ workspace root:

```powershell
dotnet build --no-restore Backend/Backend/tests/ApiIntegration.Regression/ApiIntegration.Regression.csproj
$env:SCMS_TEST_WEB_ROOT = 'C:\Users\LENOVO\Downloads\New folder\Backend\Backend\SportsCenterManagement.API\wwwroot'
dotnet run --no-build --no-restore --project Backend/Backend/tests/ApiIntegration.Regression/ApiIntegration.Regression.csproj -- --sql --browser
```

Bản frontend nhúng cho browser test ở API `wwwroot`, build với `VITE_GOOGLE_CLIENT_ID` rỗng và `VITE_API_BASE_URL=/api` trong môi trường tiến trình build. Report/ảnh ở `.validation/browser/`; log API ở `.validation/api-integration-runtime.log`.

Kết quả đợt triển khai cuối: 60/60 frontend regression đạt, gồm 17 kiểm tra JWT/trạng thái từng tab. `npm.cmd run build` và `npm.cmd run build:api` đạt. Build API regression đạt, 0 warning/error. Kiểm thử trực tiếp frontend nhúng tại API `wwwroot` đạt 183 kiểm tra API/SQL (gồm kiểm tra tổng hợp browser) trên database riêng `SCMS_ApiIntegration_Test_4c1cf491f2bc4cf58ce5432fd7aa2172`. Chrome đạt 46/46 kiểm tra, mảng JavaScript exception rỗng và không có HTTP lỗi ngoài các ca cố ý kiểm tra. Các luồng thông báo sửa trước đó tiếp tục đạt.

Sau kiểm chứng, đã build lại `Frontend/dist` và API `wwwroot` theo cấu hình local hiện có; cùng bundle `index-D-MCK5YK.js`. Bản nhúng chỉ còn một bundle JavaScript, không chứa key hồ sơ/token đăng nhập cũ, event hết hạn cũ hoặc sessionStorage. Tài nguyên public được sao chép đủ. Cú pháp browser runner và diff check đạt.

## Áp dụng và phạm vi

- FE: `SWP391_SE2039_G06_SportsCenterManagement_FE`, nhánh `feature/fe-fixes-and-support`, remote `https://github.com/DuyPham-bit/SWP391_SE2039_G06_SportsCenterManagement_FE.git`.
- BE: `SWP391_SE2039_G06_SportsCenterManagement_BE`, nhánh `feature/be-fixes-and-support`, remote `https://github.com/DuyPham-bit/SWP391_SE2039_G06_SportsCenterManagement_BE.git`. Chỉ bổ sung kiểm chứng JWT, phần xác thực production đã dùng JWT.
- Chưa commit, push hoặc deploy. Áp dụng bằng bản frontend mới, đăng nhập từng tab. Rollback bằng bản frontend trước thay đổi; không cần rollback database.
- JWT chỉ nằm trong bộ nhớ: F5 cần đăng nhập lại. Chưa bổ sung refresh token hoặc thu hồi JWT phía server; logout xóa đăng nhập trong tab, không thu hồi bản sao JWT còn hạn ở nơi khác.
- Nếu chạy API kèm giao diện: build `npm.cmd run build:api` trước khi chạy hoặc publish backend. Nếu chạy Vite: source JWT được dùng trực tiếp. Bản nhúng được kiểm thử với Google Client ID rỗng theo fixture của browser runner, sau đó build lại theo cấu hình local sẵn có; `.env.local` không bị sửa.
- Cảnh báo build có sẵn: Vite CJS và bundle lớn hơn 500 kB. Kiểm chứng browser dùng Chrome/CDP, không tuyên bố đã chạy Playwright/SonarQube MCP.
