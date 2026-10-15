# Sports Center Management System (SCMS)
## Frontend Flow & Architecture Document – React + JavaScript (Vite)

> **Tài liệu đặc tả luồng giao diện Frontend SCMS**  
> **Cập nhật:** Đồng bộ hóa chính xác 100% với kiến trúc mã nguồn thực tế tại thư mục `src/`.  
> **Nền tảng công nghệ:** React 18, JavaScript (ES6+), Vite, Tailwind CSS (Chivo & Inter typography, Dark Olympic theme, Material Symbols Outlined).  
> **Nguồn gốc Use Case:** Đối chiếu với tài liệu nghiệp vụ *Use Cases - Copy(2).docx*.

---

## 1. Mục tiêu và Phạm vi Frontend

Frontend của Hệ thống Quản lý Trung tâm Thể thao SCMS chịu trách nhiệm:

1. **Hiển thị giao diện theo đúng vai trò người dùng:**
   - **GUEST / PUBLIC:** Trang chủ Landing Page, giới thiệu 15 môn thể thao, 9 cụm sân tiêu chuẩn Olympic, tra cứu thông tin và đăng ký trực tuyến.
   - **MANAGER:** Quản trị viên trung tâm – giám sát toàn bộ hoạt động, nhân sự, gói tập, lớp học, sân bãi, phân công HLV, báo cáo doanh thu, phân quyền ma trận và audit logs.
   - **RECEPTIONIST:** Nhân viên quầy lễ tân – tra cứu hồ sơ hội viên, bán/gia hạn gói tập tại quầy, check-in quét thẻ vào cổng.
   - **COACH:** Huấn luyện viên chuyên môn – theo dõi lịch dạy, danh sách học viên, điểm danh ca học, tạo giáo án, ghi nhận tiến độ thể lực, gửi bài tập và sử dụng Trợ lý gợi ý giáo án AI.
   - **MEMBER:** Hội viên – theo dõi thẻ tập cá nhân, đăng ký/gia hạn gói trực tuyến, tra cứu lịch và đặt chỗ lớp học thể thao, xem tiến độ rèn luyện và trò chuyện cùng Trợ lý AI.

2. **Cơ chế Điều hướng & Bảo vệ tuyến đường:**
   - Điều hướng SPA thông qua **Hash-based Router (`window.location.hash`)**, hỗ trợ cuộn mượt đến các vùng neo (`#khoa-hoc`, `#co-so-vat-chat`, `#ve-chung-toi`).
   - Bảo vệ bằng `ProtectedRoute` (kiểm tra phiên đăng nhập) và `RoleGuard` (kiểm tra vai trò và quyền hạn chi tiết `requiredCapability`).

3. **Cơ chế Phân quyền động (Dynamic Capability Matrix):**
   - Hệ thống không chỉ cố định vai trò mà còn cho phép Manager linh hoạt cấp thêm quyền hạn giữa các role thông qua màn hình *Vai Trò & Phân Quyền*. Menu Sidebar sẽ tự động cập nhật mục *"QUYỀN ĐƯỢC CẤP THÊM"* theo thời gian thực nhờ sự kiện `SCMS_PERMISSIONS_CHANGED`.

4. **Kiến trúc Dữ liệu & Service Layer mô phỏng độc lập:**
   - Tầng lưu trữ Client Database (`dbStorage.js`) hỗ trợ IndexedDB/localStorage giúp toàn bộ hành vi CRUD (thêm nhân viên, mở lớp, đặt chỗ, điểm danh, ghi nhận chỉ số, thanh toán gói) lưu lại bền vững trên trình duyệt mà không cần backend chạy đồng thời.
   - Toàn bộ hành vi được ghi nhận tự động vào **Audit Logs**.

---

## 2. Tổng quan Luồng Ứng Dụng (Application Flow)

```text
                               ┌─────────────────────────────────┐
                               │           React App             │
                               │      (App.jsx / main.jsx)       │
                               └────────────────┬────────────────┘
                                                │
                               ┌────────────────▼────────────────┐
                               │    Toast & Auth Context Layer   │
                               │  (ToastContext / AuthContext)   │
                               └────────────────┬────────────────┘
                                                │
                               ┌────────────────▼────────────────┐
                               │       Hash Router (SPA)         │
                               │     (window.location.hash)      │
                               └───────┬─────────────────┬───────┘
                                       │                 │
             ┌─────────────────────────┴────┐       ┌────┴────────────────────────┐
             ▼                              ▼       ▼                             ▼
       Landing Page                   Auth Routes        Role-based Protected Routes
    (#/, #khoa-hoc,                 (#/login,       (AppLayout + ProtectedRoute + RoleGuard)
    #co-so-vat-chat,                #/register,                      │
    #ve-chung-toi)                  Google Auth)                     │
                                                    ┌────────────────┼────────────────┬───────────────┐
                                                    ▼                ▼                ▼               ▼
                                                 MANAGER       RECEPTIONIST         COACH          MEMBER
                                               (#/manager/*) (#/receptionist/*)  (#/coach/*)    (#/member/*)
                                                    │                │                │               │
                                                    ▼                ▼                ▼               ▼
                                               8 Màn hình       4 Màn hình       8 Màn hình      6 Màn hình
```

---

## 3. Cấu trúc Thư mục Thực tế của Codebase

Toàn bộ mã nguồn Frontend được cấu trúc rõ ràng theo tính năng (Feature-based Architecture):

