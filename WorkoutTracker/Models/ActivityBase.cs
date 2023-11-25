namespace WorkoutTracker.Models
{
    public class ActivityBase
    {
        public string _id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = "";
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public ActivityBase() { }
    }
}
