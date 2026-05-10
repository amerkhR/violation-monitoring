using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ViolationMonitoring.Api.Contracts;
using ViolationMonitoring.Api.Data;
using ViolationMonitoring.Api.Domain;
using ViolationMonitoring.Api.Services;

namespace ViolationMonitoring.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(AppDbContext db, IPasswordHasher passwordHasher) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> GetAll()
    {
        var users = await db.Users
            .Include(x => x.Employee)        
            .ThenInclude(e => e.Department)
            .Select(x => new
            {
                x.Id,
                x.Login,
                x.FullName,
                Role = x.Role.ToString(),
                x.IsActive,
                Department = x.Employee == null ? null : x.Employee.Department == null ? null : x.Employee.Department.Name,
                Position = x.Employee == null ? null : x.Employee.Position,
                HireDate = x.Employee == null ? (DateOnly?)null : x.Employee.HireDate,
                PhotoPath = x.Employee == null ? null : x.Employee.PhotoPath,
                ViolationCount = x.Employee == null ? 0 : x.Employee.Violations.Count,
                PenaltyPoints = x.Employee == null ? 0 : x.Employee.Violations.Sum(v => (int?)v.PenaltyPoints) ?? 0
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == 0)
        {
            return Unauthorized();
        }

        var user = await db.Users
            .Include(x => x.Employee)
            .ThenInclude(e => e.Department)
            .FirstOrDefaultAsync(x => x.Id == currentUserId);

        if (user is null)
        {
            return NotFound();
        }

        var violationCount = 0;
        var penaltyPoints = 0;
        if (user.EmployeeId != null)
        {
            violationCount = await db.Violations.CountAsync(x => x.EmployeeId == user.EmployeeId);
            penaltyPoints = await db.Violations.Where(x => x.EmployeeId == user.EmployeeId).SumAsync(x => (int?)x.PenaltyPoints) ?? 0;
        }

        return Ok(new
        {
            user.Id,
            user.Login,
            user.FullName,
            Role = user.Role.ToString(),
            user.IsActive,
            Department = user.Employee?.Department?.Name,
            Position = user.Employee?.Position,
            HireDate = user.Employee?.HireDate,
            PhotoPath = user.Employee?.PhotoPath,
            ViolationCount = violationCount,
            PenaltyPoints = penaltyPoints
        });
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Create([FromBody] UserCreateRequest request)
    {
        if (await db.Users.AnyAsync(x => x.Login == request.Login))
        {
            return Conflict("Login already exists.");
        }

        var user = new User
        {
            Login = request.Login,
            FullName = request.FullName,
            Role = request.Role,
            IsActive = request.IsActive,
            PasswordHash = passwordHasher.Hash(request.Password)
        };

        if (request.Role != UserRole.Admin)
        {
            var employee = new Employee
            {
                FullName = request.FullName,
                DepartmentId = request.DepartmentId,
                Position = request.Position,
                HireDate = request.HireDate,
                Role = request.Role == UserRole.Inspector ? EmployeeRole.Inspector : EmployeeRole.Employee,
                IsActive = request.IsActive
            };
            db.Employees.Add(employee);
            await db.SaveChangesAsync();
            user.EmployeeId = employee.Id;
        }

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = user.Id }, new { user.Id });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Update(int id, [FromBody] UserUpdateRequest request)
    {
        var user = await db.Users.Include(x => x.Employee).FirstOrDefaultAsync(x => x.Id == id);
        if (user is null) return NotFound();

        if (user.Login != request.Login && await db.Users.AnyAsync(x => x.Login == request.Login))
        {
            return Conflict("Login already exists.");
        }

        user.Login = request.Login;
        user.FullName = request.FullName;
        user.Role = request.Role;
        user.IsActive = request.IsActive;

        if (request.Role != UserRole.Admin)
        {
            if (user.Employee is null)
            {
                var employee = new Employee
                {
                    FullName = request.FullName,
                    DepartmentId = request.DepartmentId,
                    Position = request.Position,
                    HireDate = request.HireDate,
                    Role = request.Role == UserRole.Inspector ? EmployeeRole.Inspector : EmployeeRole.Employee,
                    IsActive = request.IsActive
                };
                db.Employees.Add(employee);
                await db.SaveChangesAsync();
                user.EmployeeId = employee.Id;
            }
            else
            {
                user.Employee.FullName = request.FullName;
                user.Employee.DepartmentId = request.DepartmentId;
                user.Employee.Position = request.Position;
                user.Employee.HireDate = request.HireDate;
                user.Employee.Role = request.Role == UserRole.Inspector ? EmployeeRole.Inspector : EmployeeRole.Employee;
                user.Employee.IsActive = request.IsActive;
            }
        }

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id:int}/password")]
    public async Task<IActionResult> ChangePassword(int id, [FromBody] UserPasswordUpdateRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (!User.IsInRole(nameof(UserRole.Admin)) && currentUserId != id)
        {
            return Forbid();
        }

        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        if (!User.IsInRole(nameof(UserRole.Admin)))
        {
            if (!passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest("Current password is incorrect.");
            }
        }

        user.PasswordHash = passwordHasher.Hash(request.NewPassword);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/photo")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> UploadPhoto(int id, IFormFile photo, [FromServices] IWebHostEnvironment env)
    {
        var user = await db.Users.Include(x => x.Employee).FirstOrDefaultAsync(x => x.Id == id);
        if (user is null) return NotFound();
        if (user.Employee is null) return BadRequest("User has no employee profile.");
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

        user.Employee.PhotoPath = $"/uploads/employee-photos/{fileName}";
        await db.SaveChangesAsync();
        return Ok(new { user.Id, user.Employee.PhotoPath });
    }

    private int GetCurrentUserId()
    {
        var idValue = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idValue, out var id) ? id : 0;
    }
}
