using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SportsCenterManagement.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddMediaStorageKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "storage_key",
                table: "uploaded_media",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_uploaded_media_storage_key",
                table: "uploaded_media",
                column: "storage_key",
                unique: true,
                filter: "storage_key <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_uploaded_media_storage_key",
                table: "uploaded_media");

            migrationBuilder.DropColumn(
                name: "storage_key",
                table: "uploaded_media");
        }
    }
}
