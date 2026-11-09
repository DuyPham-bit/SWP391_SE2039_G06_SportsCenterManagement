SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

BEGIN TRANSACTION;

-- 1. Distribute the 12 invoices across 2026-10-12 to 2026-11-07
-- Invoice 30109: 2026-10-12 (650,000đ)
UPDATE dbo.invoices SET issued_at = '2026-10-12 09:15:00', paid_at = '2026-10-12 09:15:00' WHERE id = 30109;
UPDATE dbo.payments SET paid_at = '2026-10-12 09:15:00', created_at = '2026-10-12 09:15:00', attempted_at = '2026-10-12 09:14:40' WHERE invoice_id = 30109;
UPDATE s SET s.start_date = '2026-10-12', s.end_date = DATEADD(day, s.duration_days - 1, '2026-10-12'), s.created_at = '2026-10-12 09:15:00', s.updated_at = '2026-10-12 09:15:00'
FROM dbo.member_subscriptions s JOIN dbo.invoice_items it ON it.subscription_id = s.id WHERE it.invoice_id = 30109;

-- Invoice 30101: 2026-10-14 (1,800,000đ)
UPDATE dbo.invoices SET issued_at = '2026-10-14 14:20:00', paid_at = '2026-10-14 14:20:00' WHERE id = 30101;
UPDATE dbo.payments SET paid_at = '2026-10-14 14:20:00', created_at = '2026-10-14 14:20:00', attempted_at = '2026-10-14 14:19:40' WHERE invoice_id = 30101;
UPDATE s SET s.start_date = '2026-10-14', s.end_date = DATEADD(day, s.duration_days - 1, '2026-10-14'), s.created_at = '2026-10-14 14:20:00', s.updated_at = '2026-10-14 14:20:00'
FROM dbo.member_subscriptions s JOIN dbo.invoice_items it ON it.subscription_id = s.id WHERE it.invoice_id = 30101;

-- Invoice 30103: 2026-10-17 (3,200,000đ)
UPDATE dbo.invoices SET issued_at = '2026-10-17 10:45:00', paid_at = '2026-10-17 10:45:00' WHERE id = 30103;
UPDATE dbo.payments SET paid_at = '2026-10-17 10:45:00', created_at = '2026-10-17 10:45:00', attempted_at = '2026-10-17 10:44:40' WHERE invoice_id = 30103;
UPDATE s SET s.start_date = '2026-10-17', s.end_date = DATEADD(day, s.duration_days - 1, '2026-10-17'), s.created_at = '2026-10-17 10:45:00', s.updated_at = '2026-10-17 10:45:00'
FROM dbo.member_subscriptions s JOIN dbo.invoice_items it ON it.subscription_id = s.id WHERE it.invoice_id = 30103;

-- Invoice 30111: 2026-10-19 (1,800,000đ)
UPDATE dbo.invoices SET issued_at = '2026-10-19 16:30:00', paid_at = '2026-10-19 16:30:00' WHERE id = 30111;
UPDATE dbo.payments SET paid_at = '2026-10-19 16:30:00', created_at = '2026-10-19 16:30:00', attempted_at = '2026-10-19 16:29:40' WHERE invoice_id = 30111;
UPDATE s SET s.start_date = '2026-10-19', s.end_date = DATEADD(day, s.duration_days - 1, '2026-10-19'), s.created_at = '2026-10-19 16:30:00', s.updated_at = '2026-10-19 16:30:00'
FROM dbo.member_subscriptions s JOIN dbo.invoice_items it ON it.subscription_id = s.id WHERE it.invoice_id = 30111;

-- Invoice 30107: 2026-10-21 (1,800,000đ)
UPDATE dbo.invoices SET issued_at = '2026-10-21 11:10:00', paid_at = '2026-10-21 11:10:00' WHERE id = 30107;
UPDATE dbo.payments SET paid_at = '2026-10-21 11:10:00', created_at = '2026-10-21 11:10:00', attempted_at = '2026-10-21 11:09:40' WHERE invoice_id = 30107;
UPDATE s SET s.start_date = '2026-10-21', s.end_date = DATEADD(day, s.duration_days - 1, '2026-10-21'), s.created_at = '2026-10-21 11:10:00', s.updated_at = '2026-10-21 11:10:00'
FROM dbo.member_subscriptions s JOIN dbo.invoice_items it ON it.subscription_id = s.id WHERE it.invoice_id = 30107;

-- Invoice 30113: 2026-10-23 (3,200,000đ)
UPDATE dbo.invoices SET issued_at = '2026-10-23 15:05:00', paid_at = '2026-10-23 15:05:00' WHERE id = 30113;
UPDATE dbo.payments SET paid_at = '2026-10-23 15:05:00', created_at = '2026-10-23 15:05:00', attempted_at = '2026-10-23 15:04:40' WHERE invoice_id = 30113;
UPDATE s SET s.start_date = '2026-10-23', s.end_date = DATEADD(day, s.duration_days - 1, '2026-10-23'), s.created_at = '2026-10-23 15:05:00', s.updated_at = '2026-10-23 15:05:00'
FROM dbo.member_subscriptions s JOIN dbo.invoice_items it ON it.subscription_id = s.id WHERE it.invoice_id = 30113;

-- Invoice 30105: 2026-10-25 (5,800,000đ)
UPDATE dbo.invoices SET issued_at = '2026-10-25 08:50:00', paid_at = '2026-10-25 08:50:00' WHERE id = 30105;
UPDATE dbo.payments SET paid_at = '2026-10-25 08:50:00', created_at = '2026-10-25 08:50:00', attempted_at = '2026-10-25 08:49:40' WHERE invoice_id = 30105;
UPDATE s SET s.start_date = '2026-10-25', s.end_date = DATEADD(day, s.duration_days - 1, '2026-10-25'), s.created_at = '2026-10-25 08:50:00', s.updated_at = '2026-10-25 08:50:00'
FROM dbo.member_subscriptions s JOIN dbo.invoice_items it ON it.subscription_id = s.id WHERE it.invoice_id = 30105;

