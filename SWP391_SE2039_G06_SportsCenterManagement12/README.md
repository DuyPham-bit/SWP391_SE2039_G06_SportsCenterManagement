# Sports Center Management

Workspace gộp frontend React/Vite và backend ASP.NET Core/.NET 10 thành hai thư mục riêng:

- `Frontend/` — React 18, Vite, port `3004`.
- `Backend/` — repository backend ASP.NET Core Web API, SQL Server và EF Core.

## Chạy local

1. Cấu hình SQL Server LocalDB và các khóa ứng dụng theo hướng dẫn trong [Backend/Backend/README.md](./Backend/Backend/README.md). Backend cần `ConnectionStrings:SportsCenter` và `Jwt:Key` dài ít nhất 32 byte.
2. Chạy API từ thư mục workspace:

   ```powershell
   dotnet run --project .\Backend\Backend\SportsCenterManagement.API\SportsCenterManagement.API.csproj
   ```

   API dùng `http://localhost:54162` trong cấu hình launch profile.
3. Sao chép `Frontend/.env.example` thành `Frontend/.env.local` và đặt `VITE_SPORTS_CENTER_ID` thành ID trung tâm thực tế trong database; biến này bắt buộc khi đăng ký hội viên mới.
4. Cài và chạy giao diện:

   ```powershell
   cd .\Frontend
   npm ci
   npm run dev
   ```

## Dùng chung qua Internet

Muốn mọi máy nhìn thấy cùng tài khoản và dữ liệu, hãy triển khai một Frontend, một Backend API và một cơ sở dữ liệu SQL Server tập trung trên máy chủ có tên miền và HTTPS. Trình duyệt chỉ truy cập tên miền chung; không kết nối trực tiếp tới máy chủ database. Cấu hình máy chủ và các biến môi trường nằm trong [DEPLOYMENT.md](./DEPLOYMENT.md).

## Các luồng đã nối API

- Đăng nhập, đăng ký hội viên, hồ sơ, đổi mật khẩu và yêu cầu/đặt lại mật khẩu.
- Danh mục và quản lý gói tập; lịch ca tập và đặt/hủy chỗ.
- Flow 2: quản lý lớp/phòng, tạo lịch, công bố/hủy lớp, phân công HLV, danh sách chờ, lễ tân đặt/hủy hộ và HLV xem học viên/điểm danh qua API.
- Manager cấu hình quyền Member/Coach/Receptionist trong trung tâm; System Admin giữ ma trận quyền toàn hệ thống.
- Manager bổ nhiệm hội viên hiện có làm HLV/lễ tân, đổi vai trò có kiểm tra phân công lớp và xuất báo cáo CSV từ dữ liệu API.
- Tra cứu hội viên, thu tiền tại quầy bằng CASH/POS (cần mã chuẩn chi cho POS).
- Khởi tạo thanh toán online qua VNPay, MoMo hoặc PayOS; callback VNPay/MoMo được gửi về backend để xác minh.

Frontend gửi Bearer token, đọc lỗi Problem Details và `traceId`, đồng thời dùng `Idempotency-Key` cho thao tác thanh toán. Không dùng mock để giả lập các luồng trên.

## API mới và cấu hình Google/AI

Giáo án chung/cá nhân, tiến độ và thông báo HLV/hội viên đã nối API lưu SQL Server. Xác thực dùng JWT HS256 qua JwtBearer, kiểm tra issuer/audience/thời hạn và tài khoản ở mỗi request; Swagger có nút Authorize. Frontend giữ JWT và hồ sơ/quyền trong bộ nhớ riêng từng tab, không dùng Session đăng nhập hoặc browser storage. Các tab đăng nhập độc lập; F5 cần đăng nhập lại. Chi tiết: [cấu trúc JWT](./Frontend/docs/jwt-auth-fix.md).

Nếu chạy giao diện nhúng trong backend, chạy `npm.cmd run build:api` từ `Frontend/` trước khi chạy/publish backend. Lệnh này tạo lại `Backend/Backend/SportsCenterManagement.API/wwwroot` từ source frontend và thay các bundle cũ, tránh tiếp tục phục vụ bản lưu Session trước đây. Giao diện chạy bằng Vite dùng source frontend trực tiếp.

