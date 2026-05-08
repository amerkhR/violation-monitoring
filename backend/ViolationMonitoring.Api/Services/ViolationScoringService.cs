using ViolationMonitoring.Api.Domain;

namespace ViolationMonitoring.Api.Services;

public interface IViolationScoringService
{
    int CalculatePoints(ViolationType type, SeverityLevel severity);
}

public class ViolationScoringService : IViolationScoringService
{
    public int CalculatePoints(ViolationType type, SeverityLevel severity)
    {
        var factor = severity switch
        {
            SeverityLevel.Low => 1.0m,
            SeverityLevel.Medium => 1.5m,
            SeverityLevel.High => 2.0m,
            _ => 1.0m
        };
        return (int)Math.Ceiling(type.DefaultPoints * factor);
    }
}
