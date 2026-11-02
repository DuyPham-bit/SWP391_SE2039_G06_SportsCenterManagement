## graphify

Use Graphify automatically for repository code tasks; the user need not invoke it.

The CLI is installed with uv on Windows. In PowerShell, use
`& "$env:USERPROFILE/.local/bin/graphify.exe"` when `graphify` is absent from PATH.

- Before the first source search for a task, refresh the local index with
  `& "$env:USERPROFILE/.local/bin/graphify.exe" extract . --code-only --no-cluster --max-workers 2`.
  This uses cached AST extraction and no LLM/API calls. Run from the repository root.
- Then run `& "$env:USERPROFILE/.local/bin/graphify.exe" query "<focused question with relevant code identifiers>" --budget 1500`.
  Use `path` or `explain` for focused relationships. Read only relevant source ranges
  surfaced by the graph; use targeted `rg` if the graph is incomplete or unavailable.
- Refresh with the same extraction command after changing code, before finishing.
- Keep tool output and answers concise. Do not dump `graph.json`, read the full
  report, or rebuild the full semantic graph for routine tasks. Use the full
  Graphify skill when the user explicitly requests its pipeline or visualization.
- The index covers code only; consult relevant docs directly when needed. It does
  not establish runtime correctness, so verify affected behavior with suitable checks.

## Quy tắc Tự động Kích hoạt Kỹ năng (Automatic Skill Triggering)

Trước khi viết, chỉnh sửa hoặc gỡ lỗi mã nguồn cho bất kỳ phần nào, Agent PHẢI tự động kích hoạt kỹ năng tương ứng từ bộ kỹ năng đã cài đặt mà người dùng KHÔNG CẦN phải gọi tên skill thủ công:

1. **Giao diện, UI, UX, Styling, CSS, Layout**:
   - Tự động gọi và kích hoạt: `ux-ui-promax`
   - Hành động: Tra cứu màu sắc, typography, khoảng cách, bố cục responsive, animations và độ tương phản WCAG trước khi viết code giao diện.

2. **Khởi tạo Tính năng mới, Module mới, Thay đổi kiến trúc**:
   - Tự động gọi và kích hoạt: `brainstorming` và `writing-plans`
   - Hành động: Phân tích các giải pháp kỹ thuật, so sánh ưu nhược điểm và lập kế hoạch thực thi từng bước (Implementation Plan) trước khi chạm vào mã nguồn.

3. **Sửa Bug, Điều tra Lỗi ngoại lệ, Test thất bại**:
   - Tự động gọi và kích hoạt: `systematic-debugging`
   - Hành động: Phân tích nguyên nhân gốc rễ (Root Cause Analysis), tái hiện lỗi trước khi can thiệp mã nguồn; không phán đoán mơ hồ hoặc thử sửa mù quáng.

4. **Triển khai Logic Nghiệp vụ, Endpoint API, Xử lý dữ liệu**:
   - Tự động gọi và kích hoạt: `test-driven-development`
   - Hành động: Viết kiểm thử trước khi viết mã nguồn thực thi, bảo đảm nguyên tắc đỏ (fail) -> xanh (pass) -> tái cấu trúc (refactor).

5. **Tác vụ phức tạp kéo dài nhiều bước hoặc cần lưu kế hoạch qua các phiên**:
   - Tự động gọi và kích hoạt: `planning-with-files`
   - Hành động: Khởi tạo và cập nhật liên tục bộ 3 tệp `task_plan.md`, `findings.md`, `progress.md` để duy trì tiến độ làm việc bền vững.

6. **Xác nhận Hoàn thành Tác vụ, Trước khi Commit/Đẩy code**:
   - Tự động gọi và kích hoạt: `verification-before-completion`
   - Hành động: Luôn chạy lệnh kiểm thử (test suite, build compiler) và kiểm tra output thực tế trước khi kết luận nhiệm vụ hoàn thành.

7. **Xử lý Tệp Văn phòng & Báo cáo**:
   - Tự động gọi và kích hoạt: `docx` (Word), `pdf` (PDF), `xlsx` (Excel), `pptx` (PowerPoint) tương ứng với định dạng cần xử lý.
