using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Video_Platform_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryToLivestream : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "Livestreams",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Livestreams_CategoryId",
                table: "Livestreams",
                column: "CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Livestreams_VideoCategories_CategoryId",
                table: "Livestreams",
                column: "CategoryId",
                principalTable: "VideoCategories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Livestreams_VideoCategories_CategoryId",
                table: "Livestreams");

            migrationBuilder.DropIndex(
                name: "IX_Livestreams_CategoryId",
                table: "Livestreams");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Livestreams");
        }
    }
}