```text
src/
├── main.jsx                            # Điểm khởi động React 18, mount DOM vào #root
├── App.jsx                             # Quản lý Routing hash, Layout wrapper và RoleGuards
│
├── context/
│   ├── AuthContext.jsx                 # Quản lý Auth State, currentUser, Token, Login, Register, Google OAuth
│   └── ToastContext.jsx                # Hệ thống thông báo Toast (Success, Error, Info, Warning)
│
├── components/
│   ├── auth/
│   │   └── RoleGuard.jsx               # ProtectedRoute & RoleGuard (Role + Capability validator)
│   ├── layout/
│   │   ├── AppLayout.jsx               # Khung sườn ứng dụng gồm Header, Sidebar và Main container
│   │   ├── Header.jsx                  # Thanh điều hướng trên, User badge, nút Hồ sơ, Logout
│   │   └── Sidebar.jsx                 # Menu bên trái động theo vai trò và quyền hạn
│   └── common/
│       ├── Modal.jsx                   # Dialog modal tái sử dụng
│       ├── StatCard.jsx                # Thẻ thống kê KPI & Badge hiển thị trạng thái
│       └── Table.jsx                   # Bảng dữ liệu chuẩn hóa có Loading spinner & Empty state
│
├── features/
│   ├── landing/
│   │   ├── LandingPage.jsx             # Trang chủ giới thiệu trung tâm, 15 môn thể thao
│   │   └── FacilitiesSection.jsx       # Trưng bày 9 cụm sân tiêu chuẩn Olympic với Modal chi tiết
│   │
│   ├── auth/
│   │   ├── LoginPage.jsx               # Màn hình split-screen 50/50: Đăng nhập & Đăng ký tài khoản
│   │   ├── GoogleLoginModal.jsx        # Hộp thoại đăng nhập / đăng ký nhanh qua Google OAuth
│   │   ├── ForgotPasswordModal.jsx     # Hộp thoại khôi phục mật khẩu qua mã OTP 3 bước
│   │   └── ProfileModal.jsx            # Hộp thoại xem/sửa hồ sơ và đổi mật khẩu cá nhân
│   │
│   ├── manager/                        # Phân hệ Quản trị viên (8 chức năng)
│   │   ├── ManagerDashboard.jsx        # Bảng điều khiển KPI tổng thể, biểu đồ doanh thu & công suất
│   │   ├── StaffManagement.jsx         # Quản lý nhân viên (HLV, Lễ tân): Tạo mới, sửa, bật/khóa
│   │   ├── PackageManagement.jsx       # Quản lý gói tập hội viên: Cấu hình giá, số môn, thời hạn
│   │   ├── ClassesAndRooms.jsx         # Quản lý lớp học & quản lý 9 cụm sân thể thao tiêu chuẩn
│   │   ├── CoachAssignment.jsx         # Phân công HLV cho lớp học có kiểm tra xung đột thời gian
│   │   ├── ReportsAnalytics.jsx        # Báo cáo thống kê, doanh thu, tăng trưởng & cơ cấu gói tập
│   │   ├── RolesPermissions.jsx        # Ma trận phân quyền động (SYSTEM_CAPABILITIES)
│   │   └── AuditLogs.jsx               # Nhật ký thao tác hệ thống thời gian thực
│   │
│   ├── receptionist/                   # Phân hệ Lễ tân quầy (4 chức năng)
│   │   ├── ReceptionistDashboard.jsx   # Bảng điều khiển ca trực lễ tân, thống kê lượt tập trong ngày
│   │   ├── MemberLookup.jsx            # Tra cứu hồ sơ hội viên theo Tên, Email, SĐT, Mã hội viên
│   │   ├── CounterMembership.jsx       # Đăng ký & gia hạn gói tập tại quầy với quy trình 4 bước
│   │   └── MemberCheckIn.jsx           # Quét mã check-in xác thực gói tập và tài khoản vào cổng
│   │
│   ├── coach/                          # Phân hệ Huấn luyện viên (8 chức năng)
│   │   ├── CoachDashboard.jsx          # Bảng điều khiển cá nhân của HLV
│   │   ├── TeachingSchedule.jsx        # Lịch giảng dạy hàng tuần theo ca và sân bãi
│   │   ├── ClassMembers.jsx            # Danh sách học viên đăng ký theo từng lớp
│   │   ├── Attendance.jsx              # Điểm danh học viên lớp học (Có mặt / Vắng mặt)
│   │   ├── TrainingPlan.jsx            # Soạn thảo giáo án rèn luyện thể chất cho học viên
│   │   ├── WorkoutProgress.jsx         # Ghi nhận chỉ số thể lực (Cân nặng, Body Fat, Cơ bắp, RPE)
│   │   ├── CoachNotifications.jsx      # Gửi bài tập về nhà và thông báo tới học viên
│   │   └── AIRecommendation.jsx        # Trợ lý AI gợi ý giáo án thể thao chuyên biệt theo môn
│   │
│   └── member/                         # Phân hệ Hội viên (6 chức năng)
│       ├── MemberDashboard.jsx         # Bảng thông tin cá nhân, thẻ hội viên số, đếm ngược ca học
│       ├── MemberPackages.jsx          # Danh mục gói tập và thanh toán trực tuyến (VNPAY, MoMo)
│       ├── ClassScheduleView.jsx       # Tra cứu lịch 15 môn thể thao và đặt chỗ lớp học
│       ├── MyBookings.jsx              # Quản lý các lớp đã đặt, lịch sử và hủy đặt chỗ
│       ├── MyProgress.jsx              # Xem giáo án được giao, chỉ số rèn luyện và nhận xét của HLV
│       └── MemberAIAssistant.jsx       # Chatbot Trợ lý Thể thao AI tương tác hỏi đáp 24/7
│
└── services/
    ├── api.js                          # Tầng Service API hợp nhất toàn bộ 24+ Use Case
    ├── dbStorage.js                    # Cơ sở dữ liệu IndexedDB / LocalStorage Client-side
    ├── permissions.js                  # Định nghĩa SYSTEM_CAPABILITIES, hasCapability, dynamic navigation
    └── mockData.js                     # Bộ dữ liệu mẫu chuẩn Olympic (Users, Packages, Classes, Rooms...)
```

---

## 4. Chi tiết Luồng Công Khai (Landing Page Flow)

Người dùng chưa đăng nhập hoặc khách truy cập có thể tiếp cận Landing Page đa năng tại `#/`:

```text
Khách truy cập (URL: #/)
  │
  ├── 1. Header Navigation:
  │    ├── Brand Logo "SCMS Sports Center"
  │    ├── Neo liên kết: "Về chúng tôi" (#ve-chung-toi)
  │    ├── Neo liên kết: "Khóa học (15 môn)" (#khoa-hoc)
  │    ├── Neo liên kết: "Cơ sở vật chất" (#co-so-vat-chat)
  │    └── Action Buttons: [Đăng Nhập] hoặc [Đăng Ký] (Nếu đã login: [Vào Dashboard])
  │
  ├── 2. Hero Section:
  │    ├── Khẩu hiệu: "Ý CHÍ TẠO NÊN NHÀ VÔ ĐỊCH - BỨT PHÁ GIỚI HẠN CÙNG SCMS"
  │    ├── Thống kê nổi bật: 15 Môn thể thao | 9 Sân tập Olympic | 100% HLV AFC & NASM
  │    └── Nút CTA: [Khám Phá Khóa Học] & [Đăng Ký Tập Thử]
  │
  ├── 3. Về chúng tôi (#ve-chung-toi):
  │    └── Giới thiệu tổ hợp thể thao cao cấp 15.000m² đạt chuẩn liên đoàn quốc tế
  │
  ├── 4. Khóa học 15 Môn Thể Thao (#khoa-hoc):
  │    ├── Bộ lọc danh mục: "Tất cả", "Thể thao đối kháng", "Bóng & Vợt", "Sức bền & Tĩnh tâm"
  │    └── Lưới 15 môn: Bơi lội, Bóng đá, Cầu lông, Nhảy hiện đại, Bóng rổ, Tennis, Võ thuật & Boxing,
  │                     Gym & Fitness, Yoga & Pilates, Bóng chuyền, Bóng bàn, Điền kinh, Bắn cung,
  │                     Đạp xe trong nhà, Leo núi nhân tạo
  │
  ├── 5. Cơ sở vật chất 9 Cụm Sân (#co-so-vat-chat):
  │    ├── Chi tiết bể bơi 50m, sân cỏ FIFA, thảm Taraflex BWF, sàn gỗ phong Bắc Mỹ, Technogym Pro...
  │    └── Modal tương tác xem chi tiết thông số kỹ thuật, sức chứa và tiêu chuẩn thi đấu
  │
  └── 6. Footer:
       └── Thông tin liên hệ, hotline tổng đài, giờ mở cửa (05:30 - 22:30).
```

