/*
  SCMS demo data seed (idempotent, guarded by system_settings key 'seed.demo-data.full-dashboard.v1').
  Target: database SportsCenterManagement, center 15, after all EF migrations are applied.
  Keeps the member base small (~10 active members): adds only 3 demo members
  (demo.member01..03, same password as member01) and enriches existing members with
  renewal history (Jun 2026 onwards), check-ins (incl. today), bookings, attendance and coach data.
  Timestamps in *_at / start_at columns are UTC; class session times are Vietnam local time.

  Run:  sqlcmd -S localhost -E -C -d SportsCenterManagement -i Backend\database\seed_demo_data.sql
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;

IF EXISTS (SELECT 1 FROM dbo.system_settings WHERE setting_key = N'seed.demo-data.full-dashboard.v2')
BEGIN
    PRINT N'Demo data already seeded (seed.demo-data.full-dashboard.v2). Nothing to do.';
    RETURN;
END

BEGIN TRANSACTION;

DECLARE @center bigint = 15;
DECLARE @today date = CAST(SYSUTCDATETIME() AS date);
DECLARE @nowUtc datetime2 = SYSUTCDATETIME();
DECLARE @memberRole bigint = (SELECT id FROM dbo.roles WHERE name = N'Member');
DECLARE @pwdHash nvarchar(255) = (SELECT password_hash FROM dbo.users WHERE username = N'member01');
DECLARE @admin bigint = (SELECT id FROM dbo.users WHERE username = N'admin');
DECLARE @manager bigint = (SELECT id FROM dbo.users WHERE username = N'manager01');
DECLARE @reception bigint = (SELECT id FROM dbo.users WHERE username = N'reception01');

IF @memberRole IS NULL OR @pwdHash IS NULL OR @manager IS NULL OR @reception IS NULL
    OR NOT EXISTS (SELECT 1 FROM dbo.centers WHERE id = @center)
BEGIN
    RAISERROR(N'Base data (roles, member01, manager01, reception01, center 15) is missing.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

/* ---------------------------------------------------------------- numbers helper */
DECLARE @nums TABLE (i int PRIMARY KEY);
INSERT @nums (i)
SELECT TOP (400) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 FROM sys.all_objects;

/* ---------------------------------------------------------------- 1. existing members ONLY (NO NEW USERS / PROFILES) */
DECLARE @m TABLE (
    n int IDENTITY(1,1) PRIMARY KEY, full_name nvarchar(150), gender nvarchar(20), dob date,
    goal nvarchar(500), lvl nvarchar(50), h decimal(5,1), w decimal(5,1), joined datetime2,
    pkg bigint, churn bit, user_id bigint NULL, member_id bigint NULL);

INSERT @m (full_name, gender, dob, goal, lvl, h, w, joined, pkg, churn, user_id, member_id)
SELECT mp.full_name, mp.gender, mp.date_of_birth, mp.fitness_goal, mp.fitness_level,
       ISNULL(mp.height_cm, 170), ISNULL(mp.weight_kg, 65),
       ISNULL(mp.created_at, '2026-06-01 02:00'),
       COALESCE(
           CASE (ROW_NUMBER() OVER (ORDER BY mp.id) % 4)
               WHEN 0 THEN (SELECT TOP 1 id FROM dbo.membership_packages WHERE duration_days >= 365)
               WHEN 1 THEN (SELECT TOP 1 id FROM dbo.membership_packages WHERE duration_days BETWEEN 1 AND 45)
               WHEN 2 THEN (SELECT TOP 1 id FROM dbo.membership_packages WHERE duration_days BETWEEN 46 AND 100)
               ELSE (SELECT TOP 1 id FROM dbo.membership_packages WHERE duration_days BETWEEN 101 AND 200)
           END,
           (SELECT TOP 1 id FROM dbo.membership_packages ORDER BY id)
       ),
       0, mp.user_id, mp.id
FROM dbo.member_profiles mp
JOIN dbo.users u ON u.id = mp.user_id AND u.status = N'Active';

DECLARE @n int = 1, @uid bigint, @mid bigint;
DECLARE @memberCount int = (SELECT COUNT(*) FROM @m);

/* ---------------------------------------------------------------- 2. subscriptions, invoices, payments */
DECLARE @k int, @dur int, @price decimal(18,2), @pkg bigint, @pkgName nvarchar(150), @churn bit,
        @start date, @paid datetime2, @subId bigint, @invId bigint, @method nvarchar(50), @hex varchar(64),
        @status nvarchar(30);

SET @n = 1;
WHILE @n <= @memberCount
BEGIN
    SELECT @pkg = pkg, @churn = churn, @start = CAST(joined AS date), @uid = user_id, @mid = member_id FROM @m WHERE n = @n;
    SELECT @dur = duration_days, @price = price, @pkgName = name FROM dbo.membership_packages WHERE id = @pkg;
    SET @k = 0;
    WHILE @start <= @today AND (@churn = 0 OR @k = 0)
    BEGIN
        SET @paid = DATEADD(minute, (ABS(CHECKSUM(CONCAT('t', @n, '-', @k))) % 600),
                    DATEADD(hour, 2, CAST(@start AS datetime2)));
        IF @k = 0 AND @paid < (SELECT joined FROM @m WHERE n = @n) SET @paid = (SELECT joined FROM @m WHERE n = @n);
        IF @paid > @nowUtc SET @paid = DATEADD(minute, -30, @nowUtc);
        SET @hex = LOWER(CONVERT(varchar(64), HASHBYTES('SHA2_256', CONCAT('scms-demo-', @n, '-', @k)), 2));
        SET @method = CASE WHEN (@n + @k) % 3 = 0 THEN N'VNPAY' ELSE N'CASH' END;
        SET @status = CASE WHEN DATEADD(day, @dur - 1, @start) >= @today THEN N'Active' ELSE N'Expired' END;

        INSERT dbo.member_subscriptions (member_id, package_id, start_date, end_date, price, status, auto_renew,
                                         created_at, updated_at, duration_days)
        VALUES (@mid, @pkg, @start, DATEADD(day, @dur - 1, @start), @price, @status, 0, @paid, @paid, @dur);
        SET @subId = SCOPE_IDENTITY();

        INSERT dbo.invoices (invoice_number, member_id, center_id, created_by, subtotal, discount, tax,
                             total_amount, status, issued_at, paid_at, idempotency_key)
        VALUES (CONCAT(N'SC-', FORMAT(@paid, 'yyyyMMddHHmmss'), N'-', LEFT(@hex, 12)), @mid, @center,
                CASE WHEN @method = N'CASH' THEN @reception ELSE @uid END,
                @price, 0, 0, @price, N'Paid', @paid, @paid, @hex);
        SET @invId = SCOPE_IDENTITY();

        INSERT dbo.invoice_items (invoice_id, package_id, subscription_id, enrollment_id, description, quantity, unit_price, amount)
        VALUES (@invId, @pkg, @subId, NULL,
                CASE WHEN @k = 0 THEN CONCAT(N'Gói tập: ', @pkgName) ELSE CONCAT(N'Gia hạn gói: ', @pkgName) END,
                1, @price, @price);

        INSERT dbo.payments (invoice_id, member_id, processed_by, payment_method, transaction_code, amount, payment_status,
                             paid_at, note, created_at, gateway_reference, provider_transaction_id, idempotency_key,
                             amount_received, attempted_at)
        VALUES (@invId, @mid,
                CASE WHEN @method = N'CASH' THEN @reception END,
                @method,
                CASE WHEN @method = N'CASH' THEN CONCAT(N'CASH:', SUBSTRING(@hex, 13, 32))
                     ELSE CONCAT(N'VNPAY:', 15900000 + @n * 100 + @k) END,
                @price, N'Succeeded', @paid,
                CASE WHEN @method = N'CASH' THEN N'Thu tiền mặt tại quầy' END,
                @paid,
                CASE WHEN @method = N'VNPAY' THEN CONCAT(N'PAY-', SUBSTRING(@hex, 13, 32)) END,
                CASE WHEN @method = N'VNPAY' THEN CONCAT(N'VNPAY:', 15900000 + @n * 100 + @k) END,
                @hex,
                CASE WHEN @method = N'CASH' THEN @price END,
                DATEADD(second, -40, @paid));

        SET @k += 1;
        SET @start = DATEADD(day, @dur, @start);
    END
    SET @n += 1;
