using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Video_Platform_Backend.Models
{
    public class DailyVideoEarnings
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid VideoId { get; set; }

        [ForeignKey("VideoId")]
        public virtual Video Video { get; set; } = null!;

        public DateTime Date { get; set; }

        public int ViewsCount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal EarnedAmount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
