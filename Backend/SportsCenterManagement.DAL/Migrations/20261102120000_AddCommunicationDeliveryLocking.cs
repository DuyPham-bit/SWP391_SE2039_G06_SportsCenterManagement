using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SportsCenterManagement.DAL.Context;

#nullable disable

namespace SportsCenterManagement.DAL.Migrations;

[DbContext(typeof(SportsCenterDbContext))]
[Migration("20261102120000_AddCommunicationDeliveryLocking")]
public sealed class AddCommunicationDeliveryLocking : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "attempt_count",
            schema: "dbo",
            table: "communication_deliveries",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<DateTime>(
            name: "next_attempt_at",
            schema: "dbo",
            table: "communication_deliveries",
            type: "datetime2",
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "lease_until",
            schema: "dbo",
            table: "communication_deliveries",
            type: "datetime2",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "locked_by",
            schema: "dbo",
            table: "communication_deliveries",
            type: "nvarchar(100)",
            maxLength: 100,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "last_error",
            schema: "dbo",
            table: "communication_deliveries",
            type: "nvarchar(1000)",
            maxLength: 1000,
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_communication_deliveries_status_next_attempt_at_lease_until",
            schema: "dbo",
            table: "communication_deliveries",
            columns: new[] { "status", "next_attempt_at", "lease_until" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_communication_deliveries_status_next_attempt_at_lease_until",
            schema: "dbo",
            table: "communication_deliveries");

        migrationBuilder.DropColumn(
            name: "attempt_count",
            schema: "dbo",
            table: "communication_deliveries");

        migrationBuilder.DropColumn(
            name: "next_attempt_at",
            schema: "dbo",
            table: "communication_deliveries");

        migrationBuilder.DropColumn(
            name: "lease_until",
            schema: "dbo",
            table: "communication_deliveries");

        migrationBuilder.DropColumn(
            name: "locked_by",
            schema: "dbo",
            table: "communication_deliveries");

        migrationBuilder.DropColumn(
            name: "last_error",
            schema: "dbo",
            table: "communication_deliveries");
    }
}

