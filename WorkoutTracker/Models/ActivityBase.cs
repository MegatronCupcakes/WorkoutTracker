using System.ComponentModel.DataAnnotations;

namespace WorkoutTracker.Models
{
    public class ActivityBase
    {
        public string _id { get; set; } = Guid.NewGuid().ToString();
        [Required]
        public string Name { get; set; } = "";
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public ActivityBase() { }

        public object Validate()
        {
            var context = new ValidationContext(this, serviceProvider: null, items: null);
            var validationResults = new List<ValidationResult>();
            bool isValid = Validator.TryValidateObject(this, context, validationResults, true);
            return new
            {
                Valid = isValid,
                Results = validationResults
            };
        }
    }
}
