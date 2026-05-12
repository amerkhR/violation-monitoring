using System.Data;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using ViolationMonitoring.Api.Domain;
using ViolationMonitoring.Api.Services;

namespace ViolationMonitoring.Api.Data;

public static class SeedData
{
    private const string TabNumberPattern = @"^#\d{5}$";
    public static void Initialize(AppDbContext db, IPasswordHasher passwordHasher)
    {
        EnsureTabNumbers(db);

        if (!db.Users.Any())
        {
            db.Users.AddRange(
                new User
                {
                    Login = "admin",
                    FullName = "System Administrator",
                    Role = UserRole.Admin,
                    PasswordHash = passwordHasher.Hash("Admin123!")
                },
                new User
                {
                    Login = "inspector",
                    FullName = "Main Inspector",
                    Role = UserRole.Inspector,
                    PasswordHash = passwordHasher.Hash("Inspector123!")
                });
        }

        if (!db.Departments.Any())
        {
            db.Departments.AddRange(
                new Department { Name = "Производственный цех" },
                new Department { Name = "Склад" },
                new Department { Name = "Отдел технического контроля" },
                new Department { Name = "Ремонтно-механический отдел" },
                new Department { Name = "Отдел главного энергетика" },
                new Department { Name = "Бухгалтерия" },
                new Department { Name = "Отдел кадров" },
                new Department { Name = "Служба охраны труда" },
                new Department { Name = "Транспортный отдел" },
                new Department { Name = "Охрана" });
        }

        if (!db.ViolationTypes.Any())
        {
            db.ViolationTypes.AddRange(
                new ViolationType { Name = "Отсутствие каски", DefaultPoints = 2 },
                new ViolationType { Name = "Курение", DefaultPoints = 3 },
                new ViolationType { Name = "Опоздание", DefaultPoints = 1 },
                new ViolationType { Name = "Нарушение техники безопасности", DefaultPoints = 5 });
        }

        db.SaveChanges();
        EnsureInspectorsHaveEmployees(db);
    }

    private static void EnsureInspectorsHaveEmployees(AppDbContext db)
    {
        var firstDept = db.Departments.OrderBy(d => d.Id).FirstOrDefault();
        if (firstDept is null)
        {
            return;
        }

        var inspectors = db.Users.Where(u => u.Role == UserRole.Inspector && u.EmployeeId == null).ToList();
        foreach (var user in inspectors)
        {
            var tabNumber = TabNumberGenerator.GenerateUniqueAsync(db).GetAwaiter().GetResult();
            var employee = new Employee
            {
                FullName = user.FullName,
                DepartmentId = firstDept.Id,
                Position = "Инспектор",
                HireDate = DateOnly.FromDateTime(DateTime.UtcNow),
                IsActive = true,
                Role = EmployeeRole.Inspector,
                TabNumber = tabNumber
            };
            db.Employees.Add(employee);
            db.SaveChanges();
            user.EmployeeId = employee.Id;
            db.SaveChanges();
        }
    }

    private static void EnsureTabNumbers(AppDbContext db)
    {
        EnsureTabNumberColumn(db);

        var employees = db.Employees
            .OrderBy(e => e.Id)
            .ToList();

        var used = new HashSet<string>(StringComparer.Ordinal);
        var changed = false;

        foreach (var employee in employees)
        {
            var current = string.IsNullOrWhiteSpace(employee.TabNumber) ? null : employee.TabNumber.Trim();

            var isValid = current is not null && System.Text.RegularExpressions.Regex.IsMatch(current, TabNumberPattern);

            // Генерируем номер, если его нет, если формат неверный, либо если обнаружен дубль.
            if (current is null || !isValid || used.Contains(current))
            {
                var tabNumber = GenerateUnusedTabNumber(used);
                employee.TabNumber = tabNumber;
                used.Add(tabNumber);
                changed = true;
                continue;
            }

            used.Add(current);
        }

        if (changed)
        {
            db.SaveChanges();
        }

        // На всякий случай: создаём уникальный индекс, чтобы гарантировать отсутствие повторов.
        // Если уникальный индекс не получится (например, из-за старых дублей), приложение продолжит работать,
        // а следующий апдейт табельных номеров должен их устранить.
        try
        {
            // Имя таблицы фиксировано: предупреждение EF1002 на интерполированный идентификатор не нужен.
            db.Database.ExecuteSqlRaw(
                "CREATE UNIQUE INDEX IF NOT EXISTS IX_Employees_TabNumber ON Employees(TabNumber);");
        }
        catch
        {
            // ignore
        }
    }

    private static void EnsureTabNumberColumn(AppDbContext db)
    {
        var tableName = db.Model.FindEntityType(typeof(Employee))?.GetTableName() ?? "Employees";

        var conn = db.Database.GetDbConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = $"PRAGMA table_info({tableName});";

        if (conn.State != ConnectionState.Open)
        {
            conn.Open();
        }

        var hasColumn = false;
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                // pragma output: cid, name, type, notnull, dflt_value, pk
                var name = reader["name"]?.ToString();
                if (string.Equals(name, "TabNumber", StringComparison.OrdinalIgnoreCase))
                {
                    hasColumn = true;
                    break;
                }
            }
        }

        if (!hasColumn)
        {
            using var alterCmd = conn.CreateCommand();
            alterCmd.CommandText = $"ALTER TABLE {tableName} ADD COLUMN TabNumber TEXT;";
            alterCmd.ExecuteNonQuery();
        }
    }

    private static string GenerateUnusedTabNumber(HashSet<string> used)
    {
        for (var attempt = 0; attempt < 10000; attempt++)
        {
            var num = RandomNumberGenerator.GetInt32(0, 100_000);
            var candidate = $"#{num.ToString("D5")}";
            if (!used.Contains(candidate))
            {
                return candidate;
            }
        }

        throw new InvalidOperationException("Не удалось сгенерировать уникальный табельный номер.");
    }
}
