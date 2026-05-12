using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ViolationMonitoring.Api.Contracts;
using ViolationMonitoring.Api.Data;
using ViolationMonitoring.Api.Domain;
using ViolationMonitoring.Api.Services;

namespace ViolationMonitoring.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = $"{nameof(UserRole.Admin)},{nameof(UserRole.Inspector)}")]
public class ReportsController(AppDbContext db, IWebHostEnvironment env) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetCurrentUserId();
        var isAdmin = User.IsInRole(nameof(UserRole.Admin));

        var reports = await db.Reports
            .AsNoTracking()
            .Where(r => isAdmin || r.CreatedBy == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(200)
            .ToListAsync();

        if (reports.Count == 0)
        {
            return Ok(Array.Empty<object>());
        }

        var authorIds = reports.Select(r => r.CreatedBy).Distinct().ToList();
        var authors = await db.Users
            .AsNoTracking()
            .Where(u => authorIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName);

        var result = reports.Select(r =>
        {
            ReportPeriod? period = null;
            try
            {
                period = Enum.Parse<ReportPeriod>(r.Type, ignoreCase: true);
            }
            catch
            {
                /* старые записи */
            }

            return new
            {
                r.Id,
                CreatedAt = ReportTimeDisplay.AssumeUtc(r.CreatedAt),
                r.Type,
                PeriodLabel = period is null ? r.Type : ReportPeriodHelper.ToRussianLabel(period.Value),
                r.ParamsJson,
                r.PdfPath,
                AuthorFullName = authors.GetValueOrDefault(r.CreatedBy) ?? "—",
                r.CreatedBy
            };
        });

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Inspector))]
    public async Task<IActionResult> Create([FromBody] ReportCreateRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
        {
            return Unauthorized();
        }

        var user = await db.Users
            .Include(u => u.Employee)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
        {
            return Unauthorized();
        }

        if (user.Employee is not null)
        {
            var tabChanged = await TabNumberGenerator.EnsureEmployeeTabNumberAsync(db, user.Employee);
            if (tabChanged)
            {
                await db.SaveChangesAsync();
            }
        }

        var nowUtc = DateTime.UtcNow;
        var (fromUtc, toUtc) = ReportPeriodHelper.GetUtcRange(request.Period, nowUtc);

        var violations = await db.Violations
            .AsNoTracking()
            .Include(v => v.ViolationType)
            .Include(v => v.Employee)
            .ThenInclude(e => e!.Department)
            .Where(v => v.DateTimeUtc >= fromUtc && v.DateTimeUtc <= toUtc)
            .ToListAsync();

        var byType = violations
            .GroupBy(v => v.ViolationType?.Name ?? "Не указано")
            .Select(g => (Label: g.Key, Count: g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var byDept = violations
            .GroupBy(v => v.Employee?.Department?.Name ?? "Без отдела")
            .Select(g => (Label: g.Key, Count: g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var topEmployees = violations
            .GroupBy(v => v.Employee?.FullName ?? "Неизвестно")
            .Select(g => (EmployeeName: g.Key, Count: g.Count()))
            .OrderByDescending(x => x.Count)
            .ThenBy(x => x.EmployeeName)
            .Take(15)
            .ToList();

        var tabLine = user.Employee?.TabNumber is { } tn && !string.IsNullOrWhiteSpace(tn)
            ? $"Табельный номер: {tn}"
            : "Табельный номер: —";

        var createdLocal = ReportTimeDisplay.FormatReportLocal(nowUtc);
        var rangeText = $"{ReportTimeDisplay.FormatReportLocal(fromUtc)} — {ReportTimeDisplay.FormatReportLocal(toUtc)}";
        var periodRu = ReportPeriodHelper.ToRussianLabel(request.Period);

        var pdfBytes = ReportPdfBuilder.Build(
            $"Автор отчёта: {user.FullName}",
            tabLine,
            createdLocal,
            periodRu,
            rangeText,
            byType,
            byDept,
            topEmployees);

        const string pdfRelative = "/uploads/reports";
        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var absDir = Path.Combine(webRoot, "uploads", "reports");
        Directory.CreateDirectory(absDir);
        var fileName = $"{Guid.NewGuid():N}.pdf";
        var absPath = Path.Combine(absDir, fileName);
        await System.IO.File.WriteAllBytesAsync(absPath, pdfBytes);
        var pdfPath = $"{pdfRelative}/{fileName}";

        var paramsJson = JsonSerializer.Serialize(new { fromUtc, toUtc }, JsonOpts);

        var report = new Report
        {
            Type = request.Period.ToString(),
            ParamsJson = paramsJson,
            CreatedAt = nowUtc,
            CreatedBy = userId,
            PdfPath = pdfPath
        };
        db.Reports.Add(report);
        await db.SaveChangesAsync();

        return Ok(new
        {
            report.Id,
            CreatedAt = ReportTimeDisplay.AssumeUtc(report.CreatedAt),
            report.Type,
            PeriodLabel = periodRu,
            report.ParamsJson,
            report.PdfPath,
            AuthorFullName = user.FullName
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var report = await db.Reports.FirstOrDefaultAsync(r => r.Id == id);
        if (report is null)
        {
            return NotFound();
        }

        var userId = GetCurrentUserId();
        var isAdmin = User.IsInRole(nameof(UserRole.Admin));
        if (!isAdmin && report.CreatedBy != userId)
        {
            return Forbid();
        }

        if (!string.IsNullOrWhiteSpace(report.PdfPath))
        {
            var trimmed = report.PdfPath.TrimStart('/');
            var physical = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), trimmed.Replace('/', Path.DirectorySeparatorChar));
            if (System.IO.File.Exists(physical))
            {
                System.IO.File.Delete(physical);
            }
        }

        db.Reports.Remove(report);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private int GetCurrentUserId()
    {
        var raw = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0";
        return int.TryParse(raw, out var id) ? id : 0;
    }
}
