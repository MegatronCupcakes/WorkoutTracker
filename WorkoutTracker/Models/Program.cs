using WorkoutTracker.DataAccess;

namespace WorkoutTracker.Types
{
    /// <summary>
    /// 
    /// Program
    /// 
    /// Program -> Routine -> Exercise
    /// A Program is the top level; it's a series of Routines (and Routines are a series of Exercises with their associated properties)
    /// </summary>
    public class Program : IStorable
    {        
        public string _id { get; set; }
        public bool Active { get; set; }        
        public string Name { get; set; }        
        public string[] Routines { get; set; }
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