---

## 5. Luồng Xác thực (Authentication Flow)

Phục vụ các Use Case:
- **UC-01 Login System**
- **UC-02 Logout System**
- **UC-03 View Profile & Change Password**
- **UC-04 Reset Password**
- **Mở rộng:** Đăng nhập & Đăng ký nhanh với Google OAuth (`GoogleLoginModal`)

### 5.1 Giao diện Đăng nhập & Đăng ký kết hợp (Split-Screen 50/50)

- Route: `#/login` (Mặc định tab Đăng nhập) và `#/register` (Mặc định tab Đăng ký).
- Nửa bên trái: Hình ảnh vận động viên thể thao, thông số 15 môn, 9 sân Olympic, khẩu hiệu truyền cảm hứng.
- Nửa bên phải: Form tương tác với tab chuyển đổi tức thời giữa Đăng nhập và Đăng ký.

```text
[Người dùng truy cập #/login hoặc #/register]
  │
  ├── Cách 1: Đăng nhập / Đăng ký nhanh qua Google
  │     ↓
  │   Click "Tiếp tục bằng Google / Gmail"
  │     ↓
  │   Mở GoogleLoginModal (Chọn tài khoản Google / Nhập Gmail cá nhân)
  │     ↓
  │   Gọi authApi.loginWithGoogle(email, fullName, avatar)
  │     ↓
  │   Hệ thống tự động kích hoạt tài khoản MEMBER (nếu là lần đầu) và lưu Auth State
  │     ↓
  │   Redirect tới #/member/dashboard
  │
  ├── Cách 2: Đăng nhập truyền thống (Email + Password)
  │     ↓
  │   Nhập Email & Mật khẩu -> Bấm "ĐĂNG NHẬP VÀO HỆ THỐNG"
  │     ↓
  │   authApi.login(email, password) -> Kiểm tra tính hợp lệ & trạng thái ACTIVE
  │     ↓
  │   Ghi nhận Audit Log "LOGIN"
  │     ↓
  │   Lưu User info & Token vào AuthContext
  │     ↓
  │   Redirect về Dashboard tương ứng của Role:
  │     - MANAGER       → #/manager/dashboard
  │     - RECEPTIONIST  → #/receptionist/dashboard
  │     - COACH         → #/coach/dashboard
  │     - MEMBER        → #/member/dashboard
  │
  ├── Cách 3: Đăng ký thành viên mới (MEMBER)
  │     ↓
  │   Nhập: Họ tên, Email, Số điện thoại, Mật khẩu, Xác nhận mật khẩu, Tích đồng ý điều khoản
  │     ↓
  │   authApi.register(...) -> Tạo tài khoản với vai trò MEMBER, gán mã MEM-xxxx
  │     ↓
  │   Hiển thị thông báo Toast thành công -> Chuyển vào #/member/dashboard
  │
  └── Quên mật khẩu? (UC-04)
        ↓
      Click "Quên mật khẩu?" trên form đăng nhập
        ↓
      Mở ForgotPasswordModal (3 bước):
        - Bước 1: Nhập Email đã đăng ký -> Gửi mã xác thực
        - Bước 2: Nhập mã OTP xác thực (Mã mặc định hệ thống: 123456 hoặc 8888)
        - Bước 3: Đặt mật khẩu mới (tối thiểu 6 ký tự) và xác nhận
        ↓
      authApi.resetPassword() -> Cập nhật mật khẩu -> Tự động điền email vào form Login.
```

### 5.2 UC-03 Xem Hồ sơ & Đổi Mật khẩu (Profile & Change Password)
- Người dùng bấm vào Avatar hoặc Tên của mình trên thanh `Header` -> Chọn *"Hồ sơ & Đổi mật khẩu"*.
- Mở `ProfileModal`:
  - **Tab Thông tin tài khoản:** Xem Mã định danh, Role, Email, SĐT, Gói tập hiện tại, ngày hết hạn. Hỗ trợ cập nhật Họ tên, SĐT.
  - **Tab Đổi mật khẩu:** Nhập Mật khẩu hiện tại, Mật khẩu mới, Xác nhận mật khẩu mới. Gọi `authApi.changePassword`.

### 5.3 UC-02 Đăng xuất (Logout)
- Người dùng bấm menu user -> Chọn *"Đăng xuất"*.
- Gọi hàm `logout()` trong `AuthContext` -> Xóa dữ liệu user trong state và session.
- Điều hướng ngay lập tức về `#/login`.

---

## 6. Cơ chế Phân quyền Động & Route Guard

Codebase thực tế áp dụng hệ thống bảo vệ 3 lớp rất chặt chẽ:

```text
                       [Truy cập đường dẫn Hash]
                                   │
                                   ▼
                           <ProtectedRoute>
                                   │
                    ┌──────────────┴──────────────┐
                    │ Đã đăng nhập chưa?          │
                    │ (isAuthenticated)           │
                    └──────────────┬──────────────┘
                                   │
                      ┌────────────┴────────────┐
                      ▼                         ▼
                  Chưa (No)                  Đã (Yes)
                      │                         │
            Redirect #/login                    ▼
                                           <RoleGuard>
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     │ 1. Người dùng có vai trò là MANAGER? (Superuser)    │
                     │                 HOẶC                                │
                     │ 2. Role nằm trong danh sách `allowedRoles`?         │
                     │                 HOẶC                                │
                     │ 3. Role đã được cấp quyền qua `requiredCapability`? │
                     └──────────────────────────┬──────────────────────────┘
                                                │
                               ┌────────────────┴────────────────┐
                               ▼                                 ▼
                          Hợp lệ (Pass)                  Bị từ chối (Denied)
                               │                                 │
                     Hiển thị Màn hình chức năng        Hiển thị màn hình 403
                                                    "QUYỀN TRUY CẬP BỊ TỪ CHỐI"
                                                    - Tên quyền thiếu (Capability)
                                                    - Mã quyền & Icon
                                                    - Hướng dẫn liên hệ Manager
                                                    - Nút quay về Dashboard an toàn
```

### 6.1 Danh mục 15+ System Capabilities (`permissions.js`)

