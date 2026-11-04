# Nội dung trang chủ và ảnh R2

Trang quản lý: `#/manager/home-content`. Manager/Admin quản lý nội dung chung của website.

## Lưu trữ

- File ảnh chỉ lưu tại Cloudflare R2; không còn SDK, service, cấu hình hay fallback Google Drive/local.
- Mỗi ảnh là một dòng trong `uploaded_media`: `Id`, `storage_key`, `file_name`, `mime_type`, `file_size`, `uploaded_by_user_id`, `created_at`. Index duy nhất trên `storage_key` ngăn trùng object.
- `system_settings`, khóa `site.landing-content`, chỉ giữ nội dung và các ID ảnh: `posterMediaId`, `mediaId`, `secondaryMediaId`, `imageMediaId`. Một ID có thể dùng ở nhiều vị trí.
- Không lưu binary/domain trong các bản ghi mới. `GET /api/landing-content` tra metadata bằng ID rồi ghép domain từ `R2Storage:PublicDomain` để trả các trường URL hiển thị tương thích frontend. `PUT` chuyển URL/key thành ID của một ảnh có thật; từ chối ảnh chưa đăng ký hoặc ID không tồn tại.
- Service `IR2StorageService.UploadImageAsync` chỉ trả relative key. API upload trả thêm `publicUrl` được tính tại runtime để xem trước.
- File mới mang tên UTC timestamp + GUID + phần mở rộng gốc đã chuẩn hóa. Tên do người dùng cung cấp không được dùng làm object key.
- Chỉ nhận JPG/JPEG/PNG/WEBP, tối đa 5 MiB; kiểm tra đuôi file, MIME và chữ ký nhị phân cả backend lẫn kiểm tra sơ bộ ở frontend.
- Avatar và ảnh hóa đơn vẫn dùng R2. Đăng nhập Google và Gemini không liên quan tới Google Drive, tiếp tục hoạt động như trước.

## API và cleanup

- `POST /api/r2-images/dashboard`: Manager/Admin, multipart field `file`.
- `DELETE /api/r2-images/dashboard?key=...`: chỉ nhận key hợp lệ trong prefix dashboard, trả 409 nếu ảnh còn được nội dung đã công bố tham chiếu.
- Sau khi lưu nội dung thành công, backend so sánh tập ID cũ/mới; xóa object và dòng metadata khi ảnh không còn được sử dụng. Khi hai mục dùng chung ảnh, xóa một mục không xóa ảnh mục kia.
- Khi hủy upload/bản nháp, frontend gọi cleanup cho ảnh tạm. Không xóa ảnh đang công bố trước khi lưu nội dung thay thế thành công.
- Cleanup R2 là thao tác sau khi commit DB. Lỗi xóa được ghi log với key để xử lý lại; chưa có worker tự quét/xóa nền. Các upload bị bỏ dở khi đóng trình duyệt đột ngột cần đối soát thủ công.
- `POST /api/media/upload`, `POST /api/r2-images/dashboard` đều tạo metadata qua cùng service. `GET /api/media/files` / `recent` trả thư viện để chọn lại ảnh. Các cột lịch sử `drive_file_id`, `file_url`, `web_view_link` được giữ để tương thích và không được dùng cho ảnh mới; key mới chỉ lưu trong `storage_key`.

## Chuyển dữ liệu cũ

Migration `AddMediaStorageKey` thêm cột/index, không xóa dữ liệu cũ. Khi backend khởi động, `LandingMediaBackfill` đọc các R2 key đang có trong landing, đọc metadata object R2, tạo một dòng cho mỗi key và đổi JSON sang ID trong cùng transaction. File R2 không bị upload lại hay thay đổi. Chạy lại không tạo trùng vì landing đã chuyển thành ID.

Xem ảnh trực tiếp trong DB:

```sql
SELECT "Id", storage_key, file_name, mime_type, file_size, uploaded_by_user_id, created_at
FROM uploaded_media
WHERE storage_key <> ''
ORDER BY "Id";
```

## Nhập bộ ảnh landing

23 ảnh nguồn được đối chiếu trực quan với 10 bộ môn/cơ sở vật chất. Hai cặp trùng là 4/19 (bóng đá) và 7/21 (yoga), dùng chung object; tổng cộng 21 object.

- Bơi: 14 (bộ môn), 1 và 22 (bể bơi).
- Cầu lông: 18 (bộ môn), 2 (sân).
- Bóng đá: 4/19 (bộ môn), 3 (sân).
- Yoga: 5 (bộ môn), 6 và 7/21 (không gian).
- Gym: 8 (bộ môn), 23 (phòng tập và banner/auth).
- Tennis: 9 (bộ môn), 11 (sân).
- Bóng rổ: 10 (bộ môn), 17 (sân).
- Bóng bàn: 15 (bộ môn), 16 (khu tập).
- Boxing: 20. Chạy bộ: 13. Tư vấn sức khỏe trong phần giới thiệu: 12.

Các thẻ là nội dung giới thiệu, không tự tạo lớp học, sân có thể đặt chỗ, giá, lịch hoặc sức chứa.

Script `Frontend/scripts/import-landing-r2.mjs` đọc ảnh đã tải trong `.validation/landing-import`, xác thực bằng cấu hình local, upload qua API và công bố. Báo cáo `r2-import.json` lưu mapping/hash để chạy tiếp khi gián đoạn; không chứa mật khẩu/token. Không chạy lại để ghi đè tùy chỉnh danh sách của biên tập viên.

## Kiểm chứng

```powershell
dotnet build Backend/Backend/SportsCenterManagement.API/SportsCenterManagement.API.csproj
node --test Frontend/tests/cloud-media.test.cjs Frontend/tests/landing-content.test.cjs
node Frontend/scripts/verify-landing-r2.mjs
```

Script verification đọc 21 object thật, so SHA256 với ảnh nguồn, kiểm tra định dạng/dung lượng, tên an toàn, bảo vệ ảnh dùng chung và xóa upload tạm do test tạo.