END

/* ---------------------------------------------------------------- 2b. renewal history for existing members (Jun-Sep 2026) */
DECLARE @old TABLE (n int IDENTITY(1,1) PRIMARY KEY, member_id bigint, user_id bigint, joined datetime2);
INSERT @old (member_id, user_id, joined)
SELECT mp.id, mp.user_id, DATEADD(day, -(ROW_NUMBER() OVER (ORDER BY mp.id)) * 3, CAST('2026-06-01 02:30' AS datetime2))
FROM dbo.member_profiles mp
JOIN dbo.users u ON u.id = mp.user_id AND u.status = N'Active' AND u.role_id = @memberRole
WHERE mp.member_code IN (N'MEM-00001', N'MEM-00002', N'MEM-00003', N'MEM-00004', N'MEM-00005')
  AND NOT EXISTS (SELECT 1 FROM dbo.member_subscriptions ms
                  WHERE ms.member_id = mp.id AND ms.start_date < '2026-10-01' AND ms.status <> N'Cancelled');

-- Members joined in late May so their history is consistent with the profile age.
UPDATE mp SET created_at = o.joined FROM dbo.member_profiles mp JOIN @old o ON o.member_id = mp.id;
UPDATE u SET created_at = o.joined FROM dbo.users u JOIN @old o ON o.user_id = u.id;

SELECT @pkg = 1;
SELECT @dur = duration_days, @price = price, @pkgName = name FROM dbo.membership_packages WHERE id = @pkg;
DECLARE @oldCount int = (SELECT COUNT(*) FROM @old);
SET @n = 1;
WHILE @n <= @oldCount
BEGIN
    SELECT @mid = member_id, @uid = user_id, @start = CAST(joined AS date) FROM @old WHERE n = @n;
    SET @k = 0;
    WHILE DATEADD(day, @dur - 1, @start) < '2026-10-01'
    BEGIN
        SET @paid = DATEADD(minute, (ABS(CHECKSUM(CONCAT('o', @mid, '-', @k))) % 600), DATEADD(hour, 2, CAST(@start AS datetime2)));
        SET @hex = LOWER(CONVERT(varchar(64), HASHBYTES('SHA2_256', CONCAT('scms-demo-old-', @mid, '-', @k)), 2));
        SET @method = CASE WHEN (@mid + @k) % 3 = 0 THEN N'VNPAY' ELSE N'CASH' END;

        INSERT dbo.member_subscriptions (member_id, package_id, start_date, end_date, price, status, auto_renew, created_at, updated_at, duration_days)
        VALUES (@mid, @pkg, @start, DATEADD(day, @dur - 1, @start), @price, N'Expired', 0, @paid, @paid, @dur);
        SET @subId = SCOPE_IDENTITY();

        INSERT dbo.invoices (invoice_number, member_id, center_id, created_by, subtotal, discount, tax, total_amount, status, issued_at, paid_at, idempotency_key)
        VALUES (CONCAT(N'SC-', FORMAT(@paid, 'yyyyMMddHHmmss'), N'-', LEFT(@hex, 12)), @mid, @center,
                CASE WHEN @method = N'CASH' THEN @reception ELSE @uid END, @price, 0, 0, @price, N'Paid', @paid, @paid, @hex);
        SET @invId = SCOPE_IDENTITY();

        INSERT dbo.invoice_items (invoice_id, package_id, subscription_id, enrollment_id, description, quantity, unit_price, amount)
        VALUES (@invId, @pkg, @subId, NULL,
                CASE WHEN @k = 0 THEN CONCAT(N'Gói tập: ', @pkgName) ELSE CONCAT(N'Gia hạn gói: ', @pkgName) END, 1, @price, @price);

        INSERT dbo.payments (invoice_id, member_id, processed_by, payment_method, transaction_code, amount, payment_status,
                             paid_at, note, created_at, gateway_reference, provider_transaction_id, idempotency_key, amount_received, attempted_at)
        VALUES (@invId, @mid, CASE WHEN @method = N'CASH' THEN @reception END, @method,
                CASE WHEN @method = N'CASH' THEN CONCAT(N'CASH:', SUBSTRING(@hex, 13, 32)) ELSE CONCAT(N'VNPAY:', 15950000 + @mid * 100 + @k) END,
                @price, N'Succeeded', @paid, CASE WHEN @method = N'CASH' THEN N'Thu tiền mặt tại quầy' END, @paid,
                CASE WHEN @method = N'VNPAY' THEN CONCAT(N'PAY-', SUBSTRING(@hex, 13, 32)) END,
                CASE WHEN @method = N'VNPAY' THEN CONCAT(N'VNPAY:', 15950000 + @mid * 100 + @k) END,
                @hex, CASE WHEN @method = N'CASH' THEN @price END, DATEADD(second, -40, @paid));

        SET @k += 1;
        SET @start = DATEADD(day, @dur, @start);
    END
    SET @n += 1;
END

/* ---------------------------------------------------------------- 3. missing class sessions from schedules (to 2026-12-31) */
INSERT dbo.class_sessions (class_id, schedule_id, room_id, coach_id, session_date, start_time, end_time,
                           session_status, notes, created_at)
