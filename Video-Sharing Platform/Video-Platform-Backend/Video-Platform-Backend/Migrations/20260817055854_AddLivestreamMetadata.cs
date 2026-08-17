using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Video_Platform_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddLivestreamMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Livestreams",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HlsUrl",
                table: "Livestreams",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "Livestreams",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ThumbnailUrl",
                table: "Livestreams",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "TotalViews",
                table: "Livestreams",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VodUrl",
                table: "Livestreams",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "LiveMessages",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPinned",
                table: "LiveMessages",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MessageType",
                table: "LiveMessages",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Livestreams");

            migrationBuilder.DropColumn(
                name: "HlsUrl",
                table: "Livestreams");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "Livestreams");

            migrationBuilder.DropColumn(
                name: "ThumbnailUrl",
                table: "Livestreams");

            migrationBuilder.DropColumn(
                name: "TotalViews",
                table: "Livestreams");

            migrationBuilder.DropColumn(
                name: "VodUrl",
                table: "Livestreams");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "LiveMessages");

            migrationBuilder.DropColumn(
                name: "IsPinned",
                table: "LiveMessages");

            migrationBuilder.DropColumn(
                name: "MessageType",
                table: "LiveMessages");
        }
    }
}
