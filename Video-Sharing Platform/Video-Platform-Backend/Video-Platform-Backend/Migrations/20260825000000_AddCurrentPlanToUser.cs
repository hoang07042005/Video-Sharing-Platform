using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Video_Platform_Backend.Migrations
{
    public partial class AddCurrentPlanToUser : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CurrentPlan",
                table: "Users",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Free");

            migrationBuilder.Sql(@"
                UPDATE u
                SET u.CurrentPlan = CASE
                    WHEN latest.TransactionType LIKE 'PremiumUpgrade_Pro_%' THEN 'Pro'
                    WHEN latest.TransactionType LIKE 'PremiumUpgrade_Family_%' THEN 'Family'
                    WHEN latest.TransactionType LIKE 'PremiumUpgrade_Premium_%' THEN 'Premium'
                    ELSE 'Premium'
                END
                FROM Users u
                OUTER APPLY (
                    SELECT TOP 1 t.TransactionType
                    FROM Transactions t
                    INNER JOIN Payments p ON p.Id = t.PaymentId
                    WHERE p.UserId = u.Id
                      AND t.TransactionType LIKE 'PremiumUpgrade_%'
                    ORDER BY t.CreatedAt DESC
                ) latest
                                WHERE latest.TransactionType IS NOT NULL;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentPlan",
                table: "Users");
        }
    }
}