SELECT s.class_id, s.id, s.room_id,
       COALESCE((SELECT TOP 1 cs.coach_id FROM dbo.class_sessions cs WHERE cs.class_id = s.class_id AND cs.coach_id IS NOT NULL ORDER BY cs.session_date DESC),
                (SELECT MIN(cc.coach_id) FROM dbo.class_coaches cc WHERE cc.class_id = s.class_id)),
       d.dt, s.start_time, s.end_time, N'Scheduled', N'Buổi học định kỳ', @nowUtc
FROM dbo.class_schedules s
JOIN dbo.classes c ON c.id = s.class_id AND c.status = N'Published'
CROSS APPLY (SELECT DATEADD(day, x.i, CAST('2026-10-12' AS date)) AS dt FROM @nums x) d
WHERE s.status = N'Active'
  AND d.dt BETWEEN s.start_date AND s.end_date
  AND d.dt <= '2026-12-31'
  AND (DATEDIFF(day, '19000101', d.dt) % 7) + 1 = s.day_of_week
  AND NOT EXISTS (SELECT 1 FROM dbo.class_sessions x
                  WHERE x.class_id = s.class_id AND x.session_date = d.dt AND x.start_time = s.start_time);

/* ---------------------------------------------------------------- 4. enrollments for demo members */
DECLARE @classPool TABLE (slot int PRIMARY KEY, class_id bigint);
INSERT @classPool VALUES (0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 7);

;WITH wanted AS (
    SELECT m.member_id, m.joined, p.class_id, sub.id AS subscription_id, pk.max_classes, x.ord
    FROM @m m
    CROSS APPLY (SELECT TOP 1 ms.id, ms.package_id FROM dbo.member_subscriptions ms
                 WHERE ms.member_id = m.member_id AND ms.status = N'Active' ORDER BY ms.end_date DESC) sub
    JOIN dbo.membership_packages pk ON pk.id = sub.package_id
    CROSS APPLY (VALUES (0, m.n % 6), (1, (m.n + 2) % 6)) x(ord, slot)
    JOIN @classPool p ON p.slot = x.slot
    WHERE x.ord < CASE WHEN ISNULL(pk.max_classes, 1) >= 2 THEN 2 ELSE 1 END
)
INSERT dbo.class_enrollments (class_id, member_id, subscription_id, registered_by, registered_at, status)
SELECT w.class_id, w.member_id, w.subscription_id, @reception,
       CASE WHEN w.joined > '2026-10-10' THEN w.joined ELSE CAST('2026-10-10 03:00' AS datetime2) END,
       N'Active'
FROM wanted w
JOIN dbo.classes c ON c.id = w.class_id
WHERE NOT EXISTS (SELECT 1 FROM dbo.class_enrollments e WHERE e.class_id = w.class_id AND e.member_id = w.member_id)
  AND (SELECT COUNT(*) FROM dbo.class_enrollments e2 WHERE e2.class_id = w.class_id AND e2.status IN (N'Active', N'Confirmed', N'Enrolled'))
      < c.capacity - 2;

/* ---------------------------------------------------------------- 5. session bookings (active enrollments, up to 3 weeks ahead) */
INSERT dbo.session_bookings (session_id, member_id, enrollment_id, booked_at, status, subscription_id, registered_by)
SELECT cs.id, e.member_id, e.id,
       CASE WHEN e.registered_at < DATEADD(day, -2, CAST(cs.session_date AS datetime2)) THEN DATEADD(day, -2, CAST(cs.session_date AS datetime2)) ELSE e.registered_at END,
       N'Booked',
       COALESCE((SELECT TOP 1 ms.id FROM dbo.member_subscriptions ms
                 WHERE ms.member_id = e.member_id AND ms.status IN (N'Active', N'Expired')
                   AND cs.session_date BETWEEN ms.start_date AND ms.end_date ORDER BY ms.end_date DESC),
                e.subscription_id),
       NULL
FROM dbo.class_enrollments e
JOIN dbo.member_profiles mp ON mp.id = e.member_id
JOIN dbo.users u ON u.id = mp.user_id AND u.status = N'Active'
JOIN dbo.class_sessions cs ON cs.class_id = e.class_id AND cs.session_status = N'Scheduled'
JOIN dbo.classes c ON c.id = e.class_id
WHERE e.status IN (N'Active', N'Confirmed', N'Enrolled')
  AND cs.session_date >= CAST(e.registered_at AS date)
  AND cs.session_date <= DATEADD(day, 21, @today)
  AND NOT EXISTS (SELECT 1 FROM dbo.session_bookings b WHERE b.session_id = cs.id AND b.member_id = e.member_id)
  AND (SELECT COUNT(*) FROM dbo.session_bookings b2 WHERE b2.session_id = cs.id AND b2.status = N'Booked') < c.capacity;

/* ---------------------------------------------------------------- 6. attendance for past sessions */
INSERT dbo.attendance (session_id, member_id, checked_in_by, attendance_status, check_in_time, check_out_time, note, created_at)
SELECT b.session_id, b.member_id, coach.user_id, st.status,
       CASE WHEN st.status = N'ABSENT' THEN NULL ELSE DATEADD(minute, CASE WHEN st.status = N'LATE' THEN 12 ELSE -6 END, sdt.local_start) END,
       CASE WHEN st.status = N'ABSENT' THEN NULL ELSE DATEADD(hour, -7, DATEADD(second, DATEDIFF(second, CAST('00:00' AS time), cs.end_time), CAST(cs.session_date AS datetime2))) END,
       CASE WHEN st.status = N'LATE' THEN N'Đến muộn ~10 phút' END,
       DATEADD(minute, 15, sdt.local_start)
FROM dbo.session_bookings b
JOIN dbo.class_sessions cs ON cs.id = b.session_id
CROSS APPLY (SELECT DATEADD(hour, -7, DATEADD(second, DATEDIFF(second, CAST('00:00' AS time), cs.start_time), CAST(cs.session_date AS datetime2))) AS local_start) sdt
CROSS APPLY (SELECT CASE WHEN r < 72 THEN N'PRESENT' WHEN r < 86 THEN N'LATE' ELSE N'ABSENT' END AS status
             FROM (SELECT ABS(CHECKSUM(CONCAT('att', b.session_id, '-', b.member_id))) % 100 AS r) q) st
OUTER APPLY (SELECT TOP 1 cp.user_id FROM dbo.coach_profiles cp
             WHERE cp.id = COALESCE(cs.coach_id, (SELECT MIN(cc.coach_id) FROM dbo.class_coaches cc WHERE cc.class_id = cs.class_id))) coach
WHERE b.status = N'Booked'
  AND cs.session_date < @today
  AND NOT EXISTS (SELECT 1 FROM dbo.attendance a WHERE a.session_id = b.session_id AND a.member_id = b.member_id);

