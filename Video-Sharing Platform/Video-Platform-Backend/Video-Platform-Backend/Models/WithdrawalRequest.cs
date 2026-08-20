using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Video_Platform_Backend.Models
{
    public class WithdrawalRequest
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
        
        [Required]
        public int Coins { get; set; }
        
        public int UserCoinsDeducted { get; set; } = 0;
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal AmountFiat { get; set; } 
        
        [Required]
        [MaxLength(255)]
        public string BankName { get; set; } = null!;
        
        [Required]
        [MaxLength(255)]
        public string BankAccountNumber { get; set; } = null!;
        
        [Required]
        [MaxLength(255)]
        public string BankAccountName { get; set; } = null!;
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // "Pending", "Completed", "Rejected"
        
        [MaxLength(1000)]
        public string? AdminNote { get; set; }
        
        [MaxLength(2048)]
        public string? ReceiptUrl { get; set; } // Link to the transfer receipt image

        public string? BreakdownData { get; set; } // JSON storing breakdown of sources
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