| Mã Capability | Tên hiển thị | Nhóm danh mục | Màn hình tương ứng | Role mặc định |
|---|---|---|---|---|
| `manage_staff` | Quản lý Nhân sự | VẬN HÀNH & NHÂN SỰ | `#/manager/staff` | MANAGER |
| `manage_packages` | Quản lý Gói tập | VẬN HÀNH & NHÂN SỰ | `#/manager/packages` | MANAGER |
| `manage_classes` | Quản lý Lớp & Sân | VẬN HÀNH & NHÂN SỰ | `#/manager/classes-rooms` | MANAGER |
| `assign_coach` | Phân công HLV | VẬN HÀNH & NHÂN SỰ | `#/manager/coach-assignment` | MANAGER |
| `view_reports` | Báo cáo Thống kê | BÁO CÁO & BẢO MẬT | `#/manager/reports` | MANAGER |
| `manage_roles` | Cấu hình Phân quyền | BÁO CÁO & BẢO MẬT | `#/manager/roles-permissions` | MANAGER |
| `view_audit_logs` | Xem Audit Logs | BÁO CÁO & BẢO MẬT | `#/manager/audit-logs` | MANAGER |
| `lookup_member` | Tra cứu Hội viên | NGHIỆP VỤ LỄ TÂN | `#/receptionist/lookup` | RECEPTIONIST |
| `register_counter_package` | Thu ngân Tại Quầy | NGHIỆP VỤ LỄ TÂN | `#/receptionist/counter-register` | RECEPTIONIST |
| `checkin_member` | Check-in Vào Sân | NGHIỆP VỤ LỄ TÂN | `#/receptionist/check-in` | RECEPTIONIST |
| `view_teaching_schedule` | Xem Lịch Dạy | HUẤN LUYỆN VIÊN | `#/coach/schedule` | COACH |
| `take_attendance` | Điểm danh Học viên | HUẤN LUYỆN VIÊN | `#/coach/attendance` | COACH |
| `create_training_plan` | Thiết lập Giáo án | GIÁO ÁN & CHUYÊN MÔN | `#/coach/training-plan` | COACH |
| `get_ai_recommendation` | Trợ lý Giáo án AI | GIÁO ÁN & CHUYÊN MÔN | `#/coach/ai-recommendation` | COACH |
| `book_class` | Đặt chỗ Lớp học | HỘI VIÊN & ĐẶT CHỖ | `#/member/schedule` | MEMBER |
| `ask_ai_assistant` | Trợ lý AI Hội viên | HỘI VIÊN & ĐẶT CHỖ | `#/member/ai-assistant` | MEMBER |

### 6.2 Đồng bộ Menu Sidebar thời gian thực
- Menu Sidebar được lấy qua hàm `getDynamicNavItems(role)`.
- Khi Manager thay đổi quyền hạn của bất kỳ Role nào trong trang `#/manager/roles-permissions`, hệ thống phát đi sự kiện:
  ```js
  window.dispatchEvent(new CustomEvent('SCMS_PERMISSIONS_CHANGED', { detail: { role, permissions } }));
  ```
- Component `Sidebar.jsx` lắng nghe sự kiện này và cập nhật lại danh sách mục điều hướng ngay tức thì mà không cần tải lại trang. Các quyền mở rộng được gom vào nhóm tiêu đề riêng: `"QUYỀN ĐƯỢC CẤP THÊM"`.

---

## 7. Phân hệ Quản Lý (Manager Frontend Flow)

Gồm 8 màn hình chức năng chuyên sâu với đầy đủ hành vi nghiệp vụ:

### 7.1 Bảng Điều Khiển Tổng Quan (Manager Dashboard)
- Route: `#/manager/dashboard` | Component: `ManagerDashboard.jsx`
- Hiển thị 4 thẻ KPI động: Tổng hội viên, Doanh thu tháng, Công suất khai thác 9 sân tập, Đội ngũ HLV.
- Biểu đồ tăng trưởng doanh thu 6 tháng gần nhất.
- Bảng tỷ lệ lấp đầy sân tập và phân bổ doanh số theo từng gói cước.

### 7.2 UC-10 Quản Lý Nhân Sự (Staff Management)
- Route: `#/manager/staff` | Component: `StaffManagement.jsx` | Capability: `manage_staff`
- **Chức năng:**
  - Tra cứu nhân viên theo họ tên, email, lọc theo vai trò (COACH, RECEPTIONIST) hoặc trạng thái (ACTIVE, INACTIVE).
  - Thêm mới nhân viên: Điền họ tên, email, SĐT, vai trò, chuyên môn, bằng cấp quốc tế (AFC, NASM, BWF).
  - Chỉnh sửa thông tin nhân sự.
  - Bật/Khóa trạng thái tài khoản nhân viên (Toggle Status) có xác nhận an toàn.
  - Ghi nhận Audit Log hành động tự động.

### 7.3 UC-11 Quản Lý Gói Tập Hội Viên (Package Management)
- Route: `#/manager/packages` | Component: `PackageManagement.jsx` | Capability: `manage_packages`
- **Chức năng:**
  - Hiển thị danh mục các gói thẻ hội viên (Basic, Pro, Elite, All-Access Olympic Pass).
  - Thêm mới / Cập nhật gói: Tên gói, thời hạn ngày, đơn giá niêm yết, số môn thể thao được phép tập, huy hiệu khuyến mãi (badge), mô tả tính năng.
  - Khóa tạm ngưng hoặc mở bán gói cước.

### 7.4 UC-12 Quản Lý Lớp Học & Sân Bãi (Classes & Rooms)
- Route: `#/manager/classes-rooms` | Component: `ClassesAndRooms.jsx` | Capability: `manage_classes`
- **Giao diện tab đôi:**
  - **Tab Lớp Học:** Danh sách các lớp học theo 15 môn thể thao. Mở lớp mới: Chọn môn, chọn cụm sân, thời gian ca học, thứ trong tuần, sức chứa tối đa.
    - *Ràng buộc Frontend:* Kiểm tra sức chứa lớp không được vượt quá sức chứa tối đa của sân bãi đã chọn.
  - **Tab Sân Bãi (9 Cụm Sân Olympic):** Quản lý thông tin sân, sức chứa, vị trí phân khu, tình trạng sẵn sàng.

### 7.5 UC-13 Phân Công Huấn Luyện Viên (Coach Assignment)
- Route: `#/manager/coach-assignment` | Component: `CoachAssignment.jsx` | Capability: `assign_coach`
- **Chức năng & Thuật toán chống xung đột lịch:**
  - Hiển thị danh sách các lớp học chưa có HLV hoặc cần đổi HLV.
  - Chọn lớp -> Chọn HLV từ danh sách -> Kiểm tra: Nếu HLV đã có lịch dạy lớp khác cùng khung giờ và cùng ngày trong tuần -> Hệ thống báo lỗi xung đột lịch ngay trên giao diện và ngăn chặn lưu dữ liệu.

### 7.6 UC-14 Báo Cáo Thống Kê & Doanh Thu (Reports & Analytics)
- Route: `#/manager/reports` | Component: `ReportsAnalytics.jsx` | Capability: `view_reports`
- **Chức năng:**
  - Thống kê doanh thu theo thời gian, tỷ lệ chuyển đổi gói tập.
  - Tỷ lệ học viên hoàn thành ca học, thống kê số lượng hội viên mới hàng tháng.
  - Phân tích hiệu suất khai thác của từng cụm sân bãi.

### 7.7 UC-15 Cấu Hình Vai Trò & Ma Trận Phân Quyền (Roles & Permissions)
- Route: `#/manager/roles-permissions` | Component: `RolesPermissions.jsx` | Capability: `manage_roles`
- **Chức năng:**
  - Chọn vai trò mục tiêu: RECEPTIONIST, COACH, MEMBER.
  - Hiển thị toàn bộ 15+ System Capabilities kèm Icon, nhóm nghiệp vụ và mô tả.
  - Bật/Tắt checkbox cấp quyền trực quan.
  - Nút *"Cấp Toàn Bộ Quyền"* và nút *"Khôi Phục Mặc Định"*.
  - Bấm *"Lưu Thay Đổi Phân Quyền"* -> Cập nhật vào DB và kích hoạt đồng bộ Sidebar toàn hệ thống.