/* ---------------------------------------------------------------- 7. center check-ins (last 60 days, ~3 visits/week) */
INSERT dbo.center_checkins (member_id, center_id, checked_in_by, check_in_time, check_out_time, created_at)
SELECT mp.id, @center, @reception, v.cin,
       CASE WHEN v.cout <= @nowUtc THEN v.cout END, v.cin
FROM dbo.member_profiles mp
JOIN dbo.users u ON u.id = mp.user_id AND u.status = N'Active' AND u.role_id = @memberRole
CROSS APPLY (SELECT DATEADD(day, -x.i, @today) AS dt, x.i FROM @nums x WHERE x.i BETWEEN 0 AND 60) d
CROSS APPLY (SELECT CASE WHEN d.i = 0
                         -- today: spread visits between local 06:00 and now
                         THEN DATEADD(minute, -(ABS(CHECKSUM(CONCAT('in', mp.id, d.dt))) % (CASE WHEN DATEDIFF(minute, DATEADD(hour, -1, CAST(@today AS datetime2)), @nowUtc) > 10 THEN DATEDIFF(minute, DATEADD(hour, -1, CAST(@today AS datetime2)), @nowUtc) ELSE 10 END)), @nowUtc)
                         ELSE DATEADD(minute, (ABS(CHECKSUM(CONCAT('in', mp.id, d.dt))) % 840) - 60, CAST(d.dt AS datetime2)) END AS cin) v0
CROSS APPLY (SELECT v0.cin, DATEADD(minute, 70 + (ABS(CHECKSUM(CONCAT('out', mp.id, d.dt))) % 80), v0.cin) AS cout) v
WHERE ABS(CHECKSUM(CONCAT('day', mp.id, d.dt))) % 7 < CASE WHEN d.i = 0 THEN 5 ELSE 3 END
  AND v.cin <= @nowUtc
  AND d.dt >= CAST(mp.created_at AS date)
  AND EXISTS (SELECT 1 FROM dbo.member_subscriptions ms WHERE ms.member_id = mp.id AND ms.status IN (N'Active', N'Expired')
              AND d.dt BETWEEN ms.start_date AND ms.end_date);

/* ---------------------------------------------------------------- 8. body metrics (training_results) for coach01 members */
DECLARE @coach1 bigint = (SELECT cp.id FROM dbo.coach_profiles cp JOIN dbo.users u ON u.id = cp.user_id WHERE u.username = N'coach01');
DECLARE @coach1User bigint = (SELECT user_id FROM dbo.coach_profiles WHERE id = @coach1);
DECLARE @coach2 bigint = (SELECT cp.id FROM dbo.coach_profiles cp JOIN dbo.users u ON u.id = cp.user_id WHERE u.username = N'coach02');
DECLARE @coachB bigint = (SELECT cp.id FROM dbo.coach_profiles cp JOIN dbo.users u ON u.id = cp.user_id WHERE u.username = N'member05');

INSERT dbo.training_results (member_id, coach_id, class_id, result_date, weight, body_fat_percentage, muscle_mass,
                             duration_seconds, calories_burned, performance_score, workout_result, coach_feedback, created_at)
SELECT e.member_id, @coach1, e.class_id, DATEADD(month, -x.i, DATEADD(day, -3, @today)),
       CAST(COALESCE(mp.weight_kg, 65) + x.i * 0.8 AS decimal(6,2)),
       CAST(CASE WHEN mp.gender = N'Nữ' THEN 27 ELSE 21 END + x.i * 0.6 AS decimal(5,2)),
       CAST(COALESCE(mp.weight_kg, 65) * 0.42 - x.i * 0.3 AS decimal(6,2)),
       3600, 380 + (ABS(CHECKSUM(CONCAT('cal', e.member_id, x.i))) % 220),
       CAST(70 + (3 - x.i) * 5 + (ABS(CHECKSUM(CONCAT('sc', e.member_id, x.i))) % 6) AS decimal(5,2)),
       N'Hoàn thành giáo án tuần, đo chỉ số cơ thể định kỳ',
       CASE x.i WHEN 0 THEN N'Tiến bộ rõ, duy trì cường độ hiện tại.' WHEN 1 THEN N'Cần ngủ đủ giấc để phục hồi tốt hơn.'
                WHEN 2 THEN N'Kỹ thuật ổn định, tăng dần khối lượng.' ELSE N'Buổi đánh giá đầu vào.' END,
       DATEADD(month, -x.i, DATEADD(day, -3, @nowUtc))
FROM (SELECT member_id, MIN(class_id) AS class_id FROM dbo.class_enrollments
      WHERE class_id IN (SELECT class_id FROM dbo.class_coaches WHERE coach_id = @coach1) AND status IN (N'Active', N'Confirmed', N'Enrolled')
      GROUP BY member_id) e
JOIN dbo.member_profiles mp ON mp.id = e.member_id
JOIN @nums x ON x.i BETWEEN 0 AND 3
WHERE DATEADD(month, -x.i, DATEADD(day, -3, @today)) >= DATEADD(day, -7, CAST(mp.created_at AS date));

/* ---------------------------------------------------------------- 9. coach work events (PT / floor duty), reviews, resource bookings */
DECLARE @ev TABLE (k int PRIMARY KEY, coach_id bigint, member_code nvarchar(50), title nvarchar(200), event_type nvarchar(30),
                   start_local datetime2, minutes int, status nvarchar(30), notes nvarchar(1000), rating int NULL, comment nvarchar(2000) NULL, id bigint NULL);
