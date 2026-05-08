using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ViolationMonitoring.Api.Contracts;
using ViolationMonitoring.Api.Data;
using ViolationMonitoring.Api.Domain;
using ViolationMonitoring.Api.Services;

namespace ViolationMonitoring.Api.Controllers;

[ApiController]
[Route("api/inspectors")]
[Authorize(Roles = nameof(UserRole.Admin))]
public class InspectorsController(AppDbContext db, IPasswordHasher passwordHasher) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await db.Users
            .Where(x => x.Role == UserRole.Inspector)
            .OrderBy(x => x.FullName)
            .Select(x => new { x.Id, x.Login, x.FullName, x.IsActive })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] InspectorCreateRequest request)
    {
        var exists = await db.Users.AnyAsync(x => x.Login == request.Login);
        if (exists) return BadRequest("Login already exists.");

        var inspector = new User
        {
            Login = request.Login,
            FullName = request.FullName,
            Role = UserRole.Inspector,
            IsActive = request.IsActive,
            PasswordHash = passwordHasher.Hash(request.Password)
        };
        db.Users.Add(inspector);
        await db.SaveChangesAsync();
        return Ok(new { inspector.Id, inspector.Login, inspector.FullName, inspector.IsActive });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] InspectorUpdateRequest request)
    {
        var inspector = await db.Users.FirstOrDefaultAsync(x => x.Id == id && x.Role == UserRole.Inspector);
        if (inspector is null) return NotFound();
        inspector.FullName = request.FullName;
        inspector.IsActive = request.IsActive;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var inspector = await db.Users.FirstOrDefaultAsync(x => x.Id == id && x.Role == UserRole.Inspector);
        if (inspector is null) return NotFound();
        db.Users.Remove(inspector);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
