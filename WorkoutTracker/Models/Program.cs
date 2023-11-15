namespace WorkoutTracker.Models
{
    /// <summary>
    /// 
    /// Program
    /// 
    /// Program -> Routine -> Exercise
    /// A Program is the top level; it's a series of Routines (and Routines are a series of Exercises with their associated properties)
    /// </summary>
    public class Program : ActivityBase
    {
        public bool Active { get; set; } = false;                   
        public string[] Routines { get; set; } = new string[0];
        public Program() { }
        public Program(string id, bool active, string name, string[] routines)
        {
            _id = id;
            Active = active;
            Name = name;
            Routines = routines;
        }
    }
}
