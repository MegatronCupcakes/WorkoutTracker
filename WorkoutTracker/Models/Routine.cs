﻿namespace WorkoutTracker.Models
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
        public Routine() { }
        public Routine(string id, string name)
        {
            _id = id;
            Name = name;
        }
    }
}
