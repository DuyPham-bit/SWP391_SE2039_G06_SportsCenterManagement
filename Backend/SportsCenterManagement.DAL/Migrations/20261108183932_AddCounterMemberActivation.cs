using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SportsCenterManagement.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddCounterMemberActivation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_email_verified",
                schema: "dbo",
                table: "users",
                type: "bit",
                nullable: false,
                // Existing accounts were created through OTP registration or staff workflows: keep them verified.
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "must_change_password",
                schema: "dbo",
                table: "users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "account_activation_tokens",
                schema: "dbo",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    token_hash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    expires_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    used_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_account_activation_tokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_account_activation_tokens_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "dbo",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_account_activation_tokens_token_hash",
                schema: "dbo",
                table: "account_activation_tokens",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_account_activation_tokens_user_id_created_at",
                schema: "dbo",
                table: "account_activation_tokens",
                columns: new[] { "user_id", "created_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "account_activation_tokens",
                schema: "dbo");

            migrationBuilder.DropColumn(
                name: "is_email_verified",
                schema: "dbo",
                table: "users");

            migrationBuilder.DropColumn(
                name: "must_change_password",
                schema: "dbo",
                table: "users");
        }
    }
}
