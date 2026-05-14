namespace ViolationMonitoring.Api.Domain;

public class AuditLog
{
    public int Id { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    /// <summary>Краткое название операции для отображения в журнале.</summary>
    public string OperationName { get; set; } = string.Empty;
    /// <summary>Идентификатор пользователя (если известен); без FK, чтобы журнал не ломал сохранение нарушений.</summary>
    public int? UserId { get; set; }
    /// <summary>ФИО или логин на момент записи.</summary>
    public string AuthorDisplay { get; set; } = string.Empty;
}
