namespace ViolationMonitoring.Api.Services;

/// <summary>
/// Время в отчётах: Europe/Moscow (постоянно UTC+3). Значения из SQLite приходят как Unspecified — считаем их уже в UTC.
/// </summary>
public static class ReportTimeDisplay
{
    private static readonly TimeSpan FallbackUtcPlus3 = TimeSpan.FromHours(3);

    private static TimeZoneInfo MoscowTimeZone { get; } = ResolveMoscowTimeZone();

    private static TimeZoneInfo ResolveMoscowTimeZone()
    {
        foreach (var id in new[] { "Europe/Moscow", "Russian Standard Time" })
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(id);
            }
            catch (TimeZoneNotFoundException)
            {
                /* next */
            }
            catch (InvalidTimeZoneException)
            {
                /* next */
            }
        }

        return TimeZoneInfo.CreateCustomTimeZone("UTC+3", FallbackUtcPlus3, "UTC+3", "UTC+3");
    }

    /// <summary>В БД для отчётов хранится момент UTC; SQLite часто отдаёт Kind=Unspecified.</summary>
    public static DateTime AssumeUtc(DateTime value) =>
        value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };

    public static string FormatReportLocal(DateTime utcOrUnspecified, string format = "dd.MM.yyyy HH:mm")
    {
        var utc = AssumeUtc(utcOrUnspecified);
        var utcMarked = DateTime.SpecifyKind(utc, DateTimeKind.Utc);
        try
        {
            return TimeZoneInfo.ConvertTimeFromUtc(utcMarked, MoscowTimeZone).ToString(format);
        }
        catch
        {
            return utc.Add(FallbackUtcPlus3).ToString(format);
        }
    }
}
