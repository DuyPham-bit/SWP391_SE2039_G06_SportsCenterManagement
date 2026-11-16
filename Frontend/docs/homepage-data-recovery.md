# Khôi phục hiển thị nội dung trang chủ — 20/10/2026

Người dùng xác nhận phần bị mất là ảnh, nội dung và bộ môn tại `http://localhost:3004/#/`.

## Nguyên nhân và phạm vi

`GET /api/landing-content` vẫn trả đủ 9 bộ môn và 9 cụm sân/phòng, kèm ảnh, mô tả, số liệu, giá tham khảo, thông tin HLV và liên hệ đã công bố. Không có bằng chứng các nội dung này bị xóa.

Giao diện đã chuyển sang dựng toàn bộ danh mục từ public catalog nghiệp vụ, chỉ có 5 bộ môn và 5 phòng/sân. ID của public catalog là số, còn ID trong CMS là các chuỗi như `boi-loi`, `room-01`. Ghép ảnh bằng ID giữa hai danh mục không khớp khiến ảnh trắng và các mục CMS không xuất hiện. Mã giao diện cũng ghi đè số liệu/liên hệ, bỏ các nhãn đã lưu và thay giá/HLV bằng văn bản chung.

Quyết định: khôi phục cách hiển thị nội dung CMS đã công bố trong SQL thông qua API hiện có. Giữ nguyên React/Vite, .NET và SQL Server; không cần reset/restore database hoặc hoàn tác toàn bộ các thay đổi khác trong workspace.

## Bản sửa

- `landingPresentation.js` giữ nguyên danh sách, thứ tự, ID, ảnh và quan hệ bộ môn–sân/phòng đã lưu. Public catalog chỉ cung cấp danh sách khi phần danh mục CMS tương ứng chưa có mục nào.
- Trang chủ và phần cơ sở vật chất dùng cùng nguồn hiển thị này; giữ số liệu, nhãn, giá/HLV/đánh giá và liên hệ đã biên tập.
- Trình quản lý ảnh hiển thị các mục CMS đã lưu. Đổi ảnh hoặc ẩn/hiện giữ thứ tự và toàn bộ trường khác. Khi chưa có danh mục CMS, chỉnh một mục trong catalog vẫn giữ các mục còn lại.
- Sửa giá trị `className` lỗi trong tab ảnh chi tiết; cửa sổ chi tiết giữ thông số, ảnh và liên hệ đã công bố.
- Không sửa backend, connection string, schema hoặc dữ liệu đã công bố. Không thêm danh mục mẫu vào mã nguồn.

## Sao lưu và hoàn tác

Trước khi sửa, đã lưu nguyên phản hồi API cùng các file giao diện liên quan tại `tmp/data-recovery-20261020/`. Các file `landing-content-before.json` và `catalog-before.json` là bản sao chỉ đọc của dữ liệu công khai. Các file `*.before.jsx` và `*.before.js` giữ trạng thái mã ngay trước lần xử lý này, bao gồm các thay đổi chưa commit có sẵn.

Không dùng `git reset`/`git restore` toàn bộ workspace để hoàn tác: workspace có nhiều thay đổi khác của người dùng. Nếu cần hoàn tác riêng bản sửa này, đối chiếu các bản `*.before.*` với file tương ứng; database không cần rollback.

## Kiểm chứng

- `npm.cmd test`: 71/71 đạt, gồm giữ nguyên nội dung CMS khi catalog khác ID/không khả dụng, fallback danh mục thật khi chưa cấu hình và chỉnh ảnh không mất trường/thứ tự.
- `npm.cmd run build`: đạt, 211 module.
- `npm.cmd run test:landing:browser`: 10/10 đạt với API fixture riêng, gồm công bố/xem trước, lỗi lưu, sáu tab CMS, liên hệ và thư viện ảnh.
- Regression của trình quản lý ảnh được chạy với bản mã trước sửa: thất bại vì chỉ hiển thị 1 mục catalog thay vì 2 mục CMS trong fixture. Cùng kiểm tra đó đạt sau sửa.
- Chrome trên ứng dụng thật: đủ 9 bộ môn, 9 cụm sân/phòng; 18/18 ảnh tải được; bộ lọc hoạt động; bấm bộ môn mở đúng sân/phòng, thông số và thư viện ảnh. Nội dung còn nguyên sau F5 và khi public catalog bị chặn trong trình duyệt kiểm thử.
- Phản hồi `GET /api/landing-content` sau kiểm tra giống hệt bản sao trước sửa, kể cả `updatedAt`.

Ảnh desktop/mobile, báo cáo Chrome và log kiểm tra nằm tại `tmp/data-recovery-20261020/`. Các thư mục `tmp` được bỏ qua bởi Git.