INSERT @ev (k, coach_id, member_code, title, event_type, start_local, minutes, status, notes, rating, comment) VALUES
 ( 1, @coach1, N'MEM-00001', N'PT 1-1: Đánh giá thể lực đầu vào',  N'PersonalTraining', '2026-10-13 15:00', 60, N'Completed', N'Đo InBody, test sức bền', 5, N'HLV hướng dẫn rất kỹ, đo chỉ số rõ ràng.'),
 ( 2, @coach1, N'MEM-00002', N'PT 1-1: Kỹ thuật squat & deadlift', N'PersonalTraining', '2026-10-16 15:00', 60, N'Completed', N'Sửa form squat',          5, N'Sửa tư thế rất chi tiết, mình hết đau gối.'),
 ( 3, @coach1, N'MEM-00003', N'PT 1-1: Giáo án giảm mỡ tuần 1',    N'PersonalTraining', '2026-10-20 15:00', 60, N'Completed', NULL,                       4, N'Buổi tập hiệu quả, hơi nặng một chút.'),
 ( 4, @coach1, N'MEM-00004', N'PT 1-1: Core & tư thế',             N'PersonalTraining', '2026-10-23 15:00', 60, N'Completed', NULL,                       5, N'Rất nhiệt tình, giải thích dễ hiểu.'),
 ( 5, @coach1, N'MEM-00001', N'PT 1-1: Giáo án tăng sức bền',      N'PersonalTraining', '2026-10-27 15:00', 60, N'Completed', NULL,                       4, N'Ổn, mong có thêm bài giãn cơ cuối buổi.'),
 ( 6, @coach1, N'MEM-00002', N'PT 1-1: Upper body',                N'PersonalTraining', '2026-10-30 15:00', 60, N'Completed', NULL,                       5, N'Tuyệt vời!'),
 ( 7, @coach1, N'MEM-00003', N'PT 1-1: Đánh giá giữa kỳ',          N'PersonalTraining', '2026-11-03 15:00', 60, N'Completed', N'Giảm 1.5kg sau 3 tuần', 5, N'Thấy rõ tiến bộ sau 3 tuần, cảm ơn HLV.'),
 ( 8, @coach1, N'MEM-00004', N'PT 1-1: HIIT cường độ cao',         N'PersonalTraining', '2026-11-06 15:00', 60, N'Completed', NULL,                       4, N'Buổi tập vui, hơi đông máy.'),
 ( 9, @coach1, NULL,         N'Trực sàn khu Gym buổi sáng',        N'FloorDuty',        '2026-11-04 10:00', 120, N'Completed', N'Hỗ trợ hội viên mới', NULL, NULL),
 (10, @coach1, N'MEM-00001', N'PT 1-1: Giáo án tăng sức bền tuần 4', N'PersonalTraining', '2026-11-11 15:00', 60, N'Confirmed', NULL, NULL, NULL),
 (11, @coach1, N'MEM-00002', N'PT 1-1: Lower body nâng cao',       N'PersonalTraining', '2026-11-13 15:00', 60, N'PendingMemberConfirmation', NULL, NULL, NULL),
 (12, @coach1, NULL,         N'Trực sàn khu Gym buổi sáng',        N'FloorDuty',        '2026-11-12 10:00', 120, N'Confirmed', NULL, NULL, NULL),
 (13, @coach1, N'MEM-00004', N'PT 1-1: Kiểm tra InBody tháng 11',  N'PersonalTraining', '2026-11-16 15:00', 60, N'Confirmed', NULL, NULL, NULL),
 (14, @coach1, N'MEM-00003', N'PT 1-1: Phục hồi chủ động',         N'PersonalTraining', '2026-11-10 15:00', 60, N'Declined', N'Hội viên bận công tác', NULL, NULL),
 (15, @coachB, N'MEM-00002', N'PT 1-1: Bơi sải nâng cao',          N'PersonalTraining', '2026-10-21 16:00', 60, N'Completed', NULL, 5, N'HLV bơi rất chuyên nghiệp.'),
 (16, @coachB, NULL,         N'Họp chuyên môn bộ môn Bơi',         N'Other',            '2026-11-14 09:00', 90, N'Confirmed', NULL, NULL, NULL),
 (17, @coach2, NULL,         N'Trực sân Golf 3D Simulator',        N'FloorDuty',        '2026-11-15 14:00', 180, N'Confirmed', NULL, NULL, NULL);

DECLARE @evk int = 1, @evId bigint;
WHILE @evk <= 17
BEGIN
    INSERT dbo.coach_work_events (center_id, coach_id, member_id, room_id, title, event_type, start_at, end_at, status, notes, created_by, created_at, updated_at)
    SELECT @center, e.coach_id, mp.id, CASE WHEN e.event_type = N'FloorDuty' THEN 2 END, e.title, e.event_type,
           DATEADD(hour, -7, e.start_local), DATEADD(minute, e.minutes, DATEADD(hour, -7, e.start_local)), e.status, e.notes,
           cp.user_id, DATEADD(day, -4, DATEADD(hour, -7, e.start_local)),
           CASE WHEN e.status <> N'Confirmed' THEN DATEADD(minute, e.minutes + 10, DATEADD(hour, -7, e.start_local)) END
    FROM @ev e
    JOIN dbo.coach_profiles cp ON cp.id = e.coach_id
    LEFT JOIN dbo.member_profiles mp ON mp.member_code = e.member_code
    WHERE e.k = @evk;
    SET @evId = SCOPE_IDENTITY();
    UPDATE @ev SET id = @evId WHERE k = @evk;
    SET @evk += 1;
END

INSERT dbo.coach_reviews (coach_id, member_id, work_event_id, rating, comment, created_at, updated_at)
SELECT e.coach_id, mp.id, e.id, e.rating, e.comment,
       DATEADD(hour, 5, DATEADD(hour, -7, e.start_local)), DATEADD(hour, 5, DATEADD(hour, -7, e.start_local))
FROM @ev e JOIN dbo.member_profiles mp ON mp.member_code = e.member_code
WHERE e.rating IS NOT NULL;

INSERT dbo.resource_bookings (resource_id, coach_id, work_event_id, start_at, end_at, purpose, status, created_at)
SELECT CASE WHEN e.coach_id = @coachB THEN 5 ELSE 1 END, e.coach_id, e.id,
       DATEADD(hour, -7, e.start_local), DATEADD(minute, e.minutes, DATEADD(hour, -7, e.start_local)),
       CONCAT(N'Phục vụ buổi: ', e.title), N'Confirmed', DATEADD(day, -4, DATEADD(hour, -7, e.start_local))
FROM @ev e
WHERE e.event_type = N'PersonalTraining' AND e.status IN (N'Completed', N'Confirmed', N'PendingMemberConfirmation');

INSERT dbo.resource_bookings (resource_id, coach_id, work_event_id, start_at, end_at, purpose, status, created_at) VALUES
 (3, @coach1, NULL, '2026-11-17 03:00', '2026-11-17 04:00', N'Chuẩn bị bài Pilates Reformer cho lớp Yoga', N'Confirmed', '2026-11-08 02:00'),
 (4, @coach1, NULL, '2026-11-05 03:00', '2026-11-05 04:00', N'Thử nghiệm bài Yoga bay',                   N'Cancelled', '2026-11-01 02:00');

/* ---------------------------------------------------------------- 10. coach leaves */
INSERT dbo.coach_leaves (coach_id, start_at, end_at, status, leave_type, manager_note, reason, requested_at, reviewed_at, reviewed_by, swap_coach_id) VALUES
 (@coach1, '2026-10-24 00:00', '2026-10-25 16:59', N'Approved', N'AnnualLeave', N'Đã duyệt, chúc nghỉ vui.',        N'Về quê dự đám cưới người thân', '2026-10-15 02:00', '2026-10-15 09:00', @manager, NULL),
 (@coach1, '2026-11-27 00:00', '2026-11-27 16:59', N'Pending',  N'SickLeave',   NULL,                               N'Lịch tái khám chấn thương vai', '2026-11-08 03:00', NULL, NULL, NULL),
 (@coachB, '2026-11-01 00:00', '2026-11-02 16:59', N'Rejected', N'AnnualLeave', N'Trùng đợt kiểm tra kỹ năng bơi.', N'Nghỉ phép cá nhân',             '2026-10-20 02:00', '2026-10-21 03:00', @manager, NULL),
 (@coach2, '2026-12-05 00:00', '2026-12-06 16:59', N'Pending',  N'AnnualLeave', NULL,                               N'Tham gia giải Golf nghiệp dư',  '2026-11-07 04:00', NULL, NULL, NULL);

