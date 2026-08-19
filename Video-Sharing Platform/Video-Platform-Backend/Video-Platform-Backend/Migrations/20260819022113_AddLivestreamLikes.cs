using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Video_Platform_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddLivestreamLikes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK__Livestrea__Chann__531856C7",
                table: "Livestreams");

            migrationBuilder.AddColumn<int>(
                name: "Likes",
                table: "Livestreams",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LivestreamLikes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LivestreamId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsLike = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LivestreamLikes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LivestreamLikes_Livestream",
                        column: x => x.LivestreamId,
                        principalTable: "Livestreams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LivestreamLikes_User",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_LivestreamLikes_LivestreamId",
                table: "LivestreamLikes",
                column: "LivestreamId");

            migrationBuilder.CreateIndex(
                name: "IX_LivestreamLikes_UserId",
                table: "LivestreamLikes",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK__Livestrea__Chann__797309D9",
                table: "Livestreams",
                column: "ChannelId",
                principalTable: "Channels",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK__Livestrea__Chann__797309D9",
                table: "Livestreams");

            migrationBuilder.DropTable(
                name: "LivestreamLikes");

            migrationBuilder.DropColumn(
                name: "Likes",
                table: "Livestreams");

            migrationBuilder.AddForeignKey(
                name: "FK__Livestrea__Chann__531856C7",
                table: "Livestreams",
                column: "ChannelId",
                principalTable: "Channels",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
