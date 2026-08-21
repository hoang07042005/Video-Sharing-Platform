using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Video_Platform_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCommunityPostCommentLike : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CommunityPostCommentLikes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CommentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsLike = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityPostCommentLikes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityPostCommentLikes_CommunityPostComments_CommentId",
                        column: x => x.CommentId,
                        principalTable: "CommunityPostComments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityPostCommentLikes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityPostCommentLikes_CommentId",
                table: "CommunityPostCommentLikes",
                column: "CommentId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityPostCommentLikes_UserId",
                table: "CommunityPostCommentLikes",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommunityPostCommentLikes");
        }
    }
}