### 7.8 UC-16 Nhật Ký Thao Tác Hệ Thống (Audit Logs)
- Route: `#/manager/audit-logs` | Component: `AuditLogs.jsx` | Capability: `view_audit_logs`
- **Chức năng:**
  - Theo dõi mọi hành vi trọng yếu: Đăng nhập, đăng ký, tạo nhân viên, phân công HLV, tạo giáo án, check-in, hủy đặt lớp, thay đổi quyền hạn.
  - Bộ lọc tìm kiếm nhanh theo Người thực hiện, Hành động hoặc Từ khóa chi tiết.

---

## 8. Phân hệ Lễ Tân (Receptionist Frontend Flow)

Gồm 4 màn hình phục vụ trực tiếp tại bàn lễ tân:

### 8.1 Tổng Quan Ca Trực (Receptionist Dashboard)
- Route: `#/receptionist/dashboard` | Component: `ReceptionistDashboard.jsx`
- Xem tổng số lượt check-in hôm nay, số gói tập bán ra trong ca trực, danh sách hội viên vừa vào sân.

### 8.2 UC-20 Tra Cứu Hồ Sơ Hội Viên (Member Lookup)
- Route: `#/receptionist/lookup` | Component: `MemberLookup.jsx` | Capability: `lookup_member`
- **Quy trình:**
  - Nhập từ khóa: Số điện thoại, Email, Họ tên hoặc Mã thẻ hội viên (MEM-xxxx).
  - Trả về danh sách thẻ hội viên với đầy đủ thông tin: Ảnh đại diện, tình trạng tài khoản (ACTIVE / LOCKED), tên gói cước, ngày hết hạn, trạng thái gói (ACTIVE / EXPIRED / INACTIVE).
  - Phím tắt chuyển nhanh sang nghiệp vụ: *Đăng ký gói* hoặc *Check-in ngay*.

### 8.3 UC-21 Thu Ngân & Đăng Ký Gói Tại Quầy (Counter Membership)
- Route: `#/receptionist/counter-register` | Component: `CounterMembership.jsx` | Capability: `register_counter_package`
- **Quy trình thanh toán 4 bước trực quan:**
  - **Bước 1 (Chọn hội viên):** Chọn từ danh sách hoặc tìm kiếm nhanh.
  - **Bước 2 (Chọn gói tập):** Hiển thị danh mục gói tập kèm giá tiền và thời hạn.
  - **Bước 3 (Thanh toán):** Chọn phương thức thanh toán: *Tiền mặt*, *Quẹt thẻ POS*, hoặc *Chuyển khoản QR*. Xác nhận tổng tiền.
  - **Bước 4 (Biên nhận & Kích hoạt):** Gọi `receptionApi.registerCounterPackage` -> Tự động sinh mã giao dịch `TXN-xxxxxx`, cập nhật thời hạn mới cho hội viên, in/hiển thị biên nhận thành công.

### 8.4 UC-22 Check-in Quét Thẻ Vào Sân (Member Check-In)
- Route: `#/receptionist/check-in` | Component: `MemberCheckIn.jsx` | Capability: `checkin_member`
- **Quy trình xác thực an toàn cổng:**
  - Lễ tân nhập mã hội viên hoặc chọn hội viên từ danh sách chờ.
  - Hệ thống kiểm tra điều kiện vào sân:
    - Nếu tài khoản hội viên bị KHÓA -> Báo lỗi từ chối vào cổng.
    - Nếu gói tập CHƯA KÍCH HOẠT hoặc ĐÃ HẾT HẠN -> Báo lỗi và gợi ý gia hạn.
    - Nếu gói tập ACTIVE -> Ghi nhận check-in thành công với thời gian chính xác, hiển thị lời chào mừng và cập nhật nhật ký lượt vào sân.

---

## 9. Phân hệ Huấn Luyện Viên (Coach Frontend Flow)

Gồm 8 màn hình hỗ trợ toàn diện công tác huấn luyện:

### 9.1 Bảng Điều Khiển HLV (Coach Dashboard)
- Route: `#/coach/dashboard` | Component: `CoachDashboard.jsx`
- Thống kê: Số ca dạy trong tuần, tổng số học viên đang phụ trách, số giáo án đã giao, ca dạy kế tiếp trong ngày.

### 9.2 UC-30 Lịch Giảng Dạy (Teaching Schedule)
- Route: `#/coach/schedule` | Component: `TeachingSchedule.jsx` | Capability: `view_teaching_schedule`
- Xem lịch trình các lớp được phân công theo ca (Sáng, Chiều, Tối), thứ trong tuần, sân tập và số học viên đã đăng ký.

### 9.3 UC-31 Danh Sách Học Viên Theo Lớp (Class Members)
- Route: `#/coach/members` | Component: `ClassMembers.jsx` | Capability: `view_teaching_schedule`
- Chọn lớp dạy -> Hiển thị danh sách học viên kèm ảnh đại diện, mã số thẻ, số điện thoại, ngày đăng ký.

### 9.4 UC-34 Điểm Danh Ca Học (Class Attendance)
- Route: `#/coach/attendance` | Component: `Attendance.jsx` | Capability: `take_attendance`
- **Quy trình:**
  - Chọn lớp học trong ca trực.
  - Danh sách học viên hiển thị với nút gạt: **CÓ MẶT (Present)** hoặc **VẮNG MẶT (Absent)**.
  - Bấm *"Xác Nhận & Lưu Điểm Danh"* -> Lưu trữ kết quả vào hệ thống và ghi nhận Audit Log.

### 9.5 UC-32 Thiết Lập Giáo Án Cá Nhân Hóa (Training Plan)
- Route: `#/coach/training-plan` | Component: `TrainingPlan.jsx` | Capability: `create_training_plan`
- **Quy trình:**
  - Chọn học viên mục tiêu -> Nhập tiêu đề giáo án, mục tiêu thể lực (Tăng cơ, giảm mỡ, tăng sức bền, phục hồi chức năng).
  - Soạn thảo danh sách bài tập (Tên bài, số hiệp sets, số lần reps, thời gian nghỉ).
  - Thêm hướng dẫn kỹ thuật và dặn dò chuyên môn.
  - Lưu và gửi trực tiếp đến ứng dụng của học viên.

### 9.6 UC-33 Ghi Nhận Tiến Độ & Chỉ Số Thể Lực (Workout Progress)
- Route: `#/coach/progress` | Component: `WorkoutProgress.jsx` | Capability: `create_training_plan`
- **Quy trình:**
  - Chọn học viên -> Mở modal ghi nhận thông số.
  - Cập nhật chỉ số InBody: Cân nặng (kg), Tỷ lệ mỡ Body Fat (%), Khối lượng cơ bắp Muscle Mass (kg).
  - Ghi nhận kết quả bài tập (mức tạ tối đa, số km bơi/chạy) và phản hồi chuyên môn (Coach Feedback).
  - Biểu đồ tiến độ và lịch sử chỉ số hiển thị minh bạch cho cả HLV và hội viên.

