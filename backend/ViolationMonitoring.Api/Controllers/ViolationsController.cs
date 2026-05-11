using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ViolationMonitoring.Api.Contracts;
using ViolationMonitoring.Api.Data;
using ViolationMonitoring.Api.Domain;
using ViolationMonitoring.Api.Services;

namespace ViolationMonitoring.Api.Controllers;

[ApiController]
[Route("api/violations")]
[Authorize]
public class ViolationsController(AppDbContext db, IViolationScoringService scoringService, IWebHostEnvironment env) : ControllerBase
{
    private const long MaxImageSizeBytes = 10 * 1024 * 1024;
    private const long MaxVideoSizeBytes = 100 * 1024 * 1024;
    private static readonly HashSet<string> AllowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private static readonly HashSet<string> AllowedVideoExtensions = [".mp4", ".mov", ".avi", ".webm"];

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? employeeId,
        [FromQuery] int? violationTypeId,
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc)
    {
        var query = db.Violations
            .Include(x => x.Employee)
            .Include(x => x.ViolationType)
            .Include(x => x.Inspector)
            .AsQueryable();

        if (employeeId.HasValue) query = query.Where(x => x.EmployeeId == employeeId.Value);
        if (violationTypeId.HasValue) query = query.Where(x => x.ViolationTypeId == violationTypeId.Value);
        if (fromUtc.HasValue) query = query.Where(x => x.DateTimeUtc >= fromUtc.Value);
        if (toUtc.HasValue) query = query.Where(x => x.DateTimeUtc <= toUtc.Value);

        var items = await query.OrderByDescending(x => x.DateTimeUtc)
            .Select(x => new
            {
                x.Id,
                x.EmployeeId,
                Employee = x.Employee!.FullName,
                x.ViolationTypeId,
                ViolationType = x.ViolationType!.Name,
                x.Description,
                x.Severity,
                x.DateTimeUtc,
                x.InspectorId,
                Inspector = x.Inspector!.FullName,
                x.PhotoPath,
                x.VideoPath,
                x.PenaltyPoints
            })
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("my-violations")]
    public async Task<IActionResult> GetMyViolations()
    {
        var employeeId = await GetCurrentEmployeeIdAsync();
        if (employeeId == 0)
        {
            return Unauthorized();
        }

        var items = await db.Violations
            .Include(x => x.Employee)
            .Include(x => x.ViolationType)
            .Include(x => x.Inspector)
            .Where(x => x.EmployeeId == employeeId)
            .OrderByDescending(x => x.DateTimeUtc)
            .Select(x => new
            {
                x.Id,
                x.EmployeeId,
                Employee = x.Employee!.FullName,
                x.ViolationTypeId,
                ViolationType = x.ViolationType!.Name,
                x.Description,
                x.Severity,
                x.DateTimeUtc,
                x.InspectorId,
                Inspector = x.Inspector!.FullName,
                x.PhotoPath,
                x.VideoPath,
                x.PenaltyPoints
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    [Authorize(Roles = $"{nameof(UserRole.Admin)},{nameof(UserRole.Inspector)}")]
    public async Task<IActionResult> Create([FromForm] ViolationCreateRequest request, IFormFile? photo, IFormFile? video)
    {
        try
        {
            var type = await db.ViolationTypes.FirstOrDefaultAsync(x => x.Id == request.ViolationTypeId && x.IsActive);
            if (type is null) return BadRequest("Violation type not found.");

            var inspectorId = int.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (inspectorId <= 0) return Unauthorized();

            string? photoPath = null;
            string? videoPath = null;

            if (photo is not null)
            {
                ValidateFile(photo, AllowedImageExtensions, MaxImageSizeBytes, "photo");
                photoPath = await SaveFile(photo, "images");
            }

            if (video is not null)
            {
                ValidateFile(video, AllowedVideoExtensions, MaxVideoSizeBytes, "video");
                videoPath = await SaveFile(video, "videos");
            }

            var points = scoringService.CalculatePoints(type, request.Severity);
            var entity = new Violation
            {
                EmployeeId = request.EmployeeId,
                ViolationTypeId = request.ViolationTypeId,
                Description = request.Description ?? string.Empty,
                Severity = request.Severity,
                DateTimeUtc = request.DateTimeUtc,
                InspectorId = inspectorId,
                PhotoPath = photoPath,
                VideoPath = videoPath,
                PenaltyPoints = points
            };
            db.Violations.Add(entity);
            await db.SaveChangesAsync();
            return Ok(entity);
        }
        catch (BadHttpRequestException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error creating violation: {ex.Message}");
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{nameof(UserRole.Admin)},{nameof(UserRole.Inspector)}")]
    public async Task<IActionResult> Update(int id, [FromForm] ViolationUpdateRequest request, IFormFile? photo, IFormFile? video)
    {
        try
        {
            var entity = await db.Violations.FindAsync(id);
            if (entity is null) return NotFound();

            var inspectorId = GetCurrentUserId();
            if (inspectorId <= 0) return Unauthorized();
            var isAdmin = User.IsInRole(nameof(UserRole.Admin));
            if (!isAdmin && entity.InspectorId != inspectorId) return Forbid();

            var type = await db.ViolationTypes.FirstOrDefaultAsync(x => x.Id == request.ViolationTypeId && x.IsActive);
            if (type is null) return BadRequest("Violation type not found.");

            entity.EmployeeId = request.EmployeeId;
            entity.ViolationTypeId = request.ViolationTypeId;
            entity.Description = request.Description ?? string.Empty;
            entity.Severity = request.Severity;
            entity.DateTimeUtc = request.DateTimeUtc;
            entity.PenaltyPoints = scoringService.CalculatePoints(type, request.Severity);

            if (photo is not null)
            {
                ValidateFile(photo, AllowedImageExtensions, MaxImageSizeBytes, "photo");
                entity.PhotoPath = await SaveFile(photo, "images");
            }

            if (video is not null)
            {
                ValidateFile(video, AllowedVideoExtensions, MaxVideoSizeBytes, "video");
                entity.VideoPath = await SaveFile(video, "videos");
            }

            await db.SaveChangesAsync();
            return NoContent();
        }
        catch (BadHttpRequestException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error updating violation: {ex.Message}");
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = $"{nameof(UserRole.Admin)},{nameof(UserRole.Inspector)}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await db.Violations.FindAsync(id);
        if (entity is null) return NotFound();

        var inspectorId = GetCurrentUserId();
        if (inspectorId <= 0) return Unauthorized();
        var isAdmin = User.IsInRole(nameof(UserRole.Admin));
        if (!isAdmin && entity.InspectorId != inspectorId) return Forbid();

        db.Violations.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string> SaveFile(IFormFile file, string category)
    {
        var root = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads", category);
        Directory.CreateDirectory(root);
        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(root, fileName);
        await using var stream = System.IO.File.Create(fullPath);
        await file.CopyToAsync(stream);
        return $"/uploads/{category}/{fileName}";
    }

    private static void ValidateFile(IFormFile file, HashSet<string> allowedExtensions, long maxSizeBytes, string fieldName)
    {
        if (file.Length == 0)
        {
            throw new BadHttpRequestException($"{fieldName} file is empty.");
        }

        if (file.Length > maxSizeBytes)
        {
            throw new BadHttpRequestException($"{fieldName} file exceeds max allowed size.");
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(ext))
        {
            throw new BadHttpRequestException($"{fieldName} file extension '{ext}' is not allowed.");
        }
    }

    private async Task<int> GetCurrentEmployeeIdAsync()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId <= 0)
        {
            return 0;
        }

        var user = await db.Users.FindAsync(currentUserId);
        return user?.EmployeeId ?? 0;
    }

    private int GetCurrentUserId()
    {
        var raw = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0";
        return int.TryParse(raw, out var value) ? value : 0;
    }
}
