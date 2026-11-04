using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SportsCenterManagement.DAL.Migrations
{
    /// <inheritdoc />
    public partial class IntegrateRbacPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "center_id",
                table: "uploaded_media",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "attempt_count",
                table: "communication_deliveries",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "last_error",
                table: "communication_deliveries",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "lease_until",
                table: "communication_deliveries",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "locked_by",
                table: "communication_deliveries",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "next_attempt_at",
                table: "communication_deliveries",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_uploaded_media_center_id_created_at",
                table: "uploaded_media",
                columns: new[] { "center_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_uploaded_media_drive_file_id",
                table: "uploaded_media",
                column: "drive_file_id");

            migrationBuilder.CreateIndex(
                name: "IX_communication_deliveries_status_next_attempt_at_lease_until",
                table: "communication_deliveries",
                columns: new[] { "status", "next_attempt_at", "lease_until" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_uploaded_media_center_id_created_at",
                table: "uploaded_media");

            migrationBuilder.DropIndex(
                name: "IX_uploaded_media_drive_file_id",
                table: "uploaded_media");

            migrationBuilder.DropIndex(
                name: "IX_communication_deliveries_status_next_attempt_at_lease_until",
                table: "communication_deliveries");

            migrationBuilder.DropColumn(
                name: "center_id",
                table: "uploaded_media");

            migrationBuilder.DropColumn(
                name: "attempt_count",
                table: "communication_deliveries");

            migrationBuilder.DropColumn(
                name: "last_error",
                table: "communication_deliveries");

            migrationBuilder.DropColumn(
                name: "lease_until",
                table: "communication_deliveries");

            migrationBuilder.DropColumn(
                name: "locked_by",
                table: "communication_deliveries");

            migrationBuilder.DropColumn(
                name: "next_attempt_at",
                table: "communication_deliveries");
        }
    }
}