### 9.7 UC-35 Gửi Bài Tập Về Nhà & Thông Báo (Coach Notifications)
- Route: `#/coach/notifications` | Component: `CoachNotifications.jsx` | Capability: `view_teaching_schedule`
- Soạn thông báo hoặc bài tập tự rèn luyện tại nhà gửi đến toàn bộ lớp hoặc từng cá nhân học viên.

### 9.8 UC-36 Trợ Lý Gợi Ý Giáo Án Thể Thao AI (AI Recommendation)
- Route: `#/coach/ai-recommendation` | Component: `AIRecommendation.jsx` | Capability: `get_ai_recommendation`
- **Tính năng AI chuyên sâu:**
  - HLV chọn học viên, môn thể thao, trình độ thể lực (Mới tập, Trung cấp, Nâng cao), mục tiêu và tiền sử chấn thương (nếu có).
  - Bấm *"Khởi Tạo Giáo Án AI"* -> Hệ thống phân tích và đề xuất:
    - Khối lượng tập tuần (Weekly volume).
    - Vùng nhịp tim mục tiêu (Heart rate zone).
    - Hướng dẫn dinh dưỡng và lượng nước bù khoáng.
    - Tổ hợp 4 giai đoạn bài tập chi tiết (Khởi động động lực học, Phức hợp đa khớp, Bài tập chức năng, Xả cơ phục hồi).
  - HLV có thể chỉnh sửa lại giáo án trước khi chính thức áp dụng cho học viên.

---

## 10. Phân hệ Hội Viên (Member Frontend Flow)

Gồm 6 màn hình đáp ứng trọn vẹn hành trình rèn luyện của hội viên:

### 10.1 Trang Cá Nhân Hội Viên (Member Dashboard)
- Route: `#/member/dashboard` | Component: `MemberDashboard.jsx`
- Hiển thị Thẻ Hội Viên Điện Tử kèm mã QR định danh, trạng thái gói tập và ngày hết hạn.
- Đếm ngược ca học tiếp theo đã đăng ký, lối tắt đặt chỗ nhanh và xem tiến độ thể lực.

### 10.2 UC-41 Mua & Gia Hạn Gói Tập Trực Tuyến (Member Packages)
- Route: `#/member/packages` | Component: `MemberPackages.jsx` | Capability: `manage_packages`
- Xem danh sách các gói cước đang mở bán.
- Bấm *"Đăng Ký Ngay"* -> Mở Checkout Modal -> Chọn phương thức thanh toán điện tử (VNPAY, MoMo, Thẻ tín dụng).
- Xác nhận -> Sinh mã giao dịch trực tuyến `ONL-xxxxxx` -> Kích hoạt trạng thái ACTIVE cho gói cước của hội viên.

### 10.3 UC-42 & UC-43 Tra Cứu Lịch & Đặt Chỗ Lớp Học (Class Schedule & Booking)
- Route: `#/member/schedule` | Component: `ClassScheduleView.jsx` | Capability: `book_class`
- **Quy trình đặt chỗ:**
  - Xem danh sách lớp học 15 bộ môn theo ngày trong tuần, sân tập, giờ học và HLV phụ trách.
  - Lọc theo từng môn thể thao yêu thích.
  - Bấm *"Đặt Chỗ"* -> Kiểm tra ràng buộc:
    - *Gói tập chưa kích hoạt/hết hạn:* Báo lỗi, yêu cầu mua gói.
    - *Lớp học đã đầy (FULL):* Báo lỗi, không cho đặt vượt số lượng.
    - *Đã đặt chỗ lớp này trước đó:* Ngăn chặn trùng lặp.
  - Xác nhận đặt chỗ thành công -> Số lượng học viên của lớp tự động tăng lên 1.

### 10.4 UC-44 Quản Lý & Hủy Lớp Đã Đặt (My Bookings)
- Route: `#/member/bookings` | Component: `MyBookings.jsx` | Capability: `book_class`
- Xem danh sách các lớp đã xác nhận (CONFIRMED) hoặc đã hủy (CANCELLED).
- Bấm *"Hủy Đặt Chỗ"* -> Mở modal xác nhận -> Giải phóng chỗ học -> Số lượng đăng ký của lớp tự động giảm đi 1, giúp hội viên khác có thể đăng ký.

### 10.5 UC-45 Theo Dõi Tiến Độ & Giáo Án (My Progress)
- Route: `#/member/progress` | Component: `MyProgress.jsx`
- Xem danh sách giáo án được HLV phân công riêng cho mình.
- Theo dõi biểu đồ cân nặng, lượng mỡ, khối lượng cơ bắp và những lời nhận xét chi tiết của HLV sau mỗi buổi rèn luyện.

### 10.6 UC-46 Trợ Lý Thể Thao AI Hội Viên (Member AI Assistant)
- Route: `#/member/ai-assistant` | Component: `MemberAIAssistant.jsx` | Capability: `ask_ai_assistant`
- Giao diện trò chuyện tương tác thông minh 24/7.
- Hỗ trợ giải đáp các câu hỏi về:
  - Chế độ dinh dưỡng trước và sau tập (Protein, Carbs, bù nước điện giải).
  - Biện pháp xử lý đau mỏi cơ sau tập (DOMS), phục hồi chấn thương nhẹ.
  - Giờ mở cửa và thông số kỹ thuật 9 cụm sân tiêu chuẩn Olympic của SCMS.

---

## 11. Bảng Định Tuyến URL Hash Thực Tế (Route Hash Mapping)

Toàn bộ ứng dụng sử dụng cơ chế Hash Routing mượt mà, không yêu cầu cấu hình server rewrite:

