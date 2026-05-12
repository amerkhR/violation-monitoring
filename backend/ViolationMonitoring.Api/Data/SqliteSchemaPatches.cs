using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace ViolationMonitoring.Api.Data;

/// <summary>
/// Точечные правки схемы SQLite: выполняем ALTER только при необходимости, чтобы не писать в лог ошибки EF на «ожидаемых» сбоях.
/// </summary>
internal static class SqliteSchemaPatches
{
    public static async Task ApplyAsync(DatabaseFacade database)
    {
        await database.OpenConnectionAsync();
        try
        {
            var conn = database.GetDbConnection();
            if (await ColumnExistsAsync(conn, "Violations", "Severity"))
            {
                try
                {
                    await database.ExecuteSqlRawAsync("ALTER TABLE Violations DROP COLUMN Severity;");
                }
                catch
                {
                    /* старый SQLite без DROP COLUMN */
                }
            }

            if (!await ColumnExistsAsync(conn, "Reports", "PdfPath"))
            {
                await database.ExecuteSqlRawAsync("ALTER TABLE Reports ADD COLUMN PdfPath TEXT;");
            }
        }
        finally
        {
            await database.CloseConnectionAsync();
        }
    }

    private static async Task<bool> ColumnExistsAsync(DbConnection connection, string table, string column)
    {
        if (table is not ("Violations" or "Reports" or "Employees"))
        {
            return false;
        }

        await using var cmd = connection.CreateCommand();
        cmd.CommandText = $"PRAGMA table_info({table});";
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var name = reader["name"]?.ToString();
            if (string.Equals(name, column, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
