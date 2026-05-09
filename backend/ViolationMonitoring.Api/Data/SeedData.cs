using ViolationMonitoring.Api.Domain;
using ViolationMonitoring.Api.Services;

namespace ViolationMonitoring.Api.Data;

public static class SeedData
{
    public static void Initialize(AppDbContext db, IPasswordHasher passwordHasher)
    {
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
    }
}
