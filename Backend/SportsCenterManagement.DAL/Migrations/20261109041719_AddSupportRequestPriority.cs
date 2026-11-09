using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SportsCenterManagement.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddSupportRequestPriority : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "priority",
                schema: "dbo",
                table: "support_requests",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                // Existing tickets were created without a priority: treat them as Normal.
                defaultValue: "Normal");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "priority",
                schema: "dbo",
                table: "support_requests");
        }
    }
}
