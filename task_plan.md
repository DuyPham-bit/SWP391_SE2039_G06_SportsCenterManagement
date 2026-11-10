# Kế hoạch: Ẩn các môn không học trong Đăng ký môn (Member Enrollment)

## 1. Mục tiêu
- Xử lý yêu cầu người dùng: "Ẩn các môn không học luôn chỉ hiện môn học thôi" trên giao diện Đăng Ký Môn Học (`#/member/enroll`).
- Đảm bảo khi hội viên đã tham gia/đăng ký môn học (ví dụ: Boxing & Võ thuật), danh sách chỉ hiển thị các môn đang học, ẩn hoàn toàn các bộ môn không học khác.
- Đảm bảo an toàn nghiệp vụ: Nếu hội viên mới chưa đăng ký môn nào (`enrolled.length === 0`), vẫn hiển thị danh mục môn để hội viên có thể chọn môn đăng ký lần đầu.
- Viết kiểm thử tự động (TDD) trong `member-enrollment.test.cjs`.
- Rebuild và cập nhật container Docker `scms-frontend` (`http://localhost:3004`) để thay đổi phản ánh trực tiếp trên trình duyệt của người dùng.

## 2. Các bước thực hiện
- [x] Bước 1: Khảo sát logic lọc và viết unit test trong `Frontend/tests/member-enrollment.test.cjs` cho hàm `filterVisibleSports`.
- [x] Bước 2: Bổ sung hàm tiện ích `filterVisibleSports` vào `Frontend/src/pages/member-enrollment/model/enrollmentView.js`.
- [x] Bước 3: Cập nhật `Frontend/src/pages/member-enrollment/model/useMemberEnrollment.js` sử dụng `filterVisibleSports`.
- [x] Bước 4: Chạy kiểm thử tự động `npm test` xác nhận 100% tests pass (157/157 passed).
- [x] Bước 5: Build lại container `scms-frontend` qua `docker compose build frontend && docker compose up -d frontend`.
- [x] Bước 6: Kiểm tra xác minh endpoint `http://localhost:3004` và hoàn thiện tài liệu `findings.md`, `progress.md`.
