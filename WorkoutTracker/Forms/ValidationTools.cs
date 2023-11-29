using System.ComponentModel.DataAnnotations;

namespace WorkoutTracker.Forms
{
    public static class ValidationTools
    {
        public static string ShowValidation(string propertyName, List<ValidationResult> validationResults)
        {
            if (validationResults == null) return "";
            var result = validationResults.Any(resultSet => resultSet.MemberNames.Contains(propertyName));
            if (result) return "is-invalid";
            return "is-valid";
        }
    }
}
