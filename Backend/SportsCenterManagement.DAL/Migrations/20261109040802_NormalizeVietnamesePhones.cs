using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SportsCenterManagement.DAL.Migrations
{
    /// <summary>
    /// Stores Vietnamese phone numbers in the single national form used by PhoneNumberNormalization
    /// ("+84912345678" / "84912345678" → "0912345678"), so duplicate checks and lookups match
    /// regardless of how the number was typed. A row is skipped when its national form already
    /// belongs to another account (the unique phone index would reject it); such pairs need a
    /// manual merge decision and are left untouched.
    /// </summary>
    public partial class NormalizeVietnamesePhones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
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
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Irreversible by design: the original "+84" spelling carried no extra information.
        }
    }
}
