namespace WorkoutTracker.DataAccess
{
    public static class CollectionDefinitions
    {
        public static string DatabaseName = "WorkoutTracker";
        public static Dictionary<string, List<string>> Definitions = new Dictionary<string, List<string>>()
        {
            {"workouts", new List<string>(){ "startedAt", "completedAt" }},
            {"programs", new List<string>(){ "createdAt" } },
            {"routines", new List<string>(){ "createdAt" }},
            {"exercises", new List<string>(){ "createdAt" }},
            {"settings", new List<string>(){ "createdAt" }}
        };
    }
    
}
