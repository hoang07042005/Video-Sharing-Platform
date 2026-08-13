using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Video_Platform_Backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRoleTableWithDefinitions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BgColor",
                table: "Roles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BorderColor",
                table: "Roles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "Roles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "Roles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Label",
                table: "Roles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PermissionsJson",
                table: "Roles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TextColor",
                table: "Roles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "BgColor", "BorderColor", "Color", "Icon", "Label", "PermissionsJson", "TextColor" },
                values: new object[] { "bg-red-500/10", "border-red-500/20", "from-red-500 to-orange-500", "Crown", "Quản trị viên", "[\"Quản lý người dùng\", \"Quản lý video\", \"Quản lý bình luận\", \"Quản lý danh mục\", \"Xem báo cáo\", \"Cấu hình hệ thống\", \"Phân quyền vai trò\", \"Quản lý giao dịch\"]", "text-red-400" });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "BgColor", "BorderColor", "Color", "Icon", "Label", "PermissionsJson", "TextColor" },
                values: new object[] { "bg-blue-500/10", "border-blue-500/20", "from-blue-500 to-purple-500", "ShieldCheck", "Kiểm duyệt viên", "[\"Quản lý bình luận\", \"Ẩn / xóa video vi phạm\", \"Xem báo cáo người dùng\", \"Quản lý từ khóa cấm\"]", "text-blue-400" });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "BgColor", "BorderColor", "Color", "Icon", "Label", "PermissionsJson", "TextColor" },
                values: new object[] { "bg-gray-500/10", "border-gray-500/20", "from-gray-500 to-gray-600", "Users", "Người dùng", "[\"Xem video\", \"Bình luận\", \"Thích video\", \"Đăng ký kênh\", \"Upload video\"]", "text-gray-400" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BgColor",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "BorderColor",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "Label",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "PermissionsJson",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "TextColor",
                table: "Roles");
        }
    }
}
