using WorkoutTracker.Models;

namespace WorkoutTracker.Types
{
    /// <summary>
    /// 
    /// Exercise
    /// 
    /// Program -> Routine -> Exercise
    /// An Exercise is a description of an activity
    /// </summary>
    public class Exercise : ActivityBase
    {
        public string? Notes {  get; set; }
        public Exercise(string id, string name, string? notes)
        {
            _id = id;
            Name = name;
            Notes = notes;
        }
    }
}
