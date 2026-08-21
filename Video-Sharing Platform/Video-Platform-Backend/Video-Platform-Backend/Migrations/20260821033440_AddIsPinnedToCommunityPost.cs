using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Video_Platform_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddIsPinnedToCommunityPost : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPinned",
                table: "CommunityPosts",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPinned",
                table: "CommunityPosts");
        }
    }
}
