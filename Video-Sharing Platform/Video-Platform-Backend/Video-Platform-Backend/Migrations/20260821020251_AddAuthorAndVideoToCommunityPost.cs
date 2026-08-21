using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Video_Platform_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthorAndVideoToCommunityPost : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AuthorId",
                table: "CommunityPosts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoUrl",
                table: "CommunityPosts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityPosts_AuthorId",
                table: "CommunityPosts",
                column: "AuthorId");

            migrationBuilder.AddForeignKey(
                name: "FK_CommunityPosts_Users_AuthorId",
                table: "CommunityPosts",
                column: "AuthorId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CommunityPosts_Users_AuthorId",
                table: "CommunityPosts");

            migrationBuilder.DropIndex(
                name: "IX_CommunityPosts_AuthorId",
                table: "CommunityPosts");

            migrationBuilder.DropColumn(
                name: "AuthorId",
                table: "CommunityPosts");

            migrationBuilder.DropColumn(
                name: "VideoUrl",
                table: "CommunityPosts");
        }
    }
}
