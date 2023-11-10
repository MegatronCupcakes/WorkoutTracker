using WorkoutTracker.DataAccess;

namespace WorkoutTracker.Types
{
    /// <summary>
    /// 
    /// Exercise
    /// 
    /// Program -> Routine -> Exercise
    /// An Exercise is a description of an activity
    /// </summary>
    public class Exercise : IStorable
    {
        public string _id { get; set; }
        public string Name { get; set; }
        public string? Notes {  get; set; }
        public Exercise(string id, string name, string? notes)
        {
            _id = id;
            Name = name;
            Notes = notes;
        }
    }
}