-- Invoice 30094: 2026-10-28 (650,000đ)
UPDATE dbo.invoices SET issued_at = '2026-10-28 10:15:00', paid_at = '2026-10-28 10:15:00' WHERE id = 30094;
UPDATE dbo.payments SET paid_at = '2026-10-28 10:15:00', created_at = '2026-10-28 10:15:00', attempted_at = '2026-10-28 10:14:40' WHERE invoice_id = 30094;
UPDATE s SET s.start_date = '2026-10-28', s.end_date = DATEADD(day, s.duration_days - 1, '2026-10-28'), s.created_at = '2026-10-28 10:15:00', s.updated_at = '2026-10-28 10:15:00'
FROM dbo.member_subscriptions s JOIN dbo.invoice_items it ON it.subscription_id = s.id WHERE it.invoice_id = 30094;

-- Invoice 30096: 2026-10-31 (1,800,000đ)
UPDATE dbo.invoices SET issued_at = '2026-10-31 14:00:00', paid_at = '2026-10-31 14:00:00' WHERE id = 30096;
UPDATE dbo.payments SET paid_at = '2026-10-31 14:00:00', created_at = '2026-10-31 14:00:00', attempted_at = '2026-10-31 13:59:40' WHERE invoice_id = 30096;
UPDATE s SET s.start_date = '2026-10-31', s.end_date = DATEADD(day, s.duration_days - 1, '2026-10-31'), s.created_at = '2026-10-31 14:00:00', s.updated_at = '2026-10-31 14:00:00'
FROM dbo.member_subscriptions s JOIN dbo.invoice_items it ON it.subscription_id = s.id WHERE it.invoice_id = 30096;

-- Invoice 30098: 2026-11-02 (3,200,000đ)
UPDATE dbo.invoices SET issued_at = '2026-11-02 09:30:00', paid_at = '2026-11-02 09:30:00' WHERE id = 30098;
UPDATE dbo.payments SET paid_at = '2026-11-02 09:30:00', created_at = '2026-11-02 09:30:00', attempted_at = '2026-11-02 09:29:40' WHERE invoice_id = 30098;
UPDATE s SET s.start_date = '2026-11-02', s.end_date = DATEADD(day, s.duration_days - 1, '2026-11-02'), s.created_at = '2026-11-02 09:30:00', s.updated_at = '2026-11-02 09:30:00'
FROM dbo.member_subscriptions s JOIN dbo.invoice_items it ON it.subscription_id = s.id WHERE it.invoice_id = 30098;

-- Invoice 30091: 2026-11-04 (3,200,000đ)
UPDATE dbo.invoices SET issued_at = '2026-11-04 16:20:00', paid_at = '2026-11-04 16:20:00' WHERE id = 30091;
UPDATE dbo.payments SET paid_at = '2026-11-04 16:20:00', created_at = '2026-11-04 16:20:00', attempted_at = '2026-11-04 16:19:40' WHERE invoice_id = 30091;
UPDATE s SET s.start_date = '2026-11-04', s.end_date = DATEADD(day, s.duration_days - 1, '2026-11-04'), s.created_at = '2026-11-04 16:20:00', s.updated_at = '2026-11-04 16:20:00'
FROM dbo.member_subscriptions s JOIN dbo.invoice_items it ON it.subscription_id = s.id WHERE it.invoice_id = 30091;

-- Invoice 30100: 2026-11-07 (5,800,000đ)
UPDATE dbo.invoices SET issued_at = '2026-11-07 10:00:00', paid_at = '2026-11-07 10:00:00' WHERE id = 30100;
UPDATE dbo.payments SET paid_at = '2026-11-07 10:00:00', created_at = '2026-11-07 10:00:00', attempted_at = '2026-11-07 09:59:40' WHERE invoice_id = 30100;
UPDATE s SET s.start_date = '2026-11-07', s.end_date = DATEADD(day, s.duration_days - 1, '2026-11-07'), s.created_at = '2026-11-07 10:00:00', s.updated_at = '2026-11-07 10:00:00'
FROM dbo.member_subscriptions s JOIN dbo.invoice_items it ON it.subscription_id = s.id WHERE it.invoice_id = 30100;

-- 2. Add 2 realistic refunds
DECLARE @adminId bigint = (SELECT TOP 1 id FROM dbo.users WHERE username = N'admin');
IF NOT EXISTS (SELECT 1 FROM dbo.payment_refunds WHERE payment_id = 30086)
BEGIN
    INSERT INTO dbo.payment_refunds (payment_id, amount, status, idempotency_key, reason, requested_by, created_at, processed_at)
    VALUES (30086, 200000, N'Succeeded', LOWER(NEWID()), N'Hoàn phí dịch vụ tư vấn thể lực', @adminId, '2026-10-18 10:00:00', '2026-10-18 10:30:00');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.payment_refunds WHERE payment_id = 30076)
BEGIN
    INSERT INTO dbo.payment_refunds (payment_id, amount, status, idempotency_key, reason, requested_by, created_at, processed_at)
    VALUES (30076, 350000, N'Succeeded', LOWER(NEWID()), N'Hoàn phí gia hạn ưu đãi hội viên cũ', @adminId, '2026-11-05 14:00:00', '2026-11-05 14:20:00');
END;

COMMIT TRANSACTION;
PRINT N'REVENUE DISTRIBUTION UPDATED SUCCESSFULLY';