| Đường dẫn Hash | Component JSX | Vai trò được phép (Allowed Roles) | Yêu cầu quyền hạn (Required Capability) |
|---|---|---|---|
| `#/` | `LandingPage.jsx` | Tất cả (Public / Guest / Authenticated) | Không yêu cầu |
| `#/login` | `LoginPage.jsx` (Tab Login) | Tất cả (Public / Guest) | Không yêu cầu |
| `#/register` | `LoginPage.jsx` (Tab Register) | Tất cả (Public / Guest) | Không yêu cầu |
| **QUẢN LÝ (MANAGER)** | | | |
| `#/manager/dashboard` | `ManagerDashboard.jsx` | MANAGER | Mặc định vai trò |
| `#/manager/staff` | `StaffManagement.jsx` | MANAGER | `manage_staff` |
| `#/manager/packages` | `PackageManagement.jsx` | MANAGER | `manage_packages` |
| `#/manager/classes-rooms` | `ClassesAndRooms.jsx` | MANAGER | `manage_classes` |
| `#/manager/coach-assignment` | `CoachAssignment.jsx` | MANAGER | `assign_coach` |
| `#/manager/reports` | `ReportsAnalytics.jsx` | MANAGER | `view_reports` |
| `#/manager/roles-permissions` | `RolesPermissions.jsx` | MANAGER | `manage_roles` |
| `#/manager/audit-logs` | `AuditLogs.jsx` | MANAGER | `view_audit_logs` |
| **LỄ TÂN (RECEPTIONIST)** | | | |
| `#/receptionist/dashboard` | `ReceptionistDashboard.jsx` | RECEPTIONIST, MANAGER | Mặc định vai trò |
| `#/receptionist/lookup` | `MemberLookup.jsx` | RECEPTIONIST, MANAGER | `lookup_member` |
| `#/receptionist/counter-register`| `CounterMembership.jsx` | RECEPTIONIST, MANAGER | `register_counter_package` |
| `#/receptionist/check-in` | `MemberCheckIn.jsx` | RECEPTIONIST, MANAGER | `checkin_member` |
| **HUẤN LUYỆN VIÊN (COACH)** | | | |
| `#/coach/dashboard` | `CoachDashboard.jsx` | COACH, MANAGER | Mặc định vai trò |
| `#/coach/schedule` | `TeachingSchedule.jsx` | COACH, MANAGER | `view_teaching_schedule` |
| `#/coach/members` | `ClassMembers.jsx` | COACH, MANAGER | `view_teaching_schedule` |
| `#/coach/attendance` | `Attendance.jsx` | COACH, MANAGER | `take_attendance` |
| `#/coach/training-plan` | `TrainingPlan.jsx` | COACH, MANAGER | `create_training_plan` |
| `#/coach/progress` | `WorkoutProgress.jsx` | COACH, MANAGER | `create_training_plan` |
| `#/coach/notifications` | `CoachNotifications.jsx` | COACH, MANAGER | `view_teaching_schedule` |
| `#/coach/ai-recommendation` | `AIRecommendation.jsx` | COACH, MANAGER | `get_ai_recommendation` |
| **HỘI VIÊN (MEMBER)** | | | |
| `#/member/dashboard` | `MemberDashboard.jsx` | MEMBER, MANAGER | Mặc định vai trò |
| `#/member/packages` | `MemberPackages.jsx` | MEMBER, MANAGER | `manage_packages` |
| `#/member/schedule` | `ClassScheduleView.jsx` | MEMBER, MANAGER | `book_class` |
| `#/member/bookings` | `MyBookings.jsx` | MEMBER, MANAGER | `book_class` |
| `#/member/progress` | `MyProgress.jsx` | MEMBER, MANAGER | Mặc định vai trò |
| `#/member/ai-assistant` | `MemberAIAssistant.jsx` | MEMBER, MANAGER | `ask_ai_assistant` |

> **Lưu ý đặc quyền:** Quản trị viên (`MANAGER`) sở hữu quyền Superuser, có thể xem và kiểm tra thử tất cả các màn hình của Lễ tân, Huấn luyện viên và Hội viên để phục vụ công tác giám sát hệ thống.

---

## 12. Kiến Trúc Dữ Liệu & Tầng Service API

### 12.1 Client Database Storage (`dbStorage.js`)
Ứng dụng xây dựng một cơ sở dữ liệu mô phỏng chạy trên trình duyệt người dùng với cấu trúc khóa (`DB_KEYS`):
- `USERS`: Danh sách người dùng, phân loại theo 4 vai trò, kèm mã hội viên, thông tin gói cước và ảnh đại diện.
- `PACKAGES`: Danh mục các gói tập, cấu hình số môn, giá bán và trạng thái kích hoạt.
- `CLASSES`: Danh sách các lớp học theo 15 môn thể thao, thông tin lịch học, HLV và số lượng đã ghi danh.
- `ROOMS`: 9 cụm sân tập tiêu chuẩn Olympic, sức chứa và phân khu.
- `BOOKINGS`: Toàn bộ các lượt đặt chỗ lớp học của hội viên.
- `CHECKINS`: Lịch sử các lần quét thẻ qua cổng lễ tân.
- `ATTENDANCES`: Hồ sơ điểm danh từng ca học do HLV lưu trữ.
- `TRAINING_PLANS`: Giáo án cá nhân do HLV biên soạn.
- `PROGRESS`: Chỉ số thể chất InBody và nhật ký rèn luyện.
- `NOTIFICATIONS`: Bài tập về nhà và thông báo từ HLV.
- `AUDIT_LOGS`: Nhật ký hoạt động toàn hệ thống.
- `PERMISSIONS`: Ma trận phân quyền động giữa các nhóm vai trò.

### 12.2 Tầng API Hợp Nhất (`api.js`)
Mọi tương tác từ Component đều đi qua các đối tượng API chuyên trách, có mô phỏng độ trễ mạng thực tế (Network delay 150ms - 300ms) và tự động ghi Audit Log:
- `authApi`: `login`, `register`, `loginWithGoogle`, `resetPassword`, `changePassword`, `updateProfile`.
- `staffApi`: `getAll`, `create`, `update`, `toggleStatus`.
- `packageApi`: `getAll`, `create`, `update`, `toggleStatus`.
- `classApi`: `getAll`, `create`, `update`, `assignCoach` (có logic chống xung đột lịch).
- `roomApi`: `getAll`, `create`, `update`.
- `bookingApi`: `getMemberBookings`, `bookClass` (kiểm tra hạn gói và công suất), `cancelBooking`.
- `receptionApi`: `lookupMember`, `registerCounterPackage` (sinh mã `TXN-xxxxxx`), `checkInMember`, `getCheckInHistory`.
- `coachApi`: `getCoachClassesAndMembers`, `createTrainingPlan`, `recordWorkoutProgress`, `takeAttendance`, `sendNotification`, `getAIRecommendation`.
- `memberApi`: `subscribeOnline` (sinh mã `ONL-xxxxxx`), `getMyProgress`, `getMyPlans`.
- `reportApi`: `getOverview` (tính toán công suất phòng, doanh thu, cơ cấu gói).
- `systemApi`: `getAuditLogs`, `getPermissions`, `updatePermissions`, `resetAllData`.

---

## 13. Quản Lý Trạng Thái & Thông Báo Toàn Cục

### 13.1 `AuthContext.jsx`
Cung cấp trạng thái đăng nhập xuyên suốt ứng dụng qua hook `useAuth()`:
- `currentUser`: Thông tin tài khoản đang đăng nhập.
- `role`: Vai trò hiện tại (`MANAGER`, `RECEPTIONIST`, `COACH`, `MEMBER`).
- `isAuthenticated`: Boolean kiểm tra trạng thái đăng nhập.
- `login(email, password)`: Xác thực và lưu session.
- `loginWithGoogle(email, fullName, avatar)`: Xác thực nhanh bằng tài khoản Google.
- `register(data)`: Tạo tài khoản hội viên mới.
- `logout()`: Xóa phiên làm việc và chuyển về trang đăng nhập.
- `updateProfile(data)`: Cập nhật thông tin cá nhân.
- `refreshUser()`: Làm mới dữ liệu người dùng sau khi thanh toán gói tập.

### 13.2 `ToastContext.jsx`
Hệ thống hiển thị thông báo góc trên bên phải màn hình qua hook `useToast()`:
- `showSuccess(message)`: Thông báo màu xanh lục kèm icon check-circle.
- `showError(message)`: Thông báo màu đỏ kèm icon cancel cảnh báo.
- `showInfo(message)`: Thông báo màu xanh dương.
- `showWarning(message)`: Thông báo màu vàng cam.
- Tự động đóng sau 3.5 giây hoặc bấm nút đóng thủ công.

