using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Video_Platform_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPremiumToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPremium",
                table: "Users",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PremiumUntil",
                table: "Users",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPremium",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PremiumUntil",
                table: "Users");
        }
    }
}
