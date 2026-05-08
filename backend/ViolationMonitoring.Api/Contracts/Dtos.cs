using ViolationMonitoring.Api.Domain;

namespace ViolationMonitoring.Api.Contracts;

public record LoginRequest(string Login, string Password);
public record LoginResponse(string Token, string FullName, string Role);

public record EmployeeCreateRequest(string FullName, int DepartmentId, string Position, DateOnly HireDate, EmployeeRole Role);
public record EmployeeUpdateRequest(string FullName, int DepartmentId, string Position, DateOnly HireDate, bool IsActive, EmployeeRole Role);

public record ViolationTypeRequest(string Name, int DefaultPoints, SeverityLevel SeverityDefault, bool IsActive);
public record InspectorCreateRequest(string Login, string Password, string FullName, bool IsActive);
public record InspectorUpdateRequest(string FullName, bool IsActive);
public record ReportCreateRequest(string Type, string ParamsJson);

public record ViolationCreateRequest(
    int EmployeeId,
    int ViolationTypeId,
    string Description,
    SeverityLevel Severity,
    DateTime DateTimeUtc);

public record ViolationUpdateRequest(
    int EmployeeId,
    int ViolationTypeId,
    string Description,
    SeverityLevel Severity,
    DateTime DateTimeUtc);
