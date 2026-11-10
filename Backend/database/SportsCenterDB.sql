-- SportsCenter Management System Unified Database Script
-- Schema Generated via Entity Framework Core Migrations

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[centers] (
        [Id] bigint NOT NULL IDENTITY,
        [name] nvarchar(150) NOT NULL,
        [address] nvarchar(255) NOT NULL,
        [phone] nvarchar(20) NULL,
        [email] nvarchar(150) NULL,
        [description] nvarchar(500) NULL,
        [opening_time] time NULL,
        [closing_time] time NULL,
        [status] nvarchar(30) NOT NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_centers] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[permissions] (
        [Id] bigint NOT NULL IDENTITY,
        [code] nvarchar(100) NOT NULL,
        [name] nvarchar(100) NOT NULL,
        [description] nvarchar(255) NULL,
        CONSTRAINT [PK_permissions] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[roles] (
        [Id] bigint NOT NULL IDENTITY,
        [name] nvarchar(50) NOT NULL,
        [description] nvarchar(255) NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_roles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[sports] (
        [Id] bigint NOT NULL IDENTITY,
        [name] nvarchar(100) NOT NULL,
        [description] nvarchar(500) NULL,
        [status] nvarchar(30) NOT NULL,
        CONSTRAINT [PK_sports] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[membership_packages] (
        [Id] bigint NOT NULL IDENTITY,
        [center_id] bigint NOT NULL,
        [name] nvarchar(150) NOT NULL,
        [description] nvarchar(500) NULL,
        [duration_days] int NOT NULL,
        [price] decimal(12,2) NOT NULL,
        [max_classes] int NULL,
        [access_type] nvarchar(50) NULL,
        [status] nvarchar(30) NOT NULL,
        [created_at] datetime2 NOT NULL,
        [updated_at] datetime2 NULL,
        CONSTRAINT [PK_membership_packages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_membership_packages_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[rooms] (
        [Id] bigint NOT NULL IDENTITY,
        [center_id] bigint NOT NULL,
        [name] nvarchar(100) NOT NULL,
        [room_type] nvarchar(100) NULL,
        [capacity] int NOT NULL,
        [location_description] nvarchar(255) NULL,
        [status] nvarchar(30) NOT NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_rooms] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_rooms_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[role_permissions] (
        [role_id] bigint NOT NULL,
        [permission_id] bigint NOT NULL,
        CONSTRAINT [PK_role_permissions] PRIMARY KEY ([role_id], [permission_id]),
        CONSTRAINT [FK_role_permissions_permissions_permission_id] FOREIGN KEY ([permission_id]) REFERENCES [dbo].[permissions] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_role_permissions_roles_role_id] FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[users] (
        [Id] bigint NOT NULL IDENTITY,
        [username] nvarchar(100) NOT NULL,
        [email] nvarchar(150) NOT NULL,
        [password_hash] nvarchar(255) NOT NULL,
        [phone] nvarchar(20) NULL,
        [role_id] bigint NOT NULL,
        [status] nvarchar(30) NOT NULL,
        [last_login_at] datetime2 NULL,
        [failed_login_attempts] int NOT NULL,
        [locked_until] datetime2 NULL,
        [created_at] datetime2 NOT NULL,
        [updated_at] datetime2 NULL,
        CONSTRAINT [PK_users] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_users_roles_role_id] FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[exercises] (
        [Id] bigint NOT NULL IDENTITY,
        [sport_id] bigint NULL,
        [name] nvarchar(150) NOT NULL,
        [description] nvarchar(1000) NULL,
        [muscle_group] nvarchar(100) NULL,
        [difficulty_level] nvarchar(50) NULL,
        [instructions] nvarchar(max) NULL,
        [video_url] nvarchar(500) NULL,
        [status] nvarchar(30) NOT NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_exercises] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_exercises_sports_sport_id] FOREIGN KEY ([sport_id]) REFERENCES [dbo].[sports] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[classes] (
        [Id] bigint NOT NULL IDENTITY,
        [center_id] bigint NOT NULL,
        [sport_id] bigint NOT NULL,
        [room_id] bigint NULL,
        [name] nvarchar(150) NOT NULL,
        [description] nvarchar(1000) NULL,
        [level] nvarchar(50) NULL,
        [capacity] int NOT NULL,
        [duration_minutes] int NOT NULL,
        [status] nvarchar(30) NOT NULL,
        [created_at] datetime2 NOT NULL,
        [updated_at] datetime2 NULL,
        CONSTRAINT [PK_classes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_classes_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_classes_rooms_room_id] FOREIGN KEY ([room_id]) REFERENCES [dbo].[rooms] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_classes_sports_sport_id] FOREIGN KEY ([sport_id]) REFERENCES [dbo].[sports] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[audit_logs] (
        [Id] bigint NOT NULL IDENTITY,
        [user_id] bigint NULL,
        [action] nvarchar(100) NOT NULL,
        [entity_type] nvarchar(100) NOT NULL,
        [entity_id] bigint NULL,
        [old_values] nvarchar(max) NULL,
        [new_values] nvarchar(max) NULL,
        [ip_address] nvarchar(45) NULL,
        [user_agent] nvarchar(500) NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_audit_logs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_audit_logs_users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[coach_profiles] (
        [Id] bigint NOT NULL IDENTITY,
        [user_id] bigint NOT NULL,
        [center_id] bigint NOT NULL,
        [coach_code] nvarchar(50) NOT NULL,
        [full_name] nvarchar(150) NOT NULL,
        [specialization] nvarchar(255) NULL,
        [certification] nvarchar(500) NULL,
        [experience_years] int NULL,
        [bio] nvarchar(max) NULL,
        [hire_date] date NULL,
        [status] nvarchar(30) NOT NULL,
        [created_at] datetime2 NOT NULL,
        [updated_at] datetime2 NULL,
        CONSTRAINT [PK_coach_profiles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_coach_profiles_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_coach_profiles_users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[member_profiles] (
        [Id] bigint NOT NULL IDENTITY,
        [user_id] bigint NOT NULL,
        [member_code] nvarchar(50) NOT NULL,
        [full_name] nvarchar(150) NOT NULL,
        [date_of_birth] date NULL,
        [gender] nvarchar(20) NULL,
        [address] nvarchar(255) NULL,
        [emergency_contact_name] nvarchar(150) NULL,
        [emergency_contact_phone] nvarchar(20) NULL,
        [fitness_goal] nvarchar(500) NULL,
        [fitness_level] nvarchar(50) NULL,
        [medical_note] nvarchar(1000) NULL,
        [height_cm] decimal(5,2) NULL,
        [weight_kg] decimal(5,2) NULL,
        [booking_suspended_until] datetime2 NULL,
        [created_at] datetime2 NOT NULL,
        [updated_at] datetime2 NULL,
        CONSTRAINT [PK_member_profiles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_member_profiles_users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[notifications] (
        [Id] bigint NOT NULL IDENTITY,
        [sender_id] bigint NOT NULL,
        [title] nvarchar(200) NOT NULL,
        [message] nvarchar(max) NOT NULL,
        [notification_type] nvarchar(50) NOT NULL,
        [created_at] datetime2 NOT NULL,
        [scheduled_at] datetime2 NULL,
        CONSTRAINT [PK_notifications] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_notifications_users_sender_id] FOREIGN KEY ([sender_id]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[password_reset_tokens] (
        [Id] bigint NOT NULL IDENTITY,
        [user_id] bigint NOT NULL,
        [token] nvarchar(255) NOT NULL,
        [expires_at] datetime2 NOT NULL,
        [used_at] datetime2 NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_password_reset_tokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_password_reset_tokens_users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[staff_profiles] (
        [Id] bigint NOT NULL IDENTITY,
        [user_id] bigint NOT NULL,
        [center_id] bigint NOT NULL,
        [staff_code] nvarchar(50) NOT NULL,
        [full_name] nvarchar(150) NOT NULL,
        [position] nvarchar(100) NOT NULL,
        [hire_date] date NULL,
        [status] nvarchar(30) NOT NULL,
        [created_at] datetime2 NOT NULL,
        [updated_at] datetime2 NULL,
        CONSTRAINT [PK_staff_profiles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_staff_profiles_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_staff_profiles_users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[system_settings] (
        [Id] bigint NOT NULL IDENTITY,
        [setting_key] nvarchar(100) NOT NULL,
        [setting_value] nvarchar(max) NULL,
        [description] nvarchar(500) NULL,
        [updated_by] bigint NULL,
        [updated_at] datetime2 NULL,
        CONSTRAINT [PK_system_settings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_system_settings_users_updated_by] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[class_schedules] (
        [Id] bigint NOT NULL IDENTITY,
        [class_id] bigint NOT NULL,
        [room_id] bigint NULL,
        [day_of_week] int NOT NULL,
        [start_time] time NOT NULL,
        [end_time] time NOT NULL,
        [start_date] date NULL,
        [end_date] date NULL,
        [status] nvarchar(30) NOT NULL,
        CONSTRAINT [PK_class_schedules] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_class_schedules_classes_class_id] FOREIGN KEY ([class_id]) REFERENCES [dbo].[classes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_class_schedules_rooms_room_id] FOREIGN KEY ([room_id]) REFERENCES [dbo].[rooms] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[class_coaches] (
        [class_id] bigint NOT NULL,
        [coach_id] bigint NOT NULL,
        [assigned_date] date NULL,
        [is_primary] bit NOT NULL,
        [Id] bigint NOT NULL,
        CONSTRAINT [PK_class_coaches] PRIMARY KEY ([class_id], [coach_id]),
        CONSTRAINT [FK_class_coaches_classes_class_id] FOREIGN KEY ([class_id]) REFERENCES [dbo].[classes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_class_coaches_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[ai_conversations] (
        [Id] bigint NOT NULL IDENTITY,
        [user_id] bigint NOT NULL,
        [member_id] bigint NULL,
        [title] nvarchar(200) NOT NULL,
        [conversation_type] nvarchar(50) NOT NULL,
        [created_at] datetime2 NOT NULL,
        [updated_at] datetime2 NOT NULL,
        CONSTRAINT [PK_ai_conversations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ai_conversations_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ai_conversations_users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[assignments] (
        [Id] bigint NOT NULL IDENTITY,
        [coach_id] bigint NULL,
        [class_id] bigint NULL,
        [member_id] bigint NULL,
        [title] nvarchar(200) NOT NULL,
        [description] nvarchar(max) NULL,
        [due_date] datetime2 NULL,
        [created_at] datetime2 NOT NULL,
        [status] nvarchar(30) NOT NULL,
        CONSTRAINT [PK_assignments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_assignments_classes_class_id] FOREIGN KEY ([class_id]) REFERENCES [dbo].[classes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_assignments_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_assignments_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[center_checkins] (
        [Id] bigint NOT NULL IDENTITY,
        [member_id] bigint NOT NULL,
        [center_id] bigint NOT NULL,
        [checked_in_by] bigint NULL,
        [check_in_time] datetime2 NOT NULL,
        [check_out_time] datetime2 NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_center_checkins] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_center_checkins_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_center_checkins_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_center_checkins_users_checked_in_by] FOREIGN KEY ([checked_in_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[class_waitlist] (
        [Id] bigint NOT NULL IDENTITY,
        [class_id] bigint NOT NULL,
        [member_id] bigint NOT NULL,
        [joined_at] datetime2 NOT NULL,
        [status] nvarchar(30) NOT NULL,
        CONSTRAINT [PK_class_waitlist] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_class_waitlist_classes_class_id] FOREIGN KEY ([class_id]) REFERENCES [dbo].[classes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_class_waitlist_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[invoices] (
        [Id] bigint NOT NULL IDENTITY,
        [invoice_number] nvarchar(50) NOT NULL,
        [member_id] bigint NOT NULL,
        [center_id] bigint NOT NULL,
        [created_by] bigint NULL,
        [subtotal] decimal(12,2) NOT NULL,
        [discount] decimal(12,2) NOT NULL,
        [tax] decimal(12,2) NOT NULL,
        [total_amount] decimal(12,2) NOT NULL,
        [status] nvarchar(30) NOT NULL,
        [issued_at] datetime2 NOT NULL,
        [paid_at] datetime2 NULL,
        CONSTRAINT [PK_invoices] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_invoices_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_invoices_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_invoices_users_created_by] FOREIGN KEY ([created_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[member_subscriptions] (
        [Id] bigint NOT NULL IDENTITY,
        [member_id] bigint NOT NULL,
        [package_id] bigint NOT NULL,
        [start_date] date NOT NULL,
        [end_date] date NOT NULL,
        [price] decimal(12,2) NOT NULL,
        [status] nvarchar(30) NOT NULL,
        [auto_renew] bit NOT NULL,
        [created_at] datetime2 NOT NULL,
        [updated_at] datetime2 NULL,
        CONSTRAINT [PK_member_subscriptions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_member_subscriptions_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_member_subscriptions_membership_packages_package_id] FOREIGN KEY ([package_id]) REFERENCES [dbo].[membership_packages] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[support_requests] (
        [Id] bigint NOT NULL IDENTITY,
        [member_id] bigint NOT NULL,
        [handled_by] bigint NULL,
        [subject] nvarchar(200) NOT NULL,
        [description] nvarchar(max) NOT NULL,
        [priority] nvarchar(30) NOT NULL,
        [status] nvarchar(30) NOT NULL,
        [created_at] datetime2 NOT NULL,
        [resolved_at] datetime2 NULL,
        CONSTRAINT [PK_support_requests] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_support_requests_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_support_requests_users_handled_by] FOREIGN KEY ([handled_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[training_plans] (
        [Id] bigint NOT NULL IDENTITY,
        [member_id] bigint NOT NULL,
        [class_id] bigint NULL,
        [coach_id] bigint NOT NULL,
        [name] nvarchar(150) NOT NULL,
        [description] nvarchar(1000) NULL,
        [goal] nvarchar(500) NULL,
        [start_date] date NOT NULL,
        [end_date] date NULL,
        [plan_type] nvarchar(30) NOT NULL,
        [status] nvarchar(30) NOT NULL,
        [created_at] datetime2 NOT NULL,
        [updated_at] datetime2 NULL,
        CONSTRAINT [PK_training_plans] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_training_plans_classes_class_id] FOREIGN KEY ([class_id]) REFERENCES [dbo].[classes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_training_plans_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_training_plans_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[user_notifications] (
        [Id] bigint NOT NULL IDENTITY,
        [notification_id] bigint NOT NULL,
        [user_id] bigint NOT NULL,
        [is_read] bit NOT NULL,
        [read_at] datetime2 NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_user_notifications] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_user_notifications_notifications_notification_id] FOREIGN KEY ([notification_id]) REFERENCES [dbo].[notifications] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_user_notifications_users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[class_sessions] (
        [Id] bigint NOT NULL IDENTITY,
        [class_id] bigint NOT NULL,
        [schedule_id] bigint NULL,
        [room_id] bigint NULL,
        [coach_id] bigint NULL,
        [session_date] date NOT NULL,
        [start_time] time NOT NULL,
        [end_time] time NOT NULL,
        [session_status] nvarchar(30) NOT NULL,
        [notes] nvarchar(1000) NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_class_sessions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_class_sessions_class_schedules_schedule_id] FOREIGN KEY ([schedule_id]) REFERENCES [dbo].[class_schedules] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_class_sessions_classes_class_id] FOREIGN KEY ([class_id]) REFERENCES [dbo].[classes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_class_sessions_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_class_sessions_rooms_room_id] FOREIGN KEY ([room_id]) REFERENCES [dbo].[rooms] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[ai_messages] (
        [Id] bigint NOT NULL IDENTITY,
        [conversation_id] bigint NOT NULL,
        [sender_type] nvarchar(30) NOT NULL,
        [message] nvarchar(max) NOT NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_ai_messages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ai_messages_ai_conversations_conversation_id] FOREIGN KEY ([conversation_id]) REFERENCES [dbo].[ai_conversations] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[assignment_submissions] (
        [Id] bigint NOT NULL IDENTITY,
        [assignment_id] bigint NOT NULL,
        [member_id] bigint NOT NULL,
        [submitted_at] datetime2 NULL,
        [content] nvarchar(max) NULL,
        [score] decimal(5,2) NULL,
        [coach_feedback] nvarchar(1000) NULL,
        [status] nvarchar(30) NOT NULL,
        CONSTRAINT [PK_assignment_submissions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_assignment_submissions_assignments_assignment_id] FOREIGN KEY ([assignment_id]) REFERENCES [dbo].[assignments] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_assignment_submissions_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[payments] (
        [Id] bigint NOT NULL IDENTITY,
        [invoice_id] bigint NOT NULL,
        [member_id] bigint NOT NULL,
        [processed_by] bigint NULL,
        [payment_method] nvarchar(50) NOT NULL,
        [transaction_code] nvarchar(150) NULL,
        [amount] decimal(12,2) NOT NULL,
        [payment_status] nvarchar(30) NOT NULL,
        [paid_at] datetime2 NOT NULL,
        [note] nvarchar(500) NULL,
        [refund_approved_by] bigint NULL,
        CONSTRAINT [PK_payments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_payments_invoices_invoice_id] FOREIGN KEY ([invoice_id]) REFERENCES [dbo].[invoices] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_payments_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_payments_users_processed_by] FOREIGN KEY ([processed_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_payments_users_refund_approved_by] FOREIGN KEY ([refund_approved_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[class_enrollments] (
        [Id] bigint NOT NULL IDENTITY,
        [class_id] bigint NOT NULL,
        [member_id] bigint NOT NULL,
        [subscription_id] bigint NULL,
        [registered_by] bigint NULL,
        [registered_at] datetime2 NOT NULL,
        [cancelled_at] datetime2 NULL,
        [status] nvarchar(30) NOT NULL,
        [cancellation_reason] nvarchar(500) NULL,
        CONSTRAINT [PK_class_enrollments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_class_enrollments_classes_class_id] FOREIGN KEY ([class_id]) REFERENCES [dbo].[classes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_class_enrollments_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_class_enrollments_member_subscriptions_subscription_id] FOREIGN KEY ([subscription_id]) REFERENCES [dbo].[member_subscriptions] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_class_enrollments_users_registered_by] FOREIGN KEY ([registered_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[support_request_messages] (
        [Id] bigint NOT NULL IDENTITY,
        [request_id] bigint NOT NULL,
        [sender_id] bigint NOT NULL,
        [message] nvarchar(max) NOT NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_support_request_messages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_support_request_messages_support_requests_request_id] FOREIGN KEY ([request_id]) REFERENCES [dbo].[support_requests] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_support_request_messages_users_sender_id] FOREIGN KEY ([sender_id]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[ai_exercise_recommendations] (
        [Id] bigint NOT NULL IDENTITY,
        [member_id] bigint NOT NULL,
        [conversation_id] bigint NULL,
        [exercise_id] bigint NULL,
        [training_plan_id] bigint NULL,
        [requested_by] bigint NULL,
        [recommendation_reason] nvarchar(max) NULL,
        [target_goal] nvarchar(500) NULL,
        [difficulty_level] nvarchar(50) NULL,
        [ai_model] nvarchar(100) NULL,
        [confidence_score] decimal(5,4) NULL,
        [accepted] bit NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_ai_exercise_recommendations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ai_exercise_recommendations_ai_conversations_conversation_id] FOREIGN KEY ([conversation_id]) REFERENCES [dbo].[ai_conversations] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ai_exercise_recommendations_exercises_exercise_id] FOREIGN KEY ([exercise_id]) REFERENCES [dbo].[exercises] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ai_exercise_recommendations_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ai_exercise_recommendations_training_plans_training_plan_id] FOREIGN KEY ([training_plan_id]) REFERENCES [dbo].[training_plans] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ai_exercise_recommendations_users_requested_by] FOREIGN KEY ([requested_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[member_progress_reviews] (
        [Id] bigint NOT NULL IDENTITY,
        [member_id] bigint NOT NULL,
        [coach_id] bigint NOT NULL,
        [training_plan_id] bigint NULL,
        [review_date] date NOT NULL,
        [progress_score] decimal(5,2) NULL,
        [weight] decimal(8,2) NULL,
        [body_fat_percentage] decimal(5,2) NULL,
        [review_note] nvarchar(2000) NULL,
        [next_goal] nvarchar(1000) NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_member_progress_reviews] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_member_progress_reviews_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_member_progress_reviews_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_member_progress_reviews_training_plans_training_plan_id] FOREIGN KEY ([training_plan_id]) REFERENCES [dbo].[training_plans] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[training_plan_exercises] (
        [Id] bigint NOT NULL IDENTITY,
        [training_plan_id] bigint NOT NULL,
        [exercise_id] bigint NOT NULL,
        [day_number] int NULL,
        [sets] int NULL,
        [repetitions] int NULL,
        [duration_seconds] int NULL,
        [rest_seconds] int NULL,
        [target_weight] decimal(8,2) NULL,
        [notes] nvarchar(1000) NULL,
        [sort_order] int NULL,
        CONSTRAINT [PK_training_plan_exercises] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_training_plan_exercises_exercises_exercise_id] FOREIGN KEY ([exercise_id]) REFERENCES [dbo].[exercises] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_training_plan_exercises_training_plans_training_plan_id] FOREIGN KEY ([training_plan_id]) REFERENCES [dbo].[training_plans] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[attendance] (
        [Id] bigint NOT NULL IDENTITY,
        [session_id] bigint NOT NULL,
        [member_id] bigint NOT NULL,
        [checked_in_by] bigint NULL,
        [attendance_status] nvarchar(30) NOT NULL,
        [check_in_time] datetime2 NULL,
        [check_out_time] datetime2 NULL,
        [note] nvarchar(500) NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_attendance] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_attendance_class_sessions_session_id] FOREIGN KEY ([session_id]) REFERENCES [dbo].[class_sessions] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_attendance_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_attendance_users_checked_in_by] FOREIGN KEY ([checked_in_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[invoice_items] (
        [Id] bigint NOT NULL IDENTITY,
        [invoice_id] bigint NOT NULL,
        [package_id] bigint NULL,
        [subscription_id] bigint NULL,
        [enrollment_id] bigint NULL,
        [description] nvarchar(500) NOT NULL,
        [quantity] int NOT NULL,
        [unit_price] decimal(12,2) NOT NULL,
        [amount] decimal(12,2) NOT NULL,
        CONSTRAINT [PK_invoice_items] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_invoice_items_class_enrollments_enrollment_id] FOREIGN KEY ([enrollment_id]) REFERENCES [dbo].[class_enrollments] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_invoice_items_invoices_invoice_id] FOREIGN KEY ([invoice_id]) REFERENCES [dbo].[invoices] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_invoice_items_member_subscriptions_subscription_id] FOREIGN KEY ([subscription_id]) REFERENCES [dbo].[member_subscriptions] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_invoice_items_membership_packages_package_id] FOREIGN KEY ([package_id]) REFERENCES [dbo].[membership_packages] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[session_bookings] (
        [Id] bigint NOT NULL IDENTITY,
        [session_id] bigint NOT NULL,
        [member_id] bigint NOT NULL,
        [enrollment_id] bigint NULL,
        [booked_at] datetime2 NOT NULL,
        [status] nvarchar(30) NOT NULL,
        CONSTRAINT [PK_session_bookings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_session_bookings_class_enrollments_enrollment_id] FOREIGN KEY ([enrollment_id]) REFERENCES [dbo].[class_enrollments] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_session_bookings_class_sessions_session_id] FOREIGN KEY ([session_id]) REFERENCES [dbo].[class_sessions] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_session_bookings_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE TABLE [dbo].[training_results] (
        [Id] bigint NOT NULL IDENTITY,
        [member_id] bigint NOT NULL,
        [coach_id] bigint NOT NULL,
        [session_id] bigint NULL,
        [training_plan_exercise_id] bigint NULL,
        [exercise_id] bigint NULL,
        [training_plan_id] bigint NULL,
        [result_date] date NOT NULL,
        [sets_completed] int NULL,
        [repetitions_completed] int NULL,
        [weight] decimal(8,2) NULL,
        [duration_seconds] int NULL,
        [calories_burned] decimal(8,2) NULL,
        [performance_score] decimal(5,2) NULL,
        [notes] nvarchar(1000) NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_training_results] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_training_results_class_sessions_session_id] FOREIGN KEY ([session_id]) REFERENCES [dbo].[class_sessions] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_training_results_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_training_results_exercises_exercise_id] FOREIGN KEY ([exercise_id]) REFERENCES [dbo].[exercises] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_training_results_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_training_results_training_plan_exercises_training_plan_exercise_id] FOREIGN KEY ([training_plan_exercise_id]) REFERENCES [dbo].[training_plan_exercises] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_training_results_training_plans_training_plan_id] FOREIGN KEY ([training_plan_id]) REFERENCES [dbo].[training_plans] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ai_conversations_member_id] ON [dbo].[ai_conversations] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ai_conversations_user_id] ON [dbo].[ai_conversations] ([user_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ai_exercise_recommendations_conversation_id] ON [dbo].[ai_exercise_recommendations] ([conversation_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ai_exercise_recommendations_exercise_id] ON [dbo].[ai_exercise_recommendations] ([exercise_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ai_exercise_recommendations_member_id] ON [dbo].[ai_exercise_recommendations] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ai_exercise_recommendations_requested_by] ON [dbo].[ai_exercise_recommendations] ([requested_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ai_exercise_recommendations_training_plan_id] ON [dbo].[ai_exercise_recommendations] ([training_plan_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ai_messages_conversation_id] ON [dbo].[ai_messages] ([conversation_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_assignment_submissions_assignment_id] ON [dbo].[assignment_submissions] ([assignment_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_assignment_submissions_member_id] ON [dbo].[assignment_submissions] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_assignments_class_id] ON [dbo].[assignments] ([class_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_assignments_coach_id] ON [dbo].[assignments] ([coach_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_assignments_member_id] ON [dbo].[assignments] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_attendance_checked_in_by] ON [dbo].[attendance] ([checked_in_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_attendance_member_id] ON [dbo].[attendance] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_attendance_session_id] ON [dbo].[attendance] ([session_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_audit_logs_user_id] ON [dbo].[audit_logs] ([user_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_center_checkins_center_id] ON [dbo].[center_checkins] ([center_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_center_checkins_checked_in_by] ON [dbo].[center_checkins] ([checked_in_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_center_checkins_member_id] ON [dbo].[center_checkins] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_class_coaches_coach_id] ON [dbo].[class_coaches] ([coach_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_class_enrollments_class_id] ON [dbo].[class_enrollments] ([class_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_class_enrollments_member_id] ON [dbo].[class_enrollments] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_class_enrollments_registered_by] ON [dbo].[class_enrollments] ([registered_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_class_enrollments_subscription_id] ON [dbo].[class_enrollments] ([subscription_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_class_schedules_class_id] ON [dbo].[class_schedules] ([class_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_class_schedules_room_id] ON [dbo].[class_schedules] ([room_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_class_sessions_class_id] ON [dbo].[class_sessions] ([class_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_class_sessions_coach_id] ON [dbo].[class_sessions] ([coach_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_class_sessions_room_id] ON [dbo].[class_sessions] ([room_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_class_sessions_schedule_id] ON [dbo].[class_sessions] ([schedule_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_class_waitlist_class_id] ON [dbo].[class_waitlist] ([class_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_class_waitlist_member_id] ON [dbo].[class_waitlist] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_classes_center_id] ON [dbo].[classes] ([center_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_classes_room_id] ON [dbo].[classes] ([room_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_classes_sport_id] ON [dbo].[classes] ([sport_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_coach_profiles_center_id] ON [dbo].[coach_profiles] ([center_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_coach_profiles_coach_code] ON [dbo].[coach_profiles] ([coach_code]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_coach_profiles_user_id] ON [dbo].[coach_profiles] ([user_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_exercises_sport_id] ON [dbo].[exercises] ([sport_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_invoice_items_enrollment_id] ON [dbo].[invoice_items] ([enrollment_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_invoice_items_invoice_id] ON [dbo].[invoice_items] ([invoice_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_invoice_items_package_id] ON [dbo].[invoice_items] ([package_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_invoice_items_subscription_id] ON [dbo].[invoice_items] ([subscription_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_invoices_center_id] ON [dbo].[invoices] ([center_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_invoices_created_by] ON [dbo].[invoices] ([created_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_invoices_invoice_number] ON [dbo].[invoices] ([invoice_number]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_invoices_member_id] ON [dbo].[invoices] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_member_profiles_member_code] ON [dbo].[member_profiles] ([member_code]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_member_profiles_user_id] ON [dbo].[member_profiles] ([user_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_member_progress_reviews_coach_id] ON [dbo].[member_progress_reviews] ([coach_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_member_progress_reviews_member_id] ON [dbo].[member_progress_reviews] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_member_progress_reviews_training_plan_id] ON [dbo].[member_progress_reviews] ([training_plan_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_member_subscriptions_member_id] ON [dbo].[member_subscriptions] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_member_subscriptions_package_id] ON [dbo].[member_subscriptions] ([package_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_membership_packages_center_id] ON [dbo].[membership_packages] ([center_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_notifications_sender_id] ON [dbo].[notifications] ([sender_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_password_reset_tokens_token] ON [dbo].[password_reset_tokens] ([token]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_password_reset_tokens_user_id] ON [dbo].[password_reset_tokens] ([user_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_payments_invoice_id] ON [dbo].[payments] ([invoice_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_payments_member_id] ON [dbo].[payments] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_payments_processed_by] ON [dbo].[payments] ([processed_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_payments_refund_approved_by] ON [dbo].[payments] ([refund_approved_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_permissions_code] ON [dbo].[permissions] ([code]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_role_permissions_permission_id] ON [dbo].[role_permissions] ([permission_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_roles_name] ON [dbo].[roles] ([name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_rooms_center_id] ON [dbo].[rooms] ([center_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_session_bookings_enrollment_id] ON [dbo].[session_bookings] ([enrollment_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_session_bookings_member_id] ON [dbo].[session_bookings] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_session_bookings_session_id] ON [dbo].[session_bookings] ([session_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_staff_profiles_center_id] ON [dbo].[staff_profiles] ([center_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_staff_profiles_staff_code] ON [dbo].[staff_profiles] ([staff_code]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_staff_profiles_user_id] ON [dbo].[staff_profiles] ([user_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_support_request_messages_request_id] ON [dbo].[support_request_messages] ([request_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_support_request_messages_sender_id] ON [dbo].[support_request_messages] ([sender_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_support_requests_handled_by] ON [dbo].[support_requests] ([handled_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_support_requests_member_id] ON [dbo].[support_requests] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_system_settings_setting_key] ON [dbo].[system_settings] ([setting_key]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_system_settings_updated_by] ON [dbo].[system_settings] ([updated_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_training_plan_exercises_exercise_id] ON [dbo].[training_plan_exercises] ([exercise_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_training_plan_exercises_training_plan_id] ON [dbo].[training_plan_exercises] ([training_plan_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_training_plans_class_id] ON [dbo].[training_plans] ([class_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_training_plans_coach_id] ON [dbo].[training_plans] ([coach_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_training_plans_member_id] ON [dbo].[training_plans] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_training_results_coach_id] ON [dbo].[training_results] ([coach_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_training_results_exercise_id] ON [dbo].[training_results] ([exercise_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_training_results_member_id] ON [dbo].[training_results] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_training_results_session_id] ON [dbo].[training_results] ([session_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_training_results_training_plan_exercise_id] ON [dbo].[training_results] ([training_plan_exercise_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_training_results_training_plan_id] ON [dbo].[training_results] ([training_plan_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_user_notifications_notification_id] ON [dbo].[user_notifications] ([notification_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_user_notifications_user_id] ON [dbo].[user_notifications] ([user_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_users_email] ON [dbo].[users] ([email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_users_role_id] ON [dbo].[users] ([role_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_users_username] ON [dbo].[users] ([username]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929152157_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260929152157_InitialCreate', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929165224_CoreFlowUniqueness'
)
BEGIN
    DROP INDEX [IX_session_bookings_session_id] ON [dbo].[session_bookings];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929165224_CoreFlowUniqueness'
)
BEGIN
    DROP INDEX [IX_class_enrollments_class_id] ON [dbo].[class_enrollments];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929165224_CoreFlowUniqueness'
)
BEGIN
    CREATE UNIQUE INDEX [IX_session_bookings_session_id_member_id] ON [dbo].[session_bookings] ([session_id], [member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929165224_CoreFlowUniqueness'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_payments_transaction_code] ON [dbo].[payments] ([transaction_code]) WHERE [transaction_code] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929165224_CoreFlowUniqueness'
)
BEGIN
    CREATE UNIQUE INDEX [IX_class_enrollments_class_id_member_id] ON [dbo].[class_enrollments] ([class_id], [member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260929165224_CoreFlowUniqueness'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260929165224_CoreFlowUniqueness', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261001022613_PendingMembershipEffectiveDates'
)
BEGIN
    DECLARE @var nvarchar(max);
    SELECT @var = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[member_subscriptions]') AND [c].[name] = N'start_date');
    IF @var IS NOT NULL EXEC(N'ALTER TABLE [dbo].[member_subscriptions] DROP CONSTRAINT ' + @var + ';');
    ALTER TABLE [dbo].[member_subscriptions] ALTER COLUMN [start_date] date NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261001022613_PendingMembershipEffectiveDates'
)
BEGIN
    DECLARE @var1 nvarchar(max);
    SELECT @var1 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[member_subscriptions]') AND [c].[name] = N'end_date');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[member_subscriptions] DROP CONSTRAINT ' + @var1 + ';');
    ALTER TABLE [dbo].[member_subscriptions] ALTER COLUMN [end_date] date NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261001022613_PendingMembershipEffectiveDates'
)
BEGIN
    ALTER TABLE [dbo].[member_subscriptions] ADD [duration_days] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261001022613_PendingMembershipEffectiveDates'
)
BEGIN
    UPDATE subscription
    SET duration_days = package.duration_days
    FROM dbo.member_subscriptions AS subscription
    INNER JOIN dbo.membership_packages AS package
        ON package.id = subscription.package_id;

    UPDATE dbo.member_subscriptions
    SET start_date = NULL, end_date = NULL
    WHERE status = 'PendingPayment';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261001022613_PendingMembershipEffectiveDates'
)
BEGIN
    DECLARE @var2 nvarchar(max);
    SELECT @var2 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[member_subscriptions]') AND [c].[name] = N'duration_days');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[member_subscriptions] DROP CONSTRAINT ' + @var2 + ';');
    ALTER TABLE [dbo].[member_subscriptions] ALTER COLUMN [duration_days] int NOT NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261001022613_PendingMembershipEffectiveDates'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261001022613_PendingMembershipEffectiveDates', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261001024850_Flow1MembershipScope'
)
BEGIN
    IF EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.membership_packages')
          AND name = N'IX_membership_packages_center_id')
    BEGIN
        DROP INDEX [IX_membership_packages_center_id] ON [dbo].[membership_packages];
    END
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261001024850_Flow1MembershipScope'
)
BEGIN
    ALTER TABLE [dbo].[member_profiles] ADD [center_id] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261001024850_Flow1MembershipScope'
)
BEGIN
    WITH member_centers AS
    (
        SELECT member_id, MIN(center_id) AS center_id
        FROM dbo.invoices
        GROUP BY member_id
        HAVING COUNT(DISTINCT center_id) = 1
    )
    UPDATE profile
    SET center_id = member_centers.center_id
    FROM dbo.member_profiles AS profile
    INNER JOIN member_centers ON member_centers.member_id = profile.id;

    WITH subscription_centers AS
    (
        SELECT subscription.member_id, MIN(package.center_id) AS center_id
        FROM dbo.member_subscriptions AS subscription
        INNER JOIN dbo.membership_packages AS package ON package.id = subscription.package_id
        GROUP BY subscription.member_id
        HAVING COUNT(DISTINCT package.center_id) = 1
    )
    UPDATE profile
    SET center_id = subscription_centers.center_id
    FROM dbo.member_profiles AS profile
    INNER JOIN subscription_centers ON subscription_centers.member_id = profile.id
    WHERE profile.center_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.invoices AS invoice WHERE invoice.member_id = profile.id);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261001024850_Flow1MembershipScope'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_users_phone] ON [dbo].[users] ([phone]) WHERE [phone] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261001024850_Flow1MembershipScope'
)
BEGIN
    CREATE UNIQUE INDEX [IX_membership_packages_center_id_name] ON [dbo].[membership_packages] ([center_id], [name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261001024850_Flow1MembershipScope'
)
BEGIN
    CREATE INDEX [IX_member_profiles_center_id] ON [dbo].[member_profiles] ([center_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261001024850_Flow1MembershipScope'
)
BEGIN
    ALTER TABLE [dbo].[member_profiles] ADD CONSTRAINT [FK_member_profiles_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261001024850_Flow1MembershipScope'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261001024850_Flow1MembershipScope', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003190000_AddMembershipPackageDetails'
)
BEGIN
    ALTER TABLE [dbo].[membership_packages] ADD [allowed_sports] int NOT NULL DEFAULT 1;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003190000_AddMembershipPackageDetails'
)
BEGIN
    ALTER TABLE [dbo].[membership_packages] ADD [badge] nvarchar(50) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003190000_AddMembershipPackageDetails'
)
BEGIN
    ALTER TABLE [dbo].[membership_packages] ADD [features] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003190000_AddMembershipPackageDetails'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261003190000_AddMembershipPackageDetails', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003210000_Uc13AvailabilityAndPermissionModules'
)
BEGIN
    ALTER TABLE [dbo].[permissions] ADD [module] nvarchar(50) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003210000_Uc13AvailabilityAndPermissionModules'
)
BEGIN
    CREATE TABLE [dbo].[coach_leaves] (
        [Id] bigint NOT NULL IDENTITY,
        [coach_id] bigint NOT NULL,
        [start_at] datetime2 NOT NULL,
        [end_at] datetime2 NOT NULL,
        [status] nvarchar(30) NOT NULL,
        CONSTRAINT [PK_coach_leaves] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_coach_leaves_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003210000_Uc13AvailabilityAndPermissionModules'
)
BEGIN
    CREATE INDEX [IX_coach_leaves_coach_id] ON [dbo].[coach_leaves] ([coach_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003210000_Uc13AvailabilityAndPermissionModules'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261003210000_Uc13AvailabilityAndPermissionModules', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003220000_RemoveLegacyClassCoachId'
)
BEGIN
    IF COL_LENGTH(N'dbo.class_coaches', N'Id') IS NOT NULL
    BEGIN
        ALTER TABLE [dbo].[class_coaches] DROP COLUMN [Id];
    END
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003220000_RemoveLegacyClassCoachId'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261003220000_RemoveLegacyClassCoachId', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    ALTER TABLE [dbo].[invoices] ADD [idempotency_key] nvarchar(100) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    ALTER TABLE [dbo].[payments] ADD [created_at] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    ALTER TABLE [dbo].[payments] ADD [gateway_reference] nvarchar(100) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    ALTER TABLE [dbo].[payments] ADD [provider_transaction_id] nvarchar(150) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    ALTER TABLE [dbo].[payments] ADD [idempotency_key] nvarchar(100) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    ALTER TABLE [dbo].[payments] ADD [gateway_payment_url] nvarchar(2048) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    ALTER TABLE [dbo].[payments] ADD [amount_received] decimal(12,2) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    UPDATE [dbo].[payments] SET [created_at] = COALESCE([paid_at], SYSUTCDATETIME()) WHERE [created_at] IS NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    UPDATE [dbo].[payments] SET [payment_status] = N'Succeeded' WHERE [payment_status] = N'Completed';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    UPDATE [dbo].[invoices] SET [status] = N'Voided' WHERE [status] = N'Cancelled';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    DECLARE @var3 nvarchar(max);
    SELECT @var3 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[payments]') AND [c].[name] = N'created_at');
    IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[payments] DROP CONSTRAINT ' + @var3 + ';');
    ALTER TABLE [dbo].[payments] ALTER COLUMN [created_at] datetime2 NOT NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    DECLARE @var4 nvarchar(max);
    SELECT @var4 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[payments]') AND [c].[name] = N'paid_at');
    IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[payments] DROP CONSTRAINT ' + @var4 + ';');
    ALTER TABLE [dbo].[payments] ALTER COLUMN [paid_at] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    CREATE TABLE [dbo].[payment_refunds] (
        [Id] bigint NOT NULL IDENTITY,
        [payment_id] bigint NOT NULL,
        [amount] decimal(12,2) NOT NULL,
        [status] nvarchar(30) NOT NULL,
        [idempotency_key] nvarchar(100) NOT NULL,
        [provider_refund_id] nvarchar(150) NULL,
        [external_reference] nvarchar(150) NULL,
        [reason] nvarchar(500) NOT NULL,
        [requested_by] bigint NOT NULL,
        [created_at] datetime2 NOT NULL,
        [processed_at] datetime2 NULL,
        CONSTRAINT [PK_payment_refunds] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_payment_refunds_payments_payment_id] FOREIGN KEY ([payment_id]) REFERENCES [dbo].[payments] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_payment_refunds_users_requested_by] FOREIGN KEY ([requested_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_invoices_idempotency_key] ON [dbo].[invoices] ([idempotency_key]) WHERE [idempotency_key] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_payments_gateway_reference] ON [dbo].[payments] ([gateway_reference]) WHERE [gateway_reference] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_payments_provider_transaction_id] ON [dbo].[payments] ([provider_transaction_id]) WHERE [provider_transaction_id] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_payments_idempotency_key] ON [dbo].[payments] ([idempotency_key]) WHERE [idempotency_key] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    CREATE INDEX [IX_payment_refunds_payment_id] ON [dbo].[payment_refunds] ([payment_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    CREATE INDEX [IX_payment_refunds_requested_by] ON [dbo].[payment_refunds] ([requested_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_payment_refunds_idempotency_key] ON [dbo].[payment_refunds] ([idempotency_key]) WHERE [idempotency_key] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_payment_refunds_provider_refund_id] ON [dbo].[payment_refunds] ([provider_refund_id]) WHERE [provider_refund_id] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006090000_Flow3FinancialHardening'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261006090000_Flow3FinancialHardening', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006183000_Flow1Completeness'
)
BEGIN
    ALTER TABLE [dbo].[payments] ADD [provider_reference] nvarchar(150) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006183000_Flow1Completeness'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_payments_provider_reference] ON [dbo].[payments] ([provider_reference]) WHERE [provider_reference] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006183000_Flow1Completeness'
)
BEGIN
    ALTER TABLE [dbo].[audit_logs] ADD [center_id] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006183000_Flow1Completeness'
)
BEGIN
    ALTER TABLE [dbo].[payments] ADD [attempted_at] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006183000_Flow1Completeness'
)
BEGIN
    UPDATE dbo.payments SET attempted_at = paid_at
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006183000_Flow1Completeness'
)
BEGIN
    DECLARE @var5 nvarchar(max);
    SELECT @var5 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[payments]') AND [c].[name] = N'attempted_at');
    IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[payments] DROP CONSTRAINT ' + @var5 + ';');
    ALTER TABLE [dbo].[payments] ALTER COLUMN [attempted_at] datetime2 NOT NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006183000_Flow1Completeness'
)
BEGIN
    DECLARE @var6 nvarchar(max);
    SELECT @var6 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[payments]') AND [c].[name] = N'paid_at');
    IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[payments] DROP CONSTRAINT ' + @var6 + ';');
    ALTER TABLE [dbo].[payments] ALTER COLUMN [paid_at] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006183000_Flow1Completeness'
)
BEGIN
    CREATE INDEX [IX_audit_logs_center_id_created_at] ON [dbo].[audit_logs] ([center_id], [created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006183000_Flow1Completeness'
)
BEGIN
    ALTER TABLE [dbo].[audit_logs] ADD CONSTRAINT [FK_audit_logs_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006183000_Flow1Completeness'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261006183000_Flow1Completeness', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    ALTER TABLE [dbo].[sports] ADD [center_id] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    ALTER TABLE [dbo].[classes] ADD [allow_waitlist] bit NOT NULL DEFAULT CAST(1 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    ALTER TABLE [dbo].[class_waitlist] ADD [session_id] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    ALTER TABLE [dbo].[class_waitlist] ADD [subscription_id] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    ALTER TABLE [dbo].[class_waitlist] ADD [registered_by] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    ALTER TABLE [dbo].[session_bookings] ADD [subscription_id] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    ALTER TABLE [dbo].[session_bookings] ADD [registered_by] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    UPDATE booking
    SET booking.subscription_id = eligible.Id
    FROM dbo.session_bookings AS booking
    INNER JOIN dbo.class_sessions AS session ON session.Id = booking.session_id
    INNER JOIN dbo.classes AS classEntity ON classEntity.Id = session.class_id
    CROSS APPLY (
        SELECT TOP (1) subscription.Id
        FROM dbo.member_subscriptions AS subscription
        INNER JOIN dbo.membership_packages AS package ON package.Id = subscription.package_id
        WHERE subscription.member_id = booking.member_id
            AND subscription.status = N'Active'
            AND subscription.start_date <= session.session_date
            AND subscription.end_date >= session.session_date
            AND package.center_id = classEntity.center_id
        ORDER BY subscription.end_date DESC
    ) AS eligible
    WHERE booking.subscription_id IS NULL
        AND booking.status IN (N'Booked', N'CANCELLED_LATE_CHARGED');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    UPDATE [dbo].[class_waitlist] SET [status] = N'Cancelled' WHERE [status] = N'Waiting';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    CREATE INDEX [IX_sports_center_id] ON [dbo].[sports] ([center_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    CREATE INDEX [IX_class_waitlist_session_id] ON [dbo].[class_waitlist] ([session_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    CREATE INDEX [IX_class_waitlist_subscription_id] ON [dbo].[class_waitlist] ([subscription_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    CREATE INDEX [IX_class_waitlist_registered_by] ON [dbo].[class_waitlist] ([registered_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_class_waitlist_session_id_member_id] ON [dbo].[class_waitlist] ([session_id], [member_id]) WHERE [session_id] IS NOT NULL AND [status] = N''Waiting''');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    CREATE INDEX [IX_session_bookings_registered_by] ON [dbo].[session_bookings] ([registered_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    CREATE INDEX [IX_session_bookings_subscription_id] ON [dbo].[session_bookings] ([subscription_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    CREATE INDEX [IX_session_bookings_subscription_id_status_session_id] ON [dbo].[session_bookings] ([subscription_id], [status], [session_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    ALTER TABLE [dbo].[sports] ADD CONSTRAINT [FK_sports_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    ALTER TABLE [dbo].[class_waitlist] ADD CONSTRAINT [FK_class_waitlist_class_sessions_session_id] FOREIGN KEY ([session_id]) REFERENCES [dbo].[class_sessions] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    ALTER TABLE [dbo].[class_waitlist] ADD CONSTRAINT [FK_class_waitlist_member_subscriptions_subscription_id] FOREIGN KEY ([subscription_id]) REFERENCES [dbo].[member_subscriptions] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    ALTER TABLE [dbo].[class_waitlist] ADD CONSTRAINT [FK_class_waitlist_users_registered_by] FOREIGN KEY ([registered_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    ALTER TABLE [dbo].[session_bookings] ADD CONSTRAINT [FK_session_bookings_member_subscriptions_subscription_id] FOREIGN KEY ([subscription_id]) REFERENCES [dbo].[member_subscriptions] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    ALTER TABLE [dbo].[session_bookings] ADD CONSTRAINT [FK_session_bookings_users_registered_by] FOREIGN KEY ([registered_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261006193000_Flow2BookingAndWaitlistHardening'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261006193000_Flow2BookingAndWaitlistHardening', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261007120616_ModelSnapshotSynchronization'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261007120616_ModelSnapshotSynchronization', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011055521_CompleteApiIntegration'
)
BEGIN
    ALTER TABLE [dbo].[users] ADD [google_subject] nvarchar(255) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011055521_CompleteApiIntegration'
)
BEGIN
    ALTER TABLE [dbo].[training_results] ADD [body_fat_percentage] decimal(5,2) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011055521_CompleteApiIntegration'
)
BEGIN
    ALTER TABLE [dbo].[training_results] ADD [class_id] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011055521_CompleteApiIntegration'
)
BEGIN
    ALTER TABLE [dbo].[training_results] ADD [coach_feedback] nvarchar(1000) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011055521_CompleteApiIntegration'
)
BEGIN
    ALTER TABLE [dbo].[training_results] ADD [muscle_mass] decimal(8,2) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011055521_CompleteApiIntegration'
)
BEGIN
    ALTER TABLE [dbo].[training_results] ADD [workout_result] nvarchar(1000) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011055521_CompleteApiIntegration'
)
BEGIN
    DECLARE @var7 nvarchar(max);
    SELECT @var7 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[training_plans]') AND [c].[name] = N'member_id');
    IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[training_plans] DROP CONSTRAINT ' + @var7 + ';');
    ALTER TABLE [dbo].[training_plans] ALTER COLUMN [member_id] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011055521_CompleteApiIntegration'
)
BEGIN
    ALTER TABLE [dbo].[training_plans] ADD [exercises_json] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011055521_CompleteApiIntegration'
)
BEGIN
    ALTER TABLE [dbo].[training_plans] ADD [fitness_condition] nvarchar(1000) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011055521_CompleteApiIntegration'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_users_google_subject] ON [dbo].[users] ([google_subject]) WHERE [google_subject] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011055521_CompleteApiIntegration'
)
BEGIN
    CREATE INDEX [IX_training_results_class_id] ON [dbo].[training_results] ([class_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011055521_CompleteApiIntegration'
)
BEGIN
    ALTER TABLE [dbo].[training_results] ADD CONSTRAINT [FK_training_results_classes_class_id] FOREIGN KEY ([class_id]) REFERENCES [dbo].[classes] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011055521_CompleteApiIntegration'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261011055521_CompleteApiIntegration', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014111415_AddUploadedMediaTable'
)
BEGIN
    CREATE TABLE [dbo].[uploaded_media] (
        [Id] bigint NOT NULL IDENTITY,
        [drive_file_id] nvarchar(255) NOT NULL,
        [file_name] nvarchar(500) NOT NULL,
        [mime_type] nvarchar(100) NOT NULL,
        [file_size] bigint NULL,
        [file_url] nvarchar(1000) NOT NULL,
        [web_view_link] nvarchar(1000) NULL,
        [uploaded_by_user_id] bigint NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_uploaded_media] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014111415_AddUploadedMediaTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261014111415_AddUploadedMediaTable', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015090000_AddCoachSports'
)
BEGIN
    CREATE TABLE [dbo].[coach_sports] (
        [coach_id] bigint NOT NULL,
        [sport_id] bigint NOT NULL,
        CONSTRAINT [PK_coach_sports] PRIMARY KEY ([coach_id], [sport_id]),
        CONSTRAINT [FK_coach_sports_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_coach_sports_sports_sport_id] FOREIGN KEY ([sport_id]) REFERENCES [dbo].[sports] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015090000_AddCoachSports'
)
BEGIN
    CREATE INDEX [IX_coach_sports_sport_id] ON [dbo].[coach_sports] ([sport_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015090000_AddCoachSports'
)
BEGIN
    INSERT INTO [dbo].[coach_sports] ([coach_id], [sport_id])
    SELECT DISTINCT c.[Id], s.[Id]
    FROM [dbo].[coach_profiles] c
    INNER JOIN [dbo].[sports] s ON (s.[center_id] IS NULL OR s.[center_id] = c.[center_id])
    WHERE c.[specialization] IS NOT NULL
      AND CHARINDEX(LOWER(s.[name]), LOWER(c.[specialization])) > 0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015090000_AddCoachSports'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261015090000_AddCoachSports', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015103827_AddClassReminderKey'
)
BEGIN
    ALTER TABLE [dbo].[notifications] ADD [reminder_key] nvarchar(100) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015103827_AddClassReminderKey'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_notifications_reminder_key] ON [dbo].[notifications] ([reminder_key]) WHERE [reminder_key] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261015103827_AddClassReminderKey'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261015103827_AddClassReminderKey', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016032501_SupportRequestSenders'
)
BEGIN
    DECLARE @var8 nvarchar(max);
    SELECT @var8 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[support_requests]') AND [c].[name] = N'member_id');
    IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[support_requests] DROP CONSTRAINT ' + @var8 + ';');
    ALTER TABLE [dbo].[support_requests] ALTER COLUMN [member_id] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016032501_SupportRequestSenders'
)
BEGIN
    ALTER TABLE [dbo].[support_requests] ADD [center_id] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016032501_SupportRequestSenders'
)
BEGIN
    ALTER TABLE [dbo].[support_requests] ADD [requester_id] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016032501_SupportRequestSenders'
)
BEGIN
    UPDATE request
    SET request.[requester_id] = member.[user_id], request.[center_id] = member.[center_id]
    FROM [dbo].[support_requests] request
    INNER JOIN [dbo].[member_profiles] member ON member.[Id] = request.[member_id];
    IF EXISTS (SELECT 1 FROM [dbo].[support_requests] WHERE [requester_id] IS NULL OR [center_id] IS NULL)
        THROW 51000, 'Support request owner or center is missing; repair legacy records before migrating.', 1;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016032501_SupportRequestSenders'
)
BEGIN
    DECLARE @var9 nvarchar(max);
    SELECT @var9 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[support_requests]') AND [c].[name] = N'center_id');
    IF @var9 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[support_requests] DROP CONSTRAINT ' + @var9 + ';');
    ALTER TABLE [dbo].[support_requests] ALTER COLUMN [center_id] bigint NOT NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016032501_SupportRequestSenders'
)
BEGIN
    DECLARE @var10 nvarchar(max);
    SELECT @var10 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[support_requests]') AND [c].[name] = N'requester_id');
    IF @var10 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[support_requests] DROP CONSTRAINT ' + @var10 + ';');
    ALTER TABLE [dbo].[support_requests] ALTER COLUMN [requester_id] bigint NOT NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016032501_SupportRequestSenders'
)
BEGIN
    CREATE INDEX [IX_support_requests_center_id_status_created_at] ON [dbo].[support_requests] ([center_id], [status], [created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016032501_SupportRequestSenders'
)
BEGIN
    CREATE INDEX [IX_support_requests_requester_id_created_at] ON [dbo].[support_requests] ([requester_id], [created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016032501_SupportRequestSenders'
)
BEGIN
    ALTER TABLE [dbo].[support_requests] ADD CONSTRAINT [FK_support_requests_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016032501_SupportRequestSenders'
)
BEGIN
    ALTER TABLE [dbo].[support_requests] ADD CONSTRAINT [FK_support_requests_users_requester_id] FOREIGN KEY ([requester_id]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016032501_SupportRequestSenders'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261016032501_SupportRequestSenders', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    ALTER TABLE [dbo].[exercises] ADD [center_id] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    ALTER TABLE [dbo].[exercises] ADD [created_by_coach_id] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    ALTER TABLE [dbo].[exercises] ADD [image_url] nvarchar(500) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    ALTER TABLE [dbo].[coach_leaves] ADD [leave_type] nvarchar(30) NOT NULL DEFAULT N'AnnualLeave';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    ALTER TABLE [dbo].[coach_leaves] ADD [manager_note] nvarchar(1000) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    ALTER TABLE [dbo].[coach_leaves] ADD [reason] nvarchar(1000) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    ALTER TABLE [dbo].[coach_leaves] ADD [requested_at] datetime2 NOT NULL DEFAULT (GETUTCDATE());
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    ALTER TABLE [dbo].[coach_leaves] ADD [reviewed_at] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    ALTER TABLE [dbo].[coach_leaves] ADD [reviewed_by] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    ALTER TABLE [dbo].[coach_leaves] ADD [swap_coach_id] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE TABLE [dbo].[coach_compensation_policies] (
        [Id] bigint NOT NULL IDENTITY,
        [coach_id] bigint NOT NULL,
        [monthly_base_salary] decimal(14,2) NOT NULL,
        [commission_per_session] decimal(14,2) NOT NULL,
        [sales_commission_percent] decimal(5,2) NOT NULL,
        [target_sessions] int NOT NULL,
        [target_sales] decimal(14,2) NOT NULL,
        [effective_from] date NOT NULL,
        [effective_to] date NULL,
        [status] nvarchar(30) NOT NULL,
        [updated_by] bigint NOT NULL,
        [updated_at] datetime2 NOT NULL,
        CONSTRAINT [PK_coach_compensation_policies] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_coach_compensation_policies_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_coach_compensation_policies_users_updated_by] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE TABLE [dbo].[coach_messages] (
        [Id] bigint NOT NULL IDENTITY,
        [coach_id] bigint NOT NULL,
        [member_id] bigint NOT NULL,
        [sender_user_id] bigint NOT NULL,
        [content] nvarchar(4000) NOT NULL,
        [created_at] datetime2 NOT NULL,
        [read_at] datetime2 NULL,
        CONSTRAINT [PK_coach_messages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_coach_messages_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_coach_messages_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_coach_messages_users_sender_user_id] FOREIGN KEY ([sender_user_id]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE TABLE [dbo].[coach_sales_credits] (
        [Id] bigint NOT NULL IDENTITY,
        [coach_id] bigint NOT NULL,
        [member_id] bigint NULL,
        [subscription_id] bigint NULL,
        [amount] decimal(14,2) NOT NULL,
        [credited_at] datetime2 NOT NULL,
        [note] nvarchar(500) NULL,
        [created_by] bigint NOT NULL,
        CONSTRAINT [PK_coach_sales_credits] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_coach_sales_credits_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_coach_sales_credits_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_coach_sales_credits_member_subscriptions_subscription_id] FOREIGN KEY ([subscription_id]) REFERENCES [dbo].[member_subscriptions] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_coach_sales_credits_users_created_by] FOREIGN KEY ([created_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE TABLE [dbo].[coach_work_events] (
        [Id] bigint NOT NULL IDENTITY,
        [center_id] bigint NOT NULL,
        [coach_id] bigint NOT NULL,
        [member_id] bigint NULL,
        [room_id] bigint NULL,
        [title] nvarchar(200) NOT NULL,
        [event_type] nvarchar(30) NOT NULL,
        [start_at] datetime2 NOT NULL,
        [end_at] datetime2 NOT NULL,
        [status] nvarchar(30) NOT NULL,
        [notes] nvarchar(1000) NULL,
        [created_by] bigint NOT NULL,
        [created_at] datetime2 NOT NULL,
        [updated_at] datetime2 NULL,
        CONSTRAINT [PK_coach_work_events] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_coach_work_events_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_coach_work_events_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_coach_work_events_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_coach_work_events_rooms_room_id] FOREIGN KEY ([room_id]) REFERENCES [dbo].[rooms] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_coach_work_events_users_created_by] FOREIGN KEY ([created_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE TABLE [dbo].[communication_deliveries] (
        [Id] bigint NOT NULL IDENTITY,
        [notification_id] bigint NULL,
        [recipient_user_id] bigint NOT NULL,
        [channel] nvarchar(20) NOT NULL,
        [status] nvarchar(30) NOT NULL,
        [provider_message] nvarchar(1000) NULL,
        [created_at] datetime2 NOT NULL,
        [sent_at] datetime2 NULL,
        CONSTRAINT [PK_communication_deliveries] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_communication_deliveries_notifications_notification_id] FOREIGN KEY ([notification_id]) REFERENCES [dbo].[notifications] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_communication_deliveries_users_recipient_user_id] FOREIGN KEY ([recipient_user_id]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE TABLE [dbo].[facility_resources] (
        [Id] bigint NOT NULL IDENTITY,
        [center_id] bigint NOT NULL,
        [name] nvarchar(150) NOT NULL,
        [resource_type] nvarchar(50) NOT NULL,
        [location] nvarchar(300) NULL,
        [capacity] int NULL,
        [status] nvarchar(30) NOT NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_facility_resources] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_facility_resources_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE TABLE [dbo].[food_diary_entries] (
        [Id] bigint NOT NULL IDENTITY,
        [member_id] bigint NOT NULL,
        [entry_date] date NOT NULL,
        [meal_type] nvarchar(40) NOT NULL,
        [food_name] nvarchar(300) NOT NULL,
        [calories] int NULL,
        [protein_grams] decimal(8,2) NULL,
        [carb_grams] decimal(8,2) NULL,
        [fat_grams] decimal(8,2) NULL,
        [notes] nvarchar(1000) NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_food_diary_entries] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_food_diary_entries_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE TABLE [dbo].[member_health_records] (
        [Id] bigint NOT NULL IDENTITY,
        [member_id] bigint NOT NULL,
        [coach_id] bigint NOT NULL,
        [record_type] nvarchar(40) NOT NULL,
        [title] nvarchar(200) NOT NULL,
        [details] nvarchar(max) NOT NULL,
        [occurred_on] date NOT NULL,
        [status] nvarchar(30) NOT NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_member_health_records] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_member_health_records_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_member_health_records_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE TABLE [dbo].[nutrition_plans] (
        [Id] bigint NOT NULL IDENTITY,
        [member_id] bigint NOT NULL,
        [coach_id] bigint NOT NULL,
        [title] nvarchar(200) NOT NULL,
        [start_date] date NOT NULL,
        [end_date] date NULL,
        [daily_calories] int NOT NULL,
        [protein_grams] int NOT NULL,
        [carb_grams] int NOT NULL,
        [fat_grams] int NOT NULL,
        [meal_plan_json] nvarchar(max) NULL,
        [notes] nvarchar(1000) NULL,
        [status] nvarchar(30) NOT NULL,
        [created_at] datetime2 NOT NULL,
        [updated_at] datetime2 NULL,
        CONSTRAINT [PK_nutrition_plans] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_nutrition_plans_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_nutrition_plans_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE TABLE [dbo].[coach_reviews] (
        [Id] bigint NOT NULL IDENTITY,
        [coach_id] bigint NOT NULL,
        [member_id] bigint NOT NULL,
        [work_event_id] bigint NULL,
        [rating] int NOT NULL,
        [comment] nvarchar(2000) NULL,
        [created_at] datetime2 NOT NULL,
        [updated_at] datetime2 NULL,
        CONSTRAINT [PK_coach_reviews] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_coach_reviews_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_coach_reviews_coach_work_events_work_event_id] FOREIGN KEY ([work_event_id]) REFERENCES [dbo].[coach_work_events] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_coach_reviews_member_profiles_member_id] FOREIGN KEY ([member_id]) REFERENCES [dbo].[member_profiles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE TABLE [dbo].[equipment_issues] (
        [Id] bigint NOT NULL IDENTITY,
        [center_id] bigint NOT NULL,
        [resource_id] bigint NULL,
        [reported_by_user_id] bigint NOT NULL,
        [title] nvarchar(200) NOT NULL,
        [description] nvarchar(max) NOT NULL,
        [severity] nvarchar(20) NOT NULL,
        [photo_url] nvarchar(1000) NULL,
        [status] nvarchar(30) NOT NULL,
        [resolution_note] nvarchar(1000) NULL,
        [resolved_by] bigint NULL,
        [reported_at] datetime2 NOT NULL,
        [resolved_at] datetime2 NULL,
        CONSTRAINT [PK_equipment_issues] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_equipment_issues_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_equipment_issues_facility_resources_resource_id] FOREIGN KEY ([resource_id]) REFERENCES [dbo].[facility_resources] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_equipment_issues_users_reported_by_user_id] FOREIGN KEY ([reported_by_user_id]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_equipment_issues_users_resolved_by] FOREIGN KEY ([resolved_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE TABLE [dbo].[resource_bookings] (
        [Id] bigint NOT NULL IDENTITY,
        [resource_id] bigint NOT NULL,
        [coach_id] bigint NOT NULL,
        [work_event_id] bigint NULL,
        [start_at] datetime2 NOT NULL,
        [end_at] datetime2 NOT NULL,
        [purpose] nvarchar(500) NOT NULL,
        [status] nvarchar(30) NOT NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_resource_bookings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_resource_bookings_coach_profiles_coach_id] FOREIGN KEY ([coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_resource_bookings_coach_work_events_work_event_id] FOREIGN KEY ([work_event_id]) REFERENCES [dbo].[coach_work_events] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_resource_bookings_facility_resources_resource_id] FOREIGN KEY ([resource_id]) REFERENCES [dbo].[facility_resources] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_exercises_center_id] ON [dbo].[exercises] ([center_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_exercises_created_by_coach_id] ON [dbo].[exercises] ([created_by_coach_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_leaves_reviewed_by] ON [dbo].[coach_leaves] ([reviewed_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_leaves_swap_coach_id] ON [dbo].[coach_leaves] ([swap_coach_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_compensation_policies_coach_id_effective_from] ON [dbo].[coach_compensation_policies] ([coach_id], [effective_from]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_compensation_policies_updated_by] ON [dbo].[coach_compensation_policies] ([updated_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_messages_coach_id_member_id_created_at] ON [dbo].[coach_messages] ([coach_id], [member_id], [created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_messages_member_id] ON [dbo].[coach_messages] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_messages_sender_user_id] ON [dbo].[coach_messages] ([sender_user_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_coach_reviews_coach_id_member_id_work_event_id] ON [dbo].[coach_reviews] ([coach_id], [member_id], [work_event_id]) WHERE [work_event_id] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_reviews_member_id] ON [dbo].[coach_reviews] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_reviews_work_event_id] ON [dbo].[coach_reviews] ([work_event_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_sales_credits_coach_id] ON [dbo].[coach_sales_credits] ([coach_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_sales_credits_created_by] ON [dbo].[coach_sales_credits] ([created_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_sales_credits_member_id] ON [dbo].[coach_sales_credits] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_sales_credits_subscription_id] ON [dbo].[coach_sales_credits] ([subscription_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_work_events_center_id] ON [dbo].[coach_work_events] ([center_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_work_events_coach_id_start_at_end_at] ON [dbo].[coach_work_events] ([coach_id], [start_at], [end_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_work_events_created_by] ON [dbo].[coach_work_events] ([created_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_work_events_member_id] ON [dbo].[coach_work_events] ([member_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_coach_work_events_room_id] ON [dbo].[coach_work_events] ([room_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_communication_deliveries_notification_id] ON [dbo].[communication_deliveries] ([notification_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_communication_deliveries_recipient_user_id] ON [dbo].[communication_deliveries] ([recipient_user_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_communication_deliveries_status_created_at] ON [dbo].[communication_deliveries] ([status], [created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_equipment_issues_center_id_status_reported_at] ON [dbo].[equipment_issues] ([center_id], [status], [reported_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_equipment_issues_reported_by_user_id] ON [dbo].[equipment_issues] ([reported_by_user_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_equipment_issues_resolved_by] ON [dbo].[equipment_issues] ([resolved_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_equipment_issues_resource_id] ON [dbo].[equipment_issues] ([resource_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE UNIQUE INDEX [IX_facility_resources_center_id_name] ON [dbo].[facility_resources] ([center_id], [name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_food_diary_entries_member_id_entry_date] ON [dbo].[food_diary_entries] ([member_id], [entry_date]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_member_health_records_coach_id] ON [dbo].[member_health_records] ([coach_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_member_health_records_member_id_occurred_on] ON [dbo].[member_health_records] ([member_id], [occurred_on]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_nutrition_plans_coach_id] ON [dbo].[nutrition_plans] ([coach_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_nutrition_plans_member_id_status] ON [dbo].[nutrition_plans] ([member_id], [status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_resource_bookings_coach_id] ON [dbo].[resource_bookings] ([coach_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_resource_bookings_resource_id_start_at_end_at] ON [dbo].[resource_bookings] ([resource_id], [start_at], [end_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    CREATE INDEX [IX_resource_bookings_work_event_id] ON [dbo].[resource_bookings] ([work_event_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    ALTER TABLE [dbo].[coach_leaves] ADD CONSTRAINT [FK_coach_leaves_coach_profiles_swap_coach_id] FOREIGN KEY ([swap_coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    ALTER TABLE [dbo].[coach_leaves] ADD CONSTRAINT [FK_coach_leaves_users_reviewed_by] FOREIGN KEY ([reviewed_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    ALTER TABLE [dbo].[exercises] ADD CONSTRAINT [FK_exercises_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    ALTER TABLE [dbo].[exercises] ADD CONSTRAINT [FK_exercises_coach_profiles_created_by_coach_id] FOREIGN KEY ([created_by_coach_id]) REFERENCES [dbo].[coach_profiles] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261016175228_AddCoachProfessionalWorkspace'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261016175228_AddCoachProfessionalWorkspace', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018064013_AddAccountSecurityState'
)
BEGIN
    ALTER TABLE [dbo].[users] ADD [auth_version] int NOT NULL DEFAULT 0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018064013_AddAccountSecurityState'
)
BEGIN
    ALTER TABLE [dbo].[password_reset_tokens] ADD [failed_attempts] int NOT NULL DEFAULT 0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018064013_AddAccountSecurityState'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261018064013_AddAccountSecurityState', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020082633_AddEmailVerificationTokens'
)
BEGIN
    CREATE TABLE [dbo].[email_verification_tokens] (
        [Id] bigint NOT NULL IDENTITY,
        [email] nvarchar(150) NOT NULL,
        [token] nvarchar(255) NOT NULL,
        [failed_attempts] int NOT NULL,
        [expires_at] datetime2 NOT NULL,
        [used_at] datetime2 NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_email_verification_tokens] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020082633_AddEmailVerificationTokens'
)
BEGIN
    CREATE INDEX [IX_email_verification_tokens_email_created_at] ON [dbo].[email_verification_tokens] ([email], [created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020082633_AddEmailVerificationTokens'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261020082633_AddEmailVerificationTokens', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024150000_ManualRefundAndPayroll'
)
BEGIN
    ALTER TABLE [dbo].[payment_refunds] ADD [bank_name] nvarchar(100) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024150000_ManualRefundAndPayroll'
)
BEGIN
    ALTER TABLE [dbo].[payment_refunds] ADD [bank_account_number] nvarchar(50) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024150000_ManualRefundAndPayroll'
)
BEGIN
    ALTER TABLE [dbo].[payment_refunds] ADD [bank_account_name] nvarchar(150) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024150000_ManualRefundAndPayroll'
)
BEGIN
    ALTER TABLE [dbo].[payment_refunds] ADD [reviewed_by] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024150000_ManualRefundAndPayroll'
)
BEGIN
    ALTER TABLE [dbo].[payment_refunds] ADD [review_note] nvarchar(1000) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024150000_ManualRefundAndPayroll'
)
BEGIN
    ALTER TABLE [dbo].[payment_refunds] ADD [transfer_proof_url] nvarchar(1000) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024150000_ManualRefundAndPayroll'
)
BEGIN
    DECLARE @var11 nvarchar(max);
    SELECT @var11 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dbo].[support_requests]') AND [c].[name] = N'priority');
    IF @var11 IS NOT NULL EXEC(N'ALTER TABLE [dbo].[support_requests] DROP CONSTRAINT ' + @var11 + ';');
    ALTER TABLE [dbo].[support_requests] DROP COLUMN [priority];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024150000_ManualRefundAndPayroll'
)
BEGIN
    CREATE INDEX [IX_payment_refunds_reviewed_by] ON [dbo].[payment_refunds] ([reviewed_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024150000_ManualRefundAndPayroll'
)
BEGIN
    ALTER TABLE [dbo].[payment_refunds] ADD CONSTRAINT [FK_payment_refunds_users_reviewed_by] FOREIGN KEY ([reviewed_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024150000_ManualRefundAndPayroll'
)
BEGIN
    CREATE TABLE [dbo].[staff_compensation_policies] (
        [Id] bigint NOT NULL IDENTITY,
        [user_id] bigint NOT NULL,
        [center_id] bigint NULL,
        [monthly_base_salary] decimal(14,2) NOT NULL,
        [monthly_allowance] decimal(14,2) NOT NULL,
        [effective_from] date NOT NULL,
        [effective_to] date NULL,
        [status] nvarchar(30) NOT NULL,
        [updated_by] bigint NOT NULL,
        [updated_at] datetime2 NOT NULL,
        CONSTRAINT [PK_staff_compensation_policies] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_staff_compensation_policies_centers_center_id] FOREIGN KEY ([center_id]) REFERENCES [dbo].[centers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_staff_compensation_policies_users_updated_by] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_staff_compensation_policies_users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024150000_ManualRefundAndPayroll'
)
BEGIN
    CREATE INDEX [IX_staff_compensation_policies_center_id] ON [dbo].[staff_compensation_policies] ([center_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024150000_ManualRefundAndPayroll'
)
BEGIN
    CREATE INDEX [IX_staff_compensation_policies_updated_by] ON [dbo].[staff_compensation_policies] ([updated_by]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024150000_ManualRefundAndPayroll'
)
BEGIN
    CREATE INDEX [IX_staff_compensation_policies_user_id_status] ON [dbo].[staff_compensation_policies] ([user_id], [status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024150000_ManualRefundAndPayroll'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261024150000_ManualRefundAndPayroll', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024170000_AddUserAvatarKey'
)
BEGIN
    ALTER TABLE [dbo].[users] ADD [avatar_key] nvarchar(500) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261024170000_AddUserAvatarKey'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261024170000_AddUserAvatarKey', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261025073231_AddCoachNotificationTargets'
)
BEGIN
    ALTER TABLE [dbo].[notifications] ADD [target_class_ids] nvarchar(1000) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261025073231_AddCoachNotificationTargets'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261025073231_AddCoachNotificationTargets', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261031090000_AddMediaCenterScope'
)
BEGIN
    ALTER TABLE [dbo].[uploaded_media] ADD [center_id] bigint NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261031090000_AddMediaCenterScope'
)
BEGIN
    UPDATE media SET center_id = COALESCE(
        (SELECT s.center_id FROM dbo.staff_profiles s WHERE s.user_id = media.uploaded_by_user_id AND s.status = 'Active'),
        (SELECT c.center_id FROM dbo.coach_profiles c WHERE c.user_id = media.uploaded_by_user_id AND c.status = 'Active'),
        (SELECT m.center_id FROM dbo.member_profiles m WHERE m.user_id = media.uploaded_by_user_id))
    FROM dbo.uploaded_media media WHERE media.uploaded_by_user_id IS NOT NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261031090000_AddMediaCenterScope'
)
BEGIN
    CREATE INDEX [IX_uploaded_media_center_id_created_at] ON [dbo].[uploaded_media] ([center_id], [created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261031090000_AddMediaCenterScope'
)
BEGIN
    CREATE INDEX [IX_uploaded_media_drive_file_id] ON [dbo].[uploaded_media] ([drive_file_id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261031090000_AddMediaCenterScope'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261031090000_AddMediaCenterScope', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102120000_AddCommunicationDeliveryLocking'
)
BEGIN
    IF COL_LENGTH(N'dbo.communication_deliveries', N'attempt_count') IS NULL
        ALTER TABLE [dbo].[communication_deliveries] ADD [attempt_count] INT NOT NULL CONSTRAINT [DF_communication_deliveries_attempt_count] DEFAULT 0;

    IF COL_LENGTH(N'dbo.communication_deliveries', N'next_attempt_at') IS NULL
        ALTER TABLE [dbo].[communication_deliveries] ADD [next_attempt_at] DATETIME2 NULL;

    IF COL_LENGTH(N'dbo.communication_deliveries', N'lease_until') IS NULL
        ALTER TABLE [dbo].[communication_deliveries] ADD [lease_until] DATETIME2 NULL;

    IF COL_LENGTH(N'dbo.communication_deliveries', N'locked_by') IS NULL
        ALTER TABLE [dbo].[communication_deliveries] ADD [locked_by] NVARCHAR(100) NULL;

    IF COL_LENGTH(N'dbo.communication_deliveries', N'last_error') IS NULL
        ALTER TABLE [dbo].[communication_deliveries] ADD [last_error] NVARCHAR(1000) NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'[dbo].[communication_deliveries]')
          AND name = N'IX_communication_deliveries_status_next_attempt_at_lease_until')
        CREATE INDEX [IX_communication_deliveries_status_next_attempt_at_lease_until]
            ON [dbo].[communication_deliveries] ([status], [next_attempt_at], [lease_until]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102120000_AddCommunicationDeliveryLocking'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261102120000_AddCommunicationDeliveryLocking', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261108183932_AddCounterMemberActivation'
)
BEGIN
    ALTER TABLE [dbo].[users] ADD [is_email_verified] bit NOT NULL DEFAULT CAST(1 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261108183932_AddCounterMemberActivation'
)
BEGIN
    ALTER TABLE [dbo].[users] ADD [must_change_password] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261108183932_AddCounterMemberActivation'
)
BEGIN
    CREATE TABLE [dbo].[account_activation_tokens] (
        [Id] bigint NOT NULL IDENTITY,
        [user_id] bigint NOT NULL,
        [token_hash] nvarchar(64) NOT NULL,
        [expires_at] datetime2 NOT NULL,
        [used_at] datetime2 NULL,
        [created_at] datetime2 NOT NULL,
        CONSTRAINT [PK_account_activation_tokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_account_activation_tokens_users_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261108183932_AddCounterMemberActivation'
)
BEGIN
    CREATE UNIQUE INDEX [IX_account_activation_tokens_token_hash] ON [dbo].[account_activation_tokens] ([token_hash]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261108183932_AddCounterMemberActivation'
)
BEGIN
    CREATE INDEX [IX_account_activation_tokens_user_id_created_at] ON [dbo].[account_activation_tokens] ([user_id], [created_at]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261108183932_AddCounterMemberActivation'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261108183932_AddCounterMemberActivation', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109040802_NormalizeVietnamesePhones'
)
BEGIN
    UPDATE u
    SET u.phone = N'0' + SUBSTRING(u.phone, 4, 20),
        u.updated_at = SYSUTCDATETIME()
    FROM dbo.users AS u
    WHERE u.phone LIKE N'+84%'
      AND LEN(u.phone) > 3
      AND NOT EXISTS (SELECT 1 FROM dbo.users AS o WHERE o.phone = N'0' + SUBSTRING(u.phone, 4, 20));

    UPDATE u
    SET u.phone = N'0' + SUBSTRING(u.phone, 3, 20),
        u.updated_at = SYSUTCDATETIME()
    FROM dbo.users AS u
    WHERE u.phone LIKE N'84%'
      AND LEN(u.phone) = 11
      AND u.phone NOT LIKE N'%[^0-9]%'
      AND NOT EXISTS (SELECT 1 FROM dbo.users AS o WHERE o.phone = N'0' + SUBSTRING(u.phone, 3, 20));
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109040802_NormalizeVietnamesePhones'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261109040802_NormalizeVietnamesePhones', N'10.0.12');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109041719_AddSupportRequestPriority'
)
BEGIN
    ALTER TABLE [dbo].[support_requests] ADD [priority] nvarchar(20) NOT NULL DEFAULT N'Normal';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109041719_AddSupportRequestPriority'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261109041719_AddSupportRequestPriority', N'10.0.12');
END;

COMMIT;
GO


GO

-- =========================================================================================
-- PRODUCTION SEED DATA: RESTORED FULL CLEAN DATASET (10 SPORTS, 10 ROOMS, 18 USERS, ETC.)
-- =========================================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

PRINT 'Disabling foreign key constraints...';
EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
GO

PRINT 'Cleaning existing data...';
DELETE FROM dbo.[system_settings];
DELETE FROM dbo.[audit_logs];
DELETE FROM dbo.[ai_messages];
DELETE FROM dbo.[ai_conversations];
DELETE FROM dbo.[support_request_messages];
DELETE FROM dbo.[support_requests];
DELETE FROM dbo.[user_notifications];
DELETE FROM dbo.[notifications];
DELETE FROM dbo.[uploaded_media];
DELETE FROM dbo.[equipment_issues];
DELETE FROM dbo.[payments];
DELETE FROM dbo.[invoice_items];
DELETE FROM dbo.[invoices];
DELETE FROM dbo.[attendance];
DELETE FROM dbo.[center_checkins];
DELETE FROM dbo.[class_enrollments];
DELETE FROM dbo.[session_bookings];
DELETE FROM dbo.[facility_resources];
DELETE FROM dbo.[coach_compensation_policies];
DELETE FROM dbo.[training_results];
DELETE FROM dbo.[training_plan_exercises];
DELETE FROM dbo.[training_plans];
DELETE FROM dbo.[exercises];
DELETE FROM dbo.[member_subscriptions];
DELETE FROM dbo.[membership_packages];
DELETE FROM dbo.[class_coaches];
DELETE FROM dbo.[class_sessions];
DELETE FROM dbo.[class_schedules];
DELETE FROM dbo.[classes];
DELETE FROM dbo.[coach_sports];
DELETE FROM dbo.[rooms];
DELETE FROM dbo.[sports];
DELETE FROM dbo.[coach_profiles];
DELETE FROM dbo.[member_profiles];
DELETE FROM dbo.[staff_profiles];
DELETE FROM dbo.[users];
DELETE FROM dbo.[role_permissions];
DELETE FROM dbo.[roles];
DELETE FROM dbo.[permissions];
DELETE FROM dbo.[centers];
GO

-- Table dbo.[system_settings] (6 rows)
SET IDENTITY_INSERT dbo.[system_settings] ON;
INSERT INTO dbo.[system_settings] ([Id], [setting_key], [setting_value], [description], [updated_by], [updated_at]) VALUES
(1, N'seed.rbac.auth-and-reception-search.v2', N'applied', N'One-time backfill for member sign-in profile access and receptionist member search.', NULL, NULL),
(2, N'center.rbac.15.24', N'{"PermissionCodes":["CLASS_VIEW","MEMBER_VIEW","members.center.create","members.center.read","payments.center.cash","subscriptions.center.create","subscriptions.read"],"CapabilityIds":["lookup_member","register_counter_package","checkin_member"]}', NULL, 35, '2026-10-11 15:43:01.0000000'),
(3, N'center.rbac.15.26', N'{"PermissionCodes":["CLASS_VIEW","members.self.read","members.self.update","payments.self.create","subscriptions.read","subscriptions.self.create"],"CapabilityIds":["book_class","cancel_booking","view_my_progress","ask_ai_assistant","use_coach_portal"]}', NULL, 35, '2026-10-20 07:46:13.0000000'),
(4, N'seed.demo-data.v1', N'completed', N'Demo data initializes a new development database once; saved business data is preserved.', NULL, NULL),
(5, N'site.landing-content', N'{"heroBanner":{"badge":"TRUNG TÂM THỂ THAO ĐẲNG CẤP QUỐC TẾ SCMS","title":"SHAPING RESILIENCE THROUGH SPORTS","description":"Phát triển thể lực, tôi luyện ý chí và bứt phá mọi giới hạn cùng hệ thống 9 cụm sân, phòng tập phục vụ 9 bộ môn thể thao.","videoUrl":"./hero-video.mp4","posterUrl":"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=75&w=1280&auto=format&fit=crop","primaryCtaText":"ĐĂNG KÝ HỘI VIÊN MỚI","primaryCtaLink":"#/register","secondaryCtaText":"KHÁM PHÁ MÔN HỌC","secondaryCtaLink":"#khoa-hoc","metrics":[{"id":"m1","value":"100%","label":"Chuẩn Thi Đấu"},{"id":"m2","value":"24/7","label":"Lọc Khí & Điều Hòa"},{"id":"m3","value":"50+","label":"Chuyên Gia Huấn Luyện"},{"id":"m4","value":"5.0 ★","label":"Đánh Giá Hội Viên"}]},"whyUs":{"badge":"TẠI SAO NÊN CHỌN SCMS","title":"Nền Tảng Vững Chắc Cho Hành Trình Chinh Phục Đỉnh Cao","description":"SCMS tự hào là tổ hợp thể thao đa năng chuẩn quốc tế, mang đến không gian tập luyện chuyên nghiệp, đội ngũ huấn luyện viên chứng chỉ AFC & NASM cùng quy trình cá nhân hóa toàn diện cho từng học viên.","features":[{"id":"f1","icon":"workspace_premium","title":"Huấn luyện viên đạt chuẩn quốc tế","description":"100% đội ngũ huấn luyện sở hữu chứng chỉ AFC, FIBA, BWF hoặc NASM với kinh nghiệm đào tạo thực chiến."},{"id":"f2","icon":"tune","title":"Giáo án cá nhân hóa theo từng thể trạng","description":"Đo lường chỉ số InBody định kỳ, thiết lập biểu đồ vận động riêng biệt và AI Workout Recommender theo mục tiêu."},{"id":"f3","icon":"local_fire_department","title":"Môi trường năng động và truyền cảm hứng","description":"Cộng đồng hội viên văn minh, các giải đấu nội bộ định kỳ và hệ thống sân bãi đạt chuẩn thi đấu Olympic."}],"stats":[{"id":"s1","number":10,"suffix":"","title":"CỤM SÂN & PHÒNG TẬP","subtitle":"Tiêu chuẩn thi đấu chuyên nghiệp","icon":"stadium","isAutoCount":false},{"id":"s2","number":10,"suffix":"","title":"MÔN THỂ THAO","subtitle":"Đa dạng lựa chọn cho mọi lứa tuổi","icon":"sports_kabaddi","isAutoCount":false},{"id":"s3","number":400,"suffix":"+","title":"HỌC VIÊN","subtitle":"Thường xuyên rèn luyện mỗi ngày","icon":"diversity_3","isAutoCount":false},{"id":"s4","number":13000,"suffix":" m²","title":"DIỆN TÍCH","subtitle":"Tổ hợp liên hợp khép kín hiện đại","icon":"domain","formatThousands":true,"isAutoCount":false}],"trustBanner":{"title":"Bảo hiểm rèn luyện toàn diện","description":"Tất cả hội viên được trang bị y tế sơ cấp cứu tại sân 24/7","certificate":"ISO 9001"}},"coursesSection":{"badge":"CHƯƠNG TRÌNH ĐÀO TẠO CHUYÊN NGHIỆP","title":"Khóa Học Thể Thao Đa Năng","description":"Thiết kế bài bản từ nền tảng đến chuyên sâu thi đấu, đáp ứng mọi nhu cầu rèn luyện thể chất chuẩn Olympic cùng đội ngũ huấn luyện viên kiện tướng quốc gia.","trustBadges":[{"id":"tb1","icon":"military_tech","text":"Chuẩn Đào Tạo Olympic"},{"id":"tb2","icon":"verified","text":"100% HLV Chứng Chỉ Quốc Tế"},{"id":"tb3","icon":"shield","text":"Bảo Hiểm & Y Tế 24/7"}],"sportsList":[{"id":"golf","name":"Golf","icon":"sports_golf","category":"Kỹ thuật & Đẳng cấp","facilityId":"room-golf","venue":"Tổ Hợp Sân Tập Golf & 3D Simulator","location":"Khu VIP • Tầng 3","rating":"5.0","ratingCount":"96","level":"Nhập môn • Kỹ thuật Swing TrackMan • Nâng cao","coach":"HLV PGA & Chuyên gia Kỹ thuật TrackMan","schedule":"06:00 - 22:00 hàng ngày","highlight":"Phòng tập Golf 3D màn hình cong độ nét cao, cảm biến TrackMan 4 phân tích đường bóng chính xác từng cú Swing.","price":"Từ 150.000đ/giờ","capacity":"8 - 12 golfer/ca","badges":["CÔNG NGHỆ 3D","TRACKMAN 4","PGA COACH"],"image":"https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=1200&auto=format&fit=crop","isVisible":true},{"id":"boi-loi","name":"Bơi lội","icon":"pool","category":"Sức bền & Tĩnh tâm","facilityId":"room-01","venue":"Bể Bơi 4 Mùa Nước Ấm 25m","location":"Khu A • Tầng 1","rating":"4.9","ratingCount":"128","level":"Mọi lứa tuổi • Nhập môn đến Thi đấu","coach":"Kiện tướng Bơi lội Quốc Gia","schedule":"06:00 - 21:00","highlight":"Bể bơi 25m tiêu chuẩn tập luyện, 5 làn bơi nước ấm 4 mùa, lọc ozone an toàn tuyệt đối.","price":"Từ 50.000đ/buổi","capacity":"25 - 35 người/ca","badges":["SỨC BỀN","NƯỚC ẤM 4 MÙA"],"image":"https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=1200&auto=format&fit=crop","isVisible":true},{"id":"gym-fitness","name":"Gym & Fitness","icon":"fitness_center","category":"Sức bền & Tĩnh tâm","facilityId":"room-08","venue":"Phòng Tập Gym & Fitness","location":"Khu A • Tầng 2","rating":"5.0","ratingCount":"240","level":"Tăng cơ • Giảm mỡ • Thể lực toàn diện","coach":"Master Trainer & Chuyên gia Thể Hình","schedule":"05:30 - 21:30","highlight":"Không gian 250m² trang bị giàn máy kháng lực Matrix, dàn tạ tự do đa dạng và máy đo InBody 770.","price":"Từ 30.000đ/ngày","capacity":"30 - 45 hội viên/ca","badges":["SỨC BỀN","MÁY TẬP ĐẦY ĐỦ"],"image":"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop","isVisible":true},{"id":"yoga-pilates","name":"Yoga & Pilates","icon":"self_improvement","category":"Sức bền & Tĩnh tâm","facilityId":"room-09","venue":"Phòng Tập Yoga & Pilates","location":"Khu C • Tầng 3","rating":"4.9","ratingCount":"165","level":"Tĩnh tâm • Dẻo dai • Cân bằng cột sống","coach":"Giảng viên Yoga Alliance Quốc Tế","schedule":"06:00 - 21:00","highlight":"Không gian yên tĩnh sàn gỗ tự nhiên, trang bị máy Pilates Reformer và thảm tập cao cấp lớp nhóm nhỏ.","price":"Từ 50.000đ/buổi","capacity":"15 - 20 học viên/lớp","badges":["SỨC BỀN","THƯ GIÃN & TĨNH TÂM"],"image":"https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=1200&auto=format&fit=crop","isVisible":true},{"id":"vo-thuat","name":"Võ thuật & Boxing","icon":"sports_mma","category":"Thể thao đối kháng","facilityId":"room-07","venue":"Phòng Tập Võ Thuật & Boxing","location":"Khu C • Tầng 1","rating":"4.9","ratingCount":"98","level":"Boxing • Muay Thai • Vovinam • Tự vệ","coach":"Võ sư Đai Đen & HLV Đội tuyển","schedule":"06:00 - 21:30","highlight":"Sàn tập trải thảm xốp EVA dày 3cm chống trơn, dàn bao cát thi đấu kiên cố và trang bị bảo hộ đầy đủ.","price":"Từ 300.000đ/tháng","capacity":"15 - 25 võ sinh/ca","badges":["ĐỐI KHÁNG","ĐẤU TẬP CHUẨN"],"image":"https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1200&auto=format&fit=crop","isVisible":true},{"id":"bong-da","name":"Bóng đá","icon":"sports_soccer","category":"Bóng & Vợt","facilityId":"room-02","venue":"Sân Bóng Đá Cỏ Nhân Tạo","location":"Khu Ngoài trời","rating":"4.8","ratingCount":"310","level":"Sân 5 & Sân 7 • Phong trào & Năng khiếu","coach":"Cựu Cầu Thủ Chuyên Nghiệp","schedule":"06:00 - 22:30","highlight":"Mặt cỏ nhân tạo dày êm chân rải hạt cao su giảm chấn, thoát nước nhanh và dàn đèn LED cao áp đêm.","price":"Từ 180.000đ/giờ","capacity":"10 - 20 cầu thủ/sân","badges":["BÓNG & VỢT","CỎ TIÊU CHUẨN"],"image":"https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop","isVisible":true},{"id":"cau-long","name":"Cầu lông","icon":"sports_tennis","category":"Bóng & Vợt","facilityId":"room-03","venue":"Cụm Sân Cầu Lông Thảm Chống Trượt","location":"Khu B • Tầng 2","rating":"4.9","ratingCount":"280","level":"Kỹ thuật • Tốc độ • Đánh đơn & Đánh đôi","coach":"HLV Liên đoàn Cầu Lông Cấp 1","schedule":"06:00 - 22:00","highlight":"4 sân cầu lông trong nhà với thảm PVC vân kim cương chống trơn, trần 8m không gió tạt, đèn chống lóa.","price":"Từ 60.000đ/giờ","capacity":"16 - 24 người chơi","badges":["BÓNG & VỢT","THẢM CHUYÊN DỤNG"],"image":"https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop","isVisible":true},{"id":"bong-ro","name":"Bóng rổ","icon":"sports_basketball","category":"Bóng & Vợt","facilityId":"room-05","venue":"Sân Bóng Rổ Tiêu Chuẩn Phong Trào","location":"Khu B • Tầng 1","rating":"4.8","ratingCount":"190","level":"Dẫn bóng • Sức bật • Chiến thuật nhóm","coach":"VĐV Bóng Rổ Giải Quốc Gia","schedule":"06:00 - 22:00","highlight":"Mặt sân sơn thể thao Acrylic chống trượt, trụ rổ kiên cố bảng kính cường lực độ nảy tốt, mái che mát.","price":"Từ 80.000đ/nửa sân","capacity":"15 - 20 người chơi","badges":["BÓNG & VỢT","MÁI CHE MÁT"],"image":"https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1200&auto=format&fit=crop","isVisible":true},{"id":"bong-ban","name":"Bóng bàn","icon":"sports_score","category":"Bóng & Vợt","facilityId":"room-04","venue":"Khu Bóng Bàn Trong Nhà","location":"Khu B • Tầng 3","rating":"4.8","ratingCount":"115","level":"Phản xạ • Kỹ thuật giật bóng & cắt bóng","coach":"Kiện tướng Bóng Bàn Quốc Gia","schedule":"06:00 - 22:00","highlight":"4 bàn thi đấu đạt chuẩn quốc tế, ánh sáng đều hạn chế chói mắt, khoảng trống di chuyển an toàn.","price":"Từ 40.000đ/giờ","capacity":"8 - 16 người chơi","badges":["BÓNG & VỢT","PHÒNG MÁY LẠNH"],"image":"https://images.unsplash.com/photo-1708268411988-d30e0e1eef0c?q=80&w=1200&auto=format&fit=crop","isVisible":true},{"id":"pickleball","name":"Pickleball","icon":"sports_tennis","category":"Bóng & Vợt","facilityId":"room-06","venue":"Cụm Sân Pickleball Ngoài Trời","location":"Khu Ngoài trời","rating":"5.0","ratingCount":"210","level":"Nhập môn • Dinking • Giao lưu phong trào","coach":"HLV Chứng chỉ Pickleball Pro","schedule":"05:30 - 22:00","highlight":"Cụm 4 sân ngoài trời mới nhất, mặt sơn Acrylic chống trơn, vạch bếp chuẩn và rào chắn bóng kiên cố.","price":"Từ 50.000đ/giờ","capacity":"8 - 16 người chơi","badges":["BÓNG & VỢT","BỘ MÔN HOT 2026"],"image":"https://images.unsplash.com/photo-1693142517898-2f986215e412?q=80&w=1200&auto=format&fit=crop","isVisible":true}]},"facilitiesSection":{"badge":"HẠ TẦNG THỂ THAO TIÊU CHUẨN","title":"HỆ THỐNG CƠ SỞ VẬT CHẤT TIỆN NGHI & CHẤT LƯỢNG","description":"Khu liên hợp thể thao rộng rãi, sạch đẹp với 9 cụm sân bãi và phòng tập dành cho bơi lội, Gym & Fitness, Yoga & Pilates, Võ thuật & Boxing, bóng đá, cầu lông, bóng rổ, bóng bàn và Pickleball. Phục vụ nhu cầu học tập, rèn luyện sức khỏe, sinh hoạt câu lạc bộ và thi đấu phong trào.","metrics":[{"id":"fm1","icon":"domain","value":"3.500m²","label":"TỔNG DIỆN TÍCH MẶT SÀN"},{"id":"fm2","icon":"verified","value":"9 Khu Vực","label":"ĐA DẠNG MÔN TẬP LUYỆN"},{"id":"fm3","icon":"groups","value":"600+","label":"LƯỢT TẬP LUYỆN/NGÀY"},{"id":"fm4","icon":"cleaning_services","value":"100%","label":"VỆ SINH & BẢO TRÌ ĐỊNH KỲ"}],"facilitiesList":[{"id":"room-golf","name":"Tổ Hợp Sân Tập Golf & 3D Simulator","category":"golf","categoryName":"Golf","location":"Khu VIP • Tầng 3","zone":"Khu VIP","capacity":"8 - 12 người/ca","openHours":"06:00 - 22:00 hàng ngày","priceRate":"Từ 150.000đ/giờ • Gói hội viên Golf","badge":"TrackMan 4 & 3D Simulator","badgeColor":"bg-emerald-600","image":"https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=1200&auto=format&fit=crop","secondaryImage":"https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800&auto=format&fit=crop","highlights":"Màn hình cong 4K • Cảm biến TrackMan 4 • Huấn luyện viên PGA","description":"Tổ hợp phòng tập Golf 3D hiện đại chuẩn quốc tế trang bị hệ thống cảm biến TrackMan 4 và màn hình cong 4K tái hiện hơn 100 sân golf danh tiếng thế giới. Tích hợp phân tích góc phóng, vận tốc đầu gậy, độ xoáy và camera quay chậm đa góc phục vụ học viên từ cơ bản đến chuyên nghiệp.","specs":[{"label":"Công nghệ cảm biến","value":"TrackMan 4 Radar kép phân tích đa chỉ số"},{"label":"Màn hình mô phỏng","value":"Màn cong 4K High-Definition 180 độ"},{"label":"Thảm & Khu Putting","value":"Cỏ nhân tạo chuyên dụng & Green dốc tự nhiên"},{"label":"Khung giờ mở","value":"06:00 - 22:00 hàng ngày"}],"amenities":["Bộ gậy tập TaylorMade & Callaway miễn phí","Tủ đồ thông minh cao cấp & phòng thay đồ","Phòng chờ VIP phục vụ trà & cà phê","Phân tích dữ liệu cú đánh TrackMan lưu điện thoại"],"tags":["Golf 3D trong nhà","Khóa học Swing cơ bản","TrackMan Simulator","Trải nghiệm sân 18 lỗ"],"isVisible":true},{"id":"room-01","name":"Bể Bơi 4 Mùa Nước Ấm 25m","category":"aquatics","categoryName":"Bơi lội","location":"Khu A • Tầng 1","zone":"Khu A","capacity":"25 - 35 người/ca","openHours":"06:00 - 21:00 hàng ngày","priceRate":"Từ 50.000đ/lượt • 250.000đ/làn/giờ","badge":"Nước Ấm 4 Mùa","badgeColor":"bg-cyan-600","image":"https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=1200&auto=format&fit=crop","secondaryImage":"https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=800&auto=format&fit=crop","highlights":"Bể bơi 25m tiêu chuẩn tập luyện • Nước ấm quanh năm • Cứu hộ túc trực liên tục","description":"Bể bơi trong nhà kích thước 25m x 12.5m với 5 làn bơi riêng biệt, độ sâu an toàn từ 1.2m đến 1.8m. Hệ thống lọc nước tuần hoàn khử khuẩn sạch sẽ mỗi ngày, nước ấm ổn định phù hợp cho việc học bơi và rèn luyện thể lực quanh năm cho cả người lớn lẫn trẻ em.","specs":[{"label":"Quy cách hồ","value":"25m x 12.5m (5 làn bơi)"},{"label":"Độ sâu an toàn","value":"1.2m - 1.8m tiện tập luyện"},{"label":"Hệ thống nước","value":"Lọc tuần hoàn & Gia nhiệt 4 mùa"},{"label":"Khung giờ mở","value":"06:00 - 21:00 hàng ngày"}],"amenities":["Phòng thay đồ & tắm tráng nóng lạnh","Tủ để đồ cá nhân có chìa khóa","Phao bơi & áo phao mượn miễn phí","Nhân viên cứu hộ quan sát thường trực"],"tags":["Bơi lội phong trào","Lớp học bơi cơ bản","Rèn luyện sức khỏe"],"isVisible":true},{"id":"room-02","name":"Sân Bóng Đá Cỏ Nhân Tạo (Sân 5 & Sân 7)","category":"team-sports","categoryName":"Sân bóng & Vợt","location":"Khu Ngoài trời","zone":"Ngoài trời","capacity":"10 - 20 cầu thủ/sân","openHours":"06:00 - 22:30 hàng ngày","priceRate":"Từ 180.000đ - 350.000đ/giờ","badge":"Cỏ Nhân Tạo Tiêu Chuẩn","badgeColor":"bg-emerald-600","image":"https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop","secondaryImage":"https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=800&auto=format&fit=crop","highlights":"Mặt cỏ nhân tạo êm chân • Dàn đèn LED chiếu sáng ban đêm • Lưới bao sân an toàn","description":"Cụm sân bóng đá cỏ nhân tạo ngoài trời gồm các sân 5 người và có thể ghép thành sân 7 người. Mặt cỏ dày, rải hạt cao su đàn hồi giảm chấn động cho khớp gối và cổ chân. Hệ thống thoát nước nhanh chóng giúp sân luôn khô ráo sau mưa.","specs":[{"label":"Quy cách sân","value":"2 sân 5 hoặc ghép thành 1 sân 7"},{"label":"Mặt cỏ","value":"Cỏ nhân tạo chuyên dụng rải hạt cao su"},{"label":"Chiếu sáng","value":"Dàn đèn LED cao áp rõ nét ban đêm"},{"label":"Bao quanh","value":"Lưới chắn bóng cao 6m chắc chắn"}],"amenities":["Ghế ngồi chờ có mái che bên sân","Phòng thay đồ & vệ sinh sạch sẽ","Cho mượn áo bib phân đội & bóng tập","Quầy nước giải khát tiện lợi"],"tags":["Bóng đá phong trào","Giao lưu đội nhóm","Thi đấu giao hữu"],"isVisible":true},{"id":"room-03","name":"Cụm Sân Cầu Lông Thảm Chống Trượt","category":"team-sports","categoryName":"Sân bóng & Vợt","location":"Khu B • Tầng 2","zone":"Khu B","capacity":"16 - 24 người chơi","openHours":"06:00 - 22:00 hàng ngày","priceRate":"Từ 60.000đ - 100.000đ/giờ/sân","badge":"Thảm Chuyên Dụng","badgeColor":"bg-blue-600","image":"https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop","secondaryImage":"https://images.unsplash.com/photo-1613918108466-292b78a8ef95?q=80&w=800&auto=format&fit=crop","highlights":"Thảm cao su chống trơn trượt • Đèn LED góc xiên không lóa mắt • Không gian thoáng mát","description":"Khu vực gồm 4 sân cầu lông tiêu chuẩn trong nhà, mặt sàn trải thảm cao su chuyên dụng bám giày và giảm chấn êm ái. Hệ thống đèn chiếu sáng bố trí góc chếch hạn chế chói mắt khi ngửa đầu đón cầu, thông gió tự nhiên không tạo gió xoáy làm bạt cầu.","specs":[{"label":"Quy mô cụm sân","value":"4 sân cầu lông trong nhà"},{"label":"Mặt sàn","value":"Thảm cao su PVC vân chống trượt"},{"label":"Độ cao trần","value":"8m thoáng mát, không gió tạt"},{"label":"Ánh sáng","value":"Đèn LED chống chói mắt người chơi"}],"amenities":["Ghế nghỉ có quạt gió mát mẻ","Dịch vụ căng cước và bán cầu tại quầy","Tủ cất balo và giày thể thao","Bình nước lọc phục vụ miễn phí"],"tags":["Cầu lông phong trào","Giao lưu câu lạc bộ","Rèn luyện phản xạ"],"isVisible":true},{"id":"room-04","name":"Khu Bóng Bàn Trong Nhà","category":"team-sports","categoryName":"Sân bóng & Vợt","location":"Khu B • Tầng 3","zone":"Khu B","capacity":"8 - 16 người chơi","openHours":"06:00 - 22:00 hàng ngày","priceRate":"Từ 40.000đ - 70.000đ/giờ/bàn","badge":"Bàn Tập Chuyên Dụng","badgeColor":"bg-purple-600","image":"https://images.unsplash.com/photo-1708268411988-d30e0e1eef0c?q=80&w=1200&auto=format&fit=crop","secondaryImage":"https://images.unsplash.com/photo-1621726543096-a8be76db3708?q=80&w=800&auto=format&fit=crop","highlights":"4 bàn bóng bàn chuyên dụng • Lưới và vợt tập đầy đủ • Đèn chiếu sáng đều, hạn chế chói","description":"Khu bóng bàn trong nhà gồm 4 bàn tập, bố trí khoảng trống quanh bàn để di chuyển và luyện kỹ thuật an toàn. Mặt sàn chống trượt, ánh sáng đều và thông gió nhẹ phù hợp cho các lớp bóng bàn cơ bản, luyện đánh đơn, đánh đôi và giao lưu câu lạc bộ.","specs":[{"label":"Quy mô","value":"4 bàn bóng bàn trong nhà"},{"label":"Kích thước bàn","value":"2.74m x 1.525m, cao 0.76m"},{"label":"Mặt sàn","value":"Sàn thể thao chống trượt, có khoảng trống di chuyển"},{"label":"Thiết bị tập","value":"Lưới, vợt, bóng tập và bảng điểm"}],"amenities":["Cho mượn vợt và bóng tập cơ bản","Ghế nghỉ giữa các lượt chơi","Tủ cất đồ cá nhân","Bình nước lọc phục vụ miễn phí"],"tags":["Bóng bàn cơ bản","Đánh đơn & Đánh đôi","Giao lưu câu lạc bộ"],"isVisible":true},{"id":"room-05","name":"Sân Bóng Rổ Tiêu Chuẩn Phong Trào","category":"team-sports","categoryName":"Sân bóng & Vợt","location":"Khu B • Tầng 1","zone":"Khu B","capacity":"15 - 20 người chơi","openHours":"06:00 - 22:00 hàng ngày","priceRate":"Từ 80.000đ/nửa sân • 180.000đ/trọn sân/giờ","badge":"Sân Tiêu Chuẩn","badgeColor":"bg-amber-600","image":"https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1200&auto=format&fit=crop","secondaryImage":"https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop","highlights":"Mặt sân sơn thể thao chống trơn • Trụ rổ kiên cố bảng kính cường lực • Mái che râm mát","description":"Sân bóng rổ trong nhà có mái che, mặt sân sơn phủ thể thao chống trơn trượt và vạch kẻ chuẩn xác. Trụ rổ chắc chắn, bảng rổ kính cường lực có độ nảy bóng tốt, tạo không gian năng động cho các bạn học sinh, sinh viên và hội nhóm giao lưu cuối tuần.","specs":[{"label":"Quy cách","value":"1 sân thi đấu chính hoặc 2 nửa sân tập"},{"label":"Mặt sân","value":"Sơn phủ thể thao Acrylic chống mài mòn"},{"label":"Bảng rổ","value":"Kính cường lực kèm vành lò xo bền bỉ"},{"label":"Chỗ ngồi","value":"Băng ghế nghỉ bên sân thoáng mát"}],"amenities":["Bảng lật điểm số tay","Cho mượn bóng tập luyện cơ bản","Quạt công nghiệp làm mát","Khu vệ sinh và rửa tay gần sân"],"tags":["Bóng rổ học sinh sinh viên","Giao lưu cuối tuần","Rèn luyện sức bật"],"isVisible":true},{"id":"room-06","name":"Cụm Sân Pickleball Ngoài Trời","category":"team-sports","categoryName":"Sân bóng & Vợt","location":"Khu Ngoài trời","zone":"Ngoài trời","capacity":"8 - 16 người chơi","openHours":"05:30 - 22:00 hàng ngày","priceRate":"Từ 50.000đ - 90.000đ/giờ/sân","badge":"Sân Sơn Đạt Chuẩn","badgeColor":"bg-teal-600","image":"https://images.unsplash.com/photo-1693142517898-2f986215e412?q=80&w=1200&auto=format&fit=crop","secondaryImage":"https://images.unsplash.com/photo-1753901821774-22a88913130f?q=80&w=800&auto=format&fit=crop","highlights":"Mặt sân cứng phẳng đẹp • Lưới căng đúng kích thước • Đèn chiếu sáng phục vụ chơi tối","description":"Cụm 4 sân Pickleball ngoài trời dành cho các lớp nhập môn, luyện đánh đơn, đánh đôi và giao lưu phong trào. Mặt sân phủ sơn thể thao chống trượt, có vạch khu vực bếp rõ ràng và lưới riêng cho từng sân. Hệ thống đèn LED và rào chắn bóng hỗ trợ tập luyện thuận tiện vào buổi tối.","specs":[{"label":"Quy mô","value":"4 sân Pickleball, mỗi sân 6.1m x 13.41m"},{"label":"Mặt sàn","value":"Sơn Acrylic chống trượt, vạch khu vực bếp rõ ràng"},{"label":"Hệ thống đèn","value":"Đèn pha LED chiếu sáng ban đêm"},{"label":"Rào chắn","value":"Lưới thép bọc nhựa bảo vệ quanh sân"}],"amenities":["Ghế ngồi nghỉ có ô che nắng","Dịch vụ cho thuê vợt và bóng tập","Bình nước uống mát phục vụ người chơi","Bãi đỗ xe rộng rãi ngay cạnh sân"],"tags":["Pickleball cơ bản","Đánh đơn & Đánh đôi","Rèn luyện phản xạ"],"isVisible":true},{"id":"room-07","name":"Phòng Tập Võ Thuật & Boxing","category":"combat-studio","categoryName":"Võ thuật & Boxing","location":"Khu C • Tầng 1","zone":"Khu C","capacity":"15 - 25 võ sinh/ca","openHours":"06:00 - 21:30 hàng ngày","priceRate":"Theo khóa học từ 300.000đ/tháng hoặc thuê sàn từ 150.000đ/giờ","badge":"Sàn Thảm An Toàn","badgeColor":"bg-red-700","image":"https://images.unsplash.com/photo-1517438322307-e67111335449?q=80&w=1200&auto=format&fit=crop","secondaryImage":"https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=800&auto=format&fit=crop","highlights":"Thảm xốp ghép êm ái • Dàn bao cát tập đấm đá • Dụng cụ bảo hộ tập luyện cơ bản","description":"Phòng tập võ thuật sạch sẽ, thoáng mát dành cho các câu lạc bộ Taekwondo, Karate, Vovinam, Boxing và các lớp kỹ năng tự vệ. Mặt sàn trải thảm xốp ghép thể thao êm ái, giảm chấn va đập, trang bị bao đấm và đích đá cơ bản giúp võ sinh an tâm rèn luyện.","specs":[{"label":"Diện tích","value":"90m² mặt sàn thông thoáng"},{"label":"Thảm sàn","value":"Thảm xốp ghép mút EVA dày 3cm chống trơn"},{"label":"Dàn bao cát","value":"4 - 6 bao đấm treo kiên cố"},{"label":"Dụng cụ tập","value":"Đích đấm, đích đá, găng tay cơ bản"}],"amenities":["Tủ cất đồ võ phục và dụng cụ cá nhân","Gương dán tường hỗ trợ chỉnh đòn thế","Quạt gió công nghiệp thoáng đãng","Tủ thuốc y tế và băng gạc sơ cứu cơ bản"],"tags":["Taekwondo & Karate","Boxing căn bản","Tự vệ & Rèn luyện tính kỷ luật"],"isVisible":true},{"id":"room-08","name":"Phòng Tập Gym & Fitness","category":"fitness","categoryName":"Gym, Yoga & Pilates","location":"Khu A • Tầng 2","zone":"Khu A","capacity":"30 - 45 hội viên cùng lúc","openHours":"05:30 - 21:30 hàng ngày","priceRate":"Vé ngày 30.000đ • Vé tháng từ 250.000đ - 350.000đ/tháng","badge":"Máy Tập Đầy Đủ","badgeColor":"bg-orange-600","image":"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop","secondaryImage":"https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop","highlights":"Đầy đủ máy Cardio & máy khối kháng lực • Dàn tạ đơn đa dạng cân nặng • Không gian sạch sẽ","description":"Phòng tập thể hình trang bị đầy đủ máy chạy bộ, xe đạp tập, máy ép ngực, kéo xô và các dàn tạ tay từ nhẹ đến nặng. Không gian tập luyện hòa đồng, thân thiện, có nhân viên túc trực hỗ trợ hướng dẫn cơ bản cho người mới bắt đầu.","specs":[{"label":"Diện tích","value":"Khoảng 250m² chia khu hợp lý"},{"label":"Máy Cardio","value":"Máy chạy bộ điện & xe đạp tập thể lực"},{"label":"Khu tạ tự do","value":"Tạ tay cao su từ 2kg đến 35kg, đòn tạ dài"},{"label":"Giàn máy khối","value":"Máy ép ngực, kéo xô, đạp đùi đa năng"}],"amenities":["Tủ gửi đồ có khóa an toàn","Cân sức khỏe và thước đo chiều cao","Phòng tắm và thay đồ riêng biệt","Quạt gió và điều hòa thông thoáng"],"tags":["Tập Gym tăng cơ giảm mỡ","Cardio rèn luyện tim mạch","Rèn luyện sức bền hàng ngày"],"isVisible":true},{"id":"room-09","name":"Phòng Tập Yoga & Pilates","category":"fitness","categoryName":"Gym, Yoga & Pilates","location":"Khu C • Tầng 3","zone":"Khu C","capacity":"15 - 20 học viên/lớp","openHours":"06:00 - 21:00 hàng ngày","priceRate":"Từ 50.000đ/buổi • Gói tháng từ 350.000đ/tháng","badge":"Thư Giãn & Tĩnh Tâm","badgeColor":"bg-emerald-700","image":"https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=1200&auto=format&fit=crop","secondaryImage":"https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop","highlights":"Không gian yên tĩnh • Khu thảm Yoga & Pilates Mat • Máy Reformer tập theo nhóm nhỏ","description":"Phòng tập Yoga & Pilates có khu thảm cho các bài tập thở, kéo giãn, thăng bằng và Pilates Mat, cùng khu máy Reformer dành cho nhóm nhỏ theo lịch hướng dẫn. Trang bị thảm tập, gạch Yoga, dây đai, vòng Pilates và bóng tập hỗ trợ học viên rèn luyện sự dẻo dai, sức mạnh cơ trung tâm và kiểm soát tư thế.","specs":[{"label":"Không gian","value":"Yên tĩnh, thoáng mát, sàn lót gỗ sạch sẽ"},{"label":"Khu thảm","value":"Thảm Yoga TPE và thảm Pilates Mat bám sàn tốt"},{"label":"Khu Pilates Reformer","value":"4 máy Reformer cho lớp nhóm nhỏ theo lịch"},{"label":"Dụng cụ hỗ trợ","value":"Gạch Yoga, dây đai, vòng Pilates và bóng tập"}],"amenities":["Bình nước uống lọc miễn phí","Giá cất thảm và tủ để đồ cá nhân","Phòng thay đồ lịch sự","Có mở các lớp cơ bản cho người mới"],"tags":["Yoga cơ bản","Pilates Mat & Reformer","Kéo giãn & Cân bằng tư thế"],"isVisible":true}]},"zonesLayout":{"badge":"BỐ TRÍ KHÔNG GIAN THUẬN TIỆN","title":"SƠ ĐỒ CÁC KHU VỰC TẬP LUYỆN","description":"9 cụm sân bãi và phòng tập được quy hoạch gọn gàng, lối đi thông thoáng, biển báo chỉ dẫn rõ ràng. Hệ thống quầy lễ tân tiếp đón chu đáo và hỗ trợ đặt sân nhanh chóng trực tiếp hoặc online.","zones":[{"id":"zone-a","name":"Khu A: Bơi Lội, Gym & Fitness","icon":"pool","color":"text-red-400","items":["Tầng 1: Bể bơi 4 mùa 25m trong nhà nước ấm","Tầng 2: Phòng tập Gym & Fitness","Tầng 3: Khu thay đồ & tắm tráng nóng lạnh"]},{"id":"zone-b","name":"Khu B: Bóng Rổ, Cầu Lông & Bóng Bàn","icon":"sports_basketball","color":"text-blue-400","items":["Tầng 1: Sân bóng rổ tiêu chuẩn phong trào có mái che","Tầng 2: Cụm 4 sân cầu lông thảm cao su chống trượt","Tầng 3: Khu bóng bàn trong nhà với 4 bàn tập"]},{"id":"zone-c","name":"Khu C: Võ Thuật, Boxing, Yoga & Pilates","icon":"self_improvement","color":"text-purple-400","items":["Tầng 1: Phòng tập võ thuật & Boxing, thảm và bao cát","Tầng 3: Phòng tập Yoga & Pilates, khu thảm và máy Reformer","Tủ đồ cá nhân và khu thay đồ phục vụ học viên"]},{"id":"zone-d","name":"Khu Ngoài Trời: Bóng Đá & Pickleball","icon":"stadium","color":"text-emerald-400","items":["Cụm sân bóng đá cỏ nhân tạo (sân 5 và sân 7)","Cụm 4 sân Pickleball, có lưới riêng và vạch khu vực bếp","Dàn đèn pha LED chiếu sáng ban đêm rõ nét"]}],"serviceAmenities":[{"id":"sa1","icon":"badge","text":"Tủ cất đồ cá nhân có chìa khóa an toàn, thuận tiện sử dụng"},{"id":"sa2","icon":"shower","text":"Phòng thay đồ và khu vực tắm tráng nóng lạnh sạch sẽ"},{"id":"sa3","icon":"local_cafe","text":"Quầy căn-tin nước giải khát, nước khoáng phục vụ nhanh"},{"id":"sa4","icon":"medical_services","text":"Tủ thuốc y tế và dụng cụ sơ cứu ban đầu luôn sẵn sàng"}]},"ctaAndFooter":{"ctaBadge":"DÀNH CHO ĐỘI NHÓM & TỔ CHỨC SỰ KIỆN","ctaTitle":"LIÊN HỆ ĐẶT THUÊ SÂN TẬP & TỔ CHỨC GIẢI ĐẤU","ctaDescription":"Bạn đang tìm sân tập thường xuyên cho đội nhóm hoặc cần thuê sân tổ chức giao lưu, giải đấu phong trào? Hãy liên hệ ngay với chúng tôi để chọn khung giờ đẹp và nhận mức giá ưu đãi nhất.","ctaPrimaryText":"ĐẶT THUÊ CỤM SÂN NGAY","ctaPrimaryLink":"#co-so-vat-chat","ctaSecondaryText":"XEM BẢNG GIÁ GÓI TẬP","ctaSecondaryLink":"#/login","brandName":"SCMS","brandTag":"PRO","brandSubtitle":"Olympic Sports Arena","brandDescription":"Không gian học tập và rèn luyện thể thao dành cho mọi lứa tuổi. Cùng SCMS chọn bộ môn yêu thích, nâng cao thể lực và kết nối cộng đồng.","contactAddress":"123 Nguyễn Thị Minh Khai, Quận 1, TP.HCM","contactPhone":"0353716249","contactEmail":"center.q1@sportscenter.vn","contactZaloPhone":"0353716249","contactFacebookUrl":"https://www.facebook.com/duyppvd","hoursWeekdays":"05:30 - 22:30","hoursWeekend":"06:00 - 22:00","hoursHolidays":"Mở cửa linh hoạt","hoursNote":"Giờ hoạt động cụ thể được ghi trong thông tin từng sân và phòng tập.","copyright":"© 2026 SCMS Sports Center. Bảo lưu mọi quyền."},"authShowcase":{"badge":"Sân tập mở cửa 24/7","tagline":"Khởi đầu bứt phá","loginTitle":"Tập luyện hôm nay, bứt phá mỗi ngày.","registerTitle":"Hành trình mới, phiên bản khỏe hơn.","description":"Hệ sinh thái thể thao đa năng với 9 cụm sân thi đấu chuẩn Olympic. Đặt sân siêu tốc, cá nhân hóa lịch tập và theo dõi chỉ số InBody cùng huấn luyện viên hàng đầu.","posterUrl":"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=75&w=800&auto=format&fit=crop","feature1Title":"Đặt chỗ trong 30s","feature1Desc":"Giữ sân & lớp học 7 ngày","feature1Icon":"bolt","feature2Title":"Chuẩn Olympic 5★","feature2Desc":"Hệ thống sân bãi cao cấp","feature2Icon":"verified","stat1Value":"10","stat1Label":"Bộ môn thi đấu","stat2Value":"10","stat2Label":"Khu tập luyện","stat3Value":"2.5K+","stat3Label":"Hội viên active"}}', N'Nội dung trang chủ công khai', 34, '2026-10-24 04:07:32.0000000'),
(10004, N'seed.demo.business-data.v2', N'applied', N'Demo business data for existing members: packages, classes, invoices, payments, sessions, bookings, attendance, checkins.', NULL, '2026-11-10 08:23:04.6395069');
SET IDENTITY_INSERT dbo.[system_settings] OFF;
GO

-- Table dbo.[audit_logs] (184 rows)
SET IDENTITY_INSERT dbo.[audit_logs] ON;
INSERT INTO dbo.[audit_logs] ([Id], [user_id], [action], [entity_type], [entity_id], [old_values], [new_values], [ip_address], [user_agent], [created_at], [center_id]) VALUES
(1, NULL, N'system-admin.bootstrapped', N'User', 38, NULL, N'{"Role":"SystemAdmin"}', NULL, NULL, '2026-10-09 16:29:03.0000000', NULL),
(2, 34, N'member.created', N'MemberProfile', 2, NULL, N'{"UserId":39,"MemberCode":"MB98D3911370","RegistrationSource":"self"}', NULL, NULL, '2026-10-09 17:56:03.0000000', 15),
(3, 34, N'Invoice.CancelledByMember', N'Invoice', 9, NULL, N'{"InvoiceNumber":"SC-20261009182826-3ed95a6798b7","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-09 18:55:57.0000000', NULL),
(4, 34, N'Invoice.CancelledByMember', N'Invoice', 8, NULL, N'{"InvoiceNumber":"SC-20261009182721-d04c03a94630","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-09 18:57:03.0000000', NULL),
(5, 34, N'Invoice.CancelledByMember', N'Invoice', 12, NULL, N'{"InvoiceNumber":"SC-20261009190036-9f9954101c7f","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-09 19:01:08.0000000', NULL),
(6, 34, N'Invoice.CancelledByMember', N'Invoice', 11, NULL, N'{"InvoiceNumber":"SC-20261009185705-04c7f947fefa","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-09 19:01:08.0000000', NULL),
(7, 34, N'Invoice.CancelledByMember', N'Invoice', 10, NULL, N'{"InvoiceNumber":"SC-20261009182944-410e1d7d034c","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-09 19:01:08.0000000', NULL),
(8, 34, N'Invoice.CancelledByMember', N'Invoice', 13, NULL, N'{"InvoiceNumber":"SC-20261009190203-876cec3f9afc","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-09 19:02:22.0000000', NULL),
(9, 36, N'Payment.CounterRecorded', N'Invoice', 15, NULL, N'{"InvoiceNumber":"SC-20261009192126-a44c8d5b7a0e","PaymentMethod":"CASH","Amount":1800000.00,"Status":"Paid"}', NULL, NULL, '2026-10-09 19:21:27.0000000', NULL),
(10, NULL, N'Invoice.CancelledByMember', N'Invoice', 14, NULL, N'{"InvoiceNumber":"SC-20261009190225-c173f9c48d70","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-09 19:39:49.0000000', NULL),
(11, 36, N'Payment.CounterRecorded', N'Invoice', 16, NULL, N'{"InvoiceNumber":"SC-20261009193948-5cf498fab3c9","PaymentMethod":"CASH","Amount":650000.00,"Status":"Paid"}', NULL, NULL, '2026-10-09 19:39:49.0000000', NULL),
(12, 37, N'Invoice.CancelledByMember', N'Invoice', 17, NULL, N'{"InvoiceNumber":"SC-20261009194046-7603d1aeab16","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-09 19:41:25.0000000', NULL),
(13, 36, N'Payment.CounterRecorded', N'Invoice', 19, NULL, N'{"InvoiceNumber":"SC-20261009194232-6a5aa643f1b4","PaymentMethod":"CASH","Amount":650000.00,"Status":"Paid"}', NULL, NULL, '2026-10-09 19:42:32.0000000', NULL),
(14, 36, N'Payment.CounterRecorded', N'Invoice', 20, NULL, N'{"InvoiceNumber":"SC-20261009194310-4bc823e4adbf","PaymentMethod":"CASH","Amount":650000.00,"Status":"Paid"}', NULL, NULL, '2026-10-09 19:43:10.0000000', NULL),
(15, 36, N'Payment.CounterRecorded', N'Invoice', 21, NULL, N'{"InvoiceNumber":"SC-20261009194318-b0a5a899ccd6","PaymentMethod":"CASH","Amount":650000.00,"Status":"Paid"}', NULL, NULL, '2026-10-09 19:43:18.0000000', NULL),
(16, NULL, N'Payment.GatewayFailed', N'Payment', 23, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-7915d0e23f5940ef872c432e209c6944","note":"Giao d\u1ECBch \u0111\u00E3 b\u1ECB h\u1EE7y b\u1EDFi ng\u01B0\u1EDDi d\u00F9ng (ResponseCode 24)"}', NULL, NULL, '2026-10-10 03:05:45.0000000', NULL),
(17, 34, N'Invoice.CancelledByMember', N'Invoice', 23, NULL, N'{"InvoiceNumber":"SC-20261010025719-183857713c0b","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-10 03:07:18.0000000', NULL),
(18, 34, N'Invoice.CancelledByMember', N'Invoice', 22, NULL, N'{"InvoiceNumber":"SC-20261010025342-c0d3be46e52f","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-10 03:07:19.0000000', NULL),
(19, NULL, N'Payment.GatewayFailed', N'Payment', 24, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-5254748a21cb40a7a12cd3fa07a41e5b","note":"Giao d\u1ECBch \u0111\u00E3 b\u1ECB h\u1EE7y b\u1EDFi ng\u01B0\u1EDDi d\u00F9ng (ResponseCode 24)"}', NULL, NULL, '2026-10-10 03:07:37.0000000', NULL),
(20, 34, N'Invoice.CancelledByMember', N'Invoice', 24, NULL, N'{"InvoiceNumber":"SC-20261010030728-13b1a3e58c1e","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-10 03:07:44.0000000', NULL),
(21, NULL, N'Payment.GatewayFailed', N'Payment', 25, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-053e3e86ce8f4c01a6c834d440ad9a6b","note":"Giao d\u1ECBch \u0111\u00E3 b\u1ECB h\u1EE7y b\u1EDFi ng\u01B0\u1EDDi d\u00F9ng (ResponseCode 24)"}', NULL, NULL, '2026-10-10 05:59:26.0000000', NULL),
(22, 34, N'Invoice.CancelledByMember', N'Invoice', 25, NULL, N'{"InvoiceNumber":"SC-20261010055853-2d5baa7783dd","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-10 15:34:40.0000000', NULL),
(23, 35, N'membership_package.updated', N'MembershipPackage', 1, N'{"Name":"G\u00F3i Basic Th\u1EC3 Thao","Price":650000.00,"DurationDays":30,"Status":"Active"}', N'{"Name":"G\u00F3i Basic Th\u1EC3 Thao","Price":700000,"DurationDays":30,"Status":"Active"}', NULL, NULL, '2026-10-10 16:39:30.0000000', 15),
(24, 35, N'membership_package.updated', N'MembershipPackage', 2, N'{"Name":"G\u00F3i Pro B\u1EE9t Ph\u00E1","Price":1800000.00,"DurationDays":90,"Status":"Active"}', N'{"Name":"G\u00F3i Pro B\u1EE9t Ph\u00E1","Price":1900000,"DurationDays":90,"Status":"Active"}', NULL, NULL, '2026-10-10 16:40:37.0000000', 15),
(25, 34, N'BOOK_SESSION', N'ClassSession', 1, NULL, NULL, NULL, NULL, '2026-10-11 04:46:17.0000000', 15),
(26, 34, N'CANCEL_SESSION_BOOKING', N'SessionBooking', 70, NULL, N'{"IsLateCancellation":false}', NULL, NULL, '2026-10-11 04:46:21.0000000', 15),
(27, 35, N'membership_package.updated', N'MembershipPackage', 1, N'{"Name":"G\u00F3i Basic Th\u1EC3 Thao","Price":650000.00,"DurationDays":30,"Status":"Active"}', N'{"Name":"G\u00F3i Basic Th\u1EC3 Thao","Price":700000,"DurationDays":30,"Status":"Active"}', NULL, NULL, '2026-10-11 05:33:41.0000000', 15),
(28, 36, N'Payment.CounterRecorded', N'Invoice', 26, NULL, N'{"InvoiceNumber":"SC-20261011053540-e742f0661978","PaymentMethod":"CASH","Amount":700000.00,"Status":"Paid"}', NULL, NULL, '2026-10-11 05:35:41.0000000', NULL),
(29, 41, N'CANCEL_SESSION_BOOKING', N'SessionBooking', 68, NULL, N'{"IsLateCancellation":false}', NULL, NULL, '2026-10-11 05:38:30.0000000', 15),
(30, 41, N'CANCEL_SESSION_BOOKING', N'SessionBooking', 63, NULL, N'{"IsLateCancellation":false}', NULL, NULL, '2026-10-11 05:38:32.0000000', 15),
(31, 41, N'CANCEL_SESSION_BOOKING', N'SessionBooking', 65, NULL, N'{"IsLateCancellation":false}', NULL, NULL, '2026-10-11 05:38:35.0000000', 15),
(32, 41, N'CANCEL_SESSION_BOOKING', N'SessionBooking', 57, NULL, N'{"IsLateCancellation":false}', NULL, NULL, '2026-10-11 05:38:36.0000000', 15),
(33, NULL, N'Payment.GatewayFailed', N'Payment', 27, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-01443bf0fa894e05a94c286ad71b5199","note":"Giao d\u1ECBch \u0111\u00E3 b\u1ECB h\u1EE7y b\u1EDFi ng\u01B0\u1EDDi d\u00F9ng (ResponseCode 24)"}', NULL, NULL, '2026-10-11 15:35:23.0000000', NULL),
(34, 34, N'Invoice.CancelledByMember', N'Invoice', 27, NULL, N'{"InvoiceNumber":"SC-20261011153500-6699bc82e3d4","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-11 15:35:36.0000000', NULL),
(35, 34, N'BOOK_SESSION', N'ClassSession', 1, NULL, NULL, NULL, NULL, '2026-10-11 15:35:42.0000000', 15),
(36, 34, N'CANCEL_SESSION_BOOKING', N'SessionBooking', 70, NULL, N'{"IsLateCancellation":false}', NULL, NULL, '2026-10-11 15:35:59.0000000', 15),
(37, 34, N'BOOK_SESSION', N'ClassSession', 10, NULL, NULL, NULL, NULL, '2026-10-11 15:36:03.0000000', 15),
(38, 34, N'CANCEL_SESSION_BOOKING', N'SessionBooking', 71, NULL, N'{"IsLateCancellation":false}', NULL, NULL, '2026-10-11 15:36:07.0000000', 15),
(39, 35, N'membership_package.updated', N'MembershipPackage', 1, N'{"Name":"G\u00F3i Basic Th\u1EC3 Thao","Price":650000.00,"DurationDays":30,"Status":"Active"}', N'{"Name":"G\u00F3i Basic Th\u1EC3 Thao","Price":700000,"DurationDays":30,"Status":"Active"}', NULL, NULL, '2026-10-11 15:41:41.0000000', 15),
(40, 35, N'CENTER_ROLE_PERMISSIONS_REPLACED', N'Role', 24, NULL, N'{"PermissionCodes":["CLASS_VIEW","MEMBER_VIEW","members.center.create","members.center.read","payments.center.cash","subscriptions.center.create","subscriptions.read"],"CapabilityIds":["lookup_member","register_counter_package","checkin_member"]}', NULL, NULL, '2026-10-11 15:43:01.0000000', 15),
(41, 35, N'CENTER_ROLE_PERMISSIONS_REPLACED', N'Role', 26, NULL, N'{"PermissionCodes":["CLASS_VIEW","members.self.read","members.self.update","payments.self.create","subscriptions.read","subscriptions.self.create"],"CapabilityIds":["book_class","cancel_booking","view_my_progress","ask_ai_assistant"]}', NULL, NULL, '2026-10-11 15:45:03.0000000', 15),
(42, 35, N'CENTER_ROLE_PERMISSIONS_REPLACED', N'Role', 26, N'{"PermissionCodes":["CLASS_VIEW","members.self.read","members.self.update","payments.self.create","subscriptions.read","subscriptions.self.create"],"CapabilityIds":["book_class","cancel_booking","view_my_progress","ask_ai_assistant"]}', N'{"PermissionCodes":["CLASS_VIEW","members.self.read","members.self.update","payments.self.create","subscriptions.self.create","subscriptions.read"],"CapabilityIds":["book_class","cancel_booking","view_my_progress","ask_ai_assistant"]}', NULL, NULL, '2026-10-11 15:45:24.0000000', 15),
(43, 34, N'TRAINING_PLAN_SAVED', N'TrainingPlan', NULL, NULL, NULL, NULL, NULL, '2026-10-11 15:53:32.0000000', 15),
(44, 34, N'TRAINING_PLAN_ARCHIVED', N'TrainingPlan', 6, NULL, NULL, NULL, NULL, '2026-10-11 15:53:39.0000000', 15),
(45, 34, N'COACH_NOTIFICATION_SENT', N'Notification', NULL, NULL, NULL, NULL, NULL, '2026-10-11 15:54:04.0000000', 15),
(46, 34, N'BOOK_SESSION', N'ClassSession', 10, NULL, NULL, NULL, NULL, '2026-10-12 03:07:51.0000000', 15),
(47, 34, N'CANCEL_SESSION_BOOKING', N'SessionBooking', 71, NULL, N'{"IsLateCancellation":false}', NULL, NULL, '2026-10-12 03:08:01.0000000', 15),
(48, 34, N'COACH_NOTIFICATION_SENT', N'Notification', NULL, NULL, NULL, NULL, NULL, '2026-10-12 04:48:41.0000000', 15),
(49, 34, N'GOOGLE_LOGIN', N'User', 45, NULL, NULL, NULL, NULL, '2026-10-12 11:37:47.0000000', NULL),
(50, 34, N'GOOGLE_LOGIN', N'User', 45, NULL, NULL, NULL, NULL, '2026-10-12 11:40:27.0000000', NULL),
(51, 34, N'GOOGLE_LOGIN', N'User', 45, NULL, NULL, NULL, NULL, '2026-10-12 11:45:21.0000000', NULL),
(52, 34, N'GOOGLE_LOGIN', N'User', 45, NULL, NULL, NULL, NULL, '2026-10-12 12:12:43.0000000', NULL),
(53, 34, N'GOOGLE_LOGIN', N'User', 45, NULL, NULL, NULL, NULL, '2026-10-13 02:42:39.0000000', NULL),
(54, NULL, N'Payment.GatewayFailed', N'Payment', 28, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-abd6500ff8314650828752888217f0d6","note":"Giao d\u1ECBch \u0111\u00E3 b\u1ECB h\u1EE7y b\u1EDFi ng\u01B0\u1EDDi d\u00F9ng (ResponseCode 24)"}', NULL, NULL, '2026-10-13 02:43:16.0000000', NULL),
(55, 34, N'Invoice.CancelledByMember', N'Invoice', 28, NULL, N'{"InvoiceNumber":"SC-20261013024305-9bf43ac61541","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-13 02:43:35.0000000', NULL),
(56, 34, N'GOOGLE_LOGIN', N'User', 45, NULL, NULL, NULL, NULL, '2026-10-13 02:49:52.0000000', NULL),
(57, 34, N'GOOGLE_LOGIN', N'User', 45, NULL, NULL, NULL, NULL, '2026-10-13 06:41:19.0000000', NULL),
(58, NULL, N'Payment.GatewayFailed', N'Payment', 29, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-f65f7535965e4d18ba282e451591d152","note":"Giao d\u1ECBch \u0111\u00E3 b\u1ECB h\u1EE7y b\u1EDFi ng\u01B0\u1EDDi d\u00F9ng (ResponseCode 24)"}', NULL, NULL, '2026-10-13 06:41:54.0000000', NULL),
(59, 34, N'GOOGLE_LOGIN', N'User', 45, NULL, NULL, NULL, NULL, '2026-10-13 06:42:02.0000000', NULL),
(60, NULL, N'Payment.GatewayFailed', N'Payment', 30, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-6eada797c01a457d987efb3b6216a296","note":"Giao d\u1ECBch \u0111\u00E3 b\u1ECB h\u1EE7y b\u1EDFi ng\u01B0\u1EDDi d\u00F9ng (ResponseCode 24)"}', NULL, NULL, '2026-10-13 07:42:07.0000000', NULL),
(61, 34, N'Invoice.CancelledByMember', N'Invoice', 30, NULL, N'{"InvoiceNumber":"SC-20261013074156-d2831bf4745a","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-13 07:42:26.0000000', NULL),
(62, NULL, N'Payment.GatewayFailed', N'Payment', 31, NULL, N'{"provider":"MOMO","gatewayReference":"PAY-c05cdc7e8c034938b592b2d817e63225","note":"MoMo result 1006"}', NULL, NULL, '2026-10-13 07:42:41.0000000', NULL),
(63, 34, N'Invoice.CancelledByMember', N'Invoice', 31, NULL, N'{"InvoiceNumber":"SC-20261013074228-fb3673dbf758","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-13 07:42:54.0000000', NULL),
(64, 34, N'Invoice.CancelledByMember', N'Invoice', 32, NULL, N'{"InvoiceNumber":"SC-20261013074257-4067249e57f2","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-13 07:43:06.0000000', NULL),
(65, NULL, N'Payment.GatewayFailed', N'Payment', 33, NULL, N'{"provider":"MOMO","gatewayReference":"PAY-e6c7b602a92f4b2c8cd05ec40a02f83a","note":"MoMo result 1006"}', NULL, NULL, '2026-10-13 07:43:14.0000000', NULL),
(66, 34, N'GOOGLE_LOGIN', N'User', 45, NULL, NULL, NULL, NULL, '2026-10-13 07:43:30.0000000', NULL),
(67, 34, N'Invoice.CancelledByMember', N'Invoice', 29, NULL, N'{"InvoiceNumber":"SC-20261013064143-ab8a9f6731db","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-13 07:45:01.0000000', NULL),
(68, NULL, N'Payment.GatewayFailed', N'Payment', 34, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-bcfc694524694511a1a81b959962bee7","note":"Giao d\u1ECBch \u0111\u00E3 b\u1ECB h\u1EE7y b\u1EDFi ng\u01B0\u1EDDi d\u00F9ng (ResponseCode 24)"}', NULL, NULL, '2026-10-13 07:46:24.0000000', NULL),
(69, 34, N'TRAINING_PLAN_SAVED', N'TrainingPlan', NULL, NULL, NULL, NULL, NULL, '2026-10-13 07:53:03.0000000', 15),
(70, 34, N'TRAINING_PLAN_ARCHIVED', N'TrainingPlan', 7, NULL, NULL, NULL, NULL, '2026-10-13 07:53:08.0000000', 15),
(71, 34, N'TRAINING_PLAN_ARCHIVED', N'TrainingPlan', 5, NULL, NULL, NULL, NULL, '2026-10-13 07:53:10.0000000', 15),
(72, 34, N'Invoice.CancelledByMember', N'Invoice', 35, NULL, N'{"InvoiceNumber":"SC-20261013080314-978c058e3686","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-13 08:12:42.0000000', NULL),
(73, 34, N'Invoice.CancelledByMember', N'Invoice', 36, NULL, N'{"InvoiceNumber":"SC-20261013081244-b96b2105bf27","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-13 08:16:46.0000000', NULL),
(74, NULL, N'Payment.GatewayFailed', N'Payment', 37, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-bbf8ef350e3c45b596db94d9b088679d","note":"Giao d\u1ECBch \u0111\u00E3 b\u1ECB h\u1EE7y b\u1EDFi ng\u01B0\u1EDDi d\u00F9ng (ResponseCode 24)"}', NULL, NULL, '2026-10-13 08:17:45.0000000', NULL),
(75, 34, N'Invoice.CancelledByMember', N'Invoice', 37, NULL, N'{"InvoiceNumber":"SC-20261013081649-be10c232a9d2","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-13 08:18:06.0000000', NULL),
(76, NULL, N'Payment.GatewaySucceeded', N'Payment', 38, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-95a97aa0a3a241f082a8216be2125b72","providerTransactionId":"15703127","Amount":1800000.00,"Status":"Paid"}', NULL, NULL, '2026-10-13 08:19:07.0000000', NULL),
(77, 34, N'CANCEL_SESSION_BOOKING', N'SessionBooking', 61, NULL, N'{"IsLateCancellation":false}', NULL, NULL, '2026-10-13 08:20:50.0000000', 15),
(78, 36, N'Invoice.CancelledByMember', N'Invoice', 33, NULL, N'{"InvoiceNumber":"SC-20261013074308-9a251f1db323","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-13 08:23:08.0000000', NULL),
(79, 36, N'Payment.CounterRecorded', N'Invoice', 39, NULL, N'{"InvoiceNumber":"SC-20261013082307-1d2783cace0c","PaymentMethod":"CASH","Amount":650000.00,"Status":"Paid"}', NULL, NULL, '2026-10-13 08:23:08.0000000', NULL),
(80, 36, N'Checkin.Recorded', N'CenterCheckin', 7, NULL, NULL, NULL, NULL, '2026-10-13 08:23:16.0000000', 15),
(81, 35, N'staff.updated', N'User', 36, N'{"Status":"Active","Role":"Receptionist"}', N'{"Status":"Disabled","Role":"Receptionist"}', NULL, NULL, '2026-10-13 08:43:17.0000000', 15),
(82, 35, N'staff.updated', N'User', 36, N'{"Status":"Disabled","Role":"Receptionist"}', N'{"Status":"Active","Role":"Receptionist"}', NULL, NULL, '2026-10-13 08:43:25.0000000', 15),
(83, NULL, N'Payment.GatewayFailed', N'Payment', 40, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-2cfba6ee790c4d60b9eb1e891479455c","note":"Giao d\u1ECBch \u0111\u00E3 b\u1ECB h\u1EE7y b\u1EDFi ng\u01B0\u1EDDi d\u00F9ng (ResponseCode 24)"}', NULL, NULL, '2026-10-13 10:24:12.0000000', NULL),
(84, 34, N'Invoice.CancelledByMember', N'Invoice', 40, NULL, N'{"InvoiceNumber":"SC-20261013102404-96a957b94d2f","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-13 13:02:02.0000000', NULL),
(85, 35, N'CLASS_COACH.ASSIGNED', N'Class', 1, N'[{"CoachId":11,"IsPrimary":true,"AssignedDate":"2026-10-11"}]', N'{"CoachId":11,"FullName":"Hu\u1EA5n luy\u1EC7n vi\u00EAn m\u1EABu","IsPrimary":true}', NULL, NULL, '2026-10-14 03:26:17.0000000', 15),
(86, 35, N'member.profile.updated.by_staff', N'MemberProfile', 4, N'{"EmailPresent":true,"PhonePresent":true}', N'{"EmailChanged":false,"PhoneChanged":false}', NULL, NULL, '2026-10-14 11:24:37.0000000', 15),
(87, 34, N'member.created', N'MemberProfile', 8, NULL, N'{"UserId":46,"MemberCode":"MBC9B6E8BD5E","RegistrationSource":"self"}', NULL, NULL, '2026-10-14 11:54:27.0000000', 15),
(88, 36, N'Payment.CounterRecorded', N'Invoice', 41, NULL, N'{"InvoiceNumber":"SC-20261014123401-c66159e7d9eb","PaymentMethod":"CASH","Amount":650000.00,"Status":"Paid"}', NULL, NULL, '2026-10-14 12:34:02.0000000', NULL),
(89, 34, N'Invoice.CancelledByMember', N'Invoice', 42, NULL, N'{"InvoiceNumber":"SC-20261014131749-1dc4756bab76","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-14 13:18:26.0000000', NULL),
(90, NULL, N'Payment.GatewaySucceeded', N'Payment', 43, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-9bbe113e1c9945c6bf948f8619974d4e","providerTransactionId":"15704649","Amount":5800000.00,"Status":"Paid"}', NULL, NULL, '2026-10-14 13:20:04.0000000', NULL),
(91, 35, N'class.created', N'Class', 6, NULL, N'{"Name":"B\u01A1i s\u1EA3i K\u1EF9 thu\u1EADt Olympic K01","SportId":1,"RoomId":1,"Capacity":20,"Status":"Draft"}', NULL, NULL, '2026-10-14 13:25:45.0000000', 15),
(92, 35, N'class_schedule.created', N'ClassSchedule', 12, NULL, N'{"ClassId":6,"RoomId":1,"DayOfWeek":1,"StartTime":"08:30:00","EndTime":"09:00:00","StartDate":"2026-10-14","EndDate":"2027-01-12","Status":"Active","GeneratedSessions":13}', NULL, NULL, '2026-10-14 13:27:00.0000000', 15),
(93, 35, N'class.updated', N'Class', 6, N'{"Name":"B\u01A1i s\u1EA3i K\u1EF9 thu\u1EADt Olympic K01","SportId":1,"RoomId":1,"Capacity":20,"AllowWaitlist":true,"DurationMinutes":60,"Status":"Draft"}', N'{"Name":"B\u01A1i s\u1EA3i K\u1EF9 thu\u1EADt Olympic K01","SportId":1,"RoomId":1,"Capacity":1,"AllowWaitlist":true,"DurationMinutes":60,"Status":"Draft"}', NULL, NULL, '2026-10-14 13:27:14.0000000', 15),
(94, 35, N'class.updated', N'Class', 6, N'{"Name":"B\u01A1i s\u1EA3i K\u1EF9 thu\u1EADt Olympic K01","SportId":1,"RoomId":1,"Capacity":1,"AllowWaitlist":true,"DurationMinutes":60,"Status":"Draft"}', N'{"Name":"B\u01A1i s\u1EA3i K\u1EF9 thu\u1EADt Olympic K01","SportId":1,"RoomId":1,"Capacity":1,"AllowWaitlist":true,"DurationMinutes":60,"Status":"Draft"}', NULL, NULL, '2026-10-14 13:27:32.0000000', 15),
(95, 35, N'CLASS_COACH.ASSIGNED', N'Class', 6, N'[]', N'{"CoachId":11,"FullName":"Hu\u1EA5n luy\u1EC7n vi\u00EAn m\u1EABu","IsPrimary":true}', NULL, NULL, '2026-10-14 13:27:32.0000000', 15),
(96, 35, N'class.published', N'Class', 6, N'{"Status":"Draft"}', N'{"Status":"Published"}', NULL, NULL, '2026-10-14 13:27:35.0000000', 15),
(97, 35, N'class.updated', N'Class', 6, N'{"Name":"B\u01A1i s\u1EA3i K\u1EF9 thu\u1EADt Olympic K01","SportId":1,"RoomId":1,"Capacity":1,"AllowWaitlist":true,"DurationMinutes":60,"Status":"Published"}', N'{"Name":"B\u01A1i s\u1EA3i K\u1EF9 thu\u1EADt Olympic K01","SportId":1,"RoomId":1,"Capacity":1,"AllowWaitlist":true,"DurationMinutes":65,"Status":"Published"}', NULL, NULL, '2026-10-14 13:27:45.0000000', 15),
(98, 35, N'CLASS_COACH.ASSIGNED', N'Class', 6, N'[{"CoachId":11,"IsPrimary":true,"AssignedDate":"2026-10-14"}]', N'{"CoachId":11,"FullName":"Hu\u1EA5n luy\u1EC7n vi\u00EAn m\u1EABu","IsPrimary":true}', NULL, NULL, '2026-10-14 13:27:45.0000000', 15),
(99, 35, N'staff.appointed', N'User', 44, N'{"Role":"Member"}', N'{"Role":"Coach","StaffCode":"ST3790A3A4AA"}', NULL, NULL, '2026-10-14 13:33:30.0000000', 15),
(100, 42, N'BOOK_SESSION', N'ClassSession', 7, NULL, NULL, NULL, NULL, '2026-10-14 13:50:28.0000000', 15);
INSERT INTO dbo.[audit_logs] ([Id], [user_id], [action], [entity_type], [entity_id], [old_values], [new_values], [ip_address], [user_agent], [created_at], [center_id]) VALUES
(101, 42, N'CANCEL_SESSION_BOOKING', N'SessionBooking', 60, NULL, N'{"IsLateCancellation":false}', NULL, NULL, '2026-10-14 13:57:29.0000000', 15),
(102, 34, N'SESSION_ATTENDANCE', N'ClassSession', 1, NULL, NULL, NULL, NULL, '2026-10-14 14:02:40.0000000', 15),
(103, 34, N'member.created', N'MemberProfile', 9, NULL, N'{"UserId":47,"MemberCode":"MB02A9B1CC98","RegistrationSource":"self"}', NULL, NULL, '2026-10-14 14:08:33.0000000', 15),
(104, 35, N'CLASS_COACH.ASSIGNED', N'Class', 1, N'[{"CoachId":11,"IsPrimary":true,"AssignedDate":"2026-10-14"}]', N'{"CoachId":12,"FullName":"V\u0169 \u0110\u1EE9c Th\u1EAFng","IsPrimary":true}', NULL, NULL, '2026-10-14 14:22:07.0000000', 15),
(105, 35, N'CLASS_COACH.ASSIGNED', N'Class', 1, N'[{"CoachId":11,"IsPrimary":false,"AssignedDate":"2026-10-14"},{"CoachId":12,"IsPrimary":true,"AssignedDate":"2026-10-14"}]', N'{"CoachId":11,"FullName":"Hu\u1EA5n luy\u1EC7n vi\u00EAn m\u1EABu","IsPrimary":true}', NULL, NULL, '2026-10-14 14:22:54.0000000', 15),
(106, 34, N'BOOK_SESSION', N'ClassSession', 19, NULL, NULL, NULL, NULL, '2026-10-14 14:26:00.0000000', 15),
(107, 36, N'Payment.CounterRecorded', N'Invoice', 44, NULL, N'{"InvoiceNumber":"SC-20261014143439-6d023cbb5377","PaymentMethod":"CASH","Amount":650000.00,"Status":"Paid"}', NULL, NULL, '2026-10-14 14:34:40.0000000', NULL),
(108, 36, N'Checkin.Recorded', N'CenterCheckin', 8, NULL, NULL, NULL, NULL, '2026-10-14 14:37:56.0000000', 15),
(109, 41, N'Support.Submitted', N'SupportRequest', 1, NULL, N'{"RequesterId":41,"MemberId":3,"Status":"Open","Priority":"High"}', NULL, NULL, '2026-10-16 04:00:11.0000000', 15),
(110, 34, N'SESSION_ATTENDANCE', N'ClassSession', 1, NULL, NULL, NULL, NULL, '2026-10-16 04:59:16.0000000', 15),
(111, 34, N'SESSION_ATTENDANCE', N'ClassSession', 1, NULL, NULL, NULL, NULL, '2026-10-16 05:02:43.0000000', 15),
(112, 36, N'Support.Updated', N'SupportRequest', 1, NULL, N'{"RequesterId":41,"MemberId":3,"Status":"Open","Priority":"High"}', NULL, NULL, '2026-10-16 05:55:05.0000000', 15),
(113, 36, N'Support.Updated', N'SupportRequest', 1, NULL, N'{"RequesterId":41,"MemberId":3,"Status":"Resolved","Priority":"High"}', NULL, NULL, '2026-10-16 05:55:12.0000000', 15),
(114, 36, N'Support.Updated', N'SupportRequest', 1, NULL, N'{"RequesterId":41,"MemberId":3,"Status":"Resolved","Priority":"High"}', NULL, NULL, '2026-10-16 06:06:33.0000000', 15),
(115, 36, N'Support.Updated', N'SupportRequest', 1, NULL, N'{"RequesterId":41,"MemberId":3,"Status":"InProgress","Priority":"High"}', NULL, NULL, '2026-10-16 06:06:37.0000000', 15),
(116, 36, N'Support.Updated', N'SupportRequest', 1, NULL, N'{"RequesterId":41,"MemberId":3,"Status":"Open","Priority":"High"}', NULL, NULL, '2026-10-16 06:06:40.0000000', 15),
(117, 36, N'Support.Updated', N'SupportRequest', 1, NULL, N'{"RequesterId":41,"MemberId":3,"Status":"Resolved","Priority":"High"}', NULL, NULL, '2026-10-16 06:06:43.0000000', 15),
(118, 34, N'GOOGLE_LOGIN', N'User', 45, NULL, NULL, NULL, NULL, '2026-10-16 08:24:05.0000000', NULL),
(119, 34, N'SESSION_ATTENDANCE', N'ClassSession', 10, NULL, NULL, NULL, NULL, '2026-10-16 08:26:05.0000000', 15),
(120, 34, N'COACH_NOTIFICATION_SENT', N'Notification', NULL, NULL, NULL, NULL, NULL, '2026-10-16 08:48:09.0000000', 15),
(121, 34, N'TRAINING_PROGRESS_RECORDED', N'TrainingResult', NULL, NULL, NULL, NULL, NULL, '2026-10-16 09:13:59.0000000', 15),
(122, 34, N'TRAINING_PROGRESS_RECORDED', N'TrainingResult', NULL, NULL, NULL, NULL, NULL, '2026-10-16 09:14:37.0000000', 15),
(123, 41, N'Invoice.CancelledByMember', N'Invoice', 45, NULL, N'{"InvoiceNumber":"SC-20261016093204-c94789639d81","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-16 09:32:12.0000000', NULL),
(124, 41, N'Invoice.CancelledByMember', N'Invoice', 46, NULL, N'{"InvoiceNumber":"SC-20261016093214-cf234d97ce12","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-16 09:32:25.0000000', NULL),
(125, 41, N'Invoice.CancelledByMember', N'Invoice', 47, NULL, N'{"InvoiceNumber":"SC-20261016093320-d7e647e31b9f","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-16 09:33:30.0000000', NULL),
(126, NULL, N'Payment.GatewaySucceeded', N'Payment', 48, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-8bb33a3729724e038628a70d9914133e","providerTransactionId":"15706762","Amount":1800000.00,"Status":"Paid"}', NULL, NULL, '2026-10-16 09:34:56.0000000', NULL),
(127, 35, N'membership_package.status_updated', N'MembershipPackage', 2, N'{"Status":"Active"}', N'{"Status":"Inactive"}', NULL, NULL, '2026-10-18 06:43:51.0000000', 15),
(128, 35, N'membership_package.status_updated', N'MembershipPackage', 2, N'{"Status":"Inactive"}', N'{"Status":"Active"}', NULL, NULL, '2026-10-18 06:43:55.0000000', 15),
(129, 35, N'Support.Updated', N'SupportRequest', 1, NULL, N'{"RequesterId":41,"MemberId":3,"Status":"Resolved","Priority":"High"}', NULL, NULL, '2026-10-18 07:26:46.0000000', 15),
(130, 34, N'member.created', N'MemberProfile', 10, NULL, N'{"UserId":49,"MemberCode":"MBFEDB9721CB","RegistrationSource":"self"}', NULL, NULL, '2026-10-19 14:51:55.0000000', 15),
(131, 34, N'SESSION_ATTENDANCE', N'ClassSession', 17, NULL, NULL, NULL, NULL, '2026-10-20 06:26:48.0000000', 15),
(133, 35, N'CENTER_ROLE_PERMISSIONS_REPLACED', N'Role', 26, N'{"PermissionCodes":["CLASS_VIEW","members.self.read","members.self.update","payments.self.create","subscriptions.self.create","subscriptions.read"],"CapabilityIds":["book_class","cancel_booking","view_my_progress","ask_ai_assistant"]}', N'{"PermissionCodes":["CLASS_VIEW","members.self.read","members.self.update","payments.self.create","subscriptions.read","subscriptions.self.create"],"CapabilityIds":["book_class","cancel_booking","view_my_progress","ask_ai_assistant","use_coach_portal"]}', NULL, NULL, '2026-10-20 07:46:13.0000000', 15),
(134, 35, N'member.account_status.updated', N'User', 47, N'{"Status":"Active"}', N'{"Status":"Disabled"}', NULL, NULL, '2026-10-20 09:09:31.0000000', 15),
(135, 35, N'member.account_status.updated', N'User', 47, N'{"Status":"Disabled"}', N'{"Status":"Active"}', NULL, NULL, '2026-10-20 09:09:35.0000000', 15),
(136, NULL, N'Payment.GatewayFailed', N'Payment', 49, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-c93c67b0a08a4322a5610d94df5cc8f0","note":"Giao d\u1ECBch \u0111\u00E3 b\u1ECB h\u1EE7y b\u1EDFi ng\u01B0\u1EDDi d\u00F9ng (ResponseCode 24)"}', NULL, NULL, '2026-10-20 09:13:01.0000000', NULL),
(137, 34, N'Invoice.CancelledByMember', N'Invoice', 49, NULL, N'{"InvoiceNumber":"SC-20261020091231-373ac9f95cb9","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-20 09:13:03.0000000', 15),
(138, NULL, N'Payment.GatewayFailed', N'Payment', 50, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-2b6c11c81e9046bcb5d983fc69bcdb2e","note":"Giao d\u1ECBch \u0111\u00E3 b\u1ECB h\u1EE7y b\u1EDFi ng\u01B0\u1EDDi d\u00F9ng (ResponseCode 24)"}', NULL, NULL, '2026-10-20 09:13:24.0000000', NULL),
(139, 34, N'Invoice.CancelledByMember', N'Invoice', 50, NULL, N'{"InvoiceNumber":"SC-20261020091305-279bac7b20f1","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-20 09:13:26.0000000', 15),
(140, 34, N'Invoice.CancelledByMember', N'Invoice', 51, NULL, N'{"InvoiceNumber":"SC-20261020091332-371b09dc6880","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-20 09:13:42.0000000', 15),
(141, 34, N'role.permissions.replaced', N'Role', 23, N'{"PermissionCodes":["members.center.read","members.center.create","members.center.update","members.center.manage-status","staff.center.read","staff.center.create","staff.center.update","membership-packages.manage","subscriptions.center.create","subscriptions.read","payments.center.cash","audit.center.read","CLASS_VIEW","CLASS_MANAGE","COACH_ASSIGN","MEMBER_VIEW","MEMBER_MANAGE"]}', N'{"PermissionCodes":["audit.center.read","CLASS_MANAGE","CLASS_VIEW","COACH_ASSIGN","MEMBER_MANAGE","MEMBER_VIEW","members.center.create","members.center.manage-status","members.center.read","members.center.update","membership-packages.manage","payments.center.cash","staff.center.create","staff.center.read","staff.center.update","subscriptions.center.create","subscriptions.read","members.self.read"]}', NULL, NULL, '2026-10-21 14:11:47.0000000', NULL),
(142, 36, N'Payment.CounterRecorded', N'Invoice', 53, NULL, N'{"InvoiceNumber":"SC-20261021141327-a6015299e8d3","PaymentMethod":"CASH","Amount":650000.00,"Status":"Paid"}', NULL, NULL, '2026-10-21 14:13:28.0000000', NULL),
(143, 34, N'BOOK_SESSION', N'ClassSession', 20, NULL, NULL, NULL, NULL, '2026-10-21 14:14:17.0000000', 15),
(144, 34, N'GOOGLE_LOGIN', N'User', 45, NULL, NULL, NULL, NULL, '2026-10-21 14:21:10.0000000', NULL),
(145, 34, N'Invoice.CancelledByMember', N'Invoice', 52, NULL, N'{"InvoiceNumber":"SC-20261020165957-447c195e1d1a","reason":"H\u1EE7y h\u00F3a \u0111\u01A1n ch\u1EDD thanh to\u00E1n."}', NULL, NULL, '2026-10-21 14:21:24.0000000', 15),
(148, NULL, N'Payment.GatewaySucceeded', N'Payment', 54, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-adf0f8dae152494aaa03973a3652564a","providerTransactionId":"15711113","Amount":1800000.00,"Status":"Paid"}', NULL, NULL, '2026-10-21 14:27:40.0000000', NULL),
(149, NULL, N'Payment.GatewaySucceeded', N'Payment', 55, NULL, N'{"provider":"VNPAY","gatewayReference":"PAY-98ee0f8ac8494a938ece4ab170468ef9","providerTransactionId":"15711116","Amount":1800000.00,"Status":"Paid"}', NULL, NULL, '2026-10-21 14:29:09.0000000', NULL),
(152, 35, N'class.created', N'Class', 8, NULL, N'{"Name":"b\u01A1i c\u01A1 b\u1EA3n","SportId":1,"RoomId":null,"Capacity":20,"Status":"Draft"}', NULL, NULL, '2026-10-21 14:37:11.0000000', 15),
(153, 35, N'class_schedule.created', N'ClassSchedule', 14, NULL, N'{"ClassId":8,"RoomId":1,"DayOfWeek":3,"StartTime":"22:00:00","EndTime":"23:30:00","StartDate":"2026-10-21","EndDate":"2027-01-19","Status":"Active","GeneratedSessions":13}', NULL, NULL, '2026-10-21 14:39:09.0000000', 15),
(154, 35, N'class.updated', N'Class', 8, N'{"Name":"b\u01A1i c\u01A1 b\u1EA3n","SportId":1,"RoomId":null,"Capacity":20,"AllowWaitlist":true,"DurationMinutes":60,"Status":"Draft"}', N'{"Name":"b\u01A1i c\u01A1 b\u1EA3n","SportId":1,"RoomId":null,"Capacity":20,"AllowWaitlist":true,"DurationMinutes":60,"Status":"Draft"}', NULL, NULL, '2026-10-21 14:39:29.0000000', 15),
(155, 35, N'class.updated', N'Class', 8, N'{"Name":"b\u01A1i c\u01A1 b\u1EA3n","SportId":1,"RoomId":null,"Capacity":20,"AllowWaitlist":true,"DurationMinutes":60,"Status":"Draft"}', N'{"Name":"b\u01A1i c\u01A1 b\u1EA3n","SportId":1,"RoomId":null,"Capacity":20,"AllowWaitlist":true,"DurationMinutes":60,"Status":"Draft"}', NULL, NULL, '2026-10-21 14:39:39.0000000', 15),
(156, 35, N'CLASS_COACH.ASSIGNED', N'Class', 8, N'[]', N'{"CoachId":12,"FullName":"V\u0169 \u0110\u1EE9c Th\u1EAFng","IsPrimary":true,"ReplacePrimary":true}', NULL, NULL, '2026-10-21 14:39:39.0000000', 15),
(157, 35, N'class.published', N'Class', 8, N'{"Status":"Draft"}', N'{"Status":"Published"}', NULL, NULL, '2026-10-21 14:39:43.0000000', 15),
(158, 41, N'CANCEL_SESSION_BOOKING', N'SessionBooking', 42, NULL, N'{"IsLateCancellation":false}', NULL, NULL, '2026-10-21 14:40:20.0000000', 15),
(159, 41, N'CANCEL_SESSION_BOOKING', N'SessionBooking', 45, NULL, N'{"IsLateCancellation":false}', NULL, NULL, '2026-10-21 14:40:30.0000000', 15),
(160, 35, N'class_schedule.updated', N'ClassSchedule', 14, N'{"RoomId":1,"DayOfWeek":3,"StartTime":"22:00:00","EndTime":"23:30:00","StartDate":"2026-10-21","EndDate":"2027-01-19","Status":"Active"}', N'{"RoomId":1,"DayOfWeek":4,"StartTime":"00:00:00","EndTime":"01:00:00","StartDate":"2026-10-22","EndDate":"2027-01-22","Status":"Active","GeneratedSessions":14}', NULL, NULL, '2026-10-21 14:42:29.0000000', 15),
(161, 41, N'BOOK_SESSION', N'ClassSession', 65, NULL, NULL, NULL, NULL, '2026-10-21 14:42:47.0000000', 15),
(162, 35, N'staff.updated', N'User', 36, N'{"Status":"Active","Role":"Receptionist"}', N'{"Status":"Disabled","Role":"Receptionist"}', NULL, NULL, '2026-10-21 14:57:56.0000000', 15),
(163, 34, N'GOOGLE_LOGIN', N'User', 45, NULL, NULL, NULL, NULL, '2026-10-22 02:08:00.0000000', NULL),
(165, 34, N'member.created', N'MemberProfile', 14, NULL, N'{"UserId":53,"MemberCode":"MBEF875CF2C3","RegistrationSource":"self"}', NULL, NULL, '2026-10-22 11:38:41.0000000', 15),
(166, 34, N'member.created', N'MemberProfile', 15, NULL, N'{"UserId":54,"MemberCode":"MBE30DB47245","RegistrationSource":"self"}', NULL, NULL, '2026-10-23 03:54:03.0000000', 15),
(167, 34, N'member.created', N'MemberProfile', 16, NULL, N'{"UserId":55,"MemberCode":"MB25FB683848","RegistrationSource":"self"}', NULL, NULL, '2026-10-23 04:43:59.0000000', 15),
(168, 34, N'admin.member.deleted', N'User', 55, NULL, N'{"Reason":"Admin xoa tai khoan","PersonalDataAnonymized":true}', N'::1', N'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-23 07:17:32.0000000', NULL),
(169, 34, N'admin.member.deleted', N'User', 54, NULL, N'{"Reason":"Admin xoa tai khoan","PersonalDataAnonymized":true}', N'::1', N'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-23 07:17:37.0000000', NULL),
(170, 34, N'admin.member.deleted', N'User', 53, NULL, N'{"Reason":"Admin xoa tai khoan","PersonalDataAnonymized":true}', N'::1', N'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-23 07:17:42.0000000', NULL),
(171, 34, N'member.created', N'MemberProfile', 17, NULL, N'{"UserId":56,"MemberCode":"MBD2A25EE8E4","RegistrationSource":"self"}', NULL, NULL, '2026-10-23 07:19:57.0000000', 15),
(172, 34, N'admin.member.deleted', N'User', 56, NULL, N'{"Reason":"Admin xoa tai khoan","PersonalDataAnonymized":true}', N'::1', N'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-23 07:31:41.0000000', NULL),
(173, 34, N'admin.member.deleted', N'User', 45, NULL, N'{"Reason":"Admin xoa tai khoan","PersonalDataAnonymized":true}', N'::1', N'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-23 07:31:51.0000000', NULL),
(174, 34, N'member.created', N'MemberProfile', 18, NULL, N'{"UserId":57,"MemberCode":"MB8BEF041CC6","RegistrationSource":"self"}', NULL, NULL, '2026-10-23 08:16:59.0000000', 15),
(175, 34, N'member.created', N'MemberProfile', 19, NULL, N'{"UserId":58,"MemberCode":"MB1D08C846F4","RegistrationSource":"self"}', NULL, NULL, '2026-10-23 08:28:38.0000000', 15),
(176, 34, N'member.created', N'MemberProfile', 20, NULL, N'{"UserId":59,"MemberCode":"MBDD80D44E64","RegistrationSource":"self"}', NULL, NULL, '2026-10-23 08:58:26.0000000', 15),
(177, 34, N'admin.member.deleted', N'User', 59, NULL, N'{"Reason":"Admin xoa tai khoan","PersonalDataAnonymized":true}', N'::1', N'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-23 08:58:37.0000000', NULL),
(178, 34, N'admin.member.deleted', N'User', 58, NULL, N'{"Reason":"Admin xoa tai khoan","PersonalDataAnonymized":true}', N'::1', N'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-23 08:58:40.0000000', NULL),
(179, 34, N'admin.member.deleted', N'User', 57, NULL, N'{"Reason":"Admin xoa tai khoan","PersonalDataAnonymized":true}', N'::1', N'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-23 08:59:26.0000000', NULL),
(180, 34, N'admin.member.deleted', N'User', 39, NULL, N'{"Reason":"Admin xoa tai khoan","PersonalDataAnonymized":true}', N'::1', N'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-23 08:59:31.0000000', NULL),
(181, 34, N'admin.member.deleted', N'User', 49, NULL, N'{"Reason":"Admin xoa tai khoan","PersonalDataAnonymized":true}', N'::1', N'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-23 09:15:41.0000000', NULL),
(182, 34, N'admin.member.deleted', N'User', 47, NULL, N'{"Reason":"Admin xoa tai khoan","PersonalDataAnonymized":true}', N'::1', N'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-23 09:15:51.0000000', NULL),
(183, 60, N'member.created', N'MemberProfile', 21, NULL, N'{"UserId":60,"MemberCode":"MB29F5946CC8","RegistrationSource":"self"}', NULL, NULL, '2026-10-23 09:19:35.0000000', 15),
(184, 34, N'GOOGLE_LOGIN', N'User', 61, NULL, NULL, NULL, NULL, '2026-10-23 09:55:32.0000000', NULL),
(185, 35, N'membership_package.status_updated', N'MembershipPackage', 1, N'{"Status":"Active"}', N'{"Status":"Inactive"}', NULL, NULL, '2026-10-23 09:57:59.0000000', 15),
(186, 35, N'membership_package.status_updated', N'MembershipPackage', 1, N'{"Status":"Inactive"}', N'{"Status":"Active"}', NULL, NULL, '2026-10-23 09:58:02.0000000', 15),
(187, 35, N'membership_package.status_updated', N'MembershipPackage', 1, N'{"Status":"Active"}', N'{"Status":"Inactive"}', NULL, NULL, '2026-10-23 09:58:08.0000000', 15),
(188, 35, N'membership_package.status_updated', N'MembershipPackage', 1, N'{"Status":"Inactive"}', N'{"Status":"Active"}', NULL, NULL, '2026-10-23 09:58:30.0000000', 15),
(189, 34, N'admin.account.lock', N'User', 61, N'{"Status":"Active","LockedUntil":null,"AuthVersion":0}', N'{"Status":"Active","LockedUntil":"2046-10-24T03:00:36.8353301Z","AuthVersion":1,"Reason":"Admin t\u1EA1m kh\u00F3a t\u00E0i kho\u1EA3n"}', N'::1', N'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-24 03:00:37.0000000', NULL),
(190, 34, N'admin.account.unlock', N'User', 61, N'{"Status":"Active","LockedUntil":"2046-10-24T03:00:37","AuthVersion":1}', N'{"Status":"Active","LockedUntil":null,"AuthVersion":2,"Reason":"Admin m\u1EDF kh\u00F3a t\u00E0i kho\u1EA3n"}', N'::1', N'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '2026-10-24 03:00:40.0000000', NULL);
SET IDENTITY_INSERT dbo.[audit_logs] OFF;
GO

-- Table dbo.[ai_messages] (10 rows)
SET IDENTITY_INSERT dbo.[ai_messages] ON;
INSERT INTO dbo.[ai_messages] ([Id], [conversation_id], [sender_type], [message], [created_at]) VALUES
(63, 14, N'User', N'17/10 có lịch học', '2026-10-16 08:01:35.0000000'),
(64, 14, N'AI', N'Chưa có lớp công khai trong khoảng ngày được truy vấn (ngày 17/10/2026) tại Sports Center Quận 1. Vui lòng kiểm tra lại sau hoặc liên hệ lễ tân (0901234567) để biết thêm chi tiết.', '2026-10-16 08:01:35.0000000'),
(65, 15, N'User', N'19/10', '2026-10-16 08:02:03.0000000'),
(66, 15, N'AI', N'Lịch các lớp ngày 19/10/2026 tại Sports Center Quận 1:

1. **Bơi sải Kỹ thuật Olympic K01** (Bơi lội)
   - Thời gian: 07:00 - 08:00
   - Phòng: Bể bơi Olympic 50m
   - Trình độ: Intermediate

2. **Bơi sải Kỹ thuật Olympic K01** (Bơi lội)
   - Thời gian: 08:30 - 09:00
   - Phòng: Bể bơi Olympic 50m
   - Trình độ: Trung cấp

3. **Gym Tăng cơ Tối đa (Hypertrophy)** (Gym & Fitness)
   - Thời gian: 18:00 - 19:15
   - Phòng: Phòng Gym High-Performance
   - Trình độ: All Levels

4. **Boxing & Kickfit Đốt mỡ Cường độ cao** (Boxing & Võ thuật)
   - Thời gian: 19:30 - 20:30
   - Phòng: Võ đài Boxing & Kickfit
   - Trình độ: Intermediate', '2026-10-16 08:02:03.0000000'),
(67, 15, N'User', N'giá gói tiện nhất cho nười bận', '2026-10-16 08:03:04.0000000'),
(68, 15, N'AI', N'Đối với người bận rộn hoặc có lịch tập cố định, gói phù hợp nhất là **Gói Basic Thể Thao**:
- **Giá:** 650.000 VND
- **Thời hạn:** 30 ngày
- **Quyền lợi:** Rèn luyện 1 môn tự chọn, phù hợp cho người mới bắt đầu hoặc có lịch tập cố định.

Ngoài ra, bạn có thể tham khảo thêm các gói khác như Gói Pro Bứt Phá (1.800.000 VND / 90 ngày / 3 môn) nếu muốn kết hợp đa dạng hơn. Vui lòng liên hệ lễ tân qua số 0901234567 để được tư vấn chi tiết hơn nhé!', '2026-10-16 08:03:04.0000000'),
(69, 15, N'User', N'mật khẩu của tôi là gì', '2026-10-16 08:03:21.0000000'),
(70, 15, N'AI', N'Tôi không cung cấp hoặc hỗ trợ truy cập thông tin cá nhân, mật khẩu hay tài khoản hội viên. Vui lòng liên hệ bộ phận lễ tân qua số điện thoại 0901234567 để được hỗ trợ trực tiếp.', '2026-10-16 08:03:21.0000000'),
(71, 16, N'User', N'lịch học tiếp của tôi là ngày nào', '2026-10-16 08:04:24.0000000'),
(72, 16, N'AI', N'Lịch cá nhân và chỗ còn trống của hội viên không được lưu trong hệ thống công khai. Vui lòng kiểm tra mục **Lớp đã đặt** hoặc **Lịch lớp** trên ứng dụng/tài khoản của bạn để xác nhận lịch học tiếp theo.', '2026-10-16 08:04:24.0000000');
SET IDENTITY_INSERT dbo.[ai_messages] OFF;
GO

-- Table dbo.[ai_conversations] (3 rows)
SET IDENTITY_INSERT dbo.[ai_conversations] ON;
INSERT INTO dbo.[ai_conversations] ([Id], [user_id], [member_id], [title], [conversation_type], [created_at], [updated_at]) VALUES
(14, 41, 3, N'17/10 có lịch học', N'MemberAssistant', '2026-10-16 08:01:35.0000000', '2026-10-16 08:01:35.0000000'),
(15, 41, 3, N'19/10', N'MemberAssistant', '2026-10-16 08:02:03.0000000', '2026-10-16 08:03:21.0000000'),
(16, 41, 3, N'lịch học tiếp của tôi là ngày nào', N'MemberAssistant', '2026-10-16 08:04:24.0000000', '2026-10-16 08:04:24.0000000');
SET IDENTITY_INSERT dbo.[ai_conversations] OFF;
GO

-- Table dbo.[support_request_messages] (2 rows)
SET IDENTITY_INSERT dbo.[support_request_messages] ON;
INSERT INTO dbo.[support_request_messages] ([Id], [request_id], [sender_id], [message], [created_at]) VALUES
(1, 1, 36, N'Em sẽ gia hạn luôn', '2026-10-16 05:55:05.0000000'),
(2, 1, 35, N'Đã hỗ trợ giải quyết xong cho thành viên tại quầy.', '2026-10-18 07:26:46.0000000');
SET IDENTITY_INSERT dbo.[support_request_messages] OFF;
GO

-- Table dbo.[support_requests] (1 rows)
SET IDENTITY_INSERT dbo.[support_requests] ON;
INSERT INTO dbo.[support_requests] ([Id], [member_id], [handled_by], [subject], [description], [status], [created_at], [resolved_at], [center_id], [requester_id], [priority]) VALUES
(1, 3, 35, N'[Gói tập & Thẻ]', N'Gia hạn gói Basic', N'Resolved', '2026-10-16 04:00:10.0000000', '2026-10-16 06:06:43.0000000', 15, 41, N'High');
SET IDENTITY_INSERT dbo.[support_requests] OFF;
GO

-- Table dbo.[user_notifications] (35 rows)
SET IDENTITY_INSERT dbo.[user_notifications] ON;
INSERT INTO dbo.[user_notifications] ([Id], [notification_id], [user_id], [is_read], [read_at], [created_at]) VALUES
(1, 1, 37, 0, NULL, '2026-10-11 15:54:04.0000000'),
(2, 1, 41, 1, '2026-10-13 08:30:54.0000000', '2026-10-11 15:54:04.0000000'),
(3, 1, 43, 0, NULL, '2026-10-11 15:54:04.0000000'),
(6, 4, 37, 0, NULL, '2026-10-12 04:48:41.0000000'),
(7, 4, 41, 1, '2026-10-13 08:30:55.0000000', '2026-10-12 04:48:41.0000000'),
(8, 4, 42, 0, NULL, '2026-10-12 04:48:41.0000000'),
(9, 4, 43, 0, NULL, '2026-10-12 04:48:41.0000000'),
(11, 5, 37, 0, NULL, '2026-10-13 07:53:03.0000000'),
(12, 6, 37, 0, NULL, '2026-10-13 07:53:08.0000000'),
(19, 13, 42, 1, '2026-10-14 14:01:17.0000000', '2026-10-14 13:50:28.0000000'),
(20, 14, 42, 1, '2026-10-14 14:00:30.0000000', '2026-10-14 13:57:29.0000000'),
(23, 17, 35, 1, '2026-10-16 04:07:03.0000000', '2026-10-16 04:00:11.0000000'),
(24, 17, 36, 1, '2026-10-16 04:06:48.0000000', '2026-10-16 04:00:11.0000000'),
(25, 18, 41, 1, '2026-10-21 15:11:42.0000000', '2026-10-16 05:55:05.0000000'),
(26, 19, 41, 1, '2026-10-21 15:11:42.0000000', '2026-10-16 05:55:12.0000000'),
(27, 20, 41, 1, '2026-10-21 15:11:42.0000000', '2026-10-16 06:06:37.0000000'),
(28, 21, 41, 1, '2026-10-21 15:11:42.0000000', '2026-10-16 06:06:40.0000000'),
(29, 22, 41, 1, '2026-10-21 15:11:42.0000000', '2026-10-16 06:06:43.0000000'),
(30, 23, 37, 0, NULL, '2026-10-16 08:48:09.0000000'),
(32, 23, 41, 1, '2026-10-21 15:11:42.0000000', '2026-10-16 08:48:09.0000000'),
(33, 23, 42, 0, NULL, '2026-10-16 08:48:09.0000000'),
(34, 23, 43, 0, NULL, '2026-10-16 08:48:09.0000000'),
(36, 24, 37, 0, NULL, '2026-10-16 09:13:59.0000000'),
(37, 25, 41, 1, '2026-10-16 09:14:47.0000000', '2026-10-16 09:14:37.0000000'),
(38, 26, 41, 1, '2026-10-21 15:11:42.0000000', '2026-10-16 09:34:56.0000000'),
(39, 27, 41, 1, '2026-10-21 15:11:42.0000000', '2026-10-18 07:26:46.0000000'),
(40, 28, 37, 0, NULL, '2026-10-19 10:00:09.0000000'),
(41, 29, 42, 0, NULL, '2026-10-19 10:00:09.0000000'),
(43, 31, 37, 0, NULL, '2026-10-19 11:30:12.0000000'),
(45, 33, 37, 0, NULL, '2026-10-21 10:00:12.0000000'),
(46, 34, 42, 0, NULL, '2026-10-21 10:00:12.0000000'),
(55, 43, 41, 1, '2026-10-21 15:11:42.0000000', '2026-10-21 14:40:20.0000000'),
(57, 45, 41, 1, '2026-10-21 15:11:42.0000000', '2026-10-21 14:40:30.0000000'),
(60, 47, 41, 1, '2026-10-21 14:42:54.0000000', '2026-10-21 14:42:47.0000000'),
(62, 49, 41, 0, NULL, '2026-10-21 16:25:46.0000000');
SET IDENTITY_INSERT dbo.[user_notifications] OFF;
GO

-- Table dbo.[notifications] (47 rows)
SET IDENTITY_INSERT dbo.[notifications] ON;
INSERT INTO dbo.[notifications] ([Id], [sender_id], [title], [message], [notification_type], [created_at], [scheduled_at], [reminder_key], [target_class_ids]) VALUES
(1, 34, N'M có thích nghỉ k', N'kkkk', N'CoachMessage', '2026-10-11 15:54:04.0000000', NULL, NULL, NULL),
(2, 34, N'Đặt lớp thành công', N'Bạn đã được xác nhận chỗ học: Gym Tăng cơ Tối đa (Hypertrophy), ngày 12/10/2026 lúc 18:00.', N'BookingConfirmed', '2026-10-12 03:07:51.0000000', NULL, NULL, NULL),
(3, 34, N'Đã hủy đặt lớp', N'Chỗ học của bạn đã được hủy: Gym Tăng cơ Tối đa (Hypertrophy), ngày 12/10/2026 lúc 18:00.', N'BookingCancelled', '2026-10-12 03:08:01.0000000', NULL, NULL, NULL),
(4, 34, N'Đi ngủ', N'Kkkk', N'CoachMessage', '2026-10-12 04:48:41.0000000', NULL, NULL, NULL),
(5, 34, N'Giáo án tập luyện được cập nhật', N'HLV Huấn luyện viên mẫu đã cập nhật giáo án: Chương trình tập luyện bơi lội tăng cơ và sức bền. Xem Giáo án & Kết quả tập để biết chi tiết.', N'TrainingPlanUpdated', '2026-10-13 07:53:03.0000000', NULL, NULL, NULL),
(6, 34, N'Giáo án đã được thu hồi', N'HLV Huấn luyện viên mẫu đã thu hồi giáo án: Chương trình tập luyện bơi lội tăng cơ và sức bền.', N'TrainingPlanUpdated', '2026-10-13 07:53:08.0000000', NULL, NULL, NULL),
(7, 34, N'Giáo án đã được thu hồi', N'HLV Huấn luyện viên mẫu đã thu hồi giáo án: Giáo án Footwork né đòn & Tổ hợp đòn đấm 1-2-3 Boxing.', N'TrainingPlanUpdated', '2026-10-13 07:53:10.0000000', NULL, NULL, NULL),
(8, 34, N'Thanh toán thành công - Gói tập đã kích hoạt', N'Gói Gói Pro Bứt Phá đã được thanh toán và kích hoạt từ 02/10/2027 đến 30/12/2027.', N'MembershipActivated', '2026-10-13 08:19:07.0000000', NULL, NULL, NULL),
(9, 34, N'Đã hủy đặt lớp', N'Chỗ học của bạn đã được hủy: Gym Tăng cơ Tối đa (Hypertrophy), ngày 28/10/2026 lúc 18:00.', N'BookingCancelled', '2026-10-13 08:20:50.0000000', NULL, NULL, NULL),
(10, 36, N'Thanh toán thành công - Gói tập đã kích hoạt', N'Gói Gói Basic Thể Thao đã được thanh toán và kích hoạt từ 07/06/2027 đến 06/07/2027.', N'MembershipActivated', '2026-10-13 08:23:08.0000000', NULL, NULL, NULL),
(11, 36, N'Thanh toán thành công - Gói tập đã kích hoạt', N'Gói Gói Basic Thể Thao đã được thanh toán và kích hoạt từ 07/07/2027 đến 05/08/2027.', N'MembershipActivated', '2026-10-14 12:34:02.0000000', NULL, NULL, NULL),
(12, 34, N'Thanh toán thành công - Gói tập đã kích hoạt', N'Gói Gói All-Access Olympic Pass đã được thanh toán và kích hoạt từ 31/12/2027 đến 29/12/2028.', N'MembershipActivated', '2026-10-14 13:20:04.0000000', NULL, NULL, NULL),
(13, 42, N'Đặt lớp thành công', N'Bạn đã được xác nhận chỗ học: Bơi sải Kỹ thuật Olympic K01, ngày 16/10/2026 lúc 07:00.', N'BookingConfirmed', '2026-10-14 13:50:28.0000000', NULL, NULL, NULL),
(14, 42, N'Đã hủy đặt lớp', N'Chỗ học của bạn đã được hủy: Gym Tăng cơ Tối đa (Hypertrophy), ngày 28/10/2026 lúc 18:00.', N'BookingCancelled', '2026-10-14 13:57:29.0000000', NULL, NULL, NULL),
(15, 34, N'Đặt lớp thành công', N'Bạn đã được xác nhận chỗ học: Yoga Phục hồi & Trị liệu Cột sống, ngày 15/10/2026 lúc 08:30.', N'BookingConfirmed', '2026-10-14 14:26:00.0000000', NULL, NULL, NULL),
(16, 36, N'Thanh toán thành công - Gói tập đã kích hoạt', N'Gói Gói Basic Thể Thao đã được thanh toán và kích hoạt từ 06/08/2027 đến 04/09/2027.', N'MembershipActivated', '2026-10-14 14:34:40.0000000', NULL, NULL, NULL),
(17, 41, N'Có yêu cầu hỗ trợ mới', N'Yêu cầu #1: [Gói tập & Thẻ].', N'SupportSubmitted', '2026-10-16 04:00:11.0000000', NULL, NULL, NULL),
(18, 36, N'Yêu cầu hỗ trợ được cập nhật', N'[Gói tập & Thẻ]: Đã tiếp nhận.
Phản hồi: Em sẽ gia hạn luôn', N'SupportUpdated', '2026-10-16 05:55:05.0000000', NULL, NULL, NULL),
(19, 36, N'Yêu cầu hỗ trợ được cập nhật', N'[Gói tập & Thẻ]: Đã giải quyết.', N'SupportUpdated', '2026-10-16 05:55:12.0000000', NULL, NULL, NULL),
(20, 36, N'Yêu cầu hỗ trợ được cập nhật', N'[Gói tập & Thẻ]: Đang xử lý.', N'SupportUpdated', '2026-10-16 06:06:37.0000000', NULL, NULL, NULL),
(21, 36, N'Yêu cầu hỗ trợ được cập nhật', N'[Gói tập & Thẻ]: Đã tiếp nhận.', N'SupportUpdated', '2026-10-16 06:06:40.0000000', NULL, NULL, NULL),
(22, 36, N'Yêu cầu hỗ trợ được cập nhật', N'[Gói tập & Thẻ]: Đã giải quyết.', N'SupportUpdated', '2026-10-16 06:06:43.0000000', NULL, NULL, NULL),
(23, 34, N'[Bài tập] Tự rèn luyện thể lực bổ trợ trước ca học', N'Chào các bạn học viên,

Để chuẩn bị tốt nhất cho buổi tập tiếp theo, các bạn vui lòng thực hiện bài tập bổ trợ tại nhà:
1. Khởi động khớp cổ tay, cổ chân, vai: 5 phút
2. Hít đất / Plank: 3 hiệp x 30-45 giây
3. Squat bật nhảy nhẹ: 3 hiệp x 15 lần

Nghỉ giữa hiệp 60 giây và uống đủ 500ml nước nhé!', N'CoachMessage', '2026-10-16 08:48:09.0000000', NULL, NULL, NULL),
(24, 34, N'Có kết quả tập luyện mới', N'HLV Huấn luyện viên mẫu đã ghi nhận kết quả tập ngày 16/10/2026. Xem Giáo án & Kết quả tập để biết chi tiết.', N'ProgressUpdated', '2026-10-16 09:13:59.0000000', NULL, NULL, NULL),
(25, 34, N'Có kết quả tập luyện mới', N'HLV Huấn luyện viên mẫu đã ghi nhận kết quả tập ngày 16/10/2026. Xem Giáo án & Kết quả tập để biết chi tiết.', N'ProgressUpdated', '2026-10-16 09:14:37.0000000', NULL, NULL, NULL),
(26, 41, N'Thanh toán thành công - Gói tập chờ hiệu lực', N'Gói Pro Bứt Phá đã được thanh toán và sẽ có hiệu lực từ 02/10/2027 đến 30/12/2027. Gói đang dùng tiếp tục có hiệu lực đến ngày hết hạn của gói đó.', N'MembershipActivated', '2026-10-16 09:34:56.0000000', NULL, NULL, NULL),
(27, 35, N'Yêu cầu hỗ trợ được cập nhật', N'[Gói tập & Thẻ]: Đã giải quyết.
Phản hồi: Đã hỗ trợ giải quyết xong cho thành viên tại quầy.', N'SupportUpdated', '2026-10-18 07:26:46.0000000', NULL, NULL, NULL),
(28, 37, N'Nhắc lịch: Ca học sắp bắt đầu', N'Bạn có ca học Gym Tăng cơ Tối đa (Hypertrophy) ngày 19/10/2026, lúc 18:00 - 19:15, tại Phòng Gym High-Performance. Ca học sẽ bắt đầu trong vòng 1 tiếng. Vui lòng đến đúng giờ.', N'ClassReminder', '2026-10-19 10:00:09.0000000', '2026-10-19 10:00:00.0000000', N'booking:24:start:202610191800000000000', NULL),
(29, 42, N'Nhắc lịch: Ca học sắp bắt đầu', N'Bạn có ca học Gym Tăng cơ Tối đa (Hypertrophy) ngày 19/10/2026, lúc 18:00 - 19:15, tại Phòng Gym High-Performance. Ca học sẽ bắt đầu trong vòng 1 tiếng. Vui lòng đến đúng giờ.', N'ClassReminder', '2026-10-19 10:00:09.0000000', '2026-10-19 10:00:00.0000000', N'booking:25:start:202610191800000000000', NULL),
(30, 34, N'Nhắc lịch: Ca học sắp bắt đầu', N'Bạn có ca học Gym Tăng cơ Tối đa (Hypertrophy) ngày 19/10/2026, lúc 18:00 - 19:15, tại Phòng Gym High-Performance. Ca học sẽ bắt đầu trong vòng 1 tiếng. Vui lòng đến đúng giờ.', N'ClassReminder', '2026-10-19 10:00:09.0000000', '2026-10-19 10:00:00.0000000', N'booking:26:start:202610191800000000000', NULL),
(31, 37, N'Nhắc lịch: Ca học sắp bắt đầu', N'Bạn có ca học Boxing & Kickfit Đốt mỡ Cường độ cao ngày 19/10/2026, lúc 19:30 - 20:30, tại Võ đài Boxing & Kickfit. Ca học sẽ bắt đầu trong vòng 1 tiếng. Vui lòng đến đúng giờ.', N'ClassReminder', '2026-10-19 11:30:12.0000000', '2026-10-19 11:30:00.0000000', N'booking:30:start:202610191930000000000', NULL),
(32, 34, N'Nhắc lịch: Ca học sắp bắt đầu', N'Bạn có ca học Boxing & Kickfit Đốt mỡ Cường độ cao ngày 19/10/2026, lúc 19:30 - 20:30, tại Võ đài Boxing & Kickfit. Ca học sẽ bắt đầu trong vòng 1 tiếng. Vui lòng đến đúng giờ.', N'ClassReminder', '2026-10-19 11:30:12.0000000', '2026-10-19 11:30:00.0000000', N'booking:31:start:202610191930000000000', NULL),
(33, 37, N'Nhắc lịch: Ca học sắp bắt đầu', N'Bạn có ca học Gym Tăng cơ Tối đa (Hypertrophy) ngày 21/10/2026, lúc 18:00 - 19:15, tại Phòng Gym High-Performance. Ca học sẽ bắt đầu trong vòng 1 tiếng. Vui lòng đến đúng giờ.', N'ClassReminder', '2026-10-21 10:00:12.0000000', '2026-10-21 10:00:00.0000000', N'booking:36:start:202610211800000000000', NULL),
(34, 42, N'Nhắc lịch: Ca học sắp bắt đầu', N'Bạn có ca học Gym Tăng cơ Tối đa (Hypertrophy) ngày 21/10/2026, lúc 18:00 - 19:15, tại Phòng Gym High-Performance. Ca học sẽ bắt đầu trong vòng 1 tiếng. Vui lòng đến đúng giờ.', N'ClassReminder', '2026-10-21 10:00:12.0000000', '2026-10-21 10:00:00.0000000', N'booking:37:start:202610211800000000000', NULL),
(35, 34, N'Nhắc lịch: Ca học sắp bắt đầu', N'Bạn có ca học Gym Tăng cơ Tối đa (Hypertrophy) ngày 21/10/2026, lúc 18:00 - 19:15, tại Phòng Gym High-Performance. Ca học sẽ bắt đầu trong vòng 1 tiếng. Vui lòng đến đúng giờ.', N'ClassReminder', '2026-10-21 10:00:12.0000000', '2026-10-21 10:00:00.0000000', N'booking:38:start:202610211800000000000', NULL),
(36, 36, N'Thanh toán thành công - Gói tập đã kích hoạt', N'Gói Basic Thể Thao đã được thanh toán và có hiệu lực từ 21/10/2026 đến 19/11/2026.', N'MembershipActivated', '2026-10-21 14:13:28.0000000', NULL, NULL, NULL),
(37, 34, N'Đặt lớp thành công', N'Bạn đã được xác nhận chỗ học: Yoga Phục hồi & Trị liệu Cột sống, ngày 22/10/2026 lúc 08:30.', N'BookingConfirmed', '2026-10-21 14:14:17.0000000', NULL, NULL, NULL),
(38, 34, N'Học viên đặt lịch', N'Duy Phạm đã đặt buổi học: Yoga Phục hồi & Trị liệu Cột sống, ngày 22/10/2026 lúc 08:30.', N'CoachBookingCreated', '2026-10-21 14:14:17.0000000', NULL, NULL, NULL),
(39, 36, N'Thanh toán thành công - Gói tập đã kích hoạt', N'Gói Pro Bứt Phá đã được thanh toán và có hiệu lực từ 21/10/2026 đến 18/01/2027.', N'MembershipActivated', '2026-10-21 14:27:40.0000000', NULL, NULL, NULL),
(40, 36, N'Thanh toán thành công - Gói tập chờ hiệu lực', N'Gói Pro Bứt Phá đã được thanh toán và sẽ có hiệu lực từ 19/01/2027 đến 18/04/2027. Gói đang dùng tiếp tục có hiệu lực đến ngày hết hạn của gói đó.', N'MembershipActivated', '2026-10-21 14:29:09.0000000', NULL, NULL, NULL),
(43, 41, N'Đã hủy đặt lớp', N'Chỗ học của bạn đã được hủy: Yoga Phục hồi & Trị liệu Cột sống, ngày 22/10/2026 lúc 08:30.', N'BookingCancelled', '2026-10-21 14:40:20.0000000', NULL, NULL, NULL),
(44, 41, N'Học viên hủy lịch', N'Hoàng Hải Yến đã hủy buổi học: Yoga Phục hồi & Trị liệu Cột sống, ngày 22/10/2026 lúc 08:30.', N'CoachBookingCancelled', '2026-10-21 14:40:20.0000000', NULL, NULL, NULL),
(45, 41, N'Đã hủy đặt lớp', N'Chỗ học của bạn đã được hủy: Bơi sải Kỹ thuật Olympic K01, ngày 23/10/2026 lúc 07:00.', N'BookingCancelled', '2026-10-21 14:40:30.0000000', NULL, NULL, NULL),
(46, 41, N'Học viên hủy lịch', N'Hoàng Hải Yến đã hủy buổi học: Bơi sải Kỹ thuật Olympic K01, ngày 23/10/2026 lúc 07:00.', N'CoachBookingCancelled', '2026-10-21 14:40:30.0000000', NULL, NULL, NULL),
(47, 41, N'Đặt lớp thành công', N'Bạn đã được xác nhận chỗ học: bơi cơ bản, ngày 22/10/2026 lúc 00:00.', N'BookingConfirmed', '2026-10-21 14:42:47.0000000', NULL, NULL, NULL),
(48, 41, N'Học viên đặt lịch', N'Hoàng Hải Yến đã đặt buổi học: bơi cơ bản, ngày 22/10/2026 lúc 00:00.', N'CoachBookingCreated', '2026-10-21 14:42:47.0000000', NULL, NULL, NULL),
(49, 41, N'Nhắc lịch: Ca học sắp bắt đầu', N'Bạn có ca học bơi cơ bản ngày 22/10/2026, lúc 00:00 - 01:00, tại Bể bơi Olympic 50m. Ca học sẽ bắt đầu trong vòng 1 tiếng. Vui lòng đến đúng giờ.', N'ClassReminder', '2026-10-21 16:25:46.0000000', '2026-10-21 16:00:00.0000000', N'booking:76:start:202610220000000000000', NULL);
SET IDENTITY_INSERT dbo.[notifications] OFF;
GO

-- Table dbo.[uploaded_media] (26 rows)
SET IDENTITY_INSERT dbo.[uploaded_media] ON;
INSERT INTO dbo.[uploaded_media] ([Id], [drive_file_id], [file_name], [mime_type], [file_size], [file_url], [web_view_link], [uploaded_by_user_id], [created_at], [center_id]) VALUES
(1, N'1OdDEC7sVsmNyKsttkfpyJXNaFXIIskea', N'Screenshot 2026-07-06 224745.png', N'image/png', 9089, N'https://lh3.googleusercontent.com/d/1OdDEC7sVsmNyKsttkfpyJXNaFXIIskea', N'https://drive.google.com/file/d/1OdDEC7sVsmNyKsttkfpyJXNaFXIIskea/view?usp=drivesdk', NULL, '2026-10-16 03:07:05.0680000', NULL),
(2, N'1ZN94C4E4JCJIfLyRBMHyh7GRehRDazlO', N'Screenshot 2026-08-01 222144.png', N'image/png', 177872, N'https://lh3.googleusercontent.com/d/1ZN94C4E4JCJIfLyRBMHyh7GRehRDazlO', N'https://drive.google.com/file/d/1ZN94C4E4JCJIfLyRBMHyh7GRehRDazlO/view?usp=drivesdk', NULL, '2026-10-15 21:44:52.8080000', NULL),
(3, N'1JmFLu4EfEawUWAtVJAY72kIi8A4D-9KU', N'ho-boi-dat-duc-sai-gon-swimming (3).jpg', N'image/jpeg', 78431, N'https://lh3.googleusercontent.com/d/1JmFLu4EfEawUWAtVJAY72kIi8A4D-9KU', N'https://drive.google.com/file/d/1JmFLu4EfEawUWAtVJAY72kIi8A4D-9KU/view?usp=drivesdk', NULL, '2026-10-15 20:51:32.2290000', NULL),
(4, N'14Ui0AZX4t73yrH4YKdqE_kEWwupIQv88', N'1711082867_gallery_6e3baaaa3e00925ecb11.jpg', N'image/jpeg', 1222652, N'https://lh3.googleusercontent.com/d/14Ui0AZX4t73yrH4YKdqE_kEWwupIQv88', N'https://drive.google.com/file/d/14Ui0AZX4t73yrH4YKdqE_kEWwupIQv88/view?usp=drivesdk', NULL, '2026-10-15 20:45:07.6870000', NULL),
(5, N'1_aKeNP23JjoJOlWuK-XNUBb7Wmh5Y-2v', N'kich-thuoc-san-bong-da-7-nguoi-co-nhan-tao-1-1-960x960.jpg', N'image/jpeg', 118518, N'https://lh3.googleusercontent.com/d/1_aKeNP23JjoJOlWuK-XNUBb7Wmh5Y-2v', N'https://drive.google.com/file/d/1_aKeNP23JjoJOlWuK-XNUBb7Wmh5Y-2v/view?usp=drivesdk', NULL, '2026-10-15 17:41:16.6010000', NULL),
(6, N'1KjDziPME1mffQFngZumPG1-x9Qb-GJpH', N'Screenshot 2026-10-14 174849.png', N'image/png', 31255, N'https://lh3.googleusercontent.com/d/1KjDziPME1mffQFngZumPG1-x9Qb-GJpH', N'https://drive.google.com/file/d/1KjDziPME1mffQFngZumPG1-x9Qb-GJpH/view?usp=drivesdk', NULL, '2026-10-14 11:49:40.3370000', NULL),
(7, N'1tEOAnZBrszXhy9qBcP4eehifKX30-ngP', N'photo-1574629810360-7efbbe195018 (1).avif', N'image/avif', 115695, N'https://lh3.googleusercontent.com/d/1tEOAnZBrszXhy9qBcP4eehifKX30-ngP', N'https://drive.google.com/file/d/1tEOAnZBrszXhy9qBcP4eehifKX30-ngP/view?usp=drivesdk', NULL, '2026-10-14 09:17:32.9500000', NULL),
(8, N'184OtTG9h5KRXBf47q-ZLwliNjuUA6et1', N'photo-1518611012118-696072aa579a.avif', N'image/avif', 46180, N'https://lh3.googleusercontent.com/d/184OtTG9h5KRXBf47q-ZLwliNjuUA6et1', N'https://drive.google.com/file/d/184OtTG9h5KRXBf47q-ZLwliNjuUA6et1/view?usp=drivesdk', NULL, '2026-10-14 09:17:14.7180000', NULL),
(9, N'1nvLNrkdurc2wx4EV34klwUUTh0SRGjY0', N'photo-1506126613408-eca07ce68773.avif', N'image/avif', 98769, N'https://lh3.googleusercontent.com/d/1nvLNrkdurc2wx4EV34klwUUTh0SRGjY0', N'https://drive.google.com/file/d/1nvLNrkdurc2wx4EV34klwUUTh0SRGjY0/view?usp=drivesdk', NULL, '2026-10-14 09:16:50.2550000', NULL),
(10, N'1tH01BzD6eaKKLpFPXE1ifbxOsRbAQxTW', N'photo-1545205597-3d9d02c29597 (1).avif', N'image/avif', 97393, N'https://lh3.googleusercontent.com/d/1tH01BzD6eaKKLpFPXE1ifbxOsRbAQxTW', N'https://drive.google.com/file/d/1tH01BzD6eaKKLpFPXE1ifbxOsRbAQxTW/view?usp=drivesdk', NULL, '2026-10-14 09:16:40.6390000', NULL),
(11, N'1wqd_uhUEPYdYF8t_Dwg6Cx9KpblqrCBv', N'photo-1581009146145-b5ef050c2e1e.avif', N'image/avif', 35689, N'https://lh3.googleusercontent.com/d/1wqd_uhUEPYdYF8t_Dwg6Cx9KpblqrCBv', N'https://drive.google.com/file/d/1wqd_uhUEPYdYF8t_Dwg6Cx9KpblqrCBv/view?usp=drivesdk', NULL, '2026-10-14 09:16:09.3720000', NULL),
(12, N'1eYW_rAl_6vR0Yz8KnJfWgFtPDmkAAVHl', N'photo-1753901821774-22a88913130f.avif', N'image/avif', 135484, N'https://lh3.googleusercontent.com/d/1eYW_rAl_6vR0Yz8KnJfWgFtPDmkAAVHl', N'https://drive.google.com/file/d/1eYW_rAl_6vR0Yz8KnJfWgFtPDmkAAVHl/view?usp=drivesdk', NULL, '2026-10-14 09:15:43.2570000', NULL),
(13, N'1_hRI4fsLbEpSETIfDv5mW5JLLKMfjkhx', N'photo-1546519638-68e109498ffc.avif', N'image/avif', 24111, N'https://lh3.googleusercontent.com/d/1_hRI4fsLbEpSETIfDv5mW5JLLKMfjkhx', N'https://drive.google.com/file/d/1_hRI4fsLbEpSETIfDv5mW5JLLKMfjkhx/view?usp=drivesdk', NULL, '2026-10-14 09:15:31.5930000', NULL),
(14, N'1MaCJ_oWtK3eTC3b0CHMXMdPtzeqkAcWp', N'photo-1621726543096-a8be76db3708.avif', N'image/avif', 37661, N'https://lh3.googleusercontent.com/d/1MaCJ_oWtK3eTC3b0CHMXMdPtzeqkAcWp', N'https://drive.google.com/file/d/1MaCJ_oWtK3eTC3b0CHMXMdPtzeqkAcWp/view?usp=drivesdk', NULL, '2026-10-14 09:15:20.4610000', NULL),
(15, N'1q8BlWmbHOjkjJ1IHJlC_Icp3Rw9qESEJ', N'photo-1613918108466-292b78a8ef95.avif', N'image/avif', 13345, N'https://lh3.googleusercontent.com/d/1q8BlWmbHOjkjJ1IHJlC_Icp3Rw9qESEJ', N'https://drive.google.com/file/d/1q8BlWmbHOjkjJ1IHJlC_Icp3Rw9qESEJ/view?usp=drivesdk', NULL, '2026-10-14 09:14:59.2420000', NULL),
(16, N'1tgLXB6-HBL3qYaYtP4Odr6DsMKutL45v', N'photo-1529900748604-07564a03e7a6.avif', N'image/avif', 199968, N'https://lh3.googleusercontent.com/d/1tgLXB6-HBL3qYaYtP4Odr6DsMKutL45v', N'https://drive.google.com/file/d/1tgLXB6-HBL3qYaYtP4Odr6DsMKutL45v/view?usp=drivesdk', NULL, '2026-10-14 09:13:56.1260000', NULL),
(17, N'1VvreK9wCvN4qAMmOp4geP-KeExB0xv4l', N'photo-1530549387789-4c1017266635.avif', N'image/avif', 90415, N'https://lh3.googleusercontent.com/d/1VvreK9wCvN4qAMmOp4geP-KeExB0xv4l', N'https://drive.google.com/file/d/1VvreK9wCvN4qAMmOp4geP-KeExB0xv4l/view?usp=drivesdk', NULL, '2026-10-14 09:13:06.6610000', NULL),
(18, N'1INwsn68MyXP2yY3szxDQMO_qPr3khcl3', N'photo-1693142517898-2f986215e412.avif', N'image/avif', 85602, N'https://lh3.googleusercontent.com/d/1INwsn68MyXP2yY3szxDQMO_qPr3khcl3', N'https://drive.google.com/file/d/1INwsn68MyXP2yY3szxDQMO_qPr3khcl3/view?usp=drivesdk', NULL, '2026-10-14 09:10:54.3700000', NULL),
(19, N'1HDHK-fKFVB4i-0WpgJBD0hjfhESG1ryr', N'photo-1708268411988-d30e0e1eef0c.avif', N'image/avif', 73229, N'https://lh3.googleusercontent.com/d/1HDHK-fKFVB4i-0WpgJBD0hjfhESG1ryr', N'https://drive.google.com/file/d/1HDHK-fKFVB4i-0WpgJBD0hjfhESG1ryr/view?usp=drivesdk', NULL, '2026-10-14 09:10:47.2220000', NULL),
(20, N'1wAdXdrdPnEzLMYZa9AJ5XC9OXgYRuYPk', N'photo-1504450758481-7338eba7524a.avif', N'image/avif', 319213, N'https://lh3.googleusercontent.com/d/1wAdXdrdPnEzLMYZa9AJ5XC9OXgYRuYPk', N'https://drive.google.com/file/d/1wAdXdrdPnEzLMYZa9AJ5XC9OXgYRuYPk/view?usp=drivesdk', NULL, '2026-10-14 09:10:40.9530000', NULL),
(21, N'1yPur1YltWPBti4vsO-c-2zELwycQnaXN', N'photo-1626224583764-f87db24ac4ea.avif', N'image/avif', 37005, N'https://lh3.googleusercontent.com/d/1yPur1YltWPBti4vsO-c-2zELwycQnaXN', N'https://drive.google.com/file/d/1yPur1YltWPBti4vsO-c-2zELwycQnaXN/view?usp=drivesdk', NULL, '2026-10-14 09:10:33.6480000', NULL),
(22, N'1MqE9iHOIABX-vSPloOD2ArKNwqWjR78F', N'photo-1574629810360-7efbbe195018.avif', N'image/avif', 115695, N'https://lh3.googleusercontent.com/d/1MqE9iHOIABX-vSPloOD2ArKNwqWjR78F', N'https://drive.google.com/file/d/1MqE9iHOIABX-vSPloOD2ArKNwqWjR78F/view?usp=drivesdk', NULL, '2026-10-14 09:10:23.3000000', NULL),
(23, N'1ooJmozAC_EVf8J0d-1O_p1TQXArtnQKJ', N'photo-1549719386-74dfcbf7dbed.avif', N'image/avif', 60530, N'https://lh3.googleusercontent.com/d/1ooJmozAC_EVf8J0d-1O_p1TQXArtnQKJ', N'https://drive.google.com/file/d/1ooJmozAC_EVf8J0d-1O_p1TQXArtnQKJ/view?usp=drivesdk', NULL, '2026-10-14 09:10:17.1240000', NULL),
(24, N'12Z9k1Yvoo26ZiFan8kxkGPHUwOJ4hK0L', N'photo-1545205597-3d9d02c29597.avif', N'image/avif', 97393, N'https://lh3.googleusercontent.com/d/12Z9k1Yvoo26ZiFan8kxkGPHUwOJ4hK0L', N'https://drive.google.com/file/d/12Z9k1Yvoo26ZiFan8kxkGPHUwOJ4hK0L/view?usp=drivesdk', NULL, '2026-10-14 09:10:09.5690000', NULL),
(25, N'1wXyGVDESYL08THode8vZVkH8VPTo1Rc2', N'photo-1519315901367-f34ff9154487.avif', N'image/avif', 192551, N'https://lh3.googleusercontent.com/d/1wXyGVDESYL08THode8vZVkH8VPTo1Rc2', N'https://drive.google.com/file/d/1wXyGVDESYL08THode8vZVkH8VPTo1Rc2/view?usp=drivesdk', NULL, '2026-10-14 09:09:36.2400000', NULL),
(26, N'1EZTtzJvTM2MKSZ8f1QxcxXoFzg5Hdk1d', N'photo-1534438327276-14e5300c3a48.avif', N'image/avif', 87669, N'https://lh3.googleusercontent.com/d/1EZTtzJvTM2MKSZ8f1QxcxXoFzg5Hdk1d', N'https://drive.google.com/file/d/1EZTtzJvTM2MKSZ8f1QxcxXoFzg5Hdk1d/view?usp=drivesdk', NULL, '2026-10-14 09:09:08.3440000', NULL);
SET IDENTITY_INSERT dbo.[uploaded_media] OFF;
GO

-- Table dbo.[equipment_issues] (2 rows)
SET IDENTITY_INSERT dbo.[equipment_issues] ON;
INSERT INTO dbo.[equipment_issues] ([Id], [center_id], [resource_id], [reported_by_user_id], [title], [description], [severity], [photo_url], [status], [resolution_note], [resolved_by], [reported_at], [resolved_at]) VALUES
(6, 1, NULL, 62, N'Dây cáp máy kéo xô đa năng có dấu hiệu sờn', N'Dây cáp bên trái máy kéo lat pulldown tại tầng 2 bị sờn vỏ bọc, cần bảo dưỡng định kỳ.', N'Medium', NULL, N'InProgress', N'Đã liên hệ nhà cung cấp phụ tùng thay thế.', NULL, '2026-11-06 08:23:04.6395069', NULL),
(7, 1, NULL, 62, N'Hệ thống lọc nước hồ bơi tầng 1', N'Cảm biến pH báo chỉ số nhẹ cần cân bằng Clo và lọc tuần hoàn ban đêm.', N'Low', NULL, N'Resolved', N'Đã sục rửa bình lọc cát và cân bằng nồng độ nước đạt chuẩn thi đấu.', 34, '2026-10-31 08:23:04.6395069', '2026-11-01 08:23:04.6395069');
SET IDENTITY_INSERT dbo.[equipment_issues] OFF;
GO

-- Table dbo.[payments] (56 rows)
SET IDENTITY_INSERT dbo.[payments] ON;
INSERT INTO dbo.[payments] ([Id], [invoice_id], [member_id], [processed_by], [payment_method], [transaction_code], [amount], [payment_status], [paid_at], [note], [refund_approved_by], [created_at], [gateway_reference], [provider_transaction_id], [idempotency_key], [gateway_payment_url], [amount_received], [provider_reference], [attempted_at]) VALUES
(8, 8, 1, NULL, N'VNPAY', NULL, 650000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-09 18:27:21.5526052', N'PAY-b10225c4d52b43f497eebe0ee0903130', NULL, N'7e1d4a6a65b3ef15c9b6369a99a2b154637d750312ef3e62a9dd5e513f1cdb7f', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=65000000&vnp_Command=pay&vnp_CreateDate=20261009182721&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261009182721-d04c03a94630&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A54162%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-b10225c4d52b43f497eebe0ee0903130&vnp_Version=2.1.0&vnp_SecureHash=aa8b2e97b5a68e1d302d26ed7307f113d15dcbc14117fc3369520f748b61ac54b5ea524c99a05d3f259ff04f62cfe97aba7080268db9e39c72026fbb646b7e91', NULL, NULL, '2026-10-09 18:27:21.5526052'),
(9, 9, 1, NULL, N'VNPAY', NULL, 1800000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-09 18:28:26.1302528', N'PAY-9626be731c944743b1f5f73d408b2a4e', NULL, N'0530d4145ecedb40836cd8ef1d323e11d490556df3f36855c951d771d0b72a0b', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261009182826&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261009182826-3ed95a6798b7&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A54162%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-9626be731c944743b1f5f73d408b2a4e&vnp_Version=2.1.0&vnp_SecureHash=5ab0c911a9e87bb7c6a24b15d7979fff4f0ba824a9838110246b5535c312410f9f6e75c9d9955bc80a208629e5d80c553d29fe516a8412717463103eb87ed86f', NULL, NULL, '2026-10-09 18:28:26.1302528'),
(10, 10, 1, NULL, N'MOMO', NULL, 3200000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-09 18:29:44.6549277', N'PAY-c164939b83424082a95a1782e49e0b63', NULL, N'09260007e4eee72019a5c389aba7e56e5fdad2ac1afd98d9dae386cb39c1ae8c', N'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT3xQQVktYzE2NDkzOWI4MzQyNDA4MmE5NWExNzgyZTQ5ZTBiNjM&s=af186b0667f49a0aef762b7c7212e88a21878f733474b63fd45f870e9ad4019d', NULL, NULL, '2026-10-09 18:29:44.6549277'),
(11, 11, 1, NULL, N'VNPAY', NULL, 650000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-09 18:57:05.7401523', N'PAY-b50d7959e7854e649ba873698095da43', NULL, N'c25b620c8d7510517f706d055f03345dafe9bcc668d841f3e028e9399713a9b3', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=65000000&vnp_Command=pay&vnp_CreateDate=20261009185705&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261009185705-04c7f947fefa&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A54162%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-b50d7959e7854e649ba873698095da43&vnp_Version=2.1.0&vnp_SecureHash=18a7b480ee4d4f436634691b78654bb2513a4fbcbf0aed721b349057d00e1f2e32da6a5ac2618fbb075acd7da4a5cb9cc497a24ed72eda3cdeb1d57ddb9f491d', NULL, NULL, '2026-10-09 18:57:05.7401523'),
(12, 12, 1, NULL, N'VNPAY', NULL, 1800000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-09 19:00:36.8013074', N'PAY-8fd346abf8ba4ba19820c177575d6480', NULL, N'4b2284ba98274280fd88419cc85694e86435fcb52a5591d3bca47c2e5b4f1825', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261010020036&vnp_CurrCode=VND&vnp_ExpireDate=20261010021536&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261009190036-9f9954101c7f&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A54162%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-8fd346abf8ba4ba19820c177575d6480&vnp_Version=2.1.0&vnp_SecureHash=5fa821d01769f0b6f856fe5380d3f2f7ea2c2202d8bb0ed798bb832d71a258abd0f316225c262e5986affa34fe51a4bb931c5557e6fa4abd5a8f7c6132a3884b', NULL, NULL, '2026-10-09 19:00:36.8013074'),
(13, 13, 1, NULL, N'VNPAY', NULL, 650000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-09 19:02:03.6740877', N'PAY-830de4ebd0bf4ecc9882f90bd87f2927', NULL, N'64fb5cf3344d2a4ec0021a4571d5e87867e02f6eb5a9754bca832914865e6cd9', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=65000000&vnp_Command=pay&vnp_CreateDate=20261010020203&vnp_CurrCode=VND&vnp_ExpireDate=20261010021703&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261009190203-876cec3f9afc&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A54162%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-830de4ebd0bf4ecc9882f90bd87f2927&vnp_Version=2.1.0&vnp_SecureHash=6ca273993ccabe80959a10039f953bc4d76d8133c952f51f88b50cdb5a17f2baa8a730000c9e21871af6c2e99570d265e815ac70d0603e42cf921a7b52689eb3', NULL, NULL, '2026-10-09 19:02:03.6740877'),
(14, 14, 1, NULL, N'PAYOS', NULL, 650000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-09 19:02:25.9438533', N'14', NULL, N'03bff6bdd567ebd8b44e9ce09d5f5d215f5a140ef3093b2d336e20916770081c', NULL, NULL, NULL, '2026-10-09 19:02:25.9438533'),
(15, 15, 1, 36, N'CASH', N'CASH:adea6b07cfa6486ca08cf90f01bb73b6', 1800000.00, N'Succeeded', '2026-10-09 19:21:26.9841186', NULL, NULL, '2026-10-09 19:21:26.9841186', NULL, NULL, N'5c86c9ac36a0a4637e4b24dfbd7f8789c4998e76d9b00a24ee2b3b65ef7daa7b', NULL, 1800000.00, NULL, '2026-10-09 19:21:26.9841186'),
(16, 16, 1, 36, N'CASH', N'CASH:7aca61e6df324ca3804534cd475d73c7', 650000.00, N'Succeeded', '2026-10-09 19:39:48.9048483', NULL, NULL, '2026-10-09 19:39:48.9048483', NULL, NULL, N'67221e33ae44c345708c6088d8aa59d2ba7f3a621a9fd4749754c6d1cf48f85d', NULL, 650000.00, NULL, '2026-10-09 19:39:48.9048483'),
(17, 17, 1, NULL, N'VNPAY', NULL, 1800000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-09 19:40:47.0148005', N'PAY-f65da6f7de004ea2ac0402372bddb3d6', NULL, N'5195109ea5c8cbc222fda7469d932605797cd03cacb8c6020c869ec92b55ea0f', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261010024047&vnp_CurrCode=VND&vnp_ExpireDate=20261010025547&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261009194046-7603d1aeab16&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A54162%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-f65da6f7de004ea2ac0402372bddb3d6&vnp_Version=2.1.0&vnp_SecureHash=5ba67578e75aac71255ceed46ff704d13e77476156f8cb882df7d6710be9490f224642cc8a7877a1d5b7e3efd53191b0249667fd0067508644a5d25ee9dea86b', NULL, NULL, '2026-10-09 19:40:47.0148005'),
(18, 18, 1, NULL, N'VNPAY', NULL, 1800000.00, N'Pending', NULL, NULL, NULL, '2026-10-09 19:41:36.8290515', N'PAY-eb6025462d0e4749b3146e1a9bc0550f', NULL, N'd1c021032c668e6404f7ee1f802a61acdd83260cbe358b0e61c078b713f67d01', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261010024136&vnp_CurrCode=VND&vnp_ExpireDate=20261010025636&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261009194136-aa6e1a9bb176&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A54162%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-eb6025462d0e4749b3146e1a9bc0550f&vnp_Version=2.1.0&vnp_SecureHash=07d1a91010756df753203f44f062024c6d23d1c0d57d243d681d247985f5dd115735a529679fd1fbb5f6667d6b4bce3e208dfe4ac00ef46d29ace2c73957aa2e', NULL, NULL, '2026-10-09 19:41:36.8290515'),
(19, 19, 1, 36, N'CASH', N'CASH:09b695456879474ea84b1a0c5f2ffa75', 650000.00, N'Succeeded', '2026-10-09 19:42:32.3836770', NULL, NULL, '2026-10-09 19:42:32.3836770', NULL, NULL, N'82f17c2653efd9584348799f5e5652b37e0794390f4310f350ab3024df46dd4b', NULL, 650000.00, NULL, '2026-10-09 19:42:32.3836770'),
(20, 20, 1, 36, N'CASH', N'CASH:01854c78d7284ac2bab7aafbc3718605', 650000.00, N'Succeeded', '2026-10-09 19:43:10.3248074', NULL, NULL, '2026-10-09 19:43:10.3248074', NULL, NULL, N'60ffeafe73a8a4e4e9992c03854233e9c9c59c70b641ff4190f1172ebee7cadf', NULL, 650000.00, NULL, '2026-10-09 19:43:10.3248074'),
(21, 21, 1, 36, N'CASH', N'CASH:03c2d4dbe8954fc3b13a3ab16e1d832e', 650000.00, N'Succeeded', '2026-10-09 19:43:18.2335291', NULL, NULL, '2026-10-09 19:43:18.2335291', NULL, NULL, N'25bf5904b72f4e21e4e15334a054cfae3a62648d9dd2926956013ea056fea68b', NULL, 650000.00, NULL, '2026-10-09 19:43:18.2335291'),
(22, 22, 1, NULL, N'VNPAY', NULL, 650000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-10 02:53:42.8358502', N'PAY-5dbdf0a4f2d044ceb54e123347ccd80a', NULL, N'fcdd7b18a35ef5bcd25cac5a7391afe4369a2151f945d0219f84e6bfc280fc0f', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=65000000&vnp_Command=pay&vnp_CreateDate=20261010095342&vnp_CurrCode=VND&vnp_ExpireDate=20261010100842&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261010025342-c0d3be46e52f&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A54162%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-5dbdf0a4f2d044ceb54e123347ccd80a&vnp_Version=2.1.0&vnp_SecureHash=9cb192110d5718afd7142aaf84e571bec8d89ec18bde507a80af08b09a0a2ddcd4445f3d274380b12558cbc35bae49d36b6950dd3eed8b6199e4f6ce258fc3f4', NULL, NULL, '2026-10-10 02:53:42.8358502'),
(23, 23, 1, NULL, N'VNPAY', NULL, 1800000.00, N'Failed', NULL, N'Giao dịch đã bị hủy bởi người dùng (ResponseCode 24)', NULL, '2026-10-10 02:57:19.6508748', N'PAY-7915d0e23f5940ef872c432e209c6944', NULL, N'6038c865192fc92a1c5a82dda43f76e481c3b0ebca3ec7ff4ee63c088407001b', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261010095719&vnp_CurrCode=VND&vnp_ExpireDate=20261010101219&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261010025719-183857713c0b&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A54162%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-7915d0e23f5940ef872c432e209c6944&vnp_Version=2.1.0&vnp_SecureHash=82170503c2f9603bd14873a37f06df1e7a8a80bb9d0d5cbbab06b4b8cc5e78a80ab926685b546e9536a5126de383a71377eea0569399ee32d55e515645fa9468', NULL, NULL, '2026-10-10 02:57:19.6508748'),
(24, 24, 1, NULL, N'VNPAY', NULL, 1800000.00, N'Failed', NULL, N'Giao dịch đã bị hủy bởi người dùng (ResponseCode 24)', NULL, '2026-10-10 03:07:29.1559963', N'PAY-5254748a21cb40a7a12cd3fa07a41e5b', NULL, N'd0404cf410f1a5a44c169b5dcbe962c3a329b8f26373fd42b483461298e59ad2', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261010100729&vnp_CurrCode=VND&vnp_ExpireDate=20261010102229&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261010030728-13b1a3e58c1e&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-5254748a21cb40a7a12cd3fa07a41e5b&vnp_Version=2.1.0&vnp_SecureHash=ec3e2b1125db1eec195c226ea0dd85ed7ec2e9b78c4e1af7a98bc124767772005e5cc6059b429be08c26d48e9e7abf75f93407461645f44a873a50590b1f006f', NULL, NULL, '2026-10-10 03:07:29.1559963'),
(25, 25, 1, NULL, N'VNPAY', NULL, 1800000.00, N'Failed', NULL, N'Giao dịch đã bị hủy bởi người dùng (ResponseCode 24)', NULL, '2026-10-10 05:58:54.5027297', N'PAY-053e3e86ce8f4c01a6c834d440ad9a6b', NULL, N'd4ddf43afa44b7e70973c0cb941c76521cd41e80e4170bb0d7fe13c5f3c5c15b', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261010125854&vnp_CurrCode=VND&vnp_ExpireDate=20261010131354&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261010055853-2d5baa7783dd&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-053e3e86ce8f4c01a6c834d440ad9a6b&vnp_Version=2.1.0&vnp_SecureHash=09f031220956a987487c8c0c2f644b8fcbbbb33ba48fa6b84fadb60428ce40f4dd480ff58480dc345dc2869a7f902088a4e11c5c0bdf70f38e4a1808884b0b7a', NULL, NULL, '2026-10-10 05:58:54.5027297'),
(26, 26, 1, 36, N'CASH', N'CASH:c1c48346457143f2846ffeb1017d0602', 700000.00, N'Succeeded', '2026-10-11 05:35:40.9326232', NULL, NULL, '2026-10-11 05:35:40.9326232', NULL, NULL, N'd9d89cac911655ef9c17c0f7ef8dea5fdd8a56a753fb7d7669f4477b5c7d23eb', NULL, 700000.00, NULL, '2026-10-11 05:35:40.9326232'),
(27, 27, 1, NULL, N'VNPAY', NULL, 650000.00, N'Failed', NULL, N'Giao dịch đã bị hủy bởi người dùng (ResponseCode 24)', NULL, '2026-10-11 15:35:01.4446677', N'PAY-01443bf0fa894e05a94c286ad71b5199', NULL, N'43d34362bcf22e5622829702d099cb84c31bd5040ed3a57849b78951b1ae9774', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=65000000&vnp_Command=pay&vnp_CreateDate=20261011223501&vnp_CurrCode=VND&vnp_ExpireDate=20261011225001&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261011153500-6699bc82e3d4&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-01443bf0fa894e05a94c286ad71b5199&vnp_Version=2.1.0&vnp_SecureHash=2d92526c5d6e4c7c8aaab350daa6f8f2d8bc211cf65b2b31bfb6a4bdf50716c86763cd36cb88fbb188ae1f0144e63b9c333e482ece4651ed428b9d9cacf8d6d9', NULL, NULL, '2026-10-11 15:35:01.4446677'),
(28, 28, 1, NULL, N'VNPAY', NULL, 650000.00, N'Failed', NULL, N'Giao dịch đã bị hủy bởi người dùng (ResponseCode 24)', NULL, '2026-10-13 02:43:05.8275194', N'PAY-abd6500ff8314650828752888217f0d6', NULL, N'375a197a660f487e88306f9f2d9bfc4100e95162213f1a838eb7af6bd8471bc4', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=65000000&vnp_Command=pay&vnp_CreateDate=20261013094305&vnp_CurrCode=VND&vnp_ExpireDate=20261013095805&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261013024305-9bf43ac61541&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-abd6500ff8314650828752888217f0d6&vnp_Version=2.1.0&vnp_SecureHash=0d669860b89444d4e6224a26f0450a09ca5e76e83af310d49d5b6dbb3c4ddcde5d05d1a059e915aa7103c2508314bbc517d1ede78b74ec0e3b8660843ff4e697', NULL, NULL, '2026-10-13 02:43:05.8275194'),
(29, 29, 1, NULL, N'VNPAY', NULL, 650000.00, N'Failed', NULL, N'Giao dịch đã bị hủy bởi người dùng (ResponseCode 24)', NULL, '2026-10-13 06:41:43.2527817', N'PAY-f65f7535965e4d18ba282e451591d152', NULL, N'0e53d16cabad389cf292cc8f3f39da6bd73d2985fa721fa8341a90602a95474d', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=65000000&vnp_Command=pay&vnp_CreateDate=20261013134143&vnp_CurrCode=VND&vnp_ExpireDate=20261013135643&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261013064143-ab8a9f6731db&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-f65f7535965e4d18ba282e451591d152&vnp_Version=2.1.0&vnp_SecureHash=f266da4c82a8948c32f4c6635665adbb401b524956e1b535a5887fb51c59e6ecfb054c8346cfad4e0c7826dff5ee2cf5fe8d0febff6d1b1b531ec724e206d9e0', NULL, NULL, '2026-10-13 06:41:43.2527817'),
(30, 30, 1, NULL, N'VNPAY', NULL, 650000.00, N'Failed', NULL, N'Giao dịch đã bị hủy bởi người dùng (ResponseCode 24)', NULL, '2026-10-13 07:41:57.3397015', N'PAY-6eada797c01a457d987efb3b6216a296', NULL, N'8abbfc35791e574c441978e6e6944fabc0b490606bb340b47c965ea0fc453b42', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=65000000&vnp_Command=pay&vnp_CreateDate=20261013144157&vnp_CurrCode=VND&vnp_ExpireDate=20261013145657&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261013074156-d2831bf4745a&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-6eada797c01a457d987efb3b6216a296&vnp_Version=2.1.0&vnp_SecureHash=53e535a09e1d81b80871092de1f269d9eda0b9284e96756b135f0c73fa70d2efc9bfc6bfa348e32cb4bd6f44f066118c18598f78dbf0e0bb861185d9cedcaa9e', NULL, NULL, '2026-10-13 07:41:57.3397015'),
(31, 31, 1, NULL, N'MOMO', NULL, 650000.00, N'Failed', NULL, N'MoMo result 1006', NULL, '2026-10-13 07:42:29.1592446', N'PAY-c05cdc7e8c034938b592b2d817e63225', NULL, N'b5c9c2ad2ca2fd37b3a6fbd3dedadd289917007ed743dd5b808fb4f1d615c14f', N'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT3xQQVktYzA1Y2RjN2U4YzAzNDkzOGI1OTJiMmQ4MTdlNjMyMjU&s=efe71fa38eb76dbfbf707906131a0c3a2a0510a4aeb3bd092042702006571323', NULL, NULL, '2026-10-13 07:42:29.1592446'),
(32, 32, 1, NULL, N'PAYOS', NULL, 650000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-13 07:42:57.1699881', N'32', NULL, N'553db6edec52600687eb9c89e4eb6380aff2f2ef6c6db6a7fcf30c295835a45c', NULL, NULL, NULL, '2026-10-13 07:42:57.1699881'),
(33, 33, 1, NULL, N'MOMO', NULL, 650000.00, N'Failed', NULL, N'MoMo result 1006', NULL, '2026-10-13 07:43:08.5732030', N'PAY-e6c7b602a92f4b2c8cd05ec40a02f83a', NULL, N'9b340bdaef51f6e1e1dcbb43c46835721f9cb79227b4ba228eb9aad35ac4096c', N'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT3xQQVktZTZjN2I2MDJhOTJmNGIyYzhjZDA1ZWM0MGEwMmY4M2E&s=e859f04704d35fbe4163beaacae2a0ddfb09db53a15e2c34b7db8d642b929dbd', NULL, NULL, '2026-10-13 07:43:08.5732030'),
(34, 34, 5, NULL, N'VNPAY', NULL, 1800000.00, N'Failed', NULL, N'Giao dịch đã bị hủy bởi người dùng (ResponseCode 24)', NULL, '2026-10-13 07:46:17.3991658', N'PAY-bcfc694524694511a1a81b959962bee7', NULL, N'd3dfaf643a8170dd8989e5cb09005b0a6732a4ae2b04946ed2d2d11f22524ce1', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261013144617&vnp_CurrCode=VND&vnp_ExpireDate=20261013150117&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261013074617-c8f486e4c1fa&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-bcfc694524694511a1a81b959962bee7&vnp_Version=2.1.0&vnp_SecureHash=6849b4250ae852a6e3776d58d15655a5aac2cdac215281412d41c37d424c21c3ac793d2b4771f3de5e70d57ea08e1a40efed2f49de92c317b1330d488675535c', NULL, NULL, '2026-10-13 07:46:17.3991658'),
(35, 35, 1, NULL, N'PAYOS', NULL, 1800000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-13 08:03:14.3447384', N'35', NULL, N'e1beb87ce9f368614c198a72e97a1e1861e17b82985d906b1894ef6535f66662', NULL, NULL, NULL, '2026-10-13 08:03:14.3447384'),
(36, 36, 1, NULL, N'PAYOS', NULL, 1800000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-13 08:12:44.1216629', N'36', NULL, N'5fbfa1905b4ccb3c8b338ac926c9267e4a4f54c29612fb665364be4f90a087b4', NULL, NULL, NULL, '2026-10-13 08:12:44.1216629'),
(37, 37, 1, NULL, N'VNPAY', NULL, 1800000.00, N'Failed', NULL, N'Giao dịch đã bị hủy bởi người dùng (ResponseCode 24)', NULL, '2026-10-13 08:16:49.4755807', N'PAY-bbf8ef350e3c45b596db94d9b088679d', NULL, N'e45d3f32e4c9d629e0de5254e623ed89f8ec7ef6b1e0f71212ba5971324ca7c1', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261013151649&vnp_CurrCode=VND&vnp_ExpireDate=20261013153149&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261013081649-be10c232a9d2&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-bbf8ef350e3c45b596db94d9b088679d&vnp_Version=2.1.0&vnp_SecureHash=1db68175e55c83a74d4b83d8f41e488696d5f678418272891d667763e9b6661a986a5d32774dda1c6608d62116057feff372f573c465b85967981c7ebf3ac8fa', NULL, NULL, '2026-10-13 08:16:49.4755807'),
(38, 38, 1, NULL, N'VNPAY', N'VNPAY:15703127', 1800000.00, N'Succeeded', '2026-10-13 08:19:06.9156626', N'VNPay giao dịch thành công', NULL, '2026-10-13 08:18:28.3082144', N'PAY-95a97aa0a3a241f082a8216be2125b72', N'VNPAY:15703127', N'2458b8a04fbe34f694724e44d326a21bab36dda0af4c6082effe6e8115728755', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261013151828&vnp_CurrCode=VND&vnp_ExpireDate=20261013153328&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261013081828-7a044a361ec2&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-95a97aa0a3a241f082a8216be2125b72&vnp_Version=2.1.0&vnp_SecureHash=fc460091ae703d4bf9df074233b4dc86308bd3be1ee9c0c040809fc908e0f88da181c2a6d1f07fa2331722a22a35051a191609dfd51bf00dc29a9cfbc291ca0a', NULL, NULL, '2026-10-13 08:18:28.3082144'),
(39, 39, 1, 36, N'CASH', N'CASH:2e2f14186024426eb5c616692c48e74a', 650000.00, N'Succeeded', '2026-10-13 08:23:07.5695530', NULL, NULL, '2026-10-13 08:23:07.5695530', NULL, NULL, N'c7547f2d471d8c6dfb2fbd34de366f8502b98f4f23f6b021f826a78c6160a270', NULL, 650000.00, NULL, '2026-10-13 08:23:07.5695530'),
(40, 40, 1, NULL, N'VNPAY', NULL, 1800000.00, N'Failed', NULL, N'Giao dịch đã bị hủy bởi người dùng (ResponseCode 24)', NULL, '2026-10-13 10:24:05.1573690', N'PAY-2cfba6ee790c4d60b9eb1e891479455c', NULL, N'851846ae61bfbcfd68718aa7ee4f25525529f7d2b8d55df1287ceadd6af95c72', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261013172405&vnp_CurrCode=VND&vnp_ExpireDate=20261013173905&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261013102404-96a957b94d2f&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-2cfba6ee790c4d60b9eb1e891479455c&vnp_Version=2.1.0&vnp_SecureHash=aaad481bd1c66f9735e8096d67af36bea3badd98f3efe4053c306a657cf0d826ce89ec824ca21310e5fcac5c6f7c52542b821140be02ee6a267a3bc405495ad2', NULL, NULL, '2026-10-13 10:24:05.1573690'),
(41, 41, 1, 36, N'CASH', N'CASH:ebc5096658fc42ffadab2f30a6bc9dc6', 650000.00, N'Succeeded', '2026-10-14 12:34:01.5655190', NULL, NULL, '2026-10-14 12:34:01.5655190', NULL, NULL, N'de0fb44a597bf09babf40851e233ebee286f11c39ab7efff255225790b2d0800', NULL, 650000.00, NULL, '2026-10-14 12:34:01.5655190'),
(42, 42, 1, NULL, N'VNPAY', NULL, 5800000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-14 13:17:49.7002414', N'PAY-4fdedbf0bbbb4f53893ecb3e77ee45a1', NULL, N'b2bb06b81c12ac173af24a707e932420884cfee0787fa3d62749ad345d9bcd58', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=580000000&vnp_Command=pay&vnp_CreateDate=20261014201749&vnp_CurrCode=VND&vnp_ExpireDate=20261014203249&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261014131749-1dc4756bab76&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-4fdedbf0bbbb4f53893ecb3e77ee45a1&vnp_Version=2.1.0&vnp_SecureHash=e4952ab9659354b8729c0fa221762b67586438ebdea25be109271b7baec01c3b805a8aa1f0041e7cbfdbea056cd860470fee4726c321f94c2b14bb1e316a38f1', NULL, NULL, '2026-10-14 13:17:49.7002414'),
(43, 43, 1, NULL, N'VNPAY', N'VNPAY:15704649', 5800000.00, N'Succeeded', '2026-10-14 13:20:03.7726165', N'VNPay giao dịch thành công', NULL, '2026-10-14 13:18:28.6950350', N'PAY-9bbe113e1c9945c6bf948f8619974d4e', N'VNPAY:15704649', N'a110470729bead54aea4aa9ef882444d3a422e0e3ebc4f35aa84185f93779053', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=580000000&vnp_Command=pay&vnp_CreateDate=20261014201828&vnp_CurrCode=VND&vnp_ExpireDate=20261014203328&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261014131828-1a7880a1b2cf&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-9bbe113e1c9945c6bf948f8619974d4e&vnp_Version=2.1.0&vnp_SecureHash=0946fdeab07f9ae4b5e7200a51225bab122d8b6a1787695f1722754f92b0e89a453ccb072a10086593c7a6c89202fdf134671ef455cfeec999d9c86cececbd73', NULL, NULL, '2026-10-14 13:18:28.6950350'),
(44, 44, 1, 36, N'CASH', N'CASH:91bd67325b1c43b7876012848fd73eef', 650000.00, N'Succeeded', '2026-10-14 14:34:39.7877766', NULL, NULL, '2026-10-14 14:34:39.7877766', NULL, NULL, N'4155d928a31b310a8b17fd2c3a3b06535ddd55bdbaadefb4760f48bcff290f2d', NULL, 650000.00, NULL, '2026-10-14 14:34:39.7877766'),
(45, 45, 3, NULL, N'MOMO', NULL, 1800000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-16 09:32:04.7286374', N'PAY-b8f48865cfeb405396d31398d618c902', NULL, N'4b8cdb4d34800cb63f670d05caced266b7405d5645221989f3f5dc026cae9f53', N'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT3xQQVktYjhmNDg4NjVjZmViNDA1Mzk2ZDMxMzk4ZDYxOGM5MDI&s=eeaf828e08142b57bbcf5561a8b637472ae825d128f9acb751ac7b7296185677', NULL, NULL, '2026-10-16 09:32:04.7286374'),
(46, 46, 3, NULL, N'VNPAY', NULL, 1800000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-16 09:32:14.6182632', N'PAY-e5aea2d02f6443779d0f22960ba6309a', NULL, N'b58cbcd5bc1d95047b75091affee97359700287227417d72afbabcf2fbc41b3f', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261016163214&vnp_CurrCode=VND&vnp_ExpireDate=20261016164714&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261016093214-cf234d97ce12&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-e5aea2d02f6443779d0f22960ba6309a&vnp_Version=2.1.0&vnp_SecureHash=fe397b68cde3ae775d0b08276806a05ddda16049bc9ded36274f866fe62f8c0bb25ed2b21b88e3974ac52f075c36f6675d18d2350c617d53901de42fc8a0ecdc', NULL, NULL, '2026-10-16 09:32:14.6182632'),
(47, 47, 3, NULL, N'VNPAY', NULL, 1800000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-16 09:33:20.6148701', N'PAY-9a5390649073427781c04a2267f0a80b', NULL, N'39062f942be605319c2e0df2ed8c6586c7472c1c879fbc7b83d9783ac227e683', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261016163320&vnp_CurrCode=VND&vnp_ExpireDate=20261016164820&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261016093320-d7e647e31b9f&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-9a5390649073427781c04a2267f0a80b&vnp_Version=2.1.0&vnp_SecureHash=19ae3130bc85de0297ec9090dff074ca407ac95f8096dfee818318bf17c5024e419e23bedfd92464f5360a939d0f209aa55be95e6c056fa3c0762f9e3daa7127', NULL, NULL, '2026-10-16 09:33:20.6148701'),
(48, 48, 3, NULL, N'VNPAY', N'VNPAY:15706762', 1800000.00, N'Succeeded', '2026-10-16 09:34:56.0855562', N'VNPay giao dịch thành công', NULL, '2026-10-16 09:34:18.4664255', N'PAY-8bb33a3729724e038628a70d9914133e', N'VNPAY:15706762', N'039b703c295c9862b9b844eb8ee7f36d961c5859a4884b6a409f97bd2a251a62', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261016163418&vnp_CurrCode=VND&vnp_ExpireDate=20261016164918&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261016093418-b1511ee02317&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-8bb33a3729724e038628a70d9914133e&vnp_Version=2.1.0&vnp_SecureHash=ab1e7035ad0f5fef4fee3515d31c840c584e924e0537dad0ddf649a15e6694e34492371eedd4a639b358a9dac991b868a7e3e0386feef00aec2443c8cb09f2c1', NULL, NULL, '2026-10-16 09:34:18.4664255'),
(49, 49, 1, NULL, N'VNPAY', NULL, 1800000.00, N'Failed', NULL, N'Giao dịch đã bị hủy bởi người dùng (ResponseCode 24)', NULL, '2026-10-20 09:12:31.4994561', N'PAY-c93c67b0a08a4322a5610d94df5cc8f0', NULL, N'658e9f2cc8837fe5b9e224a605c7a71d9035d923a78fefb35873cab24c961942', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261020161231&vnp_CurrCode=VND&vnp_ExpireDate=20261020162731&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261020091231-373ac9f95cb9&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-c93c67b0a08a4322a5610d94df5cc8f0&vnp_Version=2.1.0&vnp_SecureHash=d576853e2d1869db479f7a462d3032c12fd164cfdcf0e4fcf1222742c3f78208c4f02b3f1cd33650147b835d74949c5827030b9ed45994d3516a7f3f7e2e0fa0', NULL, NULL, '2026-10-20 09:12:31.4994561'),
(50, 50, 1, NULL, N'VNPAY', NULL, 1800000.00, N'Failed', NULL, N'Giao dịch đã bị hủy bởi người dùng (ResponseCode 24)', NULL, '2026-10-20 09:13:05.4400303', N'PAY-2b6c11c81e9046bcb5d983fc69bcdb2e', NULL, N'c165324f1f700a7f6a55dd7b30db5dc1386a6f4b250cec86c4bb959f102b0836', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261020161305&vnp_CurrCode=VND&vnp_ExpireDate=20261020162805&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261020091305-279bac7b20f1&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-2b6c11c81e9046bcb5d983fc69bcdb2e&vnp_Version=2.1.0&vnp_SecureHash=436a1f99cfbbb75e00d68bd806c223bc5a3b047413e9dc84527a764ed559ef14fa0745704aa6e442405c0bc9382e12a84165a2d6f48883615ddec4aab83b36fa', NULL, NULL, '2026-10-20 09:13:05.4400303'),
(51, 51, 1, NULL, N'MOMO', NULL, 1800000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-20 09:13:32.2431447', N'PAY-2f14b914787a45a88277b07539015a04', NULL, N'08981e9dbeda013fabe12bb725cddd2ee4ffa96da71bc61b06aa6f560c39423d', N'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT3xQQVktMmYxNGI5MTQ3ODdhNDVhODgyNzdiMDc1MzkwMTVhMDQ&s=fde892b27e28dec22e32017aae6b545e669438ca06a3d008d1b2ec8182d35762', NULL, NULL, '2026-10-20 09:13:32.2431447'),
(52, 52, 1, NULL, N'VNPAY', NULL, 1800000.00, N'Voided', NULL, N'Hủy hóa đơn chờ thanh toán.', NULL, '2026-10-20 16:59:58.1744694', N'PAY-b17aebde82424939b40af8b488e6914e', NULL, N'6dd4fb2a2bbaa583f1762ad226c3d0bb0253ba796f42f45a3af79b46455ee8de', N'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=180000000&vnp_Command=pay&vnp_CreateDate=20261020235958&vnp_CurrCode=VND&vnp_ExpireDate=20261021001458&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+hoa+don+SC-20261020165957-447c195e1d1a&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3004%2Fpayment-result&vnp_TmnCode=987L6F2Z&vnp_TxnRef=PAY-b17aebde82424939b40af8b488e6914e&vnp_Version=2.1.0&vnp_SecureHash=73bff823749ca545d17a2b44d8094b5e213c6d66cdb0463fc406e103bc342686c085afe65050a556370c79b6d12bab2c1f0b1a967c48490da2fc9a3e09857ce8', NULL, NULL, '2026-10-20 16:59:58.1744694'),
(53, 53, 1, 36, N'CASH', N'CASH:0faa60b59b2f480f9af181e8edf685a3', 650000.00, N'Succeeded', '2026-10-21 14:13:27.9675575', NULL, NULL, '2026-10-21 14:13:27.9675575', NULL, NULL, N'91c872b47a78d45b4aa73ac37114d92c456b4ba0b1ec5390780476bf693d539b', NULL, 650000.00, NULL, '2026-10-21 14:13:27.9675575'),
(10061, 10061, 1, NULL, N'MOMO', N'MOMO:TXN-20260827-10061-12035602', 1800000.00, N'Succeeded', '2026-08-27 08:23:04.6395069', N'Thanh toán trực tuyến thành công qua cổng MOMO', NULL, '2026-08-27 08:23:04.6395069', NULL, NULL, NULL, NULL, 1800000.00, NULL, '2026-08-27 08:22:39.6395069'),
(10062, 10062, 1, 36, N'CASH', N'CASH:TXN-20261026-10062-BE0D5731', 1800000.00, N'Succeeded', '2026-10-26 08:23:04.6395069', N'Thu tiền mặt tại quầy lễ tân', NULL, '2026-10-26 08:23:04.6395069', NULL, NULL, NULL, NULL, 1800000.00, NULL, '2026-10-26 08:22:39.6395069'),
(10063, 10063, 3, 36, N'CASH', N'CASH:TXN-20260827-10063-F39C5851', 3200000.00, N'Succeeded', '2026-08-27 08:23:04.6395069', N'Thu tiền mặt tại quầy lễ tân', NULL, '2026-08-27 08:23:04.6395069', NULL, NULL, NULL, NULL, 3200000.00, NULL, '2026-08-27 08:22:39.6395069'),
(10064, 10064, 3, NULL, N'VNPAY', N'VNPAY:TXN-20261026-10064-D8EBA303', 3200000.00, N'Succeeded', '2026-10-26 08:23:04.6395069', N'Thanh toán trực tuyến thành công qua cổng VNPAY', NULL, '2026-10-26 08:23:04.6395069', NULL, NULL, NULL, NULL, 3200000.00, NULL, '2026-10-26 08:22:39.6395069'),
(10065, 10065, 4, 36, N'CASH', N'CASH:TXN-20260827-10065-2F296AC0', 5800000.00, N'Succeeded', '2026-08-27 08:23:04.6395069', N'Thu tiền mặt tại quầy lễ tân', NULL, '2026-08-27 08:23:04.6395069', NULL, NULL, NULL, NULL, 5800000.00, NULL, '2026-08-27 08:22:39.6395069'),
(10066, 10066, 4, NULL, N'VNPAY', N'VNPAY:TXN-20261026-10066-8C8D5AE2', 5800000.00, N'Succeeded', '2026-10-26 08:23:04.6395069', N'Thanh toán trực tuyến thành công qua cổng VNPAY', NULL, '2026-10-26 08:23:04.6395069', NULL, NULL, NULL, NULL, 5800000.00, NULL, '2026-10-26 08:22:39.6395069'),
(10067, 10067, 5, 36, N'CASH', N'CASH:TXN-20260827-10067-447A340E', 650000.00, N'Succeeded', '2026-08-27 08:23:04.6395069', N'Thu tiền mặt tại quầy lễ tân', NULL, '2026-08-27 08:23:04.6395069', NULL, NULL, NULL, NULL, 650000.00, NULL, '2026-08-27 08:22:39.6395069'),
(10068, 10068, 5, NULL, N'VNPAY', N'VNPAY:TXN-20261026-10068-B57FD13B', 650000.00, N'Succeeded', '2026-10-26 08:23:04.6395069', N'Thanh toán trực tuyến thành công qua cổng VNPAY', NULL, '2026-10-26 08:23:04.6395069', NULL, NULL, NULL, NULL, 650000.00, NULL, '2026-10-26 08:22:39.6395069'),
(10069, 10069, 21, 36, N'CASH', N'CASH:TXN-20260827-10069-F336EC49', 1800000.00, N'Succeeded', '2026-08-27 08:23:04.6395069', N'Thu tiền mặt tại quầy lễ tân', NULL, '2026-08-27 08:23:04.6395069', NULL, NULL, NULL, NULL, 1800000.00, NULL, '2026-08-27 08:22:39.6395069'),
(10070, 10070, 21, NULL, N'VNPAY', N'VNPAY:TXN-20261026-10070-97C85633', 1800000.00, N'Succeeded', '2026-10-26 08:23:04.6395069', N'Thanh toán trực tuyến thành công qua cổng VNPAY', NULL, '2026-10-26 08:23:04.6395069', NULL, NULL, NULL, NULL, 1800000.00, NULL, '2026-10-26 08:22:39.6395069');
SET IDENTITY_INSERT dbo.[payments] OFF;
GO

-- Table dbo.[invoice_items] (56 rows)
SET IDENTITY_INSERT dbo.[invoice_items] ON;
INSERT INTO dbo.[invoice_items] ([Id], [invoice_id], [package_id], [subscription_id], [enrollment_id], [description], [quantity], [unit_price], [amount]) VALUES
(8, 8, 1, 8, NULL, N'Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(9, 9, 2, 9, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(10, 10, 3, 10, NULL, N'Gói Elite Chuyên Nghiệp', 1, 3200000.00, 3200000.00),
(11, 11, 1, 11, NULL, N'Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(12, 12, 2, 12, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(13, 13, 1, 13, NULL, N'Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(14, 14, 1, 14, NULL, N'Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(15, 15, 2, 15, NULL, N'Gói tập: Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(16, 16, 1, 16, NULL, N'Gói tập: Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(17, 17, 2, 17, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(18, 18, 2, 18, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(19, 19, 1, 19, NULL, N'Gói tập: Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(20, 20, 1, 20, NULL, N'Gói tập: Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(21, 21, 1, 21, NULL, N'Gói tập: Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(22, 22, 1, 22, NULL, N'Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(23, 23, 2, 23, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(24, 24, 2, 24, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(25, 25, 2, 25, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(26, 26, 1, 31, NULL, N'Gói tập: Gói Basic Thể Thao', 1, 700000.00, 700000.00),
(27, 27, 1, 32, NULL, N'Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(28, 28, 1, 33, NULL, N'Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(29, 29, 1, 34, NULL, N'Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(30, 30, 1, 35, NULL, N'Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(31, 31, 1, 36, NULL, N'Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(32, 32, 1, 37, NULL, N'Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(33, 33, 1, 38, NULL, N'Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(34, 34, 2, 39, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(35, 35, 2, 40, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(36, 36, 2, 41, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(37, 37, 2, 42, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(38, 38, 2, 43, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(39, 39, 1, 44, NULL, N'Gói tập: Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(40, 40, 2, 45, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(41, 41, 1, 46, NULL, N'Gói tập: Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(42, 42, 4, 47, NULL, N'Gói All-Access Olympic Pass', 1, 5800000.00, 5800000.00),
(43, 43, 4, 48, NULL, N'Gói All-Access Olympic Pass', 1, 5800000.00, 5800000.00),
(44, 44, 1, 49, NULL, N'Gói tập: Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(45, 45, 2, 50, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(46, 46, 2, 51, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(47, 47, 2, 52, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(48, 48, 2, 53, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(49, 49, 2, 54, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(50, 50, 2, 55, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(51, 51, 2, 56, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(52, 52, 2, 57, NULL, N'Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(53, 53, 1, 58, NULL, N'Gói tập: Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(10058, 10061, 10007, 10062, NULL, N'Đăng ký gói tập: Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(10059, 10062, 10007, 10063, NULL, N'Gia hạn gói tập: Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(10060, 10063, 10008, 10064, NULL, N'Đăng ký gói tập: Gói Elite Chuyên Nghiệp', 1, 3200000.00, 3200000.00),
(10061, 10064, 10008, 10065, NULL, N'Gia hạn gói tập: Gói Elite Chuyên Nghiệp', 1, 3200000.00, 3200000.00),
(10062, 10065, 10009, 10066, NULL, N'Đăng ký gói tập: Gói All-Access Olympic Pass', 1, 5800000.00, 5800000.00),
(10063, 10066, 10009, 10067, NULL, N'Gia hạn gói tập: Gói All-Access Olympic Pass', 1, 5800000.00, 5800000.00),
(10064, 10067, 10006, 10068, NULL, N'Đăng ký gói tập: Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(10065, 10068, 10006, 10069, NULL, N'Gia hạn gói tập: Gói Basic Thể Thao', 1, 650000.00, 650000.00),
(10066, 10069, 10007, 10070, NULL, N'Đăng ký gói tập: Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00),
(10067, 10070, 10007, 10071, NULL, N'Gia hạn gói tập: Gói Pro Bứt Phá', 1, 1800000.00, 1800000.00);
SET IDENTITY_INSERT dbo.[invoice_items] OFF;
GO

-- Table dbo.[invoices] (56 rows)
SET IDENTITY_INSERT dbo.[invoices] ON;
INSERT INTO dbo.[invoices] ([Id], [invoice_number], [member_id], [center_id], [created_by], [subtotal], [discount], [tax], [total_amount], [status], [issued_at], [paid_at], [idempotency_key]) VALUES
(8, N'SC-20261009182721-d04c03a94630', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Voided', '2026-10-09 18:27:21.0000000', NULL, N'7e1d4a6a65b3ef15c9b6369a99a2b154637d750312ef3e62a9dd5e513f1cdb7f'),
(9, N'SC-20261009182826-3ed95a6798b7', 1, 15, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-09 18:28:26.0000000', NULL, N'0530d4145ecedb40836cd8ef1d323e11d490556df3f36855c951d771d0b72a0b'),
(10, N'SC-20261009182944-410e1d7d034c', 1, 15, 36, 3200000.00, 0.00, 0.00, 3200000.00, N'Voided', '2026-10-09 18:29:44.0000000', NULL, N'09260007e4eee72019a5c389aba7e56e5fdad2ac1afd98d9dae386cb39c1ae8c'),
(11, N'SC-20261009185705-04c7f947fefa', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Voided', '2026-10-09 18:57:06.0000000', NULL, N'c25b620c8d7510517f706d055f03345dafe9bcc668d841f3e028e9399713a9b3'),
(12, N'SC-20261009190036-9f9954101c7f', 1, 15, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-09 19:00:37.0000000', NULL, N'4b2284ba98274280fd88419cc85694e86435fcb52a5591d3bca47c2e5b4f1825'),
(13, N'SC-20261009190203-876cec3f9afc', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Voided', '2026-10-09 19:02:04.0000000', NULL, N'64fb5cf3344d2a4ec0021a4571d5e87867e02f6eb5a9754bca832914865e6cd9'),
(14, N'SC-20261009190225-c173f9c48d70', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Voided', '2026-10-09 19:02:26.0000000', NULL, N'03bff6bdd567ebd8b44e9ce09d5f5d215f5a140ef3093b2d336e20916770081c'),
(15, N'SC-20261009192126-a44c8d5b7a0e', 1, 15, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Paid', '2026-10-09 19:21:27.0000000', '2026-10-09 19:21:27.0000000', N'5c86c9ac36a0a4637e4b24dfbd7f8789c4998e76d9b00a24ee2b3b65ef7daa7b'),
(16, N'SC-20261009193948-5cf498fab3c9', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Paid', '2026-10-09 19:39:49.0000000', '2026-10-09 19:39:49.0000000', N'67221e33ae44c345708c6088d8aa59d2ba7f3a621a9fd4749754c6d1cf48f85d'),
(17, N'SC-20261009194046-7603d1aeab16', 1, 15, 37, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-09 19:40:47.0000000', NULL, N'5195109ea5c8cbc222fda7469d932605797cd03cacb8c6020c869ec92b55ea0f'),
(18, N'SC-20261009194136-aa6e1a9bb176', 1, 15, 37, 1800000.00, 0.00, 0.00, 1800000.00, N'Issued', '2026-10-09 19:41:37.0000000', NULL, N'd1c021032c668e6404f7ee1f802a61acdd83260cbe358b0e61c078b713f67d01'),
(19, N'SC-20261009194232-6a5aa643f1b4', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Paid', '2026-10-09 19:42:32.0000000', '2026-10-09 19:42:32.0000000', N'82f17c2653efd9584348799f5e5652b37e0794390f4310f350ab3024df46dd4b'),
(20, N'SC-20261009194310-4bc823e4adbf', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Paid', '2026-10-09 19:43:10.0000000', '2026-10-09 19:43:10.0000000', N'60ffeafe73a8a4e4e9992c03854233e9c9c59c70b641ff4190f1172ebee7cadf'),
(21, N'SC-20261009194318-b0a5a899ccd6', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Paid', '2026-10-09 19:43:18.0000000', '2026-10-09 19:43:18.0000000', N'25bf5904b72f4e21e4e15334a054cfae3a62648d9dd2926956013ea056fea68b'),
(22, N'SC-20261010025342-c0d3be46e52f', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Voided', '2026-10-10 02:53:42.0000000', NULL, N'fcdd7b18a35ef5bcd25cac5a7391afe4369a2151f945d0219f84e6bfc280fc0f'),
(23, N'SC-20261010025719-183857713c0b', 1, 15, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-10 02:57:20.0000000', NULL, N'6038c865192fc92a1c5a82dda43f76e481c3b0ebca3ec7ff4ee63c088407001b'),
(24, N'SC-20261010030728-13b1a3e58c1e', 1, 15, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-10 03:07:29.0000000', NULL, N'd0404cf410f1a5a44c169b5dcbe962c3a329b8f26373fd42b483461298e59ad2'),
(25, N'SC-20261010055853-2d5baa7783dd', 1, 15, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-10 05:58:54.0000000', NULL, N'd4ddf43afa44b7e70973c0cb941c76521cd41e80e4170bb0d7fe13c5f3c5c15b'),
(26, N'SC-20261011053540-e742f0661978', 1, 15, 36, 700000.00, 0.00, 0.00, 700000.00, N'Paid', '2026-10-11 05:35:41.0000000', '2026-10-11 05:35:41.0000000', N'd9d89cac911655ef9c17c0f7ef8dea5fdd8a56a753fb7d7669f4477b5c7d23eb'),
(27, N'SC-20261011153500-6699bc82e3d4', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Voided', '2026-10-11 15:35:01.0000000', NULL, N'43d34362bcf22e5622829702d099cb84c31bd5040ed3a57849b78951b1ae9774'),
(28, N'SC-20261013024305-9bf43ac61541', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Voided', '2026-10-13 02:43:06.0000000', NULL, N'375a197a660f487e88306f9f2d9bfc4100e95162213f1a838eb7af6bd8471bc4'),
(29, N'SC-20261013064143-ab8a9f6731db', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Voided', '2026-10-13 06:41:43.0000000', NULL, N'0e53d16cabad389cf292cc8f3f39da6bd73d2985fa721fa8341a90602a95474d'),
(30, N'SC-20261013074156-d2831bf4745a', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Voided', '2026-10-13 07:41:57.0000000', NULL, N'8abbfc35791e574c441978e6e6944fabc0b490606bb340b47c965ea0fc453b42'),
(31, N'SC-20261013074228-fb3673dbf758', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Voided', '2026-10-13 07:42:29.0000000', NULL, N'b5c9c2ad2ca2fd37b3a6fbd3dedadd289917007ed743dd5b808fb4f1d615c14f'),
(32, N'SC-20261013074257-4067249e57f2', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Voided', '2026-10-13 07:42:57.0000000', NULL, N'553db6edec52600687eb9c89e4eb6380aff2f2ef6c6db6a7fcf30c295835a45c'),
(33, N'SC-20261013074308-9a251f1db323', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Voided', '2026-10-13 07:43:09.0000000', NULL, N'9b340bdaef51f6e1e1dcbb43c46835721f9cb79227b4ba228eb9aad35ac4096c'),
(34, N'SC-20261013074617-c8f486e4c1fa', 5, 15, 43, 1800000.00, 0.00, 0.00, 1800000.00, N'Issued', '2026-10-13 07:46:17.0000000', NULL, N'd3dfaf643a8170dd8989e5cb09005b0a6732a4ae2b04946ed2d2d11f22524ce1'),
(35, N'SC-20261013080314-978c058e3686', 1, 15, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-13 08:03:14.0000000', NULL, N'e1beb87ce9f368614c198a72e97a1e1861e17b82985d906b1894ef6535f66662'),
(36, N'SC-20261013081244-b96b2105bf27', 1, 15, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-13 08:12:44.0000000', NULL, N'5fbfa1905b4ccb3c8b338ac926c9267e4a4f54c29612fb665364be4f90a087b4'),
(37, N'SC-20261013081649-be10c232a9d2', 1, 15, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-13 08:16:49.0000000', NULL, N'e45d3f32e4c9d629e0de5254e623ed89f8ec7ef6b1e0f71212ba5971324ca7c1'),
(38, N'SC-20261013081828-7a044a361ec2', 1, 15, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Paid', '2026-10-13 08:18:28.0000000', '2026-10-13 08:19:07.0000000', N'2458b8a04fbe34f694724e44d326a21bab36dda0af4c6082effe6e8115728755'),
(39, N'SC-20261013082307-1d2783cace0c', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Paid', '2026-10-13 08:23:08.0000000', '2026-10-13 08:23:08.0000000', N'c7547f2d471d8c6dfb2fbd34de366f8502b98f4f23f6b021f826a78c6160a270'),
(40, N'SC-20261013102404-96a957b94d2f', 1, 15, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-13 10:24:05.0000000', NULL, N'851846ae61bfbcfd68718aa7ee4f25525529f7d2b8d55df1287ceadd6af95c72'),
(41, N'SC-20261014123401-c66159e7d9eb', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Paid', '2026-10-14 12:34:02.0000000', '2026-10-14 12:34:02.0000000', N'de0fb44a597bf09babf40851e233ebee286f11c39ab7efff255225790b2d0800'),
(42, N'SC-20261014131749-1dc4756bab76', 1, 15, 36, 5800000.00, 0.00, 0.00, 5800000.00, N'Voided', '2026-10-14 13:17:50.0000000', NULL, N'b2bb06b81c12ac173af24a707e932420884cfee0787fa3d62749ad345d9bcd58'),
(43, N'SC-20261014131828-1a7880a1b2cf', 1, 15, 36, 5800000.00, 0.00, 0.00, 5800000.00, N'Paid', '2026-10-14 13:18:29.0000000', '2026-10-14 13:20:04.0000000', N'a110470729bead54aea4aa9ef882444d3a422e0e3ebc4f35aa84185f93779053'),
(44, N'SC-20261014143439-6d023cbb5377', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Paid', '2026-10-14 14:34:40.0000000', '2026-10-14 14:34:40.0000000', N'4155d928a31b310a8b17fd2c3a3b06535ddd55bdbaadefb4760f48bcff290f2d'),
(45, N'SC-20261016093204-c94789639d81', 3, 15, 41, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-16 09:32:05.0000000', NULL, N'4b8cdb4d34800cb63f670d05caced266b7405d5645221989f3f5dc026cae9f53'),
(46, N'SC-20261016093214-cf234d97ce12', 3, 15, 41, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-16 09:32:15.0000000', NULL, N'b58cbcd5bc1d95047b75091affee97359700287227417d72afbabcf2fbc41b3f'),
(47, N'SC-20261016093320-d7e647e31b9f', 3, 15, 41, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-16 09:33:21.0000000', NULL, N'39062f942be605319c2e0df2ed8c6586c7472c1c879fbc7b83d9783ac227e683'),
(48, N'SC-20261016093418-b1511ee02317', 3, 15, 41, 1800000.00, 0.00, 0.00, 1800000.00, N'Paid', '2026-10-16 09:34:18.0000000', '2026-10-16 09:34:56.0000000', N'039b703c295c9862b9b844eb8ee7f36d961c5859a4884b6a409f97bd2a251a62'),
(49, N'SC-20261020091231-373ac9f95cb9', 1, 15, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-20 09:12:31.0000000', NULL, N'658e9f2cc8837fe5b9e224a605c7a71d9035d923a78fefb35873cab24c961942'),
(50, N'SC-20261020091305-279bac7b20f1', 1, 15, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-20 09:13:05.0000000', NULL, N'c165324f1f700a7f6a55dd7b30db5dc1386a6f4b250cec86c4bb959f102b0836'),
(51, N'SC-20261020091332-371b09dc6880', 1, 15, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-20 09:13:32.0000000', NULL, N'08981e9dbeda013fabe12bb725cddd2ee4ffa96da71bc61b06aa6f560c39423d'),
(52, N'SC-20261020165957-447c195e1d1a', 1, 15, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Voided', '2026-10-20 16:59:58.0000000', NULL, N'6dd4fb2a2bbaa583f1762ad226c3d0bb0253ba796f42f45a3af79b46455ee8de'),
(53, N'SC-20261021141327-a6015299e8d3', 1, 15, 36, 650000.00, 0.00, 0.00, 650000.00, N'Paid', '2026-10-21 14:13:28.0000000', '2026-10-21 14:13:28.0000000', N'91c872b47a78d45b4aa73ac37114d92c456b4ba0b1ec5390780476bf693d539b'),
(10061, N'INV-20260827-001-12035602', 1, 1, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Paid', '2026-08-27 08:23:04.6395069', '2026-08-27 08:23:04.6395069', N'2a766b211fd04216aad3559e961b2805'),
(10062, N'INV-20261026-001-BE0D5731', 1, 1, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Paid', '2026-10-26 08:23:04.6395069', '2026-10-26 08:23:04.6395069', N'3d1bcd7e10874433bf9c62ed322186be'),
(10063, N'INV-20260827-003-F39C5851', 3, 1, 36, 3200000.00, 0.00, 0.00, 3200000.00, N'Paid', '2026-08-27 08:23:04.6395069', '2026-08-27 08:23:04.6395069', N'82482e924fa4459ca199bda27c506e40'),
(10064, N'INV-20261026-003-D8EBA303', 3, 1, 36, 3200000.00, 0.00, 0.00, 3200000.00, N'Paid', '2026-10-26 08:23:04.6395069', '2026-10-26 08:23:04.6395069', N'f15dab4762de47c7915e52e7297282dd'),
(10065, N'INV-20260827-004-2F296AC0', 4, 1, 36, 5800000.00, 0.00, 0.00, 5800000.00, N'Paid', '2026-08-27 08:23:04.6395069', '2026-08-27 08:23:04.6395069', N'5b3040a301d2421ebc0f5bb3b079a006'),
(10066, N'INV-20261026-004-8C8D5AE2', 4, 1, 36, 5800000.00, 0.00, 0.00, 5800000.00, N'Paid', '2026-10-26 08:23:04.6395069', '2026-10-26 08:23:04.6395069', N'f413f5a9730b4409bde104134f0ea652'),
(10067, N'INV-20260827-005-447A340E', 5, 1, 36, 650000.00, 0.00, 0.00, 650000.00, N'Paid', '2026-08-27 08:23:04.6395069', '2026-08-27 08:23:04.6395069', N'1e7d11bf41e048d2ac6aa3ebb57fece7'),
(10068, N'INV-20261026-005-B57FD13B', 5, 1, 36, 650000.00, 0.00, 0.00, 650000.00, N'Paid', '2026-10-26 08:23:04.6395069', '2026-10-26 08:23:04.6395069', N'1e7dd96718594b6188acadd6ddb19b64'),
(10069, N'INV-20260827-021-F336EC49', 21, 1, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Paid', '2026-08-27 08:23:04.6395069', '2026-08-27 08:23:04.6395069', N'a2098b56a66847eba6a8780d7401eefe'),
(10070, N'INV-20261026-021-97C85633', 21, 1, 36, 1800000.00, 0.00, 0.00, 1800000.00, N'Paid', '2026-10-26 08:23:04.6395069', '2026-10-26 08:23:04.6395069', N'bc9059ccfdef4f8f87689e3902ec7c11');
SET IDENTITY_INSERT dbo.[invoices] OFF;
GO

-- Table dbo.[attendance] (27 rows)
SET IDENTITY_INSERT dbo.[attendance] ON;
INSERT INTO dbo.[attendance] ([Id], [session_id], [member_id], [checked_in_by], [attendance_status], [check_in_time], [check_out_time], [note], [created_at]) VALUES
(1, 1, 1, 36, N'ABSENT', NULL, NULL, N'', '2026-10-14 14:02:40.0000000'),
(2, 1, 3, 36, N'ABSENT', NULL, NULL, N'', '2026-10-14 14:02:40.0000000'),
(3, 1, 5, 36, N'LATE', '2026-10-14 14:02:40.0000000', NULL, N'', '2026-10-14 14:02:40.0000000'),
(4, 10, 1, 36, N'ABSENT', NULL, NULL, N'', '2026-10-16 08:26:05.0000000'),
(5, 10, 4, 36, N'PRESENT', '2026-10-16 08:26:05.0000000', NULL, N'', '2026-10-16 08:26:05.0000000'),
(7, 17, 3, 36, N'PRESENT', '2026-10-20 06:26:48.0000000', NULL, N'', '2026-10-20 06:26:48.0000000'),
(8, 17, 5, 36, N'LATE', '2026-10-20 06:26:48.0000000', NULL, N'', '2026-10-20 06:26:48.0000000'),
(10213, 10107, 1, 62, N'PRESENT', '2026-10-27 17:55:00.0000000', '2026-10-27 19:05:00.0000000', N'Điểm danh đúng giờ', '2026-10-27 17:55:00.0000000'),
(10214, 10108, 1, 62, N'PRESENT', '2026-11-03 17:55:00.0000000', '2026-11-03 19:05:00.0000000', N'Điểm danh đúng giờ', '2026-11-03 17:55:00.0000000'),
(10215, 10116, 1, 62, N'PRESENT', '2026-10-28 17:25:00.0000000', '2026-10-28 18:35:00.0000000', N'Điểm danh đúng giờ', '2026-10-28 17:25:00.0000000'),
(10216, 10117, 1, 62, N'PRESENT', '2026-11-04 17:25:00.0000000', '2026-11-04 18:35:00.0000000', N'Điểm danh đúng giờ', '2026-11-04 17:25:00.0000000'),
(10217, 10142, 3, 62, N'LATE', '2026-10-31 15:10:00.0000000', '2026-10-31 16:35:00.0000000', N'Đến trễ 10 phút do kẹt xe', '2026-10-31 15:10:00.0000000'),
(10218, 10143, 3, 62, N'PRESENT', '2026-11-07 14:55:00.0000000', '2026-11-07 16:35:00.0000000', N'Điểm danh đúng giờ', '2026-11-07 14:55:00.0000000'),
(10219, 10150, 3, 62, N'PRESENT', '2026-10-27 18:55:00.0000000', '2026-10-27 20:35:00.0000000', N'Điểm danh đúng giờ', '2026-10-27 18:55:00.0000000'),
(10220, 10151, 3, 62, N'PRESENT', '2026-11-03 18:55:00.0000000', '2026-11-03 20:35:00.0000000', N'Điểm danh đúng giờ', '2026-11-03 18:55:00.0000000'),
(10221, 10168, 4, 62, N'PRESENT', '2026-10-29 18:25:00.0000000', '2026-10-29 20:05:00.0000000', N'Điểm danh đúng giờ', '2026-10-29 18:25:00.0000000'),
(10222, 10169, 4, 62, N'PRESENT', '2026-11-05 18:25:00.0000000', '2026-11-05 20:05:00.0000000', N'Điểm danh đúng giờ', '2026-11-05 18:25:00.0000000'),
(10223, 10134, 4, 62, N'PRESENT', '2026-10-30 18:55:00.0000000', '2026-10-30 20:05:00.0000000', N'Điểm danh đúng giờ', '2026-10-30 18:55:00.0000000'),
(10224, 10135, 4, 62, N'PRESENT', '2026-11-06 18:55:00.0000000', '2026-11-06 20:05:00.0000000', N'Điểm danh đúng giờ', '2026-11-06 18:55:00.0000000'),
(10225, 10150, 5, 62, N'LATE', '2026-10-27 19:10:00.0000000', '2026-10-27 20:35:00.0000000', N'Đến trễ 10 phút do kẹt xe', '2026-10-27 19:10:00.0000000'),
(10226, 10151, 5, 62, N'PRESENT', '2026-11-03 18:55:00.0000000', '2026-11-03 20:35:00.0000000', N'Điểm danh đúng giờ', '2026-11-03 18:55:00.0000000'),
(10227, 10125, 5, 62, N'LATE', '2026-10-29 18:10:00.0000000', '2026-10-29 19:05:00.0000000', N'Đến trễ 10 phút do kẹt xe', '2026-10-29 18:10:00.0000000'),
(10228, 10126, 5, 62, N'PRESENT', '2026-11-05 17:55:00.0000000', '2026-11-05 19:05:00.0000000', N'Điểm danh đúng giờ', '2026-11-05 17:55:00.0000000'),
(10229, 10168, 21, 62, N'PRESENT', '2026-10-29 18:25:00.0000000', '2026-10-29 20:05:00.0000000', N'Điểm danh đúng giờ', '2026-10-29 18:25:00.0000000'),
(10230, 10169, 21, 62, N'LATE', '2026-11-05 18:40:00.0000000', '2026-11-05 20:05:00.0000000', N'Đến trễ 10 phút do kẹt xe', '2026-11-05 18:40:00.0000000'),
(10231, 10134, 21, 62, N'LATE', '2026-10-30 19:10:00.0000000', '2026-10-30 20:05:00.0000000', N'Đến trễ 10 phút do kẹt xe', '2026-10-30 19:10:00.0000000'),
(10232, 10135, 21, 62, N'PRESENT', '2026-11-06 18:55:00.0000000', '2026-11-06 20:05:00.0000000', N'Điểm danh đúng giờ', '2026-11-06 18:55:00.0000000');
SET IDENTITY_INSERT dbo.[attendance] OFF;
GO

-- Table dbo.[center_checkins] (57 rows)
SET IDENTITY_INSERT dbo.[center_checkins] ON;
INSERT INTO dbo.[center_checkins] ([Id], [member_id], [center_id], [checked_in_by], [check_in_time], [check_out_time], [created_at]) VALUES
(2, 1, 15, 36, '2026-10-09 19:28:34.0000000', NULL, '2026-10-09 19:28:34.0000000'),
(3, 1, 15, 36, '2026-10-09 19:29:44.0000000', NULL, '2026-10-09 19:29:44.0000000'),
(4, 1, 15, 36, '2026-10-09 19:29:44.0000000', NULL, '2026-10-09 19:29:44.0000000'),
(5, 1, 15, 36, '2026-10-09 19:31:06.0000000', NULL, '2026-10-09 19:31:06.0000000'),
(6, 1, 15, 36, '2026-10-11 05:35:56.0000000', NULL, '2026-10-11 05:35:56.0000000'),
(7, 1, 15, 36, '2026-10-13 08:23:16.0000000', NULL, '2026-10-13 08:23:16.0000000'),
(8, 1, 15, 36, '2026-10-14 14:37:56.0000000', NULL, '2026-10-14 14:37:56.0000000'),
(10221, 1, 1, 36, '2026-11-08 17:37:00.0000000', '2026-11-08 18:52:00.0000000', '2026-11-08 17:37:00.0000000'),
(10222, 1, 1, 36, '2026-11-06 17:37:00.0000000', '2026-11-06 18:52:00.0000000', '2026-11-06 17:37:00.0000000'),
(10223, 1, 1, 36, '2026-11-04 17:37:00.0000000', '2026-11-04 18:52:00.0000000', '2026-11-04 17:37:00.0000000'),
(10224, 1, 1, 36, '2026-11-02 17:37:00.0000000', '2026-11-02 18:52:00.0000000', '2026-11-02 17:37:00.0000000'),
(10225, 1, 1, 36, '2026-10-31 17:37:00.0000000', '2026-10-31 18:52:00.0000000', '2026-10-31 17:37:00.0000000'),
(10226, 1, 1, 36, '2026-10-29 17:37:00.0000000', '2026-10-29 18:52:00.0000000', '2026-10-29 17:37:00.0000000'),
(10227, 1, 1, 36, '2026-10-27 17:37:00.0000000', '2026-10-27 18:52:00.0000000', '2026-10-27 17:37:00.0000000'),
(10228, 1, 1, 36, '2026-10-25 17:37:00.0000000', '2026-10-25 18:52:00.0000000', '2026-10-25 17:37:00.0000000'),
(10229, 1, 1, 36, '2026-10-23 17:37:00.0000000', '2026-10-23 18:52:00.0000000', '2026-10-23 17:37:00.0000000'),
(10230, 1, 1, 36, '2026-10-21 17:37:00.0000000', '2026-10-21 18:52:00.0000000', '2026-10-21 17:37:00.0000000'),
(10231, 3, 1, 36, '2026-11-08 17:51:00.0000000', '2026-11-08 19:06:00.0000000', '2026-11-08 17:51:00.0000000'),
(10232, 3, 1, 36, '2026-11-06 17:51:00.0000000', '2026-11-06 19:06:00.0000000', '2026-11-06 17:51:00.0000000'),
(10233, 3, 1, 36, '2026-11-04 17:51:00.0000000', '2026-11-04 19:06:00.0000000', '2026-11-04 17:51:00.0000000'),
(10234, 3, 1, 36, '2026-11-02 17:51:00.0000000', '2026-11-02 19:06:00.0000000', '2026-11-02 17:51:00.0000000'),
(10235, 3, 1, 36, '2026-10-31 17:51:00.0000000', '2026-10-31 19:06:00.0000000', '2026-10-31 17:51:00.0000000'),
(10236, 3, 1, 36, '2026-10-29 17:51:00.0000000', '2026-10-29 19:06:00.0000000', '2026-10-29 17:51:00.0000000'),
(10237, 3, 1, 36, '2026-10-27 17:51:00.0000000', '2026-10-27 19:06:00.0000000', '2026-10-27 17:51:00.0000000'),
(10238, 3, 1, 36, '2026-10-25 17:51:00.0000000', '2026-10-25 19:06:00.0000000', '2026-10-25 17:51:00.0000000'),
(10239, 3, 1, 36, '2026-10-23 17:51:00.0000000', '2026-10-23 19:06:00.0000000', '2026-10-23 17:51:00.0000000'),
(10240, 3, 1, 36, '2026-10-21 17:51:00.0000000', '2026-10-21 19:06:00.0000000', '2026-10-21 17:51:00.0000000'),
(10241, 4, 1, 36, '2026-11-08 17:58:00.0000000', '2026-11-08 19:13:00.0000000', '2026-11-08 17:58:00.0000000'),
(10242, 4, 1, 36, '2026-11-06 17:58:00.0000000', '2026-11-06 19:13:00.0000000', '2026-11-06 17:58:00.0000000'),
(10243, 4, 1, 36, '2026-11-04 17:58:00.0000000', '2026-11-04 19:13:00.0000000', '2026-11-04 17:58:00.0000000'),
(10244, 4, 1, 36, '2026-11-02 17:58:00.0000000', '2026-11-02 19:13:00.0000000', '2026-11-02 17:58:00.0000000'),
(10245, 4, 1, 36, '2026-10-31 17:58:00.0000000', '2026-10-31 19:13:00.0000000', '2026-10-31 17:58:00.0000000'),
(10246, 4, 1, 36, '2026-10-29 17:58:00.0000000', '2026-10-29 19:13:00.0000000', '2026-10-29 17:58:00.0000000'),
(10247, 4, 1, 36, '2026-10-27 17:58:00.0000000', '2026-10-27 19:13:00.0000000', '2026-10-27 17:58:00.0000000'),
(10248, 4, 1, 36, '2026-10-25 17:58:00.0000000', '2026-10-25 19:13:00.0000000', '2026-10-25 17:58:00.0000000'),
(10249, 4, 1, 36, '2026-10-23 17:58:00.0000000', '2026-10-23 19:13:00.0000000', '2026-10-23 17:58:00.0000000'),
(10250, 4, 1, 36, '2026-10-21 17:58:00.0000000', '2026-10-21 19:13:00.0000000', '2026-10-21 17:58:00.0000000'),
(10251, 5, 1, 36, '2026-11-08 18:05:00.0000000', '2026-11-08 19:20:00.0000000', '2026-11-08 18:05:00.0000000'),
(10252, 5, 1, 36, '2026-11-06 18:05:00.0000000', '2026-11-06 19:20:00.0000000', '2026-11-06 18:05:00.0000000'),
(10253, 5, 1, 36, '2026-11-04 18:05:00.0000000', '2026-11-04 19:20:00.0000000', '2026-11-04 18:05:00.0000000'),
(10254, 5, 1, 36, '2026-11-02 18:05:00.0000000', '2026-11-02 19:20:00.0000000', '2026-11-02 18:05:00.0000000'),
(10255, 5, 1, 36, '2026-10-31 18:05:00.0000000', '2026-10-31 19:20:00.0000000', '2026-10-31 18:05:00.0000000'),
(10256, 5, 1, 36, '2026-10-29 18:05:00.0000000', '2026-10-29 19:20:00.0000000', '2026-10-29 18:05:00.0000000'),
(10257, 5, 1, 36, '2026-10-27 18:05:00.0000000', '2026-10-27 19:20:00.0000000', '2026-10-27 18:05:00.0000000'),
(10258, 5, 1, 36, '2026-10-25 18:05:00.0000000', '2026-10-25 19:20:00.0000000', '2026-10-25 18:05:00.0000000'),
(10259, 5, 1, 36, '2026-10-23 18:05:00.0000000', '2026-10-23 19:20:00.0000000', '2026-10-23 18:05:00.0000000'),
(10260, 5, 1, 36, '2026-10-21 18:05:00.0000000', '2026-10-21 19:20:00.0000000', '2026-10-21 18:05:00.0000000'),
(10261, 21, 1, 36, '2026-11-08 17:57:00.0000000', '2026-11-08 19:12:00.0000000', '2026-11-08 17:57:00.0000000'),
(10262, 21, 1, 36, '2026-11-06 17:57:00.0000000', '2026-11-06 19:12:00.0000000', '2026-11-06 17:57:00.0000000'),
(10263, 21, 1, 36, '2026-11-04 17:57:00.0000000', '2026-11-04 19:12:00.0000000', '2026-11-04 17:57:00.0000000'),
(10264, 21, 1, 36, '2026-11-02 17:57:00.0000000', '2026-11-02 19:12:00.0000000', '2026-11-02 17:57:00.0000000'),
(10265, 21, 1, 36, '2026-10-31 17:57:00.0000000', '2026-10-31 19:12:00.0000000', '2026-10-31 17:57:00.0000000'),
(10266, 21, 1, 36, '2026-10-29 17:57:00.0000000', '2026-10-29 19:12:00.0000000', '2026-10-29 17:57:00.0000000'),
(10267, 21, 1, 36, '2026-10-27 17:57:00.0000000', '2026-10-27 19:12:00.0000000', '2026-10-27 17:57:00.0000000'),
(10268, 21, 1, 36, '2026-10-25 17:57:00.0000000', '2026-10-25 19:12:00.0000000', '2026-10-25 17:57:00.0000000'),
(10269, 21, 1, 36, '2026-10-23 17:57:00.0000000', '2026-10-23 19:12:00.0000000', '2026-10-23 17:57:00.0000000'),
(10270, 21, 1, 36, '2026-10-21 17:57:00.0000000', '2026-10-21 19:12:00.0000000', '2026-10-21 17:57:00.0000000');
SET IDENTITY_INSERT dbo.[center_checkins] OFF;
GO

-- Table dbo.[class_enrollments] (19 rows)
SET IDENTITY_INSERT dbo.[class_enrollments] ON;
INSERT INTO dbo.[class_enrollments] ([Id], [class_id], [member_id], [subscription_id], [registered_by], [registered_at], [cancelled_at], [status], [cancellation_reason]) VALUES
(21, 1, 1, NULL, NULL, '2026-10-10 17:25:08.0000000', NULL, N'Active', NULL),
(22, 1, 3, NULL, NULL, '2026-10-10 17:25:08.0000000', NULL, N'Active', NULL),
(23, 1, 5, NULL, NULL, '2026-10-10 17:25:08.0000000', NULL, N'Active', NULL),
(24, 2, 1, NULL, NULL, '2026-10-10 17:25:08.0000000', NULL, N'Active', NULL),
(25, 2, 4, NULL, NULL, '2026-10-10 17:25:08.0000000', NULL, N'Active', NULL),
(27, 3, 3, NULL, NULL, '2026-10-10 17:25:08.0000000', NULL, N'Active', NULL),
(28, 3, 5, NULL, NULL, '2026-10-10 17:25:08.0000000', NULL, N'Active', NULL),
(29, 4, 4, NULL, NULL, '2026-10-10 17:25:08.0000000', NULL, N'Active', NULL),
(31, 5, 1, NULL, NULL, '2026-10-10 17:25:08.0000000', NULL, N'Active', NULL),
(10046, 10049, 1, 10063, 36, '2026-10-26 08:23:04.6395069', NULL, N'Active', NULL),
(10047, 10050, 1, 10063, 36, '2026-10-26 08:23:04.6395069', NULL, N'Active', NULL),
(10048, 10053, 3, 10065, 36, '2026-10-26 08:23:04.6395069', NULL, N'Active', NULL),
(10049, 10054, 3, 10065, 36, '2026-10-26 08:23:04.6395069', NULL, N'Active', NULL),
(10050, 10056, 4, 10067, 36, '2026-10-26 08:23:04.6395069', NULL, N'Active', NULL),
(10051, 10052, 4, 10067, 36, '2026-10-26 08:23:04.6395069', NULL, N'Active', NULL),
(10052, 10054, 5, 10069, 36, '2026-10-26 08:23:04.6395069', NULL, N'Active', NULL),
(10053, 10051, 5, 10069, 36, '2026-10-26 08:23:04.6395069', NULL, N'Active', NULL),
(10054, 10056, 21, 10071, 36, '2026-10-26 08:23:04.6395069', NULL, N'Active', NULL),
(10055, 10052, 21, 10071, 36, '2026-10-26 08:23:04.6395069', NULL, N'Active', NULL);
SET IDENTITY_INSERT dbo.[class_enrollments] OFF;
GO

-- Table dbo.[session_bookings] (112 rows)
SET IDENTITY_INSERT dbo.[session_bookings] ON;
INSERT INTO dbo.[session_bookings] ([Id], [session_id], [member_id], [enrollment_id], [booked_at], [status], [subscription_id], [registered_by]) VALUES
(1, 1, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(2, 1, 3, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(3, 1, 5, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(4, 10, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(5, 10, 4, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(7, 25, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(9, 16, 3, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(10, 16, 5, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(11, 22, 4, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(13, 13, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(14, 13, 4, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(16, 4, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(17, 4, 3, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(18, 4, 5, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(19, 19, 3, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(20, 19, 5, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(21, 7, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(22, 7, 3, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(23, 7, 5, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(24, 11, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(25, 11, 4, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(27, 2, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(28, 2, 3, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(29, 2, 5, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(30, 26, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(32, 23, 4, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(34, 17, 3, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(35, 17, 5, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(36, 14, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(37, 14, 4, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(39, 5, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(40, 5, 3, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(41, 5, 5, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(42, 20, 3, NULL, '2026-10-10 17:25:08.0000000', N'Cancelled', NULL, NULL),
(43, 20, 5, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(44, 8, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(45, 8, 3, NULL, '2026-10-10 17:25:08.0000000', N'Cancelled', NULL, NULL),
(46, 8, 5, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(47, 12, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(48, 12, 4, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(50, 3, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(51, 3, 3, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(52, 3, 5, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(53, 27, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(55, 24, 4, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(57, 18, 3, NULL, '2026-10-10 17:25:08.0000000', N'Cancelled', NULL, NULL),
(58, 18, 5, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(59, 15, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(60, 15, 4, NULL, '2026-10-10 17:25:08.0000000', N'Cancelled', NULL, NULL),
(62, 6, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(63, 6, 3, NULL, '2026-10-10 17:25:08.0000000', N'Cancelled', NULL, NULL),
(64, 6, 5, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(65, 21, 3, NULL, '2026-10-10 17:25:08.0000000', N'Cancelled', NULL, NULL),
(66, 21, 5, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(67, 9, 1, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(68, 9, 3, NULL, '2026-10-10 17:25:08.0000000', N'Cancelled', NULL, NULL),
(69, 9, 5, NULL, '2026-10-10 17:25:08.0000000', N'Booked', NULL, NULL),
(72, 7, 4, NULL, '2026-10-14 13:50:28.0000000', N'Booked', 28, NULL),
(76, 65, 3, NULL, '2026-10-21 14:42:47.0000000', N'Booked', 27, NULL),
(10253, 10107, 1, 10046, '2026-10-25 08:00:00.0000000', N'Booked', 10063, 36),
(10254, 10108, 1, 10046, '2026-11-01 08:00:00.0000000', N'Booked', 10063, 36),
(10255, 10109, 1, 10046, '2026-11-10 08:23:04.6395069', N'Booked', 10063, 36),
(10256, 10110, 1, 10046, '2026-11-10 08:23:04.6395069', N'Booked', 10063, 36),
(10257, 10111, 1, 10046, '2026-11-10 08:23:04.6395069', N'Booked', 10063, 36),
(10258, 10112, 1, 10046, '2026-11-10 08:23:04.6395069', N'Booked', 10063, 36),
(10259, 10116, 1, 10047, '2026-10-26 08:00:00.0000000', N'Booked', 10063, 36),
(10260, 10117, 1, 10047, '2026-11-02 08:00:00.0000000', N'Booked', 10063, 36),
(10261, 10118, 1, 10047, '2026-11-10 08:23:04.6395069', N'Booked', 10063, 36),
(10262, 10119, 1, 10047, '2026-11-10 08:23:04.6395069', N'Booked', 10063, 36),
(10263, 10120, 1, 10047, '2026-11-10 08:23:04.6395069', N'Booked', 10063, 36),
(10264, 10142, 3, 10048, '2026-10-29 08:00:00.0000000', N'Booked', 10065, 36),
(10265, 10143, 3, 10048, '2026-11-05 08:00:00.0000000', N'Booked', 10065, 36),
(10266, 10144, 3, 10048, '2026-11-10 08:23:04.6395069', N'Booked', 10065, 36),
(10267, 10145, 3, 10048, '2026-11-10 08:23:04.6395069', N'Booked', 10065, 36),
(10268, 10146, 3, 10048, '2026-11-10 08:23:04.6395069', N'Booked', 10065, 36),
(10269, 10150, 3, 10049, '2026-10-25 08:00:00.0000000', N'Booked', 10065, 36),
(10270, 10151, 3, 10049, '2026-11-01 08:00:00.0000000', N'Booked', 10065, 36),
(10271, 10152, 3, 10049, '2026-11-10 08:23:04.6395069', N'Booked', 10065, 36),
(10272, 10153, 3, 10049, '2026-11-10 08:23:04.6395069', N'Booked', 10065, 36),
(10273, 10154, 3, 10049, '2026-11-10 08:23:04.6395069', N'Booked', 10065, 36),
(10274, 10155, 3, 10049, '2026-11-10 08:23:04.6395069', N'Booked', 10065, 36),
(10275, 10168, 4, 10050, '2026-10-27 08:00:00.0000000', N'Booked', 10067, 36),
(10276, 10169, 4, 10050, '2026-11-03 08:00:00.0000000', N'Booked', 10067, 36),
(10277, 10170, 4, 10050, '2026-11-10 08:23:04.6395069', N'Booked', 10067, 36),
(10278, 10171, 4, 10050, '2026-11-10 08:23:04.6395069', N'Booked', 10067, 36),
(10279, 10172, 4, 10050, '2026-11-10 08:23:04.6395069', N'Booked', 10067, 36),
(10280, 10134, 4, 10051, '2026-10-28 08:00:00.0000000', N'Booked', 10067, 36),
(10281, 10135, 4, 10051, '2026-11-04 08:00:00.0000000', N'Booked', 10067, 36),
(10282, 10136, 4, 10051, '2026-11-10 08:23:04.6395069', N'Booked', 10067, 36),
(10283, 10137, 4, 10051, '2026-11-10 08:23:04.6395069', N'Booked', 10067, 36),
(10284, 10138, 4, 10051, '2026-11-10 08:23:04.6395069', N'Booked', 10067, 36),
(10285, 10150, 5, 10052, '2026-10-25 08:00:00.0000000', N'Booked', 10069, 36),
(10286, 10151, 5, 10052, '2026-11-01 08:00:00.0000000', N'Booked', 10069, 36),
(10287, 10152, 5, 10052, '2026-11-10 08:23:04.6395069', N'Booked', 10069, 36),
(10288, 10153, 5, 10052, '2026-11-10 08:23:04.6395069', N'Booked', 10069, 36),
(10289, 10154, 5, 10052, '2026-11-10 08:23:04.6395069', N'Booked', 10069, 36),
(10290, 10155, 5, 10052, '2026-11-10 08:23:04.6395069', N'Booked', 10069, 36),
(10291, 10125, 5, 10053, '2026-10-27 08:00:00.0000000', N'Booked', 10069, 36),
(10292, 10126, 5, 10053, '2026-11-03 08:00:00.0000000', N'Booked', 10069, 36),
(10293, 10127, 5, 10053, '2026-11-10 08:23:04.6395069', N'Booked', 10069, 36);
INSERT INTO dbo.[session_bookings] ([Id], [session_id], [member_id], [enrollment_id], [booked_at], [status], [subscription_id], [registered_by]) VALUES
(10294, 10128, 5, 10053, '2026-11-10 08:23:04.6395069', N'Booked', 10069, 36),
(10295, 10129, 5, 10053, '2026-11-10 08:23:04.6395069', N'Booked', 10069, 36),
(10296, 10168, 21, 10054, '2026-10-27 08:00:00.0000000', N'Booked', 10071, 36),
(10297, 10169, 21, 10054, '2026-11-03 08:00:00.0000000', N'Booked', 10071, 36),
(10298, 10170, 21, 10054, '2026-11-10 08:23:04.6395069', N'Booked', 10071, 36),
(10299, 10171, 21, 10054, '2026-11-10 08:23:04.6395069', N'Booked', 10071, 36),
(10300, 10172, 21, 10054, '2026-11-10 08:23:04.6395069', N'Booked', 10071, 36),
(10301, 10134, 21, 10055, '2026-10-28 08:00:00.0000000', N'Booked', 10071, 36),
(10302, 10135, 21, 10055, '2026-11-04 08:00:00.0000000', N'Booked', 10071, 36),
(10303, 10136, 21, 10055, '2026-11-10 08:23:04.6395069', N'Booked', 10071, 36),
(10304, 10137, 21, 10055, '2026-11-10 08:23:04.6395069', N'Booked', 10071, 36),
(10305, 10138, 21, 10055, '2026-11-10 08:23:04.6395069', N'Booked', 10071, 36);
SET IDENTITY_INSERT dbo.[session_bookings] OFF;
GO

-- Table dbo.[facility_resources] (5 rows)
SET IDENTITY_INSERT dbo.[facility_resources] ON;
INSERT INTO dbo.[facility_resources] ([Id], [center_id], [name], [resource_type], [location], [capacity], [status], [created_at]) VALUES
(1, 15, N'Khu PT chức năng', N'TrainingZone', N'Tầng 2', 8, N'Available', '2026-10-18 05:25:30.9999876'),
(2, 15, N'Võ đài Boxing', N'BoxingRing', N'Tầng 2', 6, N'Available', '2026-10-18 05:25:31.0144272'),
(3, 15, N'Máy Pilates Reformer #1', N'PilatesMachine', N'Studio tầng 3', 1, N'Available', '2026-10-18 05:25:31.0161521'),
(4, 15, N'Khung Yoga bay #1', N'AerialYogaRig', N'Studio tầng 3', 2, N'Available', '2026-10-18 05:25:31.0170391'),
(5, 15, N'Bộ cáp đa năng', N'Equipment', N'Phòng Gym', 2, N'Available', '2026-10-18 05:25:31.0179018');
SET IDENTITY_INSERT dbo.[facility_resources] OFF;
GO

-- Table dbo.[coach_compensation_policies] (3 rows)
SET IDENTITY_INSERT dbo.[coach_compensation_policies] ON;
INSERT INTO dbo.[coach_compensation_policies] ([Id], [coach_id], [monthly_base_salary], [commission_per_session], [sales_commission_percent], [target_sessions], [target_sales], [effective_from], [effective_to], [status], [updated_by], [updated_at]) VALUES
(1, 14, 8000000.00, 100000.00, 5.00, 60, 30000000.00, '2026-10-18 00:00:00.0000000', NULL, N'Active', 35, '2026-10-18 05:25:31.2560834'),
(2, 14, 8000000.00, 100000.00, 5.00, 60, 30000000.00, '2026-10-18 00:00:00.0000000', NULL, N'Active', 35, '2026-10-18 05:25:31.2866771'),
(3, 14, 8000000.00, 100000.00, 5.00, 60, 30000000.00, '2026-10-18 00:00:00.0000000', NULL, N'Active', 35, '2026-10-18 05:25:31.2879843');
SET IDENTITY_INSERT dbo.[coach_compensation_policies] OFF;
GO

-- Table dbo.[training_results] (2 rows)
SET IDENTITY_INSERT dbo.[training_results] ON;
INSERT INTO dbo.[training_results] ([Id], [member_id], [coach_id], [session_id], [training_plan_exercise_id], [exercise_id], [training_plan_id], [result_date], [sets_completed], [repetitions_completed], [weight], [duration_seconds], [calories_burned], [performance_score], [notes], [created_at], [body_fat_percentage], [class_id], [coach_feedback], [muscle_mass], [workout_result]) VALUES
(1, 1, 14, 7, NULL, NULL, NULL, '2026-10-16 00:00:00.0000000', NULL, NULL, 70.00, NULL, NULL, NULL, NULL, '2026-10-16 09:13:59.0000000', 50.00, 1, N'Good', 50.00, N'Good'),
(2, 3, 14, 7, NULL, NULL, NULL, '2026-10-16 00:00:00.0000000', NULL, NULL, 50.00, NULL, NULL, NULL, NULL, '2026-10-16 09:14:37.0000000', 10.00, 1, N'Good', 50.00, N'Good');
SET IDENTITY_INSERT dbo.[training_results] OFF;
GO

-- Table dbo.[training_plan_exercises] (4 rows)
SET IDENTITY_INSERT dbo.[training_plan_exercises] ON;
INSERT INTO dbo.[training_plan_exercises] ([Id], [training_plan_id], [exercise_id], [day_number], [sets], [repetitions], [duration_seconds], [rest_seconds], [target_weight], [notes], [sort_order]) VALUES
(1, 1, 1, 1, 6, 50, 60, 30, NULL, N'Tập trung cảm nhận lực nắm bắt nước', 1),
(2, 2, 2, 1, 4, 10, NULL, 90, 60.00, N'RPE 8.0, kiểm soát pha hạ tạ 2 giây', 1),
(3, 3, 3, 1, 3, 5, 45, 20, NULL, N'Hít thở bụng sâu 5 nhịp mỗi bên', 1),
(4, 4, 4, 1, 5, 12, NULL, 60, NULL, N'Tập trung vào điểm tiếp xúc mặt vợt chuẩn', 1);
SET IDENTITY_INSERT dbo.[training_plan_exercises] OFF;
GO

-- Table dbo.[training_plans] (6 rows)
SET IDENTITY_INSERT dbo.[training_plans] ON;
INSERT INTO dbo.[training_plans] ([Id], [member_id], [class_id], [coach_id], [name], [description], [goal], [start_date], [end_date], [plan_type], [status], [created_at], [updated_at], [exercises_json], [fitness_condition]) VALUES
(1, 5, 1, 14, N'Giáo án Hoàn thiện kỹ thuật bơi sải & Nhịp thở Olympic', N'Giáo trình 8 tuần rèn luyện cơ tay sau, nhóm cơ liên sườn và kiểm soát nhịp thở dưới nước', N'Tối ưu nhịp thở 2 bên, vươn sải tay xa, hoàn thành 500m bơi liên tục', '2026-10-01 00:00:00.0000000', '2026-11-30 00:00:00.0000000', N'Class', N'Active', '2026-10-10 17:25:08.0000000', NULL, NULL, NULL),
(2, 1, 2, 14, N'Giáo án Tăng phì đại cơ thân trên Hypertrophy Chu kỳ 1', N'Lịch tập chia nhóm cơ Push/Pull, tập trung Bench Press, Overhead Press, Barbell Row và Dips', N'Tăng 2kg khối lượng cơ nạc thân trên, cải thiện Bench Press lên 80kg', '2026-10-01 00:00:00.0000000', '2026-11-30 00:00:00.0000000', N'Personal', N'Active', '2026-10-10 17:25:08.0000000', NULL, NULL, NULL),
(3, 3, 3, 14, N'Giáo án Yoga Trị liệu Cột sống & Mở khớp hông', N'Các chuỗi động tác Cat-Cow, Pigeon Pose, Cobra Pose và các bài thở Pranayama phục hồi', N'Giải tỏa căng thẳng vùng thắt lưng, cải thiện tư thế đứng và độ dẻo dai khớp hông', '2026-10-01 00:00:00.0000000', '2026-11-30 00:00:00.0000000', N'Class', N'Active', '2026-10-10 17:25:08.0000000', NULL, NULL, NULL),
(4, 4, 4, 14, N'Giáo án Bộ chân di chuyển & Đập cầu góc hẹp Smash', N'Bài tập bước di chuyển 6 góc sân, bài tập cổ tay với vợt nặng, thực chiến phản xạ giao cầu', N'Nâng cao tốc độ hồi sân, tăng lực phát bóng và đập cầu chính xác góc lưới', '2026-10-01 00:00:00.0000000', '2026-11-30 00:00:00.0000000', N'Personal', N'Active', '2026-10-10 17:25:08.0000000', NULL, NULL, NULL),
(6, NULL, 1, 14, N'd', NULL, N'd', '2026-10-11 00:00:00.0000000', '2026-10-31 00:00:00.0000000', N'Class', N'Archived', '2026-10-11 15:53:31.0000000', '2026-10-11 15:53:39.0000000', N'[{"Name":"Kh\u1EDFi \u0111\u1ED9ng xoay kh\u1EDBp \u0026 ch\u1EA1y nh\u1EB9","Sets":"2","Reps":"5 ph\u00FAt","Note":"L\u00E0m n\u00F3ng to\u00E0n th\u00E2n"},{"Name":"B\u00E0i t\u1EADp ch\u00EDnh chuy\u00EAn s\u00E2u","Sets":"4","Reps":"10 - 12","Note":"RPE 8.0, ngh\u1EC9 60s"}]', NULL),
(7, 1, 1, 14, N'Chương trình tập luyện bơi lội tăng cơ và sức bền', NULL, N'Tăng cơ, cải thiện sức bền', '2026-10-13 00:00:00.0000000', NULL, N'Personal', N'Archived', '2026-10-13 07:53:03.0000000', '2026-10-13 07:53:08.0000000', N'[{"Name":"B\u01A1i s\u1EA3i li\u00EAn t\u1EE5c (Endurance Freestyle)","Sets":"4","Reps":"400m","Note":"Duy tr\u00EC nh\u1ECBp \u0111\u1ED9 \u1ED5n \u0111\u1ECBnh, ngh\u1EC9 45 gi\u00E2y gi\u1EEFa c\u00E1c hi\u1EC7p."},{"Name":"K\u00E9o phao tay (Pull Buoy)","Sets":"4","Reps":"100m","Note":"T\u1EADp trung v\u00E0o l\u1EF1c k\u00E9o c\u1EE7a th\u00E2n tr\u00EAn \u0111\u1EC3 ph\u00E1t tri\u1EC3n c\u01A1 b\u1EAFp."},{"Name":"\u0110\u1EA1p ch\u00E2n v\u1EDBi v\u00E1n (Kick set)","Sets":"4","Reps":"50m","Note":"T\u0103ng c\u01B0\u1EDDng s\u1EE9c m\u1EA1nh c\u01A1 ch\u00E2n v\u00E0 c\u01A1 l\u00F5i."}]', NULL);
SET IDENTITY_INSERT dbo.[training_plans] OFF;
GO

-- Table dbo.[exercises] (14 rows)
SET IDENTITY_INSERT dbo.[exercises] ON;
INSERT INTO dbo.[exercises] ([Id], [sport_id], [name], [description], [muscle_group], [difficulty_level], [instructions], [video_url], [status], [created_at], [center_id], [created_by_coach_id], [image_url]) VALUES
(1, 1, N'Quạt tay sải kẹp phao Pullbuoy', N'Bài tập cô lập thân trên, cải thiện kỹ thuật kéo nước và sải tay bơi', N'Cơ vai & lưng xô', N'Intermediate', N'Kẹp phao bơi giữa hai đùi, giữ thẳng thân người và chỉ dùng lực quạt tay sải', NULL, N'Active', '2026-10-10 17:25:08.0000000', NULL, NULL, NULL),
(2, 2, N'Barbell Bench Press (Đẩy ngực đòn ngang)', N'Bài tập compound cơ bản xây dựng sức mạnh và độ dày cơ ngực', N'Cơ ngực & tay sau', N'All Levels', N'Nằm trên ghế phẳng, siết bả vai, hạ thanh đòn chậm rãi chạm ngực dưới rồi đẩy lên', NULL, N'Active', '2026-10-10 17:25:08.0000000', NULL, NULL, NULL),
(3, 3, N'Tư thế chim bồ câu Pigeon Pose', N'Kéo giãn sâu cơ mông, khớp háng và giải tỏa căng cứng cột sống', N'Khớp hông & thắt lưng', N'Beginner', N'Gập chân trước vuông góc hoặc 45 độ, duỗi thẳng chân sau, từ từ gập người về phía trước', NULL, N'Active', '2026-10-10 17:25:08.0000000', NULL, NULL, NULL),
(4, 4, N'Đập cầu dốc góc lưới Smash & Footwork', N'Kỹ thuật tấn công chủ lực kết hợp phản xạ bước chân hồi sân nhanh', N'Cổ tay & cơ chân', N'Advanced', N'Bật nhảy lùi 2 bước, đón cầu điểm cao nhất, gập cổ tay đập cắm sân', NULL, N'Active', '2026-10-10 17:25:08.0000000', NULL, NULL, NULL),
(5, 5, N'Tổ hợp đòn đấm Jab-Cross-Hook & Slip', N'Tổ hợp đòn đấm boxing cơ bản tăng tốc độ ra đòn và phản xạ né tránh', N'Toàn thân & cơ lõi Core', N'Intermediate', N'Đứng đúng thủ tấn, Jab tay trước, Cross tay sau, xoay hông Lead Hook rồi né đòn Slip sang phải', NULL, N'Active', '2026-10-10 17:25:08.0000000', NULL, NULL, NULL),
(6, 1, N'Barbell Back Squat', N'Bài tập chuẩn trong thư viện trung tâm', N'Chân & Core', N'Intermediate', N'Giữ lưng trung lập, gối theo hướng mũi chân, xuống có kiểm soát.', NULL, N'Active', '2026-10-18 05:25:31.0000000', 15, NULL, NULL),
(7, 1, N'Romanian Deadlift', N'Bài tập chuẩn trong thư viện trung tâm', N'Gân kheo & Mông', N'Intermediate', N'Đẩy hông ra sau, thanh đòn sát chân, không gù lưng.', NULL, N'Active', '2026-10-18 05:25:31.0000000', 15, NULL, NULL),
(8, 1, N'Push-up chuẩn', N'Bài tập chuẩn trong thư viện trung tâm', N'Ngực & Tay sau', N'Beginner', N'Siết core, thân người thành một đường thẳng, hạ ngực có kiểm soát.', NULL, N'Active', '2026-10-18 05:25:31.0000000', 15, NULL, NULL),
(9, 1, N'Zone 2 Cardio', N'Bài tập chuẩn trong thư viện trung tâm', N'Tim mạch', N'Beginner', N'Duy trì nhịp tim 60-70% tối đa trong 30-45 phút.', NULL, N'Active', '2026-10-18 05:25:31.0000000', 15, NULL, NULL),
(10, 1, N'Hip Flexor Stretch', N'Bài tập chuẩn trong thư viện trung tâm', N'Giãn cơ hông', N'Beginner', N'Giữ khung chậu trung lập, thở chậm, mỗi bên 30-45 giây.', NULL, N'Active', '2026-10-18 05:25:31.0000000', 15, NULL, NULL),
(11, 1, N'Boxing Jab-Cross', N'Bài tập chuẩn trong thư viện trung tâm', N'Toàn thân', N'Intermediate', N'Giữ cằm thấp, xoay hông và thu tay về vị trí phòng thủ.', NULL, N'Active', '2026-10-18 05:25:31.0000000', 15, NULL, NULL),
(15, 6, N'Golf Grip & Stance Chuẩn Quốc Tế', N'Kỹ thuật cầm gậy Overlapping/Interlocking và thế đứng căn chỉnh trọng tâm.', N'Core & Full Body', N'Beginner', NULL, NULL, N'Active', '2026-10-20 17:24:47.0000000', 15, NULL, NULL),
(16, 6, N'Kỹ Thuật Full Swing Gậy Sắt 7 (Iron 7)', N'Chuyển giao lực hông, giữ góc xoay vai và điểm tiếp xúc bóng lý tưởng.', N'Vai, Lưng, Hông', N'Intermediate', NULL, NULL, N'Active', '2026-10-20 17:24:47.0000000', 15, NULL, NULL),
(17, 6, N'Putting & Chipping Cảm Biến 3D TrackMan', N'Luyện cảm giác gạt bóng trên green và cú chip tầm ngắn tiếp cận cờ hiệu quả.', N'Cổ tay & Thăng bằng', N'All Levels', NULL, NULL, N'Active', '2026-10-20 17:24:47.0000000', 15, NULL, NULL);
SET IDENTITY_INSERT dbo.[exercises] OFF;
GO

-- Table dbo.[member_subscriptions] (61 rows)
SET IDENTITY_INSERT dbo.[member_subscriptions] ON;
INSERT INTO dbo.[member_subscriptions] ([Id], [member_id], [package_id], [start_date], [end_date], [price], [status], [auto_renew], [created_at], [updated_at], [duration_days]) VALUES
(8, 1, 1, NULL, NULL, 650000.00, N'Cancelled', 0, '2026-10-09 18:27:21.0000000', '2026-10-09 18:57:03.0000000', 30),
(9, 1, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-09 18:28:26.0000000', '2026-10-09 18:55:57.0000000', 90),
(10, 1, 3, NULL, NULL, 3200000.00, N'Cancelled', 0, '2026-10-09 18:29:44.0000000', '2026-10-09 19:01:08.0000000', 180),
(11, 1, 1, NULL, NULL, 650000.00, N'Cancelled', 0, '2026-10-09 18:57:06.0000000', '2026-10-09 19:01:08.0000000', 30),
(12, 1, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-09 19:00:37.0000000', '2026-10-09 19:01:08.0000000', 90),
(13, 1, 1, NULL, NULL, 650000.00, N'Cancelled', 0, '2026-10-09 19:02:04.0000000', '2026-10-09 19:02:22.0000000', 30),
(14, 1, 1, NULL, NULL, 650000.00, N'Cancelled', 0, '2026-10-09 19:02:26.0000000', '2026-10-09 19:39:49.0000000', 30),
(15, 1, 2, '2026-10-10 00:00:00.0000000', '2027-01-07 00:00:00.0000000', 1800000.00, N'Active', 0, '2026-10-09 19:21:27.0000000', '2026-10-09 19:21:27.0000000', 90),
(16, 1, 1, '2027-01-08 00:00:00.0000000', '2027-02-06 00:00:00.0000000', 650000.00, N'Active', 0, '2026-10-09 19:39:49.0000000', '2026-10-09 19:39:49.0000000', 30),
(17, 1, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-09 19:40:47.0000000', '2026-10-09 19:41:25.0000000', 90),
(18, 1, 2, NULL, NULL, 1800000.00, N'PendingPayment', 0, '2026-10-09 19:41:37.0000000', NULL, 90),
(19, 1, 1, '2027-02-07 00:00:00.0000000', '2027-03-08 00:00:00.0000000', 650000.00, N'Active', 0, '2026-10-09 19:42:32.0000000', '2026-10-09 19:42:32.0000000', 30),
(20, 1, 1, '2027-03-09 00:00:00.0000000', '2027-04-07 00:00:00.0000000', 650000.00, N'Active', 0, '2026-10-09 19:43:10.0000000', '2026-10-09 19:43:10.0000000', 30),
(21, 1, 1, '2027-04-08 00:00:00.0000000', '2027-05-07 00:00:00.0000000', 650000.00, N'Active', 0, '2026-10-09 19:43:18.0000000', '2026-10-09 19:43:18.0000000', 30),
(22, 1, 1, NULL, NULL, 650000.00, N'Cancelled', 0, '2026-10-10 02:53:42.0000000', '2026-10-10 03:07:19.0000000', 30),
(23, 1, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-10 02:57:20.0000000', '2026-10-10 03:07:18.0000000', 90),
(24, 1, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-10 03:07:29.0000000', '2026-10-10 03:07:44.0000000', 90),
(25, 1, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-10 05:58:54.0000000', '2026-10-10 15:34:40.0000000', 90),
(26, 1, 1, '2026-10-01 00:00:00.0000000', '2027-10-01 00:00:00.0000000', 1900000.00, N'Active', 0, '2026-10-10 17:25:07.0000000', NULL, 365),
(27, 3, 1, '2026-10-01 00:00:00.0000000', '2027-10-01 00:00:00.0000000', 1900000.00, N'Active', 0, '2026-10-10 17:25:07.0000000', NULL, 365),
(28, 4, 1, '2026-10-01 00:00:00.0000000', '2027-10-01 00:00:00.0000000', 1900000.00, N'Active', 0, '2026-10-10 17:25:07.0000000', NULL, 365),
(29, 5, 1, '2026-10-01 00:00:00.0000000', '2027-10-01 00:00:00.0000000', 1900000.00, N'Active', 0, '2026-10-10 17:25:07.0000000', NULL, 365),
(30, 1, 1, '2026-10-01 00:00:00.0000000', '2027-10-01 00:00:00.0000000', 1900000.00, N'Active', 0, '2026-10-10 17:25:07.0000000', NULL, 365),
(31, 1, 1, '2027-05-08 00:00:00.0000000', '2027-06-06 00:00:00.0000000', 700000.00, N'Active', 0, '2026-10-11 05:35:41.0000000', '2026-10-11 05:35:41.0000000', 30),
(32, 1, 1, NULL, NULL, 650000.00, N'Cancelled', 0, '2026-10-11 15:35:01.0000000', '2026-10-11 15:35:36.0000000', 30),
(33, 1, 1, NULL, NULL, 650000.00, N'Cancelled', 0, '2026-10-13 02:43:06.0000000', '2026-10-13 02:43:35.0000000', 30),
(34, 1, 1, NULL, NULL, 650000.00, N'Cancelled', 0, '2026-10-13 06:41:43.0000000', '2026-10-13 07:45:01.0000000', 30),
(35, 1, 1, NULL, NULL, 650000.00, N'Cancelled', 0, '2026-10-13 07:41:57.0000000', '2026-10-13 07:42:26.0000000', 30),
(36, 1, 1, NULL, NULL, 650000.00, N'Cancelled', 0, '2026-10-13 07:42:29.0000000', '2026-10-13 07:42:54.0000000', 30),
(37, 1, 1, NULL, NULL, 650000.00, N'Cancelled', 0, '2026-10-13 07:42:57.0000000', '2026-10-13 07:43:06.0000000', 30),
(38, 1, 1, NULL, NULL, 650000.00, N'Cancelled', 0, '2026-10-13 07:43:09.0000000', '2026-10-13 08:23:08.0000000', 30),
(39, 5, 2, NULL, NULL, 1800000.00, N'PendingPayment', 0, '2026-10-13 07:46:17.0000000', NULL, 90),
(40, 1, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-13 08:03:14.0000000', '2026-10-13 08:12:42.0000000', 90),
(41, 1, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-13 08:12:44.0000000', '2026-10-13 08:16:46.0000000', 90),
(42, 1, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-13 08:16:49.0000000', '2026-10-13 08:18:06.0000000', 90),
(43, 1, 2, '2027-10-02 00:00:00.0000000', '2027-12-30 00:00:00.0000000', 1800000.00, N'Active', 0, '2026-10-13 08:18:28.0000000', '2026-10-13 08:19:07.0000000', 90),
(44, 1, 1, '2027-06-07 00:00:00.0000000', '2027-07-06 00:00:00.0000000', 650000.00, N'Active', 0, '2026-10-13 08:23:08.0000000', '2026-10-13 08:23:08.0000000', 30),
(45, 1, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-13 10:24:05.0000000', '2026-10-13 13:02:02.0000000', 90),
(46, 1, 1, '2027-07-07 00:00:00.0000000', '2027-08-05 00:00:00.0000000', 650000.00, N'Active', 0, '2026-10-14 12:34:02.0000000', '2026-10-14 12:34:02.0000000', 30),
(47, 1, 4, NULL, NULL, 5800000.00, N'Cancelled', 0, '2026-10-14 13:17:50.0000000', '2026-10-14 13:18:26.0000000', 365),
(48, 1, 4, '2027-12-31 00:00:00.0000000', '2028-12-29 00:00:00.0000000', 5800000.00, N'Active', 0, '2026-10-14 13:18:29.0000000', '2026-10-14 13:20:04.0000000', 365),
(49, 1, 1, '2027-08-06 00:00:00.0000000', '2027-09-04 00:00:00.0000000', 650000.00, N'Active', 0, '2026-10-14 14:34:40.0000000', '2026-10-14 14:34:40.0000000', 30),
(50, 3, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-16 09:32:05.0000000', '2026-10-16 09:32:12.0000000', 90),
(51, 3, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-16 09:32:15.0000000', '2026-10-16 09:32:25.0000000', 90),
(52, 3, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-16 09:33:21.0000000', '2026-10-16 09:33:30.0000000', 90),
(53, 3, 2, '2027-10-02 00:00:00.0000000', '2027-12-30 00:00:00.0000000', 1800000.00, N'Active', 0, '2026-10-16 09:34:18.0000000', '2026-10-16 09:34:56.0000000', 90),
(54, 1, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-20 09:12:31.0000000', '2026-10-20 09:13:03.0000000', 90),
(55, 1, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-20 09:13:05.0000000', '2026-10-20 09:13:26.0000000', 90),
(56, 1, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-20 09:13:32.0000000', '2026-10-20 09:13:42.0000000', 90),
(57, 1, 2, NULL, NULL, 1800000.00, N'Cancelled', 0, '2026-10-20 16:59:58.0000000', '2026-10-21 14:21:24.0000000', 90),
(58, 1, 1, '2026-10-21 00:00:00.0000000', '2026-11-19 00:00:00.0000000', 650000.00, N'Active', 0, '2026-10-21 14:13:28.0000000', '2026-10-21 14:13:28.0000000', 30),
(10062, 1, 10007, '2026-08-27 00:00:00.0000000', '2026-10-26 00:00:00.0000000', 1800000.00, N'Expired', 0, '2026-08-27 08:23:04.6395069', '2026-08-27 08:23:04.6395069', 90),
(10063, 1, 10007, '2026-10-26 00:00:00.0000000', '2027-01-24 00:00:00.0000000', 1800000.00, N'Active', 0, '2026-10-26 08:23:04.6395069', '2026-10-26 08:23:04.6395069', 90),
(10064, 3, 10008, '2026-08-27 00:00:00.0000000', '2026-10-26 00:00:00.0000000', 3200000.00, N'Expired', 0, '2026-08-27 08:23:04.6395069', '2026-08-27 08:23:04.6395069', 180),
(10065, 3, 10008, '2026-10-26 00:00:00.0000000', '2027-04-24 00:00:00.0000000', 3200000.00, N'Active', 0, '2026-10-26 08:23:04.6395069', '2026-10-26 08:23:04.6395069', 180),
(10066, 4, 10009, '2026-08-27 00:00:00.0000000', '2026-10-26 00:00:00.0000000', 5800000.00, N'Expired', 0, '2026-08-27 08:23:04.6395069', '2026-08-27 08:23:04.6395069', 365),
(10067, 4, 10009, '2026-10-26 00:00:00.0000000', '2027-10-26 00:00:00.0000000', 5800000.00, N'Active', 0, '2026-10-26 08:23:04.6395069', '2026-10-26 08:23:04.6395069', 365),
(10068, 5, 10006, '2026-08-27 00:00:00.0000000', '2026-09-26 00:00:00.0000000', 650000.00, N'Expired', 0, '2026-08-27 08:23:04.6395069', '2026-08-27 08:23:04.6395069', 30),
(10069, 5, 10006, '2026-10-26 00:00:00.0000000', '2026-11-25 00:00:00.0000000', 650000.00, N'Active', 0, '2026-10-26 08:23:04.6395069', '2026-10-26 08:23:04.6395069', 30),
(10070, 21, 10007, '2026-08-27 00:00:00.0000000', '2026-10-26 00:00:00.0000000', 1800000.00, N'Expired', 0, '2026-08-27 08:23:04.6395069', '2026-08-27 08:23:04.6395069', 90),
(10071, 21, 10007, '2026-10-26 00:00:00.0000000', '2027-01-24 00:00:00.0000000', 1800000.00, N'Active', 0, '2026-10-26 08:23:04.6395069', '2026-10-26 08:23:04.6395069', 90);
SET IDENTITY_INSERT dbo.[member_subscriptions] OFF;
GO

-- Table dbo.[membership_packages] (8 rows)
SET IDENTITY_INSERT dbo.[membership_packages] ON;
INSERT INTO dbo.[membership_packages] ([Id], [center_id], [name], [description], [duration_days], [price], [max_classes], [access_type], [status], [created_at], [updated_at], [allowed_sports], [badge], [features]) VALUES
(1, 15, N'Gói Basic Thể Thao', N'Rèn luyện 1 bộ môn tự chọn, phù hợp cho người mới bắt đầu hoặc lịch tập cố định.', 30, 650000.00, 1, N'1 môn tự chọn', N'Active', '2026-10-09 16:29:02.0000000', '2026-10-23 09:58:30.0000000', 1, NULL, N'[]'),
(2, 15, N'Gói Pro Bứt Phá', N'Lựa chọn 3 bộ môn kết hợp (ví dụ: Gym + Bơi lội + Cầu lông), kèm 1 buổi kiểm tra InBody.', 90, 1800000.00, 3, N'3 môn tự chọn', N'Active', '2026-10-09 16:29:02.0000000', '2026-10-18 06:43:55.0000000', 3, NULL, N'[]'),
(3, 15, N'Gói Elite Chuyên Nghiệp', N'Trải nghiệm thể thao đa năng toàn diện, hỗ trợ đặt sân ưu tiên và quyền vào phòng xông hơi Sauna.', 180, 3200000.00, 6, N'6 môn tự chọn', N'Active', '2026-10-09 16:29:02.0000000', '2026-10-13 10:50:31.0000000', 6, NULL, NULL),
(4, 15, N'Gói All-Access Olympic Pass', N'Toàn quyền sử dụng 15 bộ môn và 9 sân thi đấu đẳng cấp quốc tế 365 ngày.', 365, 5800000.00, 15, N'Toàn quyền 10 môn', N'Active', '2026-10-09 16:29:02.0000000', '2026-10-13 10:50:31.0000000', 10, NULL, NULL),
(10006, 1, N'Gói Basic Thể Thao', N'Khởi động lối sống năng động với 1 bộ môn tiêu chuẩn và đầy đủ tiện nghi cơ bản.', 30, 650000.00, 10, N'1 môn cơ bản', N'Active', '2026-07-10 08:23:04.5810307', NULL, 1, N'Cơ bản', N'["Tập luyện 1 bộ môn cơ bản","Tủ locker tiêu chuẩn","Miễn phí nước uống lọc và tắm nóng lạnh"]'),
(10007, 1, N'Gói Pro Bứt Phá', N'Gói tập phổ biến nhất, tự chọn 3 bộ môn linh hoạt cùng quyền lợi đo InBody định kỳ.', 90, 1800000.00, 30, N'3 môn tự chọn', N'Active', '2026-07-10 08:23:04.6007568', NULL, 3, N'Phổ biến', N'["Tự chọn 3 bộ môn linh hoạt","Đo chỉ số InBody định kỳ hàng tháng","Tủ locker thông minh VIP","Khăn tập kháng khuẩn mỗi buổi"]'),
(10008, 1, N'Gói Elite Chuyên Nghiệp', N'Dành cho người tập luyện chuyên sâu với 6 bộ môn, kèm 2 buổi tư vấn HLV cá nhân và xông hơi Sauna.', 180, 3200000.00, 70, N'6 môn chuyên sâu', N'Active', '2026-07-10 08:23:04.6064768', NULL, 6, N'Chuyên nghiệp', N'["Toàn quyền 6 bộ môn chuyên sâu","2 buổi tư vấn giáo án cùng HLV cá nhân","Phòng xông hơi Sauna & Jacuzzi phục hồi","Ưu tiên đặt chỗ trước giờ cao điểm"]'),
(10009, 1, N'Gói All-Access Olympic Pass', N'Đặc quyền tối thượng toàn hệ thống: không giới hạn 10 môn thể thao Olympic, dịch vụ VIP và đưa đón.', 365, 5800000.00, 150, N'Toàn quyền 10 môn', N'Active', '2026-07-10 08:23:04.6232427', NULL, 10, N'VIP All-Access', N'["Toàn quyền 10 môn thể thao Olympic","Không giới hạn số lượt check-in","Miễn phí dịch vụ khăn, locker & nước ion cao cấp","Mời 1 bạn tập trải nghiệm miễn phí mỗi tháng"]');
SET IDENTITY_INSERT dbo.[membership_packages] OFF;
GO

-- Table dbo.[class_coaches] (18 rows)
INSERT INTO dbo.[class_coaches] ([class_id], [coach_id], [assigned_date], [is_primary]) VALUES
(1, 15, '2026-10-14 00:00:00.0000000', 1),
(2, 14, '2026-10-01 00:00:00.0000000', 1),
(3, 16, '2026-10-01 00:00:00.0000000', 1),
(4, 19, '2026-10-01 00:00:00.0000000', 1),
(5, 17, '2026-10-01 00:00:00.0000000', 1),
(6, 15, '2026-10-14 00:00:00.0000000', 1),
(7, 20, '2026-10-21 00:00:00.0000000', 1),
(8, 15, '2026-10-21 00:00:00.0000000', 1),
(10049, 15, '2026-08-10 00:00:00.0000000', 1),
(10050, 16, '2026-08-10 00:00:00.0000000', 1),
(10051, 17, '2026-08-10 00:00:00.0000000', 1),
(10052, 18, '2026-08-10 00:00:00.0000000', 1),
(10053, 19, '2026-08-10 00:00:00.0000000', 1),
(10054, 20, '2026-08-10 00:00:00.0000000', 1),
(10055, 21, '2026-08-10 00:00:00.0000000', 1),
(10056, 22, '2026-08-10 00:00:00.0000000', 1),
(10057, 23, '2026-08-10 00:00:00.0000000', 1),
(10058, 14, '2026-08-10 00:00:00.0000000', 1);
GO

-- Table dbo.[class_sessions] (164 rows)
SET IDENTITY_INSERT dbo.[class_sessions] ON;
INSERT INTO dbo.[class_sessions] ([Id], [class_id], [schedule_id], [room_id], [coach_id], [session_date], [start_time], [end_time], [session_status], [notes], [created_at]) VALUES
(1, 1, 1, 1, 15, '2026-10-12 00:00:00.0000000', '07:00:00', '08:00:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(2, 1, 1, 1, 15, '2026-10-19 00:00:00.0000000', '07:00:00', '08:00:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(3, 1, 1, 1, 15, '2026-10-26 00:00:00.0000000', '07:00:00', '08:00:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(4, 1, 2, 1, 15, '2026-10-14 00:00:00.0000000', '07:00:00', '08:00:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(5, 1, 2, 1, 15, '2026-10-21 00:00:00.0000000', '07:00:00', '08:00:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(6, 1, 2, 1, 15, '2026-10-28 00:00:00.0000000', '07:00:00', '08:00:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(7, 1, 3, 1, 15, '2026-10-16 00:00:00.0000000', '07:00:00', '08:00:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(8, 1, 3, 1, 15, '2026-10-23 00:00:00.0000000', '07:00:00', '08:00:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(9, 1, 3, 1, 15, '2026-10-30 00:00:00.0000000', '07:00:00', '08:00:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(10, 2, 4, 2, 14, '2026-10-12 00:00:00.0000000', '18:00:00', '19:15:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(11, 2, 4, 2, 14, '2026-10-19 00:00:00.0000000', '18:00:00', '19:15:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(12, 2, 4, 2, 14, '2026-10-26 00:00:00.0000000', '18:00:00', '19:15:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(13, 2, 5, 2, 14, '2026-10-14 00:00:00.0000000', '18:00:00', '19:15:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(14, 2, 5, 2, 14, '2026-10-21 00:00:00.0000000', '18:00:00', '19:15:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(15, 2, 5, 2, 14, '2026-10-28 00:00:00.0000000', '18:00:00', '19:15:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(16, 3, 6, 3, 16, '2026-10-13 00:00:00.0000000', '08:30:00', '09:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(17, 3, 6, 3, 16, '2026-10-20 00:00:00.0000000', '08:30:00', '09:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(18, 3, 6, 3, 16, '2026-10-27 00:00:00.0000000', '08:30:00', '09:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(19, 3, 7, 3, 16, '2026-10-15 00:00:00.0000000', '08:30:00', '09:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(20, 3, 7, 3, 16, '2026-10-22 00:00:00.0000000', '08:30:00', '09:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(21, 3, 7, 3, 16, '2026-10-29 00:00:00.0000000', '08:30:00', '09:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(22, 4, 8, 4, 19, '2026-10-13 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(23, 4, 8, 4, 19, '2026-10-20 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(24, 4, 8, 4, 19, '2026-10-27 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(25, 5, 9, 5, 17, '2026-10-12 00:00:00.0000000', '19:30:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(26, 5, 9, 5, 17, '2026-10-19 00:00:00.0000000', '19:30:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(27, 5, 9, 5, 17, '2026-10-26 00:00:00.0000000', '19:30:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:25:08.0000000'),
(28, 5, 11, 5, 17, '2026-10-14 00:00:00.0000000', '19:30:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:51:24.0000000'),
(29, 4, 10, 4, 19, '2026-10-15 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:51:24.0000000'),
(30, 5, 11, 5, 17, '2026-10-21 00:00:00.0000000', '19:30:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:51:24.0000000'),
(31, 4, 10, 4, 19, '2026-10-22 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:51:24.0000000'),
(32, 5, 11, 5, 17, '2026-10-28 00:00:00.0000000', '19:30:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:51:24.0000000'),
(33, 4, 10, 4, 19, '2026-10-29 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-10 17:51:24.0000000'),
(34, 1, 1, 1, 15, '2026-11-02 00:00:00.0000000', '07:00:00', '08:00:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-12 03:06:45.0000000'),
(35, 2, 4, 2, 14, '2026-11-02 00:00:00.0000000', '18:00:00', '19:15:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-12 03:06:45.0000000'),
(36, 5, 9, 5, 17, '2026-11-02 00:00:00.0000000', '19:30:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-12 03:06:45.0000000'),
(37, 3, 6, 3, 16, '2026-11-03 00:00:00.0000000', '08:30:00', '09:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-13 02:38:58.0000000'),
(38, 4, 8, 4, 19, '2026-11-03 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ', '2026-10-13 02:38:58.0000000'),
(39, 6, 12, 1, 15, '2026-10-19 00:00:00.0000000', '08:30:00', '09:00:00', N'Scheduled', NULL, '2026-10-14 13:27:00.0000000'),
(40, 6, 12, 1, 15, '2026-10-26 00:00:00.0000000', '08:30:00', '09:00:00', N'Scheduled', NULL, '2026-10-14 13:27:00.0000000'),
(41, 6, 12, 1, 15, '2026-11-02 00:00:00.0000000', '08:30:00', '09:00:00', N'Scheduled', NULL, '2026-10-14 13:27:00.0000000'),
(42, 6, 12, 1, 15, '2026-11-09 00:00:00.0000000', '08:30:00', '09:00:00', N'Scheduled', NULL, '2026-10-14 13:27:00.0000000'),
(43, 6, 12, 1, 15, '2026-11-16 00:00:00.0000000', '08:30:00', '09:00:00', N'Scheduled', NULL, '2026-10-14 13:27:00.0000000'),
(44, 6, 12, 1, 15, '2026-11-23 00:00:00.0000000', '08:30:00', '09:00:00', N'Scheduled', NULL, '2026-10-14 13:27:00.0000000'),
(45, 6, 12, 1, 15, '2026-11-30 00:00:00.0000000', '08:30:00', '09:00:00', N'Scheduled', NULL, '2026-10-14 13:27:00.0000000'),
(46, 6, 12, 1, 15, '2026-12-07 00:00:00.0000000', '08:30:00', '09:00:00', N'Scheduled', NULL, '2026-10-14 13:27:00.0000000'),
(47, 6, 12, 1, 15, '2026-12-14 00:00:00.0000000', '08:30:00', '09:00:00', N'Scheduled', NULL, '2026-10-14 13:27:00.0000000'),
(48, 6, 12, 1, 15, '2026-12-21 00:00:00.0000000', '08:30:00', '09:00:00', N'Scheduled', NULL, '2026-10-14 13:27:00.0000000'),
(49, 6, 12, 1, 15, '2026-12-28 00:00:00.0000000', '08:30:00', '09:00:00', N'Scheduled', NULL, '2026-10-14 13:27:00.0000000'),
(50, 6, 12, 1, 15, '2027-01-04 00:00:00.0000000', '08:30:00', '09:00:00', N'Scheduled', NULL, '2026-10-14 13:27:00.0000000'),
(51, 6, 12, 1, 15, '2027-01-11 00:00:00.0000000', '08:30:00', '09:00:00', N'Scheduled', NULL, '2026-10-14 13:27:00.0000000'),
(52, 8, 14, 1, 15, '2026-10-21 00:00:00.0000000', '22:00:00', '23:30:00', N'Cancelled', NULL, '2026-10-21 14:39:09.0000000'),
(53, 8, 14, 1, 15, '2026-10-28 00:00:00.0000000', '22:00:00', '23:30:00', N'Cancelled', NULL, '2026-10-21 14:39:09.0000000'),
(54, 8, 14, 1, 15, '2026-11-04 00:00:00.0000000', '22:00:00', '23:30:00', N'Cancelled', NULL, '2026-10-21 14:39:09.0000000'),
(55, 8, 14, 1, 15, '2026-11-11 00:00:00.0000000', '22:00:00', '23:30:00', N'Cancelled', NULL, '2026-10-21 14:39:09.0000000'),
(56, 8, 14, 1, 15, '2026-11-18 00:00:00.0000000', '22:00:00', '23:30:00', N'Cancelled', NULL, '2026-10-21 14:39:09.0000000'),
(57, 8, 14, 1, 15, '2026-11-25 00:00:00.0000000', '22:00:00', '23:30:00', N'Cancelled', NULL, '2026-10-21 14:39:09.0000000'),
(58, 8, 14, 1, 15, '2026-12-02 00:00:00.0000000', '22:00:00', '23:30:00', N'Cancelled', NULL, '2026-10-21 14:39:09.0000000'),
(59, 8, 14, 1, 15, '2026-12-09 00:00:00.0000000', '22:00:00', '23:30:00', N'Cancelled', NULL, '2026-10-21 14:39:09.0000000'),
(60, 8, 14, 1, 15, '2026-12-16 00:00:00.0000000', '22:00:00', '23:30:00', N'Cancelled', NULL, '2026-10-21 14:39:09.0000000'),
(61, 8, 14, 1, 15, '2026-12-23 00:00:00.0000000', '22:00:00', '23:30:00', N'Cancelled', NULL, '2026-10-21 14:39:09.0000000'),
(62, 8, 14, 1, 15, '2026-12-30 00:00:00.0000000', '22:00:00', '23:30:00', N'Cancelled', NULL, '2026-10-21 14:39:09.0000000'),
(63, 8, 14, 1, 15, '2027-01-06 00:00:00.0000000', '22:00:00', '23:30:00', N'Cancelled', NULL, '2026-10-21 14:39:09.0000000'),
(64, 8, 14, 1, 15, '2027-01-13 00:00:00.0000000', '22:00:00', '23:30:00', N'Cancelled', NULL, '2026-10-21 14:39:09.0000000'),
(65, 8, 14, 1, 15, '2026-10-22 00:00:00.0000000', '00:00:00', '01:00:00', N'Scheduled', NULL, '2026-10-21 14:42:29.0000000'),
(66, 8, 14, 1, 15, '2026-10-29 00:00:00.0000000', '00:00:00', '01:00:00', N'Scheduled', NULL, '2026-10-21 14:42:29.0000000'),
(67, 8, 14, 1, 15, '2026-11-05 00:00:00.0000000', '00:00:00', '01:00:00', N'Scheduled', NULL, '2026-10-21 14:42:29.0000000'),
(68, 8, 14, 1, 15, '2026-11-12 00:00:00.0000000', '00:00:00', '01:00:00', N'Scheduled', NULL, '2026-10-21 14:42:29.0000000'),
(69, 8, 14, 1, 15, '2026-11-19 00:00:00.0000000', '00:00:00', '01:00:00', N'Scheduled', NULL, '2026-10-21 14:42:29.0000000'),
(70, 8, 14, 1, 15, '2026-11-26 00:00:00.0000000', '00:00:00', '01:00:00', N'Scheduled', NULL, '2026-10-21 14:42:29.0000000'),
(71, 8, 14, 1, 15, '2026-12-03 00:00:00.0000000', '00:00:00', '01:00:00', N'Scheduled', NULL, '2026-10-21 14:42:29.0000000'),
(72, 8, 14, 1, 15, '2026-12-10 00:00:00.0000000', '00:00:00', '01:00:00', N'Scheduled', NULL, '2026-10-21 14:42:29.0000000'),
(73, 8, 14, 1, 15, '2026-12-17 00:00:00.0000000', '00:00:00', '01:00:00', N'Scheduled', NULL, '2026-10-21 14:42:29.0000000'),
(74, 8, 14, 1, 15, '2026-12-24 00:00:00.0000000', '00:00:00', '01:00:00', N'Scheduled', NULL, '2026-10-21 14:42:29.0000000'),
(75, 8, 14, 1, 15, '2026-12-31 00:00:00.0000000', '00:00:00', '01:00:00', N'Scheduled', NULL, '2026-10-21 14:42:29.0000000'),
(76, 8, 14, 1, 15, '2027-01-07 00:00:00.0000000', '00:00:00', '01:00:00', N'Scheduled', NULL, '2026-10-21 14:42:29.0000000'),
(77, 8, 14, 1, 15, '2027-01-14 00:00:00.0000000', '00:00:00', '01:00:00', N'Scheduled', NULL, '2026-10-21 14:42:29.0000000'),
(78, 8, 14, 1, 15, '2027-01-21 00:00:00.0000000', '00:00:00', '01:00:00', N'Scheduled', NULL, '2026-10-21 14:42:29.0000000'),
(10105, 10049, 10047, NULL, 15, '2026-10-13 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10106, 10049, 10047, NULL, 15, '2026-10-20 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10107, 10049, 10047, NULL, 15, '2026-10-27 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10108, 10049, 10047, NULL, 15, '2026-11-03 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10109, 10049, 10047, NULL, 15, '2026-11-10 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10110, 10049, 10047, NULL, 15, '2026-11-17 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10111, 10049, 10047, NULL, 15, '2026-11-24 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10112, 10049, 10047, NULL, 15, '2026-12-01 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10113, 10049, 10047, NULL, 15, '2026-12-08 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10114, 10050, 10048, NULL, 16, '2026-10-14 00:00:00.0000000', '17:30:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10115, 10050, 10048, NULL, 16, '2026-10-21 00:00:00.0000000', '17:30:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10116, 10050, 10048, NULL, 16, '2026-10-28 00:00:00.0000000', '17:30:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10117, 10050, 10048, NULL, 16, '2026-11-04 00:00:00.0000000', '17:30:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10118, 10050, 10048, NULL, 16, '2026-11-11 00:00:00.0000000', '17:30:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10119, 10050, 10048, NULL, 16, '2026-11-18 00:00:00.0000000', '17:30:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10120, 10050, 10048, NULL, 16, '2026-11-25 00:00:00.0000000', '17:30:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10121, 10050, 10048, NULL, 16, '2026-12-02 00:00:00.0000000', '17:30:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10122, 10050, 10048, NULL, 16, '2026-12-09 00:00:00.0000000', '17:30:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10123, 10051, 10049, NULL, 17, '2026-10-15 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10124, 10051, 10049, NULL, 17, '2026-10-22 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10125, 10051, 10049, NULL, 17, '2026-10-29 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10126, 10051, 10049, NULL, 17, '2026-11-05 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069');
INSERT INTO dbo.[class_sessions] ([Id], [class_id], [schedule_id], [room_id], [coach_id], [session_date], [start_time], [end_time], [session_status], [notes], [created_at]) VALUES
(10127, 10051, 10049, NULL, 17, '2026-11-12 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10128, 10051, 10049, NULL, 17, '2026-11-19 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10129, 10051, 10049, NULL, 17, '2026-11-26 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10130, 10051, 10049, NULL, 17, '2026-12-03 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10131, 10051, 10049, NULL, 17, '2026-12-10 00:00:00.0000000', '18:00:00', '19:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10132, 10052, 10050, NULL, 18, '2026-10-16 00:00:00.0000000', '19:00:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10133, 10052, 10050, NULL, 18, '2026-10-23 00:00:00.0000000', '19:00:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10134, 10052, 10050, NULL, 18, '2026-10-30 00:00:00.0000000', '19:00:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10135, 10052, 10050, NULL, 18, '2026-11-06 00:00:00.0000000', '19:00:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10136, 10052, 10050, NULL, 18, '2026-11-13 00:00:00.0000000', '19:00:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10137, 10052, 10050, NULL, 18, '2026-11-20 00:00:00.0000000', '19:00:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10138, 10052, 10050, NULL, 18, '2026-11-27 00:00:00.0000000', '19:00:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10139, 10052, 10050, NULL, 18, '2026-12-04 00:00:00.0000000', '19:00:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10140, 10053, 10051, NULL, 19, '2026-10-17 00:00:00.0000000', '15:00:00', '16:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10141, 10053, 10051, NULL, 19, '2026-10-24 00:00:00.0000000', '15:00:00', '16:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10142, 10053, 10051, NULL, 19, '2026-10-31 00:00:00.0000000', '15:00:00', '16:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10143, 10053, 10051, NULL, 19, '2026-11-07 00:00:00.0000000', '15:00:00', '16:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10144, 10053, 10051, NULL, 19, '2026-11-14 00:00:00.0000000', '15:00:00', '16:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10145, 10053, 10051, NULL, 19, '2026-11-21 00:00:00.0000000', '15:00:00', '16:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10146, 10053, 10051, NULL, 19, '2026-11-28 00:00:00.0000000', '15:00:00', '16:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10147, 10053, 10051, NULL, 19, '2026-12-05 00:00:00.0000000', '15:00:00', '16:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10148, 10054, 10052, NULL, 20, '2026-10-13 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10149, 10054, 10052, NULL, 20, '2026-10-20 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10150, 10054, 10052, NULL, 20, '2026-10-27 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10151, 10054, 10052, NULL, 20, '2026-11-03 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10152, 10054, 10052, NULL, 20, '2026-11-10 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10153, 10054, 10052, NULL, 20, '2026-11-17 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10154, 10054, 10052, NULL, 20, '2026-11-24 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10155, 10054, 10052, NULL, 20, '2026-12-01 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10156, 10054, 10052, NULL, 20, '2026-12-08 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10157, 10055, 10053, NULL, 21, '2026-10-14 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10158, 10055, 10053, NULL, 21, '2026-10-21 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10159, 10055, 10053, NULL, 21, '2026-10-28 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10160, 10055, 10053, NULL, 21, '2026-11-04 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10161, 10055, 10053, NULL, 21, '2026-11-11 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10162, 10055, 10053, NULL, 21, '2026-11-18 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10163, 10055, 10053, NULL, 21, '2026-11-25 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10164, 10055, 10053, NULL, 21, '2026-12-02 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10165, 10055, 10053, NULL, 21, '2026-12-09 00:00:00.0000000', '19:00:00', '20:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10166, 10056, 10054, NULL, 22, '2026-10-15 00:00:00.0000000', '18:30:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10167, 10056, 10054, NULL, 22, '2026-10-22 00:00:00.0000000', '18:30:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10168, 10056, 10054, NULL, 22, '2026-10-29 00:00:00.0000000', '18:30:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10169, 10056, 10054, NULL, 22, '2026-11-05 00:00:00.0000000', '18:30:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10170, 10056, 10054, NULL, 22, '2026-11-12 00:00:00.0000000', '18:30:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10171, 10056, 10054, NULL, 22, '2026-11-19 00:00:00.0000000', '18:30:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10172, 10056, 10054, NULL, 22, '2026-11-26 00:00:00.0000000', '18:30:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10173, 10056, 10054, NULL, 22, '2026-12-03 00:00:00.0000000', '18:30:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10174, 10056, 10054, NULL, 22, '2026-12-10 00:00:00.0000000', '18:30:00', '20:00:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10175, 10057, 10055, NULL, 23, '2026-10-16 00:00:00.0000000', '18:00:00', '19:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10176, 10057, 10055, NULL, 23, '2026-10-23 00:00:00.0000000', '18:00:00', '19:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10177, 10057, 10055, NULL, 23, '2026-10-30 00:00:00.0000000', '18:00:00', '19:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10178, 10057, 10055, NULL, 23, '2026-11-06 00:00:00.0000000', '18:00:00', '19:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10179, 10057, 10055, NULL, 23, '2026-11-13 00:00:00.0000000', '18:00:00', '19:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10180, 10057, 10055, NULL, 23, '2026-11-20 00:00:00.0000000', '18:00:00', '19:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10181, 10057, 10055, NULL, 23, '2026-11-27 00:00:00.0000000', '18:00:00', '19:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10182, 10057, 10055, NULL, 23, '2026-12-04 00:00:00.0000000', '18:00:00', '19:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10183, 10058, 10056, NULL, 14, '2026-10-17 00:00:00.0000000', '17:00:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10184, 10058, 10056, NULL, 14, '2026-10-24 00:00:00.0000000', '17:00:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10185, 10058, 10056, NULL, 14, '2026-10-31 00:00:00.0000000', '17:00:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10186, 10058, 10056, NULL, 14, '2026-11-07 00:00:00.0000000', '17:00:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10187, 10058, 10056, NULL, 14, '2026-11-14 00:00:00.0000000', '17:00:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10188, 10058, 10056, NULL, 14, '2026-11-21 00:00:00.0000000', '17:00:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10189, 10058, 10056, NULL, 14, '2026-11-28 00:00:00.0000000', '17:00:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069'),
(10190, 10058, 10056, NULL, 14, '2026-12-05 00:00:00.0000000', '17:00:00', '18:30:00', N'Scheduled', N'Buổi học định kỳ theo giáo trình chuẩn', '2026-09-10 08:23:04.6395069');
SET IDENTITY_INSERT dbo.[class_sessions] OFF;
GO

-- Table dbo.[class_schedules] (24 rows)
SET IDENTITY_INSERT dbo.[class_schedules] ON;
INSERT INTO dbo.[class_schedules] ([Id], [class_id], [room_id], [day_of_week], [start_time], [end_time], [start_date], [end_date], [status]) VALUES
(1, 1, 1, 1, '07:00:00', '08:00:00', '2026-10-01 00:00:00.0000000', '2026-12-31 00:00:00.0000000', N'Active'),
(2, 1, 1, 3, '07:00:00', '08:00:00', '2026-10-01 00:00:00.0000000', '2026-12-31 00:00:00.0000000', N'Active'),
(3, 1, 1, 5, '07:00:00', '08:00:00', '2026-10-01 00:00:00.0000000', '2026-12-31 00:00:00.0000000', N'Active'),
(4, 2, 2, 1, '18:00:00', '19:15:00', '2026-10-01 00:00:00.0000000', '2026-12-31 00:00:00.0000000', N'Active'),
(5, 2, 2, 3, '18:00:00', '19:15:00', '2026-10-01 00:00:00.0000000', '2026-12-31 00:00:00.0000000', N'Active'),
(6, 3, 3, 2, '08:30:00', '09:30:00', '2026-10-01 00:00:00.0000000', '2026-12-31 00:00:00.0000000', N'Active'),
(7, 3, 3, 4, '08:30:00', '09:30:00', '2026-10-01 00:00:00.0000000', '2026-12-31 00:00:00.0000000', N'Active'),
(8, 4, 4, 2, '19:00:00', '20:30:00', '2026-10-01 00:00:00.0000000', '2026-12-31 00:00:00.0000000', N'Active'),
(9, 5, 5, 1, '19:30:00', '20:30:00', '2026-10-01 00:00:00.0000000', '2026-12-31 00:00:00.0000000', N'Active'),
(10, 4, 4, 4, '19:00:00', '20:30:00', '2026-09-30 00:00:00.0000000', '2027-01-08 00:00:00.0000000', N'Active'),
(11, 5, 5, 3, '19:30:00', '20:30:00', '2026-09-30 00:00:00.0000000', '2027-01-08 00:00:00.0000000', N'Active'),
(12, 6, 1, 1, '08:30:00', '09:00:00', '2026-10-14 00:00:00.0000000', '2027-01-12 00:00:00.0000000', N'Active'),
(13, 7, 6, 6, '08:00:00', '09:00:00', '2026-10-21 00:00:00.0000000', '2027-01-21 00:00:00.0000000', N'Active'),
(14, 8, 1, 4, '00:00:00', '01:00:00', '2026-10-22 00:00:00.0000000', '2027-01-22 00:00:00.0000000', N'Active'),
(10047, 10049, NULL, 2, '18:00:00', '19:00:00', '2026-09-10 00:00:00.0000000', '2027-03-10 00:00:00.0000000', N'Active'),
(10048, 10050, NULL, 3, '17:30:00', '18:30:00', '2026-09-10 00:00:00.0000000', '2027-03-10 00:00:00.0000000', N'Active'),
(10049, 10051, NULL, 4, '18:00:00', '19:00:00', '2026-09-10 00:00:00.0000000', '2027-03-10 00:00:00.0000000', N'Active'),
(10050, 10052, NULL, 5, '19:00:00', '20:00:00', '2026-09-10 00:00:00.0000000', '2027-03-10 00:00:00.0000000', N'Active'),
(10051, 10053, NULL, 6, '15:00:00', '16:30:00', '2026-09-10 00:00:00.0000000', '2027-03-10 00:00:00.0000000', N'Active'),
(10052, 10054, NULL, 2, '19:00:00', '20:30:00', '2026-09-10 00:00:00.0000000', '2027-03-10 00:00:00.0000000', N'Active'),
(10053, 10055, NULL, 3, '19:00:00', '20:30:00', '2026-09-10 00:00:00.0000000', '2027-03-10 00:00:00.0000000', N'Active'),
(10054, 10056, NULL, 4, '18:30:00', '20:00:00', '2026-09-10 00:00:00.0000000', '2027-03-10 00:00:00.0000000', N'Active'),
(10055, 10057, NULL, 5, '18:00:00', '19:30:00', '2026-09-10 00:00:00.0000000', '2027-03-10 00:00:00.0000000', N'Active'),
(10056, 10058, NULL, 6, '17:00:00', '18:30:00', '2026-09-10 00:00:00.0000000', '2027-03-10 00:00:00.0000000', N'Active');
SET IDENTITY_INSERT dbo.[class_schedules] OFF;
GO

-- Table dbo.[classes] (18 rows)
SET IDENTITY_INSERT dbo.[classes] ON;
INSERT INTO dbo.[classes] ([Id], [center_id], [sport_id], [room_id], [name], [description], [level], [capacity], [duration_minutes], [status], [created_at], [updated_at], [allow_waitlist]) VALUES
(1, 15, 1, 1, N'Bơi sải Kỹ thuật Olympic K01', N'Khóa huấn luyện kỹ thuật bơi sải tiêu chuẩn thi đấu, tối ưu sải tay và lực đạp chân', N'Intermediate', 15, 60, N'Published', '2026-10-10 17:25:07.0000000', NULL, 1),
(2, 15, 2, 2, N'Gym Tăng cơ Tối đa (Hypertrophy)', N'Chương trình huấn luyện tăng kích thước cơ nạc, tối ưu chuyển động đòn bẩy và dinh dưỡng', N'All Levels', 20, 75, N'Published', '2026-10-10 17:25:07.0000000', NULL, 1),
(3, 15, 3, 3, N'Yoga Phục hồi & Trị liệu Cột sống', N'Các bài tập kéo giãn chuyên sâu giúp giải tỏa áp lực đốt sống cổ và thắt lưng', N'Beginner', 15, 60, N'Published', '2026-10-10 17:25:07.0000000', NULL, 1),
(4, 15, 4, 4, N'Cầu lông Nâng cao Tấn công & Di chuyển', N'Rèn luyện bộ chân di chuyển 6 góc sân, hoàn thiện kỹ thuật đập cầu cắm và gài lưới', N'Advanced', 12, 90, N'Published', '2026-10-10 17:25:07.0000000', NULL, 1),
(5, 15, 5, 5, N'Boxing & Kickfit Đốt mỡ Cường độ cao', N'Huấn luyện tổ hợp đòn đấm 1-2-3 kết hợp footwork né đòn, đốt cháy 600-800 calo/buổi', N'Intermediate', 16, 60, N'Published', '2026-10-10 17:25:07.0000000', NULL, 1),
(6, 15, 1, 1, N'Bơi sải Kỹ thuật Olympic K01', NULL, N'Trung cấp', 1, 65, N'Published', '2026-10-14 13:25:45.0000000', '2026-10-14 13:27:45.0000000', 1),
(7, 15, 6, 6, N'Golf Nhập Môn & Kỹ Thuật Swing TrackMan', N'Khóa đào tạo Golf chuẩn quốc tế từ tư thế cầm gậy (grip), nhịp swing đến phân tích thông số đường bóng trên máy TrackMan 4K.', N'All Levels', 12, 60, N'Published', '2026-10-20 17:24:31.0000000', NULL, 1),
(8, 15, 1, NULL, N'bơi cơ bản', NULL, N'Cơ bản', 20, 60, N'Published', '2026-10-21 14:37:11.0000000', '2026-10-21 14:39:43.0000000', 1),
(10049, 1, 2, NULL, N'Powerlifting & Hypertrophy Foundation', N'Chương trình đào tạo bộ môn Gym & Fitness chuẩn quốc tế tại trung tâm, nâng cao thể lực và phản xạ thi đấu.', N'Intermediate', 20, 60, N'Published', '2026-08-10 08:23:04.6395069', NULL, 1),
(10050, 1, 3, NULL, N'Hatha Yoga & Trị Liệu Cột Sống', N'Chương trình đào tạo bộ môn Yoga & Pilates chuẩn quốc tế tại trung tâm, nâng cao thể lực và phản xạ thi đấu.', N'All Levels', 20, 60, N'Published', '2026-08-10 08:23:04.6395069', NULL, 1),
(10051, 1, 1, NULL, N'Kỹ thuật Bơi Sải & Sức bền Olympic', N'Chương trình đào tạo bộ môn Bơi lội chuẩn quốc tế tại trung tâm, nâng cao thể lực và phản xạ thi đấu.', N'Beginner', 20, 60, N'Published', '2026-08-10 08:23:04.6395069', NULL, 1),
(10052, 1, 5, NULL, N'Boxing Kháng Lực & Tự Vệ Thực Chiến', N'Chương trình đào tạo bộ môn Boxing & Võ thuật chuẩn quốc tế tại trung tâm, nâng cao thể lực và phản xạ thi đấu.', N'Intermediate', 20, 60, N'Published', '2026-08-10 08:23:04.6395069', NULL, 1),
(10053, 1, 6, NULL, N'Golf Simulator & Kỹ Thuật Swing Chuẩn PGA', N'Chương trình đào tạo bộ môn Golf chuẩn quốc tế tại trung tâm, nâng cao thể lực và phản xạ thi đấu.', N'Intermediate', 20, 90, N'Published', '2026-08-10 08:23:04.6395069', NULL, 1),
(10054, 1, 4, NULL, N'Cầu Lông Chiến Thuật & Footwork Nâng Cao', N'Chương trình đào tạo bộ môn Cầu lông chuẩn quốc tế tại trung tâm, nâng cao thể lực và phản xạ thi đấu.', N'All Levels', 20, 90, N'Published', '2026-08-10 08:23:04.6395069', NULL, 1),
(10055, 1, 10011, NULL, N'Futsal Kỹ Thuật Chạm Bóng & Di Chuyển Không Bóng', N'Chương trình đào tạo bộ môn Bóng đá chuẩn quốc tế tại trung tâm, nâng cao thể lực và phản xạ thi đấu.', N'Beginner', 20, 90, N'Published', '2026-08-10 08:23:04.6395069', NULL, 1),
(10056, 1, 10012, NULL, N'Bóng Rổ Căn Bản & Ném Rổ Tầm Xa', N'Chương trình đào tạo bộ môn Bóng rổ chuẩn quốc tế tại trung tâm, nâng cao thể lực và phản xạ thi đấu.', N'All Levels', 20, 90, N'Published', '2026-08-10 08:23:04.6395069', NULL, 1),
(10057, 1, 10013, NULL, N'Bóng Bàn Giao Cầu Xoáy & Đỡ Bóng Cắt', N'Chương trình đào tạo bộ môn Bóng bàn chuẩn quốc tế tại trung tâm, nâng cao thể lực và phản xạ thi đấu.', N'All Levels', 20, 90, N'Published', '2026-08-10 08:23:04.6395069', NULL, 1),
(10058, 1, 10014, NULL, N'Pickleball Dinking & Phản Xạ Lưới Đỉnh Cao', N'Chương trình đào tạo bộ môn Pickleball chuẩn quốc tế tại trung tâm, nâng cao thể lực và phản xạ thi đấu.', N'Beginner', 20, 90, N'Published', '2026-08-10 08:23:04.6395069', NULL, 1);
SET IDENTITY_INSERT dbo.[classes] OFF;
GO

-- Table dbo.[coach_sports] (26 rows)
INSERT INTO dbo.[coach_sports] ([coach_id], [sport_id]) VALUES
(15, 1),
(16, 1),
(19, 1),
(14, 2),
(17, 2),
(20, 2),
(21, 2),
(22, 2),
(16, 3),
(18, 3),
(22, 3),
(23, 3),
(15, 4),
(19, 4),
(21, 4),
(14, 5),
(17, 5),
(23, 5),
(14, 6),
(15, 6),
(18, 6),
(20, 6),
(16, 10011),
(17, 10012),
(18, 10013),
(18, 10014);
GO

-- Table dbo.[rooms] (10 rows)
SET IDENTITY_INSERT dbo.[rooms] ON;
INSERT INTO dbo.[rooms] ([Id], [center_id], [name], [room_type], [capacity], [location_description], [status], [created_at]) VALUES
(1, 15, N'Bể bơi Olympic 50m', N'Swimming Pool', 30, N'Tầng 1 - Khu liên hợp dưới nước', N'Active', '2026-10-10 17:25:07.0000000'),
(2, 15, N'Phòng Gym High-Performance', N'Gym', 40, N'Tầng 2 - Khu tập tạ chuyên sâu', N'Active', '2026-10-10 17:25:07.0000000'),
(3, 15, N'Phòng Yoga & Pilates Reformer', N'Studio', 20, N'Tầng 3 - Phòng Studio yên tĩnh', N'Active', '2026-10-10 17:25:07.0000000'),
(4, 15, N'Sân Cầu lông Tiêu chuẩn #1', N'Badminton Court', 16, N'Tầng 4 - Sân thảm Yonex chuyên dụng', N'Active', '2026-10-10 17:25:07.0000000'),
(5, 15, N'Võ đài Boxing & Kickfit', N'Combat Ring', 20, N'Tầng 2 - Khu võ thuật đối kháng', N'Active', '2026-10-10 17:25:07.0000000'),
(6, 15, N'Tổ Hợp Sân Tập Golf & 3D Simulator', N'Golf Complex', 30, N'Khu Ngoài Trời & Khu C • Tầng 2', N'Active', '2026-10-20 05:42:09.0000000'),
(10011, 15, N'Sân Bóng Đá Cỏ Nhân Tạo (Sân 5)', N'Outdoor Field', 14, N'Khu Ngoài Trời', N'Active', '2026-11-10 08:23:04.2808121'),
(10012, 15, N'Sân Bóng Rổ Tiêu Chuẩn Phong Trào', N'Basketball Court', 25, N'Khu B • Tầng 1', N'Active', '2026-11-10 08:23:04.2979837'),
(10013, 15, N'Khu Bóng Bàn Trong Nhà', N'Table Tennis Area', 20, N'Khu B • Tầng 3', N'Active', '2026-11-10 08:23:04.3122540'),
(10014, 15, N'Cụm Sân Pickleball Ngoài Trời', N'Pickleball Complex', 20, N'Khu Ngoài Trời', N'Active', '2026-11-10 08:23:04.3227766');
SET IDENTITY_INSERT dbo.[rooms] OFF;
GO

-- Table dbo.[sports] (10 rows)
SET IDENTITY_INSERT dbo.[sports] ON;
INSERT INTO dbo.[sports] ([Id], [name], [description], [status], [center_id]) VALUES
(1, N'Bơi lội', N'Bơi lội thể thao, cải thiện thể lực và sức bền toàn diện', N'Active', 15),
(2, N'Gym & Fitness', N'Rèn luyện thể hình, tăng cơ giảm mỡ và tăng cường sức mạnh', N'Active', 15),
(3, N'Yoga & Pilates', N'Phục hồi chức năng, tăng độ dẻo dai và tĩnh tâm', N'Active', 15),
(4, N'Cầu lông', N'Tập luyện phản xạ nhanh, di chuyển linh hoạt và đối kháng', N'Active', 15),
(5, N'Boxing & Võ thuật', N'Đốt cháy calo, rèn luyện kỹ năng tự vệ và phản xạ chiến đấu', N'Active', 15),
(6, N'Golf', N'Học viện đào tạo Golf chuẩn quốc tế, driving range 18 làn và phòng mô phỏng 3D TrackMan 4K', N'Active', 15),
(10011, N'Bóng đá', N'Sân cỏ nhân tạo 5 người tiêu chuẩn, mặt cỏ êm ái chống chấn thương, hệ thống thoát nước và dàn đèn LED cao áp ban đêm.', N'Active', 15),
(10012, N'Bóng rổ', N'Sân bóng rổ tiêu chuẩn thi đấu phong trào, mặt sân sơn acrylic chống trượt, trụ rổ kính cường lực độ nảy tốt và mái che mát.', N'Active', 15),
(10013, N'Bóng bàn', N'Khu bóng bàn trong nhà trang bị bàn thi đấu đạt chuẩn quốc tế, ánh sáng đều chống lóa và không gian di chuyển an toàn.', N'Active', 15),
(10014, N'Pickleball', N'Cụm sân Pickleball ngoài trời hiện đại, mặt sân acrylic chuyên dụng, vạch bếp chuẩn thi đấu và rào chắn bóng kiên cố.', N'Active', 15);
SET IDENTITY_INSERT dbo.[sports] OFF;
GO

-- Table dbo.[coach_profiles] (10 rows)
SET IDENTITY_INSERT dbo.[coach_profiles] ON;
INSERT INTO dbo.[coach_profiles] ([Id], [user_id], [center_id], [coach_code], [full_name], [specialization], [certification], [experience_years], [bio], [hire_date], [status], [created_at], [updated_at]) VALUES
(14, 62, 15, N'COC001_62', N'Nguyễn Quốc Cường', N'Gym & Fitness, Tăng cơ giảm mỡ & Thể hình chuyên nghiệp', N'Chứng chỉ HLV Thể hình Quốc tế IFBB Pro & NASM-CPT', 10, N'Cựu vận động viên thể hình quốc gia với hơn 10 năm kinh nghiệm thi đấu và huấn luyện. Chuyên gia xây dựng lộ trình tăng cơ, giảm mỡ khoa học và điều chỉnh tư thế chuẩn cơ sinh học.', '2022-03-01 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(15, 63, 15, N'COC002_63', N'Trần Hải Đăng', N'Bơi lội, Kỹ thuật đường bơi tốc độ Olympic & An toàn mặt nước', N'Bằng HLV Bơi lội Cấp 1 Quốc gia & FINA Level 2 Coach', 8, N'Kiện tướng bơi lội quốc gia, chuyên huấn luyện bơi kỹ thuật cao (bơi bướm, bơi ếch, bơi sải) cho người lớn và tài năng trẻ, kèm kỹ năng an toàn và xử lý sự cố dưới nước.', '2022-06-15 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(16, 64, 15, N'COC003_64', N'Lê Thị Thu Thảo', N'Yoga & Pilates, Yoga Hatha Trị liệu & Thiền định phục hồi', N'Chứng chỉ Quốc tế Yoga Alliance RYT 500 (Rishikesh, Ấn Độ)', 7, N'Hơn 7 năm chuyên sâu về Yoga phục hồi chức năng cột sống, điều trị đau mỏi cổ vai gáy và hướng dẫn thiền định giảm áp lực tâm lý cho người bận rộn.', '2023-01-10 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(17, 65, 15, N'COC004_65', N'Vũ Đình Trọng', N'Boxing & Võ thuật, Boxing đối kháng & Phản xạ tự vệ', N'Chứng chỉ Huấn luyện viên WBA Asia & Đai đen Taekwondo 3 đẳng', 9, N'Từng đạt Huy chương Bạc giải Boxing Vô địch Toàn quốc. Chuyên đào tạo kỹ thuật đấm đối kháng, phản xạ di chuyển chân và rèn luyện bản lĩnh thi đấu thép.', '2022-08-20 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(18, 66, 15, N'COC005_66', N'Hoàng Khánh Linh', N'Yoga & Pilates, Pilates Thiết bị (Reformer, Cadillac) & Cơ lõi Core', N'Chứng chỉ Chuyên sâu STOTT PILATES Toàn diện & Balanced Body', 6, N'Chuyên gia chỉnh sửa võng lưng, gù lưng, siết gọn vòng eo và kích hoạt cơ lõi sâu bằng hệ thống máy Pilates chuẩn Olympic hiện đại bậc nhất.', '2023-04-01 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(19, 67, 15, N'COC006_67', N'Phạm Thế Anh', N'Cầu lông, Kỹ thuật đập cầu, Bộ chân di chuyển & Đánh đơn/đôi', N'Chứng chỉ Huấn luyện viên BWF Level 1 (Liên đoàn Cầu lông Thế giới)', 8, N'Vận động viên thi đấu chuyên nghiệp hệ thống giải quốc gia, dày dặn kinh nghiệm uốn nắn kỹ thuật tay cổ tay, bộ pháp sân và tư duy chiến thuật nhạy bén.', '2022-11-15 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(20, 68, 15, N'COC007_68', N'Trịnh Gia Huy', N'Golf, Căn chỉnh Swing TrackMan 4K & Kỹ thuật Short Game', N'Chứng chỉ PGA Australia Coach & TrackMan University Master', 9, N'Huấn luyện viên chuẩn PGA với khả năng phân tích dữ liệu cơ sinh học 3D, giúp golfer nâng cao khoảng cách đánh bóng (Carry Distance) và hạ điểm chấp Handicap nhanh chóng.', '2021-09-01 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(21, 69, 15, N'COC008_69', N'Đặng Hữu Phúc', N'Gym & Fitness, Strength & Conditioning, Tốc độ và Sức bền bộc phát', N'Chứng chỉ Chuyên gia Thể lực CSCS (NSCA Hoa Kỳ) & EXOS Specialist', 7, N'Chuyên thiết kế giáo án tăng sức mạnh bộc phát, gia tăng sức bền tim mạch và phản xạ thần kinh vận động cho các vận động viên thể thao phong trào và bán chuyên.', '2023-02-01 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(22, 70, 15, N'COC009_70', N'Bùi Phương Nam', N'Gym & Fitness, Functional Cardio, HIIT & Tabata chuyển đổi vóc dáng', N'Chứng chỉ Quốc tế ACE-CPT & Huấn luyện viên Trưởng Les Mills', 5, N'Huấn luyện viên tràn đầy năng lượng tích cực, sở hữu phương pháp đốt mỡ tối đa thông qua các bài tập ngắt quãng cường độ cao mà vẫn bảo toàn khối cơ nạc.', '2023-08-01 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(23, 71, 15, N'COC010_71', N'Ngô Tuấn Kiệt', N'Boxing & Võ thuật, Yoga & Pilates, Vận động chức năng FMS & Tự vệ', N'Chứng chỉ Functional Movement Screen (FMS) Level 2 & EMT First Aid', 8, N'Chuyên gia cân bằng chuỗi động lực học cơ thể, giải phóng co thắt cân mạc, phục hồi biên độ khớp sau chấn thương và tích hợp kỹ năng tự vệ phản xạ sinh tồn.', '2022-05-10 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000');
SET IDENTITY_INSERT dbo.[coach_profiles] OFF;
GO

-- Table dbo.[member_profiles] (5 rows)
SET IDENTITY_INSERT dbo.[member_profiles] ON;
INSERT INTO dbo.[member_profiles] ([Id], [user_id], [member_code], [full_name], [date_of_birth], [gender], [address], [emergency_contact_name], [emergency_contact_phone], [fitness_goal], [fitness_level], [medical_note], [height_cm], [weight_kg], [booking_suspended_until], [created_at], [updated_at], [center_id]) VALUES
(1, 37, N'MEM-00001', N'Phạm Minh Tuấn', '1995-05-20 00:00:00.0000000', N'Nam', N'Quận 1, TP.HCM', NULL, NULL, N'Tăng cơ, cải thiện sức bền', N'Intermediate', NULL, 175.00, 71.00, NULL, '2026-10-09 16:29:03.0000000', NULL, 15),
(3, 41, N'MEM-00002', N'Hoàng Hải Yến', '1998-03-22 00:00:00.0000000', N'Nữ', N'Bình Thạnh, TP.HCM', NULL, NULL, N'Giảm mỡ, săn chắc vóc dáng', N'Beginner', NULL, 162.00, 52.00, NULL, '2026-10-10 17:25:07.0000000', NULL, 15),
(4, 42, N'MEM-00003', N'Đặng Quốc Bảo', '1994-11-10 00:00:00.0000000', N'Male', N'Phú Nhuận, TP.HCM', NULL, NULL, N'Tăng sức mạnh và độ linh hoạt', N'Advanced', NULL, 178.00, 76.00, NULL, '2026-10-10 17:25:07.0000000', '2026-10-14 11:24:37.0000000', 15),
(5, 43, N'MEM-00004', N'Trần Thị Mai Anh', '2000-05-18 00:00:00.0000000', N'Nữ', N'Quận 3, TP.HCM', NULL, NULL, N'Cải thiện nhịp tim và bơi lội', N'Intermediate', NULL, 165.00, 54.00, NULL, '2026-10-10 17:25:07.0000000', NULL, 15),
(21, 60, N'MB29F5946CC8', N'Phạm Văn Duy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-23 09:19:35.0000000', NULL, 15);
SET IDENTITY_INSERT dbo.[member_profiles] OFF;
GO

-- Table dbo.[staff_profiles] (12 rows)
SET IDENTITY_INSERT dbo.[staff_profiles] ON;
INSERT INTO dbo.[staff_profiles] ([Id], [user_id], [center_id], [staff_code], [full_name], [position], [hire_date], [status], [created_at], [updated_at]) VALUES
(24, 35, 15, N'STF-MANAGER-35', N'Quản lý trung tâm', N'Manager', NULL, N'Active', '2026-10-09 16:29:02.0000000', NULL),
(25, 36, 15, N'STF-RECEPTION-36', N'Nhân viên Lễ tân', N'Receptionist', NULL, N'Active', '2026-10-09 16:29:02.0000000', '2026-10-21 14:57:56.0000000'),
(27, 62, 15, N'STC001_62', N'Nguyễn Quốc Cường', N'HLV Trưởng Thể hình & Thể lực', '2022-03-01 00:00:00.0000000', N'Active', '2026-10-24 03:11:16.0000000', '2026-10-24 03:20:26.0000000'),
(28, 63, 15, N'STC002_63', N'Trần Hải Đăng', N'HLV Bơi lội Đỉnh cao & Cứu đuối', '2022-06-15 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(29, 64, 15, N'STC003_64', N'Lê Thị Thu Thảo', N'HLV Yoga Trị liệu & Phục hồi', '2023-01-10 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(30, 65, 15, N'STC004_65', N'Vũ Đình Trọng', N'HLV Quyền Anh & Kickboxing Thực chiến', '2022-08-20 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(31, 66, 15, N'STC005_66', N'Hoàng Khánh Linh', N'HLV Pilates Reformer & Cân chỉnh Vóc dáng', '2023-04-01 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(32, 67, 15, N'STC006_67', N'Phạm Thế Anh', N'HLV Cầu lông Chiến thuật & Đấu pháp', '2022-11-15 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(33, 68, 15, N'STC007_68', N'Trịnh Gia Huy', N'HLV Golf Chuyên nghiệp & Phân tích Swing TrackMan', '2021-09-01 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(34, 69, 15, N'STC008_69', N'Đặng Hữu Phúc', N'HLV Thể lực & Sức mạnh Thể thao', '2023-02-01 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(35, 70, 15, N'STC009_70', N'Bùi Phương Nam', N'HLV HIIT & Siết cơ Đốt mỡ Tốc độ', '2023-08-01 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000'),
(36, 71, 15, N'STC010_71', N'Ngô Tuấn Kiệt', N'HLV Vận động Chức năng & Phục hồi Chấn thương', '2022-05-10 00:00:00.0000000', N'Active', '2026-10-24 03:11:17.0000000', '2026-10-24 03:20:26.0000000');
SET IDENTITY_INSERT dbo.[staff_profiles] OFF;
GO

-- Table dbo.[users] (18 rows)
SET IDENTITY_INSERT dbo.[users] ON;
INSERT INTO dbo.[users] ([Id], [username], [email], [password_hash], [phone], [role_id], [status], [last_login_at], [failed_login_attempts], [locked_until], [created_at], [updated_at], [google_subject], [auth_version], [avatar_key], [is_email_verified], [must_change_password]) VALUES
(34, N'admin', N'admin@sportscenter.vn', N'$2a$11$znHu.YxC7ldCYvtKdvPzWOJBUv9qkdgMXuML9n06xM0PuBviZi1k6', N'0900000001', 22, N'Active', '2026-11-10 08:24:49.6355079', 0, NULL, '2026-10-09 16:29:02.0000000', '2026-11-10 08:24:49.6355079', NULL, 1, NULL, 1, 0),
(35, N'manager01', N'manager01@sportscenter.vn', N'$2a$11$znHu.YxC7ldCYvtKdvPzWOJBUv9qkdgMXuML9n06xM0PuBviZi1k6', N'0900000003', 23, N'Active', '2026-11-10 08:24:16.4881731', 0, NULL, '2026-10-09 16:29:02.0000000', '2026-11-10 08:24:16.4881731', NULL, 1, NULL, 1, 0),
(36, N'reception01', N'reception01@sportscenter.vn', N'$2a$11$znHu.YxC7ldCYvtKdvPzWOJBUv9qkdgMXuML9n06xM0PuBviZi1k6', N'0900000002', 24, N'Active', '2026-11-10 08:24:18.6203262', 0, NULL, '2026-10-09 16:29:02.0000000', '2026-11-10 08:24:18.6203262', NULL, 1, NULL, 1, 0),
(37, N'phamminhtuan', N'phamminhtuan@sportscenter.vn', N'$2a$11$ox1gtrNUo4HaEV9GIGqeMOHrhfP/MJdS67I0xSNhsk6ykKUkLfzFq', N'0900000006', 26, N'Active', '2026-11-10 08:24:41.1083122', 0, NULL, '2026-10-09 16:29:03.0000000', '2026-11-10 08:24:41.1083122', NULL, 1, NULL, 1, 0),
(41, N'hoanghaiyen', N'hoanghaiyen@sportscenter.vn', N'$2a$11$ox1gtrNUo4HaEV9GIGqeMOHrhfP/MJdS67I0xSNhsk6ykKUkLfzFq', N'0900000007', 26, N'Active', '2026-11-10 08:24:05.7696008', 0, NULL, '2026-10-10 17:25:07.0000000', '2026-11-10 08:24:05.7696008', NULL, 1, NULL, 1, 0),
(42, N'dangquocbao', N'dangquocbao@sportscenter.vn', N'$2a$11$ox1gtrNUo4HaEV9GIGqeMOHrhfP/MJdS67I0xSNhsk6ykKUkLfzFq', N'0900000008', 26, N'Active', '2026-11-10 08:24:07.9188184', 0, NULL, '2026-10-10 17:25:07.0000000', '2026-11-10 08:24:07.9188184', NULL, 1, NULL, 1, 0),
(43, N'tranthimaianh', N'tranthimaianh@sportscenter.vn', N'$2a$11$ox1gtrNUo4HaEV9GIGqeMOHrhfP/MJdS67I0xSNhsk6ykKUkLfzFq', N'0900000009', 26, N'Active', '2026-11-10 08:24:10.0725671', 0, NULL, '2026-10-10 17:25:07.0000000', '2026-11-10 08:24:10.0725671', NULL, 1, NULL, 1, 0),
(60, N'phamvanduy', N'phamvanduy@sportscenter.vn', N'$2a$11$ox1gtrNUo4HaEV9GIGqeMOHrhfP/MJdS67I0xSNhsk6ykKUkLfzFq', N'0353716247', 26, N'Active', '2026-11-10 08:24:12.2040100', 0, NULL, '2026-10-23 09:19:35.0000000', '2026-11-10 08:24:12.2040100', NULL, 1, NULL, 1, 0),
(62, N'nguyenquoccuong', N'nguyenquoccuong@sportscenter.vn', N'$2a$11$qGeetFHtPCiyZpe2uetQsOhTvhNoJtLmES46fq2Po/W3GXHGS3VzK', N'0911000001', 25, N'Active', '2026-11-10 08:24:32.4208103', 0, NULL, '2026-10-24 03:11:16.0000000', '2026-11-10 08:24:32.4208103', NULL, 1, NULL, 1, 0),
(63, N'tranhaidang', N'tranhaidang@sportscenter.vn', N'$2a$11$qGeetFHtPCiyZpe2uetQsOhTvhNoJtLmES46fq2Po/W3GXHGS3VzK', N'0911000002', 25, N'Active', '2026-11-10 08:23:44.1914230', 0, NULL, '2026-10-24 03:11:17.0000000', '2026-11-10 08:23:44.1914230', NULL, 1, NULL, 1, 0),
(64, N'lethithuthao', N'lethithuthao@sportscenter.vn', N'$2a$11$qGeetFHtPCiyZpe2uetQsOhTvhNoJtLmES46fq2Po/W3GXHGS3VzK', N'0911000003', 25, N'Active', '2026-11-10 08:23:46.3869461', 0, NULL, '2026-10-24 03:11:17.0000000', '2026-11-10 08:23:46.3869461', NULL, 1, NULL, 1, 0),
(65, N'vudinhtrong', N'vudinhtrong@sportscenter.vn', N'$2a$11$qGeetFHtPCiyZpe2uetQsOhTvhNoJtLmES46fq2Po/W3GXHGS3VzK', N'0911000004', 25, N'Active', '2026-11-10 08:23:48.5695567', 0, NULL, '2026-10-24 03:11:17.0000000', '2026-11-10 08:23:48.5695567', NULL, 1, NULL, 1, 0),
(66, N'hoangkhanhlinh', N'hoangkhanhlinh@sportscenter.vn', N'$2a$11$qGeetFHtPCiyZpe2uetQsOhTvhNoJtLmES46fq2Po/W3GXHGS3VzK', N'0911000005', 25, N'Active', '2026-11-10 08:23:50.7358922', 0, NULL, '2026-10-24 03:11:17.0000000', '2026-11-10 08:23:50.7358922', NULL, 1, NULL, 1, 0),
(67, N'phamtheanh', N'phamtheanh@sportscenter.vn', N'$2a$11$qGeetFHtPCiyZpe2uetQsOhTvhNoJtLmES46fq2Po/W3GXHGS3VzK', N'0911000006', 25, N'Active', '2026-11-10 08:23:52.9013985', 0, NULL, '2026-10-24 03:11:17.0000000', '2026-11-10 08:23:52.9013985', NULL, 1, NULL, 1, 0),
(68, N'trinhgiahuy', N'trinhgiahuy@sportscenter.vn', N'$2a$11$qGeetFHtPCiyZpe2uetQsOhTvhNoJtLmES46fq2Po/W3GXHGS3VzK', N'0911000007', 25, N'Active', '2026-11-10 08:23:55.0529621', 0, NULL, '2026-10-24 03:11:17.0000000', '2026-11-10 08:23:55.0529621', NULL, 1, NULL, 1, 0),
(69, N'danghuuphuc', N'danghuuphuc@sportscenter.vn', N'$2a$11$qGeetFHtPCiyZpe2uetQsOhTvhNoJtLmES46fq2Po/W3GXHGS3VzK', N'0911000008', 25, N'Active', '2026-11-10 08:23:57.2059414', 0, NULL, '2026-10-24 03:11:17.0000000', '2026-11-10 08:23:57.2059414', NULL, 1, NULL, 1, 0),
(70, N'buiphuongnam', N'buiphuongnam@sportscenter.vn', N'$2a$11$qGeetFHtPCiyZpe2uetQsOhTvhNoJtLmES46fq2Po/W3GXHGS3VzK', N'0911000009', 25, N'Active', '2026-11-10 08:23:59.3389417', 0, NULL, '2026-10-24 03:11:17.0000000', '2026-11-10 08:23:59.3389417', NULL, 1, NULL, 1, 0),
(71, N'ngotuankiet', N'ngotuankiet@sportscenter.vn', N'$2a$11$qGeetFHtPCiyZpe2uetQsOhTvhNoJtLmES46fq2Po/W3GXHGS3VzK', N'0911000010', 25, N'Active', '2026-11-10 08:24:01.4879542', 0, NULL, '2026-10-24 03:11:17.0000000', '2026-11-10 08:24:01.4879542', NULL, 1, NULL, 1, 0);
SET IDENTITY_INSERT dbo.[users] OFF;
GO

-- Table dbo.[role_permissions] (51 rows)
INSERT INTO dbo.[role_permissions] ([role_id], [permission_id]) VALUES
(23, 1),
(26, 1),
(26, 2),
(22, 3),
(23, 3),
(24, 3),
(22, 4),
(23, 4),
(24, 4),
(22, 5),
(23, 5),
(22, 6),
(23, 6),
(22, 7),
(23, 7),
(22, 8),
(23, 8),
(22, 9),
(23, 9),
(22, 10),
(23, 10),
(26, 11),
(22, 12),
(23, 12),
(24, 12),
(22, 13),
(23, 13),
(24, 13),
(26, 13),
(26, 14),
(22, 15),
(23, 15),
(24, 15),
(22, 16),
(23, 16),
(22, 17),
(22, 18),
(23, 18),
(24, 18),
(25, 18),
(26, 18),
(22, 19),
(23, 19),
(22, 20),
(23, 20),
(22, 21),
(23, 21),
(24, 21),
(22, 22),
(23, 22),
(22, 23);
GO

-- Table dbo.[roles] (5 rows)
SET IDENTITY_INSERT dbo.[roles] ON;
INSERT INTO dbo.[roles] ([Id], [name], [description], [created_at]) VALUES
(22, N'Admin', N'Quản trị viên toàn hệ thống', '2026-10-09 16:29:02.0000000'),
(23, N'Manager', N'Quản lý cơ sở trung tâm', '2026-10-09 16:29:02.0000000'),
(24, N'Receptionist', N'Nhân viên lễ tân tiếp đón & thanh toán', '2026-10-09 16:29:02.0000000'),
(25, N'Coach', N'Huấn luyện viên thể thao', '2026-10-09 16:29:02.0000000'),
(26, N'Member', N'Khách hàng hội viên', '2026-10-09 16:29:02.0000000');
SET IDENTITY_INSERT dbo.[roles] OFF;
GO

-- Table dbo.[permissions] (23 rows)
SET IDENTITY_INSERT dbo.[permissions] ON;
INSERT INTO dbo.[permissions] ([Id], [code], [name], [description], [module]) VALUES
(1, N'members.self.read', N'View own profile', N'View the authenticated member''s own profile.', N'MEMBERS'),
(2, N'members.self.update', N'Update own profile', N'Update the authenticated member''s own profile.', N'MEMBERS'),
(3, N'members.center.read', N'View center members', N'Search and view members assigned to a center.', N'MEMBERS'),
(4, N'members.center.create', N'Create center members', N'Register members at a center.', N'MEMBERS'),
(5, N'members.center.update', N'Update center members', N'Update member profile details at a center.', N'MEMBERS'),
(6, N'members.center.manage-status', N'Manage member status', N'Activate or disable a member account.', N'MEMBERS'),
(7, N'staff.center.read', N'View center staff', N'View coach and staff accounts assigned to a center.', N'STAFF'),
(8, N'staff.center.create', N'Create center staff', N'Create coach and receptionist accounts at a center.', N'STAFF'),
(9, N'staff.center.update', N'Update center staff', N'Update center staff profiles and statuses.', N'STAFF'),
(10, N'membership-packages.manage', N'Manage membership packages', N'Create and update membership packages.', N'PACKAGES'),
(11, N'subscriptions.self.create', N'Buy own subscription', N'Create a subscription for the authenticated member.', N'SUBSCRIPTIONS'),
(12, N'subscriptions.center.create', N'Sell subscriptions', N'Create subscriptions for members at a center.', N'SUBSCRIPTIONS'),
(13, N'subscriptions.read', N'View subscriptions', N'View own or authorized center subscription history.', N'SUBSCRIPTIONS'),
(14, N'payments.self.create', N'Start own payment', N'Start an online payment for the authenticated member.', N'PAYMENTS'),
(15, N'payments.center.cash', N'Record center payment', N'Record an authorized center payment.', N'PAYMENTS'),
(16, N'audit.center.read', N'View center audit history', N'View operational audit events for an assigned center.', N'AUDIT'),
(17, N'roles.permissions.manage', N'Manage role permissions', N'Replace permissions assigned to system roles.', N'ROLES'),
(18, N'CLASS_VIEW', N'Xem lớp học', N'View class data', N'CLASSES'),
(19, N'CLASS_MANAGE', N'Quản lý lớp học', N'Create and update classes', N'CLASSES'),
(20, N'COACH_ASSIGN', N'Phân công huấn luyện viên', N'Assign coaches to classes', N'CLASSES'),
(21, N'MEMBER_VIEW', N'Xem hội viên', N'View member data', N'MEMBERS'),
(22, N'MEMBER_MANAGE', N'Quản lý hội viên', N'Create and update members', N'MEMBERS'),
(23, N'ROLE_MANAGE', N'Quản lý vai trò và quyền', N'Manage roles and permissions', N'ROLES');
SET IDENTITY_INSERT dbo.[permissions] OFF;
GO

-- Table dbo.[centers] (2 rows)
SET IDENTITY_INSERT dbo.[centers] ON;
INSERT INTO dbo.[centers] ([Id], [name], [address], [phone], [email], [description], [opening_time], [closing_time], [status], [created_at]) VALUES
(1, N'SCMS Sports Center - Olympic Campus', N'Khu CÃ´ng nghá»‡ cao HÃ²a Láº¡c, Tháº¡ch Tháº¥t, HÃ  Ná»™i', N'02473001866', N'contact@sportscenter.vn', N'Trung tÃ¢m thá»ƒ thao Ä‘a nÄƒng chuáº©n Olympic', '06:00:00', '22:00:00', N'Active', '2026-11-10 15:16:25.3266667'),
(15, N'Sports Center Quận 1', N'123 Nguyễn Thị Minh Khai, Quận 1, TP.HCM', N'0901234567', N'center.q1@sportscenter.vn', NULL, NULL, NULL, N'Active', '2026-10-09 16:29:01.0000000');
SET IDENTITY_INSERT dbo.[centers] OFF;
GO

PRINT 'Re-enabling and validating all constraints...';
EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';
PRINT 'DATA SEEDING COMPLETED 100% SUCCESSFULLY!';
GO
