namespace WorkoutTracker.Models
{
    /// <summary>
    /// 
    /// Routine
    /// 
    /// Program -> Routine -> Exercise
    /// A Routine is a collection of Exercises to be performed on a given day as part of a workout Program.
    /// </summary>
    public class Routine : ActivityBase
    {
        public List<RoutineExercise> RoutineExercises { get; set; } = new List<RoutineExercise>();
        public Routine() { }
    }

    public class RoutineExercise : Exercise
    {
        public string ExerciseId { get; set; }
        public int StartingWeight { get; set; } = 0;
        public int Repetitions { get; set; } = 0;
        public int Sets { get; set; } = 0;
        public int MinutesBetweenSets { get; set; } = 0;
        public RoutineExercise() { }
    }
}
