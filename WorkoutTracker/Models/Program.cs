using WorkoutTracker.DataAccess;

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
        public List<string> RoutineIds { get; set; } = new List<string>();
        public Program() { }
        public async void ToggleActive(IndexedDb programCollection)
        {
            if (!Active)
            {
                // we're making this program active; de-activate any other active programs.
                var othersUpdated = await programCollection.Update(new { Active = true }, new Dictionary<string, object>() { { "$set", new { Active = false } } });
            }
            var uppdated = await programCollection.Update(new { _id = this._id }, new Dictionary<string, object>() { { "$set", new { Active = !this.Active } } });
            Active = !this.Active;
        }
    }
}
