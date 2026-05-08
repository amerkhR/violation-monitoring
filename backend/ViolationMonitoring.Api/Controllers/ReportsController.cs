using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ViolationMonitoring.Api.Contracts;
using ViolationMonitoring.Api.Data;
using ViolationMonitoring.Api.Domain;

namespace ViolationMonitoring.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = nameof(UserRole.Admin))]
public class ReportsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await db.Reports
            .OrderByDescending(x => x.CreatedAt)
            .Take(100)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ReportCreateRequest request)
    {
        var userIdRaw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "0";
        var createdBy = int.TryParse(userIdRaw, out var parsed) ? parsed : 0;

        var report = new Report
        {
            Type = request.Type,
            ParamsJson = string.IsNullOrWhiteSpace(request.ParamsJson) ? "{}" : request.ParamsJson,
            CreatedBy = createdBy
        };
        db.Reports.Add(report);
        await db.SaveChangesAsync();
        return Ok(report);
    }
}
