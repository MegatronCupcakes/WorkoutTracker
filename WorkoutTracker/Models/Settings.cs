using System.ComponentModel.DataAnnotations;

namespace WorkoutTracker.Models
{
    public class Settings
    {
        [Required]
        public string _id { get; set; } = Guid.NewGuid().ToString();
        [Required]
        public bool NotificationsEnabled { get; set; } = false;
        public Settings()
        {
            
        }
    }
}
