# Quản lý nội dung trang chủ và đa phương tiện

Trang quản lý: `#/manager/home-content`. Manager, Admin và SystemAdmin có thể quản lý nội dung và thư viện ảnh. Đây là nội dung của website chung, không phải nội dung riêng theo từng trung tâm.

## Lưu và xem trước

- `GET /api/landing-content`: công khai, trả `{ content, updatedAt }`. Khi chưa có dữ liệu, `content` là `null` và giao diện dùng mẫu mặc định.
- `PUT /api/landing-content`: yêu cầu JWT có vai trò quản lý; body là `{ content: { heroBanner, whyUs, coursesSection, facilitiesSection, zonesLayout, ctaAndFooter } }`.
- Nội dung lưu trong bảng `system_settings`, khóa `site.landing-content`, kèm người sửa và thời điểm sửa. Không cần thêm bảng hoặc migration.
- Trang chủ đọc dữ liệu từ API, tự làm mới mỗi 15 giây khi đang hiển thị, khi lấy lại focus và khi tab khác báo có thay đổi.
- Bản nháp trong trang quản lý không bị thay thế bởi cập nhật nền. Chỉ sau khi API xác nhận lưu thành công, giao diện mới bỏ trạng thái chưa lưu.
- Xem trước mở tab riêng bằng SessionStorage của tab đó; không ghi nội dung vào API hoặc LocalStorage công khai. Tab xem trước không đồng bộ nội dung đã công bố đè lên bản nháp.
- Khôi phục mặc định lưu một bản sao độc lập của mẫu qua API. Nếu lưu lỗi, giữ nguyên bản nháp và báo lỗi.
- Khi database chưa có nội dung nhưng trình duyệt còn dữ liệu cũ trong `SCMS_DYNAMIC_LANDING_CONTENT_V1`, trang quản lý tải dữ liệu cũ thành bản nháp. Bấm **Lưu Toàn Bộ Thay Đổi** để công bố. Trang chủ công khai không dùng dữ liệu cũ này.

## Thư viện ảnh

Các endpoint `POST /api/media/upload`, `GET /api/media/drive-files`, `GET /api/media/status`, `GET /api/media/recent` đều yêu cầu JWT với vai trò Manager/Admin/SystemAdmin.

Upload hỗ trợ PNG, JPG/JPEG, WEBP, GIF, AVIF, tối đa 15 MiB. Backend đối chiếu phần mở rộng, MIME và chữ ký nhị phân; AVIF được nhận diện bằng các brand `avif`/`avis` trong ISO-BMFF FileTypeBox. Từ chối SVG, HTML và nội dung giả mạo. Đường dẫn `/uploads` chỉ phục vụ các phần mở rộng ảnh được hỗ trợ, kèm `X-Content-Type-Options: nosniff`.

Google Drive sử dụng cấu hình hiện có. Danh sách được đọc đủ các trang trước khi cập nhật database. Ảnh có phần mở rộng được hỗ trợ vẫn xuất hiện khi Drive ghi MIME chung `application/octet-stream` hoặc thiếu MIME; metadata trả về được chuẩn hóa theo phần mở rộng. Khi Drive lỗi hoặc trả kết quả chưa đầy đủ, hệ thống trả thư viện đã lưu và giữ nguyên metadata. Sau lần đọc thành công, ảnh không còn trên Drive được ẩn khỏi thư viện nhưng metadata vẫn được giữ để phục hồi/đối chiếu.

Ảnh local mới được lưu mặc định tại `SportsCenterManagement.API/App_Data/media/uploads`, phục vụ qua `/uploads/...`. Có thể đặt `GoogleDrive:LocalStoragePath` thành đường dẫn tuyệt đối hoặc tương đối với thư mục API. Thư mục này nằm ngoài `wwwroot`, tránh bị lệnh `build:api` làm sạch. Khi triển khai, cần giữ thư mục dữ liệu này trên ổ lưu trữ bền vững.

Ảnh local cũ trong `wwwroot/uploads` vẫn được phục vụ nếu thuộc định dạng được hỗ trợ. Các tệp cũ không được tự di chuyển hoặc xóa; sao lưu chúng trước khi chạy lệnh làm sạch `wwwroot`.

## Kiểm thử

```powershell
# Từ Frontend/
npm.cmd test
npm.cmd run build
npm.cmd run test:landing:browser

# Từ workspace root
dotnet test Backend/Backend/SportsCenterManagement.Tests/SportsCenterManagement.Tests.csproj --filter "FullyQualifiedName~HomeContentIntegrationTests|FullyQualifiedName~MediaStorageTests"
```

Kiểm thử trình duyệt dùng Chrome headless và API fixture riêng. Kiểm thử backend dùng database SQLite/InMemory riêng và HTTP giả lập tại ranh giới Google Drive, không tải ảnh lên tài khoản Drive thật.