---

## 14. Bảng Tổng Hợp Mapping Use Case → Code Component & Route

| Mã Use Case | Tên nghiệp vụ | File Component JSX thực tế | Tuyến đường Hash thực tế | Service API phụ trách | Trạng thái hiện thực |
|---|---|---|---|---|---|
| **UC-01** | Đăng nhập hệ thống | `src/features/auth/LoginPage.jsx` | `#/login` | `authApi.login` | **Hoàn thành 100%** |
| **UC-01+**| Đăng nhập bằng Google | `src/features/auth/GoogleLoginModal.jsx` | Modal tại `#/login` | `authApi.loginWithGoogle` | **Hoàn thành 100%** |
| **UC-02** | Đăng xuất hệ thống | `src/components/layout/Header.jsx` | Nút đăng xuất header | `AuthContext.logout` | **Hoàn thành 100%** |
| **UC-03** | Xem hồ sơ & Đổi mật khẩu | `src/features/auth/ProfileModal.jsx` | Modal tại Header | `authApi.changePassword` | **Hoàn thành 100%** |
| **UC-04** | Khôi phục mật khẩu (OTP) | `src/features/auth/ForgotPasswordModal.jsx`| Modal tại `#/login` | `authApi.resetPassword` | **Hoàn thành 100%** |
| **UC-10** | Quản lý tài khoản nhân viên | `src/features/manager/StaffManagement.jsx` | `#/manager/staff` | `staffApi` | **Hoàn thành 100%** |
| **UC-11** | Quản lý gói cước hội viên | `src/features/manager/PackageManagement.jsx` | `#/manager/packages` | `packageApi` | **Hoàn thành 100%** |
| **UC-12** | Quản lý lớp học & sân bãi | `src/features/manager/ClassesAndRooms.jsx` | `#/manager/classes-rooms` | `classApi`, `roomApi` | **Hoàn thành 100%** |
| **UC-13** | Phân công HLV & Tránh xung đột | `src/features/manager/CoachAssignment.jsx` | `#/manager/coach-assignment` | `classApi.assignCoach` | **Hoàn thành 100%** |
| **UC-14** | Báo cáo thống kê & Doanh thu | `src/features/manager/ReportsAnalytics.jsx` | `#/manager/reports` | `reportApi.getOverview` | **Hoàn thành 100%** |
| **UC-15** | Ma trận vai trò & phân quyền | `src/features/manager/RolesPermissions.jsx`| `#/manager/roles-permissions` | `systemApi.updatePermissions`| **Hoàn thành 100%** |
| **UC-16** | Nhật ký thao tác (Audit Logs) | `src/features/manager/AuditLogs.jsx` | `#/manager/audit-logs` | `systemApi.getAuditLogs` | **Hoàn thành 100%** |
| **UC-20** | Tra cứu hồ sơ hội viên | `src/features/receptionist/MemberLookup.jsx`| `#/receptionist/lookup` | `receptionApi.lookupMember`| **Hoàn thành 100%** |
| **UC-21** | Thu ngân & Gia hạn tại quầy | `src/features/receptionist/CounterMembership.jsx`| `#/receptionist/counter-register`| `receptionApi.registerCounterPackage`| **Hoàn thành 100%** |
| **UC-22** | Check-in quét thẻ vào sân | `src/features/receptionist/MemberCheckIn.jsx`| `#/receptionist/check-in` | `receptionApi.checkInMember` | **Hoàn thành 100%** |
| **UC-30** | Lịch giảng dạy của HLV | `src/features/coach/TeachingSchedule.jsx` | `#/coach/schedule` | `coachApi.getCoachClassesAndMembers` | **Hoàn thành 100%** |
| **UC-31** | Quản lý học viên trong lớp | `src/features/coach/ClassMembers.jsx` | `#/coach/members` | `coachApi.getClassMembers` | **Hoàn thành 100%** |
| **UC-32** | Soạn giáo án huấn luyện | `src/features/coach/TrainingPlan.jsx` | `#/coach/training-plan` | `coachApi.createTrainingPlan` | **Hoàn thành 100%** |
| **UC-33** | Ghi nhận tiến độ & InBody | `src/features/coach/WorkoutProgress.jsx` | `#/coach/progress` | `coachApi.recordWorkoutProgress` | **Hoàn thành 100%** |
| **UC-34** | Điểm danh học viên ca học | `src/features/coach/Attendance.jsx` | `#/coach/attendance` | `coachApi.takeAttendance` | **Hoàn thành 100%** |
| **UC-35** | Gửi bài tập & thông báo | `src/features/coach/CoachNotifications.jsx` | `#/coach/notifications` | `coachApi.sendNotification` | **Hoàn thành 100%** |
| **UC-36** | Trợ lý gợi ý giáo án AI | `src/features/coach/AIRecommendation.jsx` | `#/coach/ai-recommendation` | `coachApi.getAIRecommendation` | **Hoàn thành 100%** |
| **UC-40** | Đăng ký thành viên mới | `src/features/auth/LoginPage.jsx` (Register) | `#/register` | `authApi.register` | **Hoàn thành 100%** |
| **UC-41** | Mua gói cước trực tuyến | `src/features/member/MemberPackages.jsx` | `#/member/packages` | `memberApi.subscribeOnline` | **Hoàn thành 100%** |
| **UC-42** | Tra cứu lịch 15 môn thể thao | `src/features/member/ClassScheduleView.jsx` | `#/member/schedule` | `classApi.getAll` | **Hoàn thành 100%** |
| **UC-43** | Đặt chỗ lớp học thể thao | `src/features/member/ClassScheduleView.jsx` | `#/member/schedule` (Modal) | `bookingApi.bookClass` | **Hoàn thành 100%** |
| **UC-44** | Hủy đặt chỗ lớp học | `src/features/member/MyBookings.jsx` | `#/member/bookings` | `bookingApi.cancelBooking` | **Hoàn thành 100%** |
| **UC-45** | Xem tiến độ & nhận xét HLV | `src/features/member/MyProgress.jsx` | `#/member/progress` | `memberApi.getMyProgress` | **Hoàn thành 100%** |
| **UC-46** | Trợ lý Thể thao AI (Chatbot) | `src/features/member/MemberAIAssistant.jsx` | `#/member/ai-assistant` | `Client AI Engine (Độc lập)` | **Hoàn thành 100%** |
| **LANDING**| Giới thiệu trung tâm & sân bãi | `src/features/landing/LandingPage.jsx` | `#/` | `mockData.INITIAL_SPORTS` | **Hoàn thành 100%** |

---

## 15. Kết Luận & Tài Liệu Tham Chiếu

Tài liệu này phản ánh chính xác cấu trúc thực tế và các luồng tương tác của dự án React + JavaScript (Vite) tại thư mục `src/`. Mọi tính năng từ xác thực, phân quyền động, giao diện Landing Page, 4 bảng điều khiển chuyên biệt theo vai trò, đến tầng dữ liệu client database và xử lý API đều đã được lập trình và kết nối hoàn chỉnh.
