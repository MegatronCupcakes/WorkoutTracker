using System.ComponentModel.DataAnnotations;

namespace WorkoutTracker.Models
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
        [Required]
        public string WeightUnits { get; set; } = "none";
        public Exercise() { }
        

    }
}
