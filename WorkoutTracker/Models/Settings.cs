using System.ComponentModel.DataAnnotations;
using WorkoutTracker.DataAccess;

namespace WorkoutTracker.Models
{
    public class Settings
    {
        [Required]
        public string _id { get; set; } = Guid.NewGuid().ToString();
        [Required]
        public bool NotificationsEnabled { get; set; } = false;
        public bool WizardEnabled { get; set; } = true;
        public Settings()
        {
            
        }
        public async static Task<Settings> GetSettings(Dictionary<string, IndexedDb> collections)
        {
            var appSettings = await collections["settings"].FindOne<WorkoutTracker.Models.Settings>(@"{}");
            if (appSettings == null)
            {
                appSettings = new WorkoutTracker.Models.Settings();
                var inserted = await collections["settings"].Insert(appSettings);
            }
            return appSettings;
        }        
    }
}
