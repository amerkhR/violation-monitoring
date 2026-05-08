using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ViolationMonitoring.Api.Contracts;
using ViolationMonitoring.Api.Data;
using ViolationMonitoring.Api.Domain;

namespace ViolationMonitoring.Api.Controllers;

[ApiController]
[Route("api/violation-types")]
[Authorize]
public class ViolationTypesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await db.ViolationTypes.OrderBy(x => x.Name).ToListAsync());

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Create([FromBody] ViolationTypeRequest request)
    {
        var entity = new ViolationType
        {
            Name = request.Name,
            DefaultPoints = request.DefaultPoints,
            SeverityDefault = request.SeverityDefault,
            IsActive = request.IsActive
        };
        db.ViolationTypes.Add(entity);
        await db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Update(int id, [FromBody] ViolationTypeRequest request)
    {
        var entity = await db.ViolationTypes.FindAsync(id);
        if (entity is null) return NotFound();

        entity.Name = request.Name;
        entity.DefaultPoints = request.DefaultPoints;
        entity.SeverityDefault = request.SeverityDefault;
        entity.IsActive = request.IsActive;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await db.ViolationTypes.FindAsync(id);
        if (entity is null) return NotFound();
        db.ViolationTypes.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