/* ---------------------------------------------------------------- 11. coach <-> member messages */
DECLARE @msg TABLE (member_code nvarchar(50), from_coach bit, content nvarchar(4000), at datetime2);
INSERT @msg VALUES
 (N'MEM-00001', 0, N'Chào HLV, em muốn hỏi sau buổi PT có nên uống whey ngay không ạ?',            '2026-11-04 12:10'),
 (N'MEM-00001', 1, N'Chào Tuấn, nên uống trong 30–60 phút sau tập, kèm 1 quả chuối là ổn nhé.',     '2026-11-04 12:40'),
 (N'MEM-00001', 0, N'Dạ em cảm ơn HLV ạ!',                                                         '2026-11-04 12:45'),
 (N'MEM-00001', 1, N'Thứ Tư tuần sau mình tăng thêm 1 hiệp plank nhé, chuẩn bị tinh thần.',         '2026-11-08 10:05'),
 (N'MEM-00002', 0, N'HLV ơi, hôm nay em hơi đau cổ tay khi chống đẩy.',                             '2026-11-06 13:20'),
 (N'MEM-00002', 1, N'Em đổi sang chống đẩy trên nắm tay hoặc tựa tường 1 tuần, nếu còn đau báo anh.', '2026-11-06 14:00'),
 (N'MEM-00003', 0, N'Lịch PT thứ 2 tới em dời sang 16h được không ạ?',                             '2026-11-07 09:30'),
 (N'MEM-00003', 1, N'Được em, anh sẽ cập nhật lịch và gửi xác nhận lại.',                           '2026-11-07 10:15'),
 (N'MEM-00004', 0, N'Em đã ghi nhật ký ăn uống 3 ngày, HLV xem giúp em nhé.',                       '2026-11-08 14:00');

INSERT dbo.coach_messages (coach_id, member_id, sender_user_id, content, created_at, read_at)
SELECT @coach1, mp.id, CASE WHEN g.from_coach = 1 THEN @coach1User ELSE mp.user_id END, g.content, g.at,
       CASE WHEN g.at < '2026-11-08' THEN DATEADD(minute, 20, g.at) END
FROM @msg g JOIN dbo.member_profiles mp ON mp.member_code = g.member_code;

/* ---------------------------------------------------------------- 12. homework assignments & submissions */
DECLARE @as1 bigint, @as2 bigint, @as3 bigint, @as4 bigint;
INSERT dbo.assignments (coach_id, class_id, member_id, title, description, due_date, created_at, status)
VALUES (@coach1, 2, NULL, N'Thử thách plank 30 ngày',
        N'Mỗi ngày giữ plank tối thiểu 3 hiệp x 45 giây, ghi lại thời gian dài nhất và cảm nhận.', '2026-11-30 16:59', '2026-10-30 03:00', N'Active');
SET @as1 = SCOPE_IDENTITY();
INSERT dbo.assignments (coach_id, class_id, member_id, title, description, due_date, created_at, status)
VALUES (@coach1, 3, NULL, N'Chuỗi giãn cơ lưng buổi tối',
        N'Thực hiện chuỗi 6 động tác giãn cơ lưng trước khi ngủ, 5 buổi/tuần. Quay video 1 buổi gửi HLV.', '2026-11-20 16:59', '2026-11-02 02:00', N'Active');
SET @as2 = SCOPE_IDENTITY();
INSERT dbo.assignments (coach_id, class_id, member_id, title, description, due_date, created_at, status)
SELECT @coach1, NULL, id, N'Nhật ký dinh dưỡng 1 tuần',
       N'Ghi đầy đủ các bữa ăn trong 7 ngày vào mục Nhật ký ăn uống, chú ý lượng protein mỗi bữa.', '2026-11-15 16:59', '2026-11-05 03:00', N'Active'
FROM dbo.member_profiles WHERE member_code = N'MEM-00001';
SET @as3 = SCOPE_IDENTITY();
INSERT dbo.assignments (coach_id, class_id, member_id, title, description, due_date, created_at, status)
VALUES (@coach1, 1, NULL, N'Tập thở bơi sải 2-3 nhịp',
        N'Luyện thở 2 và 3 nhịp, mỗi buổi 10 vòng 50m. Ghi lại vòng nào bị hụt hơi.', '2026-11-25 16:59', '2026-11-03 01:00', N'Active');
SET @as4 = SCOPE_IDENTITY();

INSERT dbo.assignment_submissions (assignment_id, member_id, submitted_at, content, score, coach_feedback, status)
SELECT @as1, id, '2026-11-07 13:00', N'Đã giữ plank tốt nhất 1 phút 50 giây, hiệp cuối hơi run tay.', 88, N'Rất tốt! Tuần tới thử plank nghiêng mỗi bên 30 giây.', N'Reviewed'
FROM dbo.member_profiles WHERE member_code = N'MEM-00003'
UNION ALL
SELECT @as1, id, '2026-11-08 14:30', N'Plank 1 phút 20 giây, sẽ cố gắng tăng thêm.', NULL, NULL, N'Submitted'
FROM dbo.member_profiles WHERE member_code = N'MEM-00005'
UNION ALL
SELECT @as3, id, '2026-11-08 15:10', N'Ngày 1-3: trung bình 2100 kcal, protein ~110g/ngày. Chi tiết đã ghi trong nhật ký.', NULL, NULL, N'Submitted'
FROM dbo.member_profiles WHERE member_code = N'MEM-00001'
UNION ALL
SELECT @as4, id, '2026-11-06 12:00', N'Đã tập 4 buổi, thở 3 nhịp còn hụt ở vòng 7-8.', 75, N'Giảm tốc độ đạp chân để giữ nhịp thở đều hơn.', N'Reviewed'
FROM dbo.member_profiles WHERE member_code = N'MEM-00004';

