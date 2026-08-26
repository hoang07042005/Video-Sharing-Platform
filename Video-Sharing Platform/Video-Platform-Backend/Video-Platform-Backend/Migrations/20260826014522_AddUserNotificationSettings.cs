using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Video_Platform_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddUserNotificationSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ReceiveCommentNotifications",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ReceiveNewVideoNotifications",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReceiveCommentNotifications",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReceiveNewVideoNotifications",
                table: "Users");
        }
    }
}
