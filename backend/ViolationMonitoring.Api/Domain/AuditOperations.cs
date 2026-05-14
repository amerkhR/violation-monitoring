namespace ViolationMonitoring.Api.Domain;

public static class AuditOperations
{
    public const string Login = "Вход в систему";
    public const string LoginFailed = "Неудачная попытка входа";
    public const string ViolationCreate = "Создание нарушения";
    public const string ViolationUpdate = "Редактирование нарушения";
    public const string ViolationDelete = "Удаление нарушения";
}
