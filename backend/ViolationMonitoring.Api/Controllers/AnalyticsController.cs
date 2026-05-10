using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
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
    public async Task<IActionResult> ByTypes([FromQuery] bool employeeOnly = false)
    {
        var query = db.Violations
            .Include(x => x.ViolationType)
            .Include(x => x.Employee)
            .AsQueryable();

        if (employeeOnly || User.IsInRole(nameof(UserRole.Employee)))
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId <= 0)
            {
                return Unauthorized();
            }

            var user = await db.Users.FirstOrDefaultAsync(x => x.Id == currentUserId);
            if (user?.EmployeeId == null)
            {
                return Ok(new List<object>());
            }

            query = query.Where(x => x.EmployeeId == user.EmployeeId);
        }

        var data = await query
            .GroupBy(x => x.ViolationType!.Name)
            .Select(g => new { type = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("user-stats")]
    public async Task<IActionResult> UserStats()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId <= 0)
        {
            return Unauthorized();
        }

        var user = await db.Users
            .Include(x => x.Employee)
            .FirstOrDefaultAsync(x => x.Id == currentUserId);

        if (user?.EmployeeId == null)
        {
            return Ok(new { violations = 0, penaltyPoints = 0 });
        }

        var violations = await db.Violations
            .Where(x => x.EmployeeId == user.EmployeeId)
            .ToListAsync();

        return Ok(new
        {
            violations = violations.Count,
            penaltyPoints = violations.Sum(x => x.PenaltyPoints)
        });
    }

    private int GetCurrentUserId()
    {
        var raw = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)
            ?? "0";
        return int.TryParse(raw, out var value) ? value : 0;
    }
}
