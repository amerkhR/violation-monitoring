using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ViolationMonitoring.Api.Contracts;
using ViolationMonitoring.Api.Data;
using ViolationMonitoring.Api.Domain;
using ViolationMonitoring.Api.Services;

namespace ViolationMonitoring.Api.Controllers;

[ApiController]
[Route("api/employees")]
[Authorize]
public class EmployeesController(AppDbContext db, IWebHostEnvironment env) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] bool includeUnlinked = false)
    {
        var query = db.Employees
            .Include(x => x.Department)
            .Include(x => x.Violations)
            .AsQueryable();

        // В списках по умолчанию только сотрудники с учётной записью (нет «хвостов» после удаления User).
        // Админ может запросить ?includeUnlinked=true на странице «Сотрудники», чтобы видеть добавленных только как Employee.
        var showUnlinked = User.IsInRole(nameof(UserRole.Admin)) && includeUnlinked;
        if (!showUnlinked)
        {
            query = query.Where(e => db.Users.Any(u => u.EmployeeId == e.Id));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.FullName.Contains(search));
        }

        var employees = await query.ToListAsync();

        var duplicateTabNumbers = employees
            .Where(e => TabNumberGenerator.IsValidFormat(e.TabNumber))
            .GroupBy(e => e.TabNumber!)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToHashSet();

        var changed = false;
        foreach (var employee in employees)
        {
            if (!TabNumberGenerator.IsValidFormat(employee.TabNumber) ||
                (employee.TabNumber is not null && duplicateTabNumbers.Contains(employee.TabNumber)))
            {
                employee.TabNumber = await TabNumberGenerator.GenerateUniqueAsync(db);
                changed = true;
            }
        }

        if (changed)
        {
            await db.SaveChangesAsync();
        }

        var items = employees.Select(x => new
        {
            x.Id,
            x.TabNumber,
            x.FullName,
            Department = x.Department!.Name,
            x.Position,
            x.PhotoPath,
            x.HireDate,
            ViolationCount = x.Violations.Count,
            PenaltyPoints = x.Violations.Sum(v => (int?)v.PenaltyPoints) ?? 0,
            x.IsActive,
            x.Role
        }).ToList();

        return Ok(items);
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Create([FromBody] EmployeeCreateRequest request)
    {
        var entity = new Employee
        {
            FullName = request.FullName,
            DepartmentId = request.DepartmentId,
            Position = request.Position,
            HireDate = request.HireDate,
            Role = request.Role,
            TabNumber = await TabNumberGenerator.GenerateUniqueAsync(db)
        };
        db.Employees.Add(entity);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = entity.Id }, entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Update(int id, [FromBody] EmployeeUpdateRequest request)
    {
        var entity = await db.Employees.FindAsync(id);
        if (entity is null) return NotFound();
        entity.FullName = request.FullName;
        entity.DepartmentId = request.DepartmentId;
        entity.Position = request.Position;
        entity.HireDate = request.HireDate;
        entity.IsActive = request.IsActive;
        entity.Role = request.Role;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await db.Employees.FindAsync(id);
        if (entity is null) return NotFound();
        db.Employees.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/photo")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> UploadPhoto(int id, IFormFile photo)
    {
        var employee = await db.Employees.FindAsync(id);
        if (employee is null) return NotFound();
        if (photo.Length == 0) return BadRequest("Photo file is empty.");

        var ext = Path.GetExtension(photo.FileName).ToLowerInvariant();
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowed.Contains(ext)) return BadRequest("Unsupported photo format.");

        var root = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads", "employee-photos");
        Directory.CreateDirectory(root);
        var fileName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(root, fileName);
        await using var stream = System.IO.File.Create(fullPath);
        await photo.CopyToAsync(stream);

        employee.PhotoPath = $"/uploads/employee-photos/{fileName}";
        await db.SaveChangesAsync();
        return Ok(new { employee.Id, employee.PhotoPath });
    }
}