Google Login dùng ID token được xác minh ở backend. Chatbot/gợi ý giáo án dùng Gemini 2.5 Flash-Lite; cần Client ID và Gemini API key riêng. Xem [hướng dẫn thiết lập miễn phí cho môn học](./Backend/Backend/docs/requirements/free-google-gemini-setup.md). Khi thiếu cấu hình, API trả lỗi rõ ràng, không trả kết quả giả. Thanh toán online vẫn cần thông tin sandbox của cổng tương ứng. Module hỗ trợ thành viên chưa có giao diện/API trong phạm vi này.

Chi tiết tích hợp và kiểm chứng: [api-jwt-integration.md](./Backend/Backend/docs/requirements/api-jwt-integration.md). Chi tiết Flow 2 trước đó: [flow2-delivery.md](./Backend/Backend/docs/requirements/flow2-delivery.md).

## Kiểm tra

- Trợ lý AI hội viên nhận dữ liệu công khai mới từ database của đúng trung tâm ở mỗi câu hỏi: lịch lớp Published/Scheduled, gói Active và giá VND, sân/phòng Active, địa chỉ, số điện thoại/email trung tâm và giờ mở cửa. Backend chỉ chọn các trường được phép; không gửi hồ sơ hội viên/HLV, ghi chú nội bộ, danh sách đặt chỗ, thanh toán, báo cáo, cấu hình hoặc hội thoại người khác. Ngày/tháng, ngày ISO, ngày tương đối và câu hỏi tiếp nối được xử lý theo giờ Việt Nam; khoảng truy vấn tối đa 31 ngày, tối đa 200 buổi học. Chưa có danh mục sự kiện riêng hoặc giá thuê sân trong database thì AI phải nói rõ thiếu dữ liệu. Thông tin sân/liên hệ đang lưu riêng trong LocalStorage của trang chủ chưa tự đồng bộ vào database, nên không được coi là nguồn dữ liệu của AI.
- Kiểm tra dữ liệu và phân quyền AI: `dotnet test Backend/Backend/SportsCenterManagement.Tests/SportsCenterManagement.Tests.csproj --filter FullyQualifiedName~MemberAiContextTests` từ workspace root.
- Nhắc lịch ca học: backend tự kiểm tra mỗi 15 giây và gửi thông báo trong ứng dụng khi ca học đã xác nhận còn tối đa 1 tiếng trước giờ bắt đầu (giờ Việt Nam). Chuông thông báo và hộp thư tự tải lại mỗi 15 giây khi trang đang mở. Lịch bị hủy và ca đã bắt đầu không được nhắc; lời nhắc được lưu trong database để tránh gửi trùng sau khi khởi động lại. Đặt chỗ trong vòng 1 tiếng trước ca học sẽ nhận lời nhắc ở lần kiểm tra kế tiếp. Backend cần hoạt động để tạo lời nhắc; migration `AddClassReminderKey` được áp dụng qua luồng khởi động hiện có.
- Kiểm tra nhắc lịch backend: `dotnet test Backend/Backend/SportsCenterManagement.Tests/SportsCenterManagement.Tests.csproj --filter FullyQualifiedName~ClassReminderTests` từ workspace root.
- Frontend: `npm run build` trong `Frontend/`.
- Frontend regression: `npm test` trong `Frontend/`.
- Backend: `dotnet build SportsCenterManagement.API/SportsCenterManagement.API.csproj` từ `Backend/Backend/`.
- Backend regression: `dotnet run --project Backend/Backend/tests/Flow2.Regression/Flow2.Regression.csproj` từ workspace root.
- API/JWT/SQL Server/browser: `dotnet run --project Backend/Backend/tests/ApiIntegration.Regression/ApiIntegration.Regression.csproj -- --sql --browser` từ workspace root. Cần Chrome/Edge, frontend đã build và SQL Server LocalDB; mỗi lần chạy tạo database kiểm thử riêng.
