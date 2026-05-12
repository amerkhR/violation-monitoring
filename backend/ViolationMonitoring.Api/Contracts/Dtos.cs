using System.Text.Json.Serialization;
using ViolationMonitoring.Api.Domain;

namespace ViolationMonitoring.Api.Contracts;

public record LoginRequest(string Login, string Password);
public record LoginResponse(string Token, string FullName, string Role);

public record EmployeeCreateRequest(string FullName, int DepartmentId, string Position, DateOnly HireDate, EmployeeRole Role);
public record EmployeeUpdateRequest(string FullName, int DepartmentId, string Position, DateOnly HireDate, bool IsActive, EmployeeRole Role);

public record ViolationTypeRequest(string Name, int DefaultPoints, SeverityLevel SeverityDefault, bool IsActive);
public record InspectorCreateRequest(string Login, string Password, string FullName, bool IsActive);
public record InspectorUpdateRequest(string FullName, bool IsActive);

public record UserCreateRequest(
    string Login,
    string Password,
    string FullName,
    UserRole Role,
    bool IsActive,
    int DepartmentId,
    string Position,
    DateOnly HireDate);

public record UserUpdateRequest(
    string Login,
    string FullName,
    UserRole Role,
    bool IsActive,
    int DepartmentId,
    string Position,
    DateOnly HireDate);

public record UserPasswordUpdateRequest(string CurrentPassword, string NewPassword);

public enum ReportPeriod
{
    Daily,
    Monthly,
    Quarterly,
    Yearly
}

public record ReportCreateRequest([property: JsonPropertyName("period")] ReportPeriod Period);

public record ViolationCreateRequest(
    int EmployeeId,
    int ViolationTypeId,
    DateTime DateTimeUtc,
    string? Description = null);

public record ViolationUpdateRequest(
    int EmployeeId,
    int ViolationTypeId,
    DateTime DateTimeUtc,
    string? Description = null);