/* ---------------------------------------------------------------- 13. health records, nutrition, food diary, progress reviews */
INSERT dbo.member_health_records (member_id, coach_id, record_type, title, details, occurred_on, status, created_at)
SELECT mp.id, @coach1, r.rt, r.title, r.details, r.occ, N'Active', DATEADD(hour, 3, CAST(r.occ AS datetime2))
FROM (VALUES
 (N'MEM-00001', N'CoachObservation', N'Sức bền tim mạch cải thiện', N'Nhịp tim nghỉ giảm từ 78 xuống 70 bpm sau 4 tuần.', CAST('2026-11-02' AS date)),
 (N'MEM-00001', N'Injury',           N'Căng cơ bắp chân nhẹ',      N'Đau nhẹ bắp chân trái sau chạy, nghỉ chạy 5 ngày, chườm lạnh.', CAST('2026-10-18' AS date)),
 (N'MEM-00002', N'MedicalCondition', N'Huyết áp thấp',             N'Dễ chóng mặt khi đứng dậy nhanh, tránh bài đổi tư thế đột ngột.', CAST('2026-10-12' AS date)),
 (N'MEM-00003', N'Injury',           N'Đau cổ tay phải',           N'Đau khi chống đẩy, thay bằng bài tựa tường trong 1 tuần.', CAST('2026-11-06' AS date)),
 (N'MEM-00004', N'CoachObservation', N'Lệch vai phải',             N'Vai phải thấp hơn ~1cm, bổ sung bài kéo cáp một tay.', CAST('2026-10-21' AS date)),
 (N'MEM-00005', N'MedicalCondition', N'Hen suyễn nhẹ',             N'Mang theo thuốc xịt, khởi động kỹ trước bài cường độ cao.', CAST('2026-10-14' AS date))
) r(code, rt, title, details, occ)
JOIN dbo.member_profiles mp ON mp.member_code = r.code;

INSERT dbo.nutrition_plans (member_id, coach_id, title, start_date, end_date, daily_calories, protein_grams, carb_grams, fat_grams,
                            meal_plan_json, notes, status, created_at, updated_at)
SELECT mp.id, @coach1, p.title, p.sd, p.ed, p.kcal, p.pro, p.carb, p.fat, p.menu, p.notes, N'Active', DATEADD(hour, 3, CAST(p.sd AS datetime2)), NULL
FROM (VALUES
 (N'MEM-00001', N'Thực đơn giảm mỡ giữ cơ', CAST('2026-11-01' AS date), CAST('2026-11-30' AS date), 2100, 140, 220, 60,
  N'{"menu":"Sáng: yến mạch + 2 trứng + chuối\nTrưa: cơm gạo lứt + ức gà 150g + rau xanh\nPhụ: sữa chua Hy Lạp\nTối: cá hồi 150g + khoai lang + salad"}', N'Uống 2.5L nước/ngày'),
 (N'MEM-00002', N'Thực đơn giữ dáng',       CAST('2026-10-20' AS date), CAST('2026-11-30' AS date), 1700, 95, 190, 55,
  N'{"menu":"Sáng: bánh mì đen + trứng\nTrưa: bún cá + rau\nPhụ: trái cây\nTối: đậu hũ + canh rau + cơm ít"}', N'Hạn chế đồ ngọt'),
 (N'MEM-00003', N'Thực đơn tăng cơ',        CAST('2026-11-03' AS date), CAST('2026-12-15' AS date), 2700, 160, 330, 75,
  N'{"menu":"Sáng: phở bò + 1 ly sữa\nTrưa: cơm + bò xào + rau\nPhụ: whey + chuối\nTối: cơm + cá + trứng"}', N'Ăn 5 bữa nhỏ'),
 (N'MEM-00004', N'Thực đơn giảm cân',       CAST('2026-10-25' AS date), CAST('2026-11-25' AS date), 1500, 100, 150, 45,
  N'{"menu":"Sáng: sinh tố rau + whey\nTrưa: salad ức gà\nPhụ: hạt hạnh nhân 20g\nTối: canh rau + cá hấp"}', N'Không ăn sau 20h')
) p(code, title, sd, ed, kcal, pro, carb, fat, menu, notes)
JOIN dbo.member_profiles mp ON mp.member_code = p.code;

INSERT dbo.food_diary_entries (member_id, entry_date, meal_type, food_name, calories, protein_grams, carb_grams, fat_grams, notes, created_at)
SELECT mp.id, DATEADD(day, -x.i, @today), f.meal, f.food, f.kcal + (ABS(CHECKSUM(CONCAT(mp.id, x.i, f.meal))) % 60) - 30, f.pro, f.carb, f.fat, NULL,
       DATEADD(hour, f.hr - 7, CAST(DATEADD(day, -x.i, @today) AS datetime2))
FROM dbo.member_profiles mp
JOIN @nums x ON x.i BETWEEN 1 AND 6
CROSS JOIN (VALUES
 (N'Bữa sáng', N'Yến mạch, 2 trứng luộc, 1 quả chuối', 480, 24.0, 62.0, 14.0, 7),
 (N'Bữa trưa', N'Cơm gạo lứt, ức gà áp chảo, rau luộc',  650, 45.0, 75.0, 15.0, 12),
 (N'Bữa phụ',  N'Sữa chua Hy Lạp, hạt điều',             250, 15.0, 18.0, 12.0, 16),
 (N'Bữa tối',  N'Cá hồi nướng, khoai lang, salad',       600, 38.0, 50.0, 24.0, 19)
) f(meal, food, kcal, pro, carb, fat, hr)
WHERE mp.member_code IN (N'MEM-00001', N'MEM-00002');

INSERT dbo.member_progress_reviews (member_id, coach_id, training_plan_id, review_date, progress_score, weight, body_fat_percentage, review_note, next_goal, created_at)
SELECT mp.id, @coach1, tp.id, r.rd, r.score, r.w, r.bf, r.note, r.goal, DATEADD(hour, 4, CAST(r.rd AS datetime2))
FROM (VALUES
 (N'MEM-00001', CAST('2026-10-05' AS date), 62.0, 80.5, 24.5, N'Đánh giá đầu vào: sức bền thấp, kỹ thuật cơ bản ổn.', N'Giảm 2kg trong tháng 10'),
 (N'MEM-00001', CAST('2026-11-05' AS date), 74.0, 78.6, 22.8, N'Giảm 1.9kg, cardio cải thiện rõ.',                  N'Plank 2 phút, giảm thêm 2kg'),
 (N'MEM-00002', CAST('2026-11-04' AS date), 70.0, 55.2, 26.0, N'Tư thế cải thiện, cần tăng sức mạnh thân trên.',   N'Chống đẩy 10 cái chuẩn'),
 (N'MEM-00003', CAST('2026-11-03' AS date), 68.0, 71.0, 18.5, N'Tăng 1kg cơ, sức mạnh squat +10kg.',                N'Squat 80kg x 5'),
 (N'MEM-00004', CAST('2026-11-06' AS date), 72.0, 58.4, 28.1, N'Giảm 1.2kg, ăn uống kỷ luật hơn.',                   N'Giảm thêm 1.5kg')
) r(code, rd, score, w, bf, note, goal)
JOIN dbo.member_profiles mp ON mp.member_code = r.code
OUTER APPLY (SELECT TOP 1 t.id FROM dbo.training_plans t WHERE t.member_id = mp.id AND t.coach_id = @coach1 ORDER BY t.id DESC) tp;

