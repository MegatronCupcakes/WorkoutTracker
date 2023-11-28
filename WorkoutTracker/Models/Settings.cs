namespace WorkoutTracker.Models
{
    public class Settings
    {
        public string _id { get; set; } = Guid.NewGuid().ToString();
        public bool NotificationsEnabled { get; set; } = false;
        public Settings()
        {
            
        }
    }
}
