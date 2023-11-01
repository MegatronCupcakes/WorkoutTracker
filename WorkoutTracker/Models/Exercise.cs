namespace WorkoutTracker.Types
{
    public class Exercise
    {
        public string Name { get; set; }
        public string? Notes {  get; set; }
        public Exercise(string name, string? notes)
        {
            Name = name;

            Notes = notes;

        }
    }
}
