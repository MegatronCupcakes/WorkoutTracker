﻿using System.Xml.Linq;
using WorkoutTracker.DataAccess;

namespace WorkoutTracker.Types
{
    /// <summary>
    /// 
    /// Routine
    /// 
    /// Program -> Routine -> Exercise
    /// A Routine is a collection of Exercises to be performed on a given day as part of a workout Program.
    /// </summary>
    public class Routine : IStorable
    {
        public string _id { get; set; }
        public string Name { get; set; }
        
        public Routine(string id, string name)
        {
            _id = id;
            Name = name;
        }
    }
}