/* ---------------------------------------------------------------- 14. equipment issues */
INSERT dbo.equipment_issues (center_id, resource_id, reported_by_user_id, title, description, severity, photo_url, status, resolution_note, resolved_by, reported_at, resolved_at) VALUES
 (@center, 5, @coach1User, N'Dây cáp đa năng bị sờn',        N'Dây cáp bên trái có dấu hiệu sờn gần ròng rọc, tạm ngưng sử dụng.', N'High',     NULL, N'InProgress', NULL, NULL, '2026-11-06 02:30', NULL),
 (@center, 3, @coach1User, N'Máy Reformer kêu khi trượt',    N'Bàn trượt phát ra tiếng kêu, cần tra dầu ray.',                     N'Low',      NULL, N'Resolved', N'Đã vệ sinh và tra dầu ray trượt.', @manager, '2026-10-20 03:00', '2026-10-21 08:00'),
 (@center, 2, (SELECT user_id FROM dbo.coach_profiles WHERE id = @coachB), N'Bao cát bị rách đường may', N'Bao cát số 3 rách đường may đáy, cát rơi ra sàn.', N'Medium', NULL, N'Open', NULL, NULL, '2026-11-08 11:15', NULL),
 (@center, 1, @coach1User, N'Sàn cao su khu PT bị bong',     N'Một tấm sàn cao su bị bong mép, dễ vấp ngã.',                        N'Critical', NULL, N'Open', NULL, NULL, '2026-11-09 01:20', NULL),
 (@center, 4, @coach1User, N'Khung Yoga bay thiếu móc khóa', N'Thiếu 1 móc khóa an toàn ở võng số 2.',                              N'Medium',   NULL, N'Closed', N'Đã thay bộ móc khóa mới.', @manager, '2026-10-10 02:00', '2026-10-11 04:00');

/* ---------------------------------------------------------------- 15. staff compensation & coach sales credits */
INSERT dbo.staff_compensation_policies (user_id, center_id, monthly_base_salary, monthly_allowance, effective_from, effective_to, status, updated_by, updated_at) VALUES
 (@manager,   @center, 15000000, 2000000, '2026-10-01', NULL, N'Active', @admin, '2026-10-01 02:00'),
 (@reception, @center,  7500000,  800000, '2026-10-01', NULL, N'Active', @admin, '2026-10-01 02:00');

INSERT dbo.coach_sales_credits (coach_id, member_id, subscription_id, amount, credited_at, note, created_by)
SELECT CASE WHEN ROW_NUMBER() OVER (ORDER BY ms.id) % 3 = 0 THEN @coachB ELSE @coach1 END,
       ms.member_id, ms.id, CAST(ms.price * 0.05 AS decimal(18,2)), ms.created_at, N'Hoa hồng tư vấn gói tập (5%)', @manager
FROM dbo.member_subscriptions ms
JOIN @m m ON m.member_id = ms.member_id
WHERE ms.created_at >= '2026-10-01' AND ms.price >= 1800000;

/* ---------------------------------------------------------------- 16. support requests */
DECLARE @sr TABLE (k int PRIMARY KEY, code nvarchar(50), subject nvarchar(200), descr nvarchar(2000), status nvarchar(30), priority nvarchar(20),
                   created datetime2, reply nvarchar(2000) NULL, id bigint NULL);
INSERT @sr (k, code, subject, descr, status, priority, created, reply) VALUES
 (1, N'MEM-00001', N'[Gói tập & Thẻ]',      N'Em muốn nâng cấp từ gói Basic lên gói Pro thì phí chênh lệch thế nào ạ?', N'Open',       N'Normal', '2026-11-08 03:20', NULL),
 (2, N'MEM-00002', N'[Cơ sở vật chất]',     N'Vòi sen số 4 phòng thay đồ nam không có nước nóng.',                     N'InProgress', N'High',   '2026-11-07 12:10', N'Đã báo bộ phận kỹ thuật, dự kiến sửa xong trong hôm nay.'),
 (3, N'MEM-00003', N'[Lịch tập]',          N'Lớp Yoga thứ Năm có thể mở thêm khung 18h không ạ?',                     N'Resolved',   N'Low',    '2026-10-28 02:00', N'Trung tâm đã ghi nhận và sẽ mở lớp mới từ tháng 12.'),
 (4, N'MEM-00001', N'[Thanh toán]',        N'Em đã chuyển khoản VNPay nhưng gói vẫn chưa kích hoạt.',                 N'Resolved',   N'Urgent', '2026-10-19 04:30', N'Giao dịch đã được đối soát và kích hoạt gói. Xin lỗi vì sự bất tiện.'),
 (5, N'MEM-00002', N'[Huấn luyện viên]',   N'Em muốn đăng ký thêm 4 buổi PT 1-1 với HLV lớp Gym.',                    N'Open',       N'Normal', '2026-11-09 01:45', NULL),
 (6, N'MEM-00003', N'[Khác]',              N'Em làm mất thẻ hội viên, cần cấp lại.',                                  N'InProgress', N'Normal', '2026-11-05 10:00', N'Vui lòng ghé quầy lễ tân mang theo CCCD để cấp lại thẻ.');

DECLARE @srk int = 1, @srId bigint;
WHILE @srk <= 6
BEGIN
    INSERT dbo.support_requests (member_id, handled_by, subject, description, status, created_at, resolved_at, center_id, requester_id, priority)
    SELECT mp.id, CASE WHEN s.status = N'Open' THEN NULL ELSE @manager END, s.subject, s.descr, s.status, s.created,
           CASE WHEN s.status = N'Resolved' THEN DATEADD(hour, 6, s.created) END, @center, mp.user_id, s.priority
    FROM @sr s
    CROSS APPLY (SELECT TOP 1 id, user_id FROM dbo.member_profiles
                 WHERE member_code = s.code OR NOT EXISTS (SELECT 1 FROM dbo.member_profiles WHERE member_code = s.code)
                 ORDER BY CASE WHEN member_code = s.code THEN 0 ELSE 1 END, id) mp
    WHERE s.k = @srk;
    SET @srId = SCOPE_IDENTITY();
    UPDATE @sr SET id = @srId WHERE k = @srk;
    SET @srk += 1;
END

INSERT dbo.support_request_messages (request_id, sender_id, message, created_at)
SELECT s.id, @manager, s.reply, DATEADD(hour, 2, s.created) FROM @sr s WHERE s.reply IS NOT NULL;

/* ---------------------------------------------------------------- marker */
INSERT dbo.system_settings (setting_key, setting_value, description, updated_by, updated_at)
VALUES (N'seed.demo-data.full-dashboard.v2', N'applied', N'Demo data for existing members: renewal history since Jun 2026, sessions, attendance, check-ins and coach workspace data.', @admin, @nowUtc);

COMMIT TRANSACTION;
PRINT N'Demo data seeded successfully.';
