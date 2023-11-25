namespace WorkoutTracker.Models
{
    public class JsonImport
    {
        public List<Workout>? Workouts { get; set; }
        public List<Exercise>? Exercises { get; set; }
        public List<Program>? Programs { get; set; }
        public List<Routine>? Routines { get; set; }
        public JsonImport()
        {
            
        }
    }
}
