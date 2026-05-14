using ViolationMonitoring.Api.Domain;

namespace ViolationMonitoring.Api.Data;

public static class AppDbContextAuditLogExtensions
{
    public static void AppendOperationLog(this AppDbContext db, int? userId, string authorDisplay, string operationName)
    {
        db.AuditLogs.Add(new AuditLog
        {
            CreatedAtUtc = DateTime.UtcNow,
            UserId = userId,
            AuthorDisplay = string.IsNullOrWhiteSpace(authorDisplay) ? "—" : authorDisplay.Trim(),
            OperationName = operationName
        });
    }
}
