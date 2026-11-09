/*
   SCMS Seed Full Center Data for Existing Members ONLY.
   STRICT REQUIREMENT: NO NEW MEMBERS CREATED.
   Attaches packages, subscriptions, invoices, payments, enrollments, bookings, attendance, and check-ins
   directly to the existing 7 members in dbo.member_profiles.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;

BEGIN TRANSACTION;

DECLARE @centerId bigint = 15;
DECLARE @nowUtc datetime2 = SYSUTCDATETIME();
DECLARE @today date = CAST(DATEADD(hour, 7, @nowUtc) AS date); -- 2026-11-09 in VN
DECLARE @adminId bigint = (SELECT TOP 1 id FROM dbo.users WHERE username = N'admin');
DECLARE @managerId bigint = COALESCE((SELECT TOP 1 id FROM dbo.users WHERE username = N'manager01'), @adminId);
DECLARE @receptionId bigint = COALESCE((SELECT TOP 1 id FROM dbo.users WHERE username = N'reception01'), @adminId);
DECLARE @coachUserId bigint = (SELECT TOP 1 user_id FROM dbo.coach_profiles WHERE center_id = @centerId ORDER BY id);

-- 1. Ensure Standard Membership Packages
IF NOT EXISTS (SELECT 1 FROM dbo.membership_packages WHERE center_id = @centerId AND name = N'Gói Basic Thể Thao')
BEGIN
    INSERT dbo.membership_packages (center_id, name, description, duration_days, price, max_classes, access_type, allowed_sports, badge, features, status, created_at, updated_at)
    VALUES (@centerId, N'Gói Basic Thể Thao', N'Khởi động lối sống năng động với 1 môn cơ bản.', 30, 650000, 10, N'1 môn cơ bản', 1, N'Cơ bản', N'["1 môn cơ bản","Locker tiêu chuẩn"]', N'Active', DATEADD(month, -4, @nowUtc), @nowUtc);
END

IF NOT EXISTS (SELECT 1 FROM dbo.membership_packages WHERE center_id = @centerId AND name = N'Gói Pro Bứt Phá')
BEGIN
    INSERT dbo.membership_packages (center_id, name, description, duration_days, price, max_classes, access_type, allowed_sports, badge, features, status, created_at, updated_at)
    VALUES (@centerId, N'Gói Pro Bứt Phá', N'Tự chọn 3 bộ môn linh hoạt cùng đo InBody.', 90, 1800000, 30, N'3 môn tự chọn', 3, N'Phổ biến', N'["3 môn tự chọn","InBody định kỳ","Locker VIP"]', N'Active', DATEADD(month, -4, @nowUtc), @nowUtc);
END

IF NOT EXISTS (SELECT 1 FROM dbo.membership_packages WHERE center_id = @centerId AND name = N'Gói Elite Chuyên Nghiệp')
BEGIN
    INSERT dbo.membership_packages (center_id, name, description, duration_days, price, max_classes, access_type, allowed_sports, badge, features, status, created_at, updated_at)
    VALUES (@centerId, N'Gói Elite Chuyên Nghiệp', N'Toàn quyền 6 bộ môn chuyên sâu kèm Sauna & Jacuzzi.', 180, 3200000, 70, N'6 môn chuyên sâu', 6, N'Chuyên nghiệp', N'["6 môn chuyên sâu","2 buổi PT","Sauna & Jacuzzi"]', N'Active', DATEADD(month, -4, @nowUtc), @nowUtc);
END

IF NOT EXISTS (SELECT 1 FROM dbo.membership_packages WHERE center_id = @centerId AND name = N'Gói All-Access Olympic Pass')
BEGIN
    INSERT dbo.membership_packages (center_id, name, description, duration_days, price, max_classes, access_type, allowed_sports, badge, features, status, created_at, updated_at)
    VALUES (@centerId, N'Gói All-Access Olympic Pass', N'Đặc quyền tối thượng: 10 môn thể thao Olympic.', 365, 5800000, 150, N'Toàn quyền 10 môn', 10, N'VIP All-Access', N'["10 môn thể thao Olympic","Không giới hạn checkin","Nước ion cao cấp"]', N'Active', DATEADD(month, -4, @nowUtc), @nowUtc);
END

-- 2. Load existing members into temp table
DECLARE @members TABLE (
    idx int IDENTITY(1,1) PRIMARY KEY,
    member_id bigint,
    user_id bigint,
    member_code nvarchar(50),
    full_name nvarchar(150)
);

INSERT INTO @members (member_id, user_id, member_code, full_name)
SELECT mp.id, mp.user_id, mp.member_code, mp.full_name
FROM dbo.member_profiles mp
JOIN dbo.users u ON u.id = mp.user_id AND u.status = N'Active'
ORDER BY mp.id;

DECLARE @totalMembers int = (SELECT COUNT(*) FROM @members);
PRINT CONCAT(N'Found existing members: ', @totalMembers);

-- 3. Seed Subscriptions, Invoices and Payments for each existing member
DECLARE @pkgBasic bigint = (SELECT TOP 1 id FROM dbo.membership_packages WHERE duration_days = 30 AND status = 'Active' ORDER BY id);
DECLARE @pkgPro bigint = (SELECT TOP 1 id FROM dbo.membership_packages WHERE duration_days = 90 AND status = 'Active' ORDER BY id);
DECLARE @pkgElite bigint = (SELECT TOP 1 id FROM dbo.membership_packages WHERE duration_days = 180 AND status = 'Active' ORDER BY id);
DECLARE @pkgAll bigint = (SELECT TOP 1 id FROM dbo.membership_packages WHERE duration_days >= 365 AND status = 'Active' ORDER BY id);

DECLARE @mIdx int = 1;
WHILE @mIdx <= @totalMembers
BEGIN
    DECLARE @mid bigint, @uid bigint, @mcode nvarchar(50);
    SELECT @mid = member_id, @uid = user_id, @mcode = member_code FROM @members WHERE idx = @mIdx;

    -- Pick packages for member
    DECLARE @activePkgId bigint = CASE (@mIdx % 4)
        WHEN 1 THEN @pkgPro
        WHEN 2 THEN @pkgElite
        WHEN 3 THEN @pkgAll
        ELSE @pkgBasic
    END;

    DECLARE @pastPkgId bigint = CASE (@mIdx % 2)
        WHEN 0 THEN @pkgBasic
        ELSE @pkgPro
    END;

    -- A. Historical Expired Subscription (60 days ago)
    IF NOT EXISTS (SELECT 1 FROM dbo.member_subscriptions WHERE member_id = @mid AND status = N'Expired')
    BEGIN
        DECLARE @pastPrice decimal(18,2) = (SELECT price FROM dbo.membership_packages WHERE id = @pastPkgId);
        DECLARE @pastDays int = (SELECT duration_days FROM dbo.membership_packages WHERE id = @pastPkgId);
        DECLARE @pastStart date = DATEADD(day, -75, @today);
        DECLARE @pastEnd date = DATEADD(day, @pastDays - 1, @pastStart);
        DECLARE @pastPaid datetime2 = DATEADD(hour, 9, CAST(@pastStart AS datetime2));
        DECLARE @subPastId bigint, @invPastId bigint;

        INSERT dbo.member_subscriptions (member_id, package_id, start_date, end_date, price, status, auto_renew, created_at, updated_at, duration_days)
        VALUES (@mid, @pastPkgId, @pastStart, @pastEnd, @pastPrice, N'Expired', 0, @pastPaid, @pastPaid, @pastDays);
        SET @subPastId = SCOPE_IDENTITY();

        INSERT dbo.invoices (invoice_number, member_id, center_id, created_by, subtotal, discount, tax, total_amount, status, issued_at, paid_at, idempotency_key)
        VALUES (CONCAT(N'SC-', FORMAT(@pastPaid, 'yyyyMMddHHmmss'), N'-', @mcode, N'-01'), @mid, @centerId, @receptionId, @pastPrice, 0, 0, @pastPrice, N'Paid', @pastPaid, @pastPaid, LOWER(NEWID()));
        SET @invPastId = SCOPE_IDENTITY();

        INSERT dbo.invoice_items (invoice_id, package_id, subscription_id, enrollment_id, description, quantity, unit_price, amount)
        VALUES (@invPastId, @pastPkgId, @subPastId, NULL, N'Đăng ký gói tập ban đầu', 1, @pastPrice, @pastPrice);

        INSERT dbo.payments (invoice_id, member_id, processed_by, payment_method, transaction_code, amount, payment_status, paid_at, note, created_at, idempotency_key, amount_received, attempted_at)
        VALUES (@invPastId, @mid, @receptionId, N'CASH', CONCAT(N'CASH:SC-', @invPastId), @pastPrice, N'Succeeded', @pastPaid, N'Thanh toán tiền mặt tại quầy', @pastPaid, LOWER(NEWID()), @pastPrice, @pastPaid);
    END;

    -- B. Current Active Subscription (renewed 12 days ago)
    IF NOT EXISTS (SELECT 1 FROM dbo.member_subscriptions WHERE member_id = @mid AND status = N'Active')
    BEGIN
        DECLARE @curPrice decimal(18,2) = (SELECT price FROM dbo.membership_packages WHERE id = @activePkgId);
        DECLARE @curDays int = (SELECT duration_days FROM dbo.membership_packages WHERE id = @activePkgId);
        DECLARE @curOffset int = ((@mIdx * 4) % 26) + 2;
        DECLARE @curStart date = DATEADD(day, -@curOffset, @today);
        DECLARE @curEnd date = DATEADD(day, @curDays - 1, @curStart);
        DECLARE @curPaid datetime2 = DATEADD(hour, 10 + (@mIdx % 6), CAST(@curStart AS datetime2));
        DECLARE @subCurId bigint, @invCurId bigint;
        DECLARE @payMethod nvarchar(30) = CASE (@mIdx % 3) WHEN 0 THEN N'VNPAY' WHEN 1 THEN N'MOMO' ELSE N'CASH' END;

        INSERT dbo.member_subscriptions (member_id, package_id, start_date, end_date, price, status, auto_renew, created_at, updated_at, duration_days)
        VALUES (@mid, @activePkgId, @curStart, @curEnd, @curPrice, N'Active', 0, @curPaid, @curPaid, @curDays);
        SET @subCurId = SCOPE_IDENTITY();

        INSERT dbo.invoices (invoice_number, member_id, center_id, created_by, subtotal, discount, tax, total_amount, status, issued_at, paid_at, idempotency_key)
        VALUES (CONCAT(N'SC-', FORMAT(@curPaid, 'yyyyMMddHHmmss'), N'-', @mcode, N'-02'), @mid, @centerId, CASE WHEN @payMethod = N'CASH' THEN @receptionId ELSE @uid END, @curPrice, 0, 0, @curPrice, N'Paid', @curPaid, @curPaid, LOWER(NEWID()));
        SET @invCurId = SCOPE_IDENTITY();

        INSERT dbo.invoice_items (invoice_id, package_id, subscription_id, enrollment_id, description, quantity, unit_price, amount)
        VALUES (@invCurId, @activePkgId, @subCurId, NULL, N'Gia hạn gói tập hội viên', 1, @curPrice, @curPrice);

        INSERT dbo.payments (invoice_id, member_id, processed_by, payment_method, transaction_code, amount, payment_status, paid_at, note, created_at, gateway_reference, provider_transaction_id, idempotency_key, amount_received, attempted_at)
        VALUES (@invCurId, @mid, CASE WHEN @payMethod = N'CASH' THEN @receptionId END, @payMethod, CONCAT(@payMethod, N':SC-', @invCurId), @curPrice, N'Succeeded', @curPaid, CASE WHEN @payMethod = N'CASH' THEN N'Thanh toán tiền mặt tại quầy' ELSE N'Thanh toán online thành công' END, @curPaid, CONCAT(N'REF-', @invCurId), CONCAT(N'TXN-', @invCurId), LOWER(NEWID()), @curPrice, DATEADD(second, -20, @curPaid));
    END;

    SET @mIdx += 1;
END;

-- 4. Enroll all members into active classes
DECLARE @activeClasses TABLE (class_id bigint, capacity int);
INSERT INTO @activeClasses (class_id, capacity)
SELECT id, capacity FROM dbo.classes WHERE status = N'Published' AND center_id = @centerId;

INSERT INTO dbo.class_enrollments (class_id, member_id, subscription_id, registered_by, registered_at, status)
SELECT c.class_id, m.member_id, sub.id, @receptionId, DATEADD(day, -10, @nowUtc), N'Active'
FROM @activeClasses c
CROSS JOIN @members m
CROSS APPLY (
    SELECT TOP 1 id FROM dbo.member_subscriptions
    WHERE member_id = m.member_id AND status = N'Active'
    ORDER BY id DESC
) sub
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.class_enrollments e
    WHERE e.class_id = c.class_id AND e.member_id = m.member_id
)
AND (m.idx + c.class_id) % 2 = 0; -- Enroll each member in ~half the classes

-- 5. Book sessions for enrolled members and create attendance for past sessions
INSERT INTO dbo.session_bookings (session_id, member_id, enrollment_id, subscription_id, registered_by, booked_at, status)
SELECT cs.id, e.member_id, e.id, e.subscription_id, @receptionId, DATEADD(hour, -24, CAST(cs.session_date AS datetime2)), N'Booked'
FROM dbo.class_sessions cs
JOIN dbo.class_enrollments e ON e.class_id = cs.class_id AND e.status = N'Active'
WHERE cs.session_status = N'Scheduled'
  AND cs.session_date BETWEEN DATEADD(day, -20, @today) AND DATEADD(day, 20, @today)
  AND NOT EXISTS (
      SELECT 1 FROM dbo.session_bookings b
      WHERE b.session_id = cs.id AND b.member_id = e.member_id
  );

-- Attendance for past sessions
INSERT INTO dbo.attendance (session_id, member_id, checked_in_by, attendance_status, check_in_time, check_out_time, note, created_at)
SELECT b.session_id, b.member_id, @coachUserId,
       CASE WHEN (b.session_id + b.member_id) % 7 = 0 THEN N'LATE' ELSE N'PRESENT' END,
       DATEADD(minute, CASE WHEN (b.session_id + b.member_id) % 7 = 0 THEN 10 ELSE -5 END, DATEADD(second, DATEDIFF(second, '00:00', cs.start_time), CAST(cs.session_date AS datetime2))),
       DATEADD(second, DATEDIFF(second, '00:00', cs.end_time), CAST(cs.session_date AS datetime2)),
       CASE WHEN (b.session_id + b.member_id) % 7 = 0 THEN N'Đến muộn 10 phút' ELSE N'Tham gia đầy đủ ca học' END,
       DATEADD(minute, 5, CAST(cs.session_date AS datetime2))
FROM dbo.session_bookings b
JOIN dbo.class_sessions cs ON cs.id = b.session_id
WHERE cs.session_date < @today
  AND NOT EXISTS (
      SELECT 1 FROM dbo.attendance a
      WHERE a.session_id = b.session_id AND a.member_id = b.member_id
  );

-- 6. Center Check-ins (Historical + TODAY)
-- A. Historical Checkins (last 30 days)
DECLARE @dayOffset int = 1;
WHILE @dayOffset <= 30
BEGIN
    DECLARE @checkDate date = DATEADD(day, -@dayOffset, @today);
    
    INSERT INTO dbo.center_checkins (member_id, center_id, checked_in_by, check_in_time, check_out_time, created_at)
    SELECT m.member_id, @centerId, @receptionId,
           DATEADD(minute, 450 + (m.idx * 45) % 600, CAST(@checkDate AS datetime2)),
           DATEADD(minute, 450 + (m.idx * 45) % 600 + 75, CAST(@checkDate AS datetime2)),
           DATEADD(minute, 450 + (m.idx * 45) % 600, CAST(@checkDate AS datetime2))
    FROM @members m
    WHERE (@dayOffset + m.idx) % 3 < 2 -- 2 out of 3 days
      AND NOT EXISTS (
          SELECT 1 FROM dbo.center_checkins c
          WHERE c.member_id = m.member_id AND CAST(c.check_in_time AS date) = @checkDate
      );
      
    SET @dayOffset += 1;
END;

-- B. TODAY Checkins (2026-11-09) - Critical for Manager Dashboard "LƯỢT CHECK-IN"
INSERT INTO dbo.center_checkins (member_id, center_id, checked_in_by, check_in_time, check_out_time, created_at)
SELECT m.member_id, @centerId, @receptionId,
       DATEADD(minute, 420 + (m.idx * 50), CAST(@today AS datetime2)), -- e.g. 07:50, 08:40, 09:30...
       DATEADD(minute, 420 + (m.idx * 50) + 80, CAST(@today AS datetime2)),
       DATEADD(minute, 420 + (m.idx * 50), CAST(@today AS datetime2))
FROM @members m
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.center_checkins c
    WHERE c.member_id = m.member_id AND CAST(c.check_in_time AS date) = @today
);

-- 7. Add Equipment Issues for Center 15
IF NOT EXISTS (SELECT 1 FROM dbo.equipment_issues WHERE center_id = @centerId)
BEGIN
    INSERT INTO dbo.equipment_issues (center_id, reported_by_user_id, title, description, severity, status, resolution_note, resolved_by, reported_at, resolved_at)
    VALUES
    (@centerId, @adminId, N'Bảo trì máy chạy bộ Matrix số 04', N'Thay thảm chạy và bôi trơn băng chuyền định kỳ.', N'Low', N'Resolved', N'Đã hoàn thành bảo dưỡng và kiểm tra tải trọng.', @managerId, DATEADD(day, -5, @nowUtc), DATEADD(day, -4, @nowUtc)),
    (@centerId, @adminId, N'Vệ sinh và kiểm tra hệ thống lọc hồ bơi Olympic', N'Đo nồng độ Clo và pH nước hồ bơi tiêu chuẩn.', N'Medium', N'Resolved', N'Nước đạt tiêu chuẩn thi đấu quốc tế.', @managerId, DATEADD(day, -3, @nowUtc), DATEADD(day, -2, @nowUtc)),
    (@centerId, @adminId, N'Bảo dưỡng dàn tạ tay Dumbbell khu Free-weight', N'Kiểm tra ốc khóa tạ và vệ sinh giá đỡ.', N'Low', N'InProgress', N'Đang siết lại ren khóa an toàn.', NULL, DATEADD(day, -1, @nowUtc), NULL);
END;

-- 8. Marker
INSERT INTO dbo.system_settings (setting_key, setting_value, description, updated_by, updated_at)
VALUES (N'seed.demo.business-data.v3', N'applied', N'Complete business data for 7 existing members.', @adminId, @nowUtc);

COMMIT TRANSACTION;

PRINT N'SUCCESS: Complete demo business data seeded for existing members!';
