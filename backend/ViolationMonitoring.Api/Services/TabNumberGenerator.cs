using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using ViolationMonitoring.Api.Data;
using ViolationMonitoring.Api.Domain;

namespace ViolationMonitoring.Api.Services;

public static class TabNumberGenerator
{
    private const int TabNumberMin = 0;
    private const int TabNumberMaxExclusive = 100_000; // 5 цифр: 00000..99999
    private const string TabNumberPattern = @"^#\d{5}$";

    public static async Task<string> GenerateUniqueAsync(AppDbContext db, int maxAttempts = 1000)
    {
        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            var candidate = GenerateRandomCandidate();
            var exists = await db.Employees.AnyAsync(e => e.TabNumber == candidate);
            if (!exists)
            {
                return candidate;
            }
        }

        throw new InvalidOperationException("Не удалось сгенерировать уникальный табельный номер.");
    }

    private static string GenerateRandomCandidate()
    {
        var num = RandomNumberGenerator.GetInt32(TabNumberMin, TabNumberMaxExclusive);
        // Табельный номер: # + 5 цифр (например, #00042)
        return $"#{num.ToString("D5")}";
    }

    public static bool IsValidFormat(string? tabNumber)
    {
        return !string.IsNullOrWhiteSpace(tabNumber) && Regex.IsMatch(tabNumber.Trim(), TabNumberPattern);
    }

    public static async Task<bool> EnsureEmployeeTabNumberAsync(AppDbContext db, Employee employee)
    {
        if (employee.TabNumber is null || !IsValidFormat(employee.TabNumber))
        {
            employee.TabNumber = await GenerateUniqueAsync(db);
            return true;
        }

        // Если внезапно встретились дубликаты (например, из старых данных), исправим для текущего сотрудника.
        var count = await db.Employees.CountAsync(e => e.TabNumber == employee.TabNumber);
        if (count <= 1) return false;

        employee.TabNumber = await GenerateUniqueAsync(db);
        return true;
    }
}

