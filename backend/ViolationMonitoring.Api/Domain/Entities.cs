namespace ViolationMonitoring.Api.Domain;

public enum UserRole
{
    Admin = 1,
    Inspector = 2,
    Employee = 3
}

public enum EmployeeRole
{
    Employee = 1,
    Inspector = 2
}

public enum SeverityLevel
{
    Low = 1,
    Medium = 2,
    High = 3
}

public class User
{
    public int Id { get; set; }
    public string Login { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }
}

public class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<Employee> Employees { get; set; } = [];
}

public class Employee
{
    public int Id { get; set; }
    // Табельный номер (5 цифр). Генерируется автоматически и должен быть уникальным.
    public string? TabNumber { get; set; }
    public string FullName { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public Department? Department { get; set; }
    public string Position { get; set; } = string.Empty;
    public string? PhotoPath { get; set; }
    public DateOnly HireDate { get; set; }
    public bool IsActive { get; set; } = true;
    public EmployeeRole Role { get; set; } = EmployeeRole.Employee;
    public List<Violation> Violations { get; set; } = [];
}

public class ViolationType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DefaultPoints { get; set; }
    public SeverityLevel SeverityDefault { get; set; } = SeverityLevel.Medium;
    public bool IsActive { get; set; } = true;
}

public class Violation
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public int ViolationTypeId { get; set; }
    public ViolationType? ViolationType { get; set; }
    public string Description { get; set; } = string.Empty;
    public SeverityLevel Severity { get; set; }
    public DateTime DateTimeUtc { get; set; } = DateTime.UtcNow;
    public int InspectorId { get; set; }
    public User? Inspector { get; set; }
    public string? PhotoPath { get; set; }
    public string? VideoPath { get; set; }
    public int PenaltyPoints { get; set; }
}

public class Report
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string ParamsJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedBy { get; set; }
}
