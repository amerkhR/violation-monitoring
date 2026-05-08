using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ViolationMonitoring.Api.Data;
using ViolationMonitoring.Api.Domain;

namespace ViolationMonitoring.Api.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController(AppDbContext db) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var total = await db.Violations.CountAsync();
        var totalPoints = await db.Violations.SumAsync(x => (int?)x.PenaltyPoints) ?? 0;
        return Ok(new { totalViolations = total, totalPenaltyPoints = totalPoints });
    }

    [HttpGet("by-departments")]
    public async Task<IActionResult> ByDepartments()
    {
        var data = await db.Violations
            .Include(v => v.Employee!)
            .ThenInclude(e => e.Department)
            .GroupBy(x => x.Employee!.Department!.Name)
            .Select(g => new { department = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("top-employees")]
    public async Task<IActionResult> TopEmployees([FromQuery] int limit = 10)
    {
        var data = await db.Violations
            .Include(x => x.Employee)
            .GroupBy(x => x.Employee!.FullName)
            .Select(g => new
            {
                employee = g.Key,
                violations = g.Count(),
                points = g.Sum(v => v.PenaltyPoints)
            })
            .OrderByDescending(x => x.violations)
            .Take(limit)
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("by-violation-types")]
    public async Task<IActionResult> ByTypes()
    {
        var data = await db.Violations
            .Include(x => x.ViolationType)
            .GroupBy(x => x.ViolationType!.Name)
            .Select(g => new { type = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToListAsync();
        return Ok(data);
    }
}
