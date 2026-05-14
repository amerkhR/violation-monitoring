using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ViolationMonitoring.Api.Contracts;
using ViolationMonitoring.Api.Data;
using ViolationMonitoring.Api.Domain;
using ViolationMonitoring.Api.Services;

namespace ViolationMonitoring.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, IPasswordHasher passwordHasher, IJwtTokenService jwtTokenService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var attemptedLogin = string.IsNullOrWhiteSpace(request.Login) ? "—" : request.Login.Trim();

        var user = await db.Users.FirstOrDefaultAsync(x => x.Login == request.Login && x.IsActive);
        if (user is null || !passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            db.AppendOperationLog(null, attemptedLogin, AuditOperations.LoginFailed);
            await db.SaveChangesAsync();
            return Unauthorized("Invalid login or password.");
        }

        var token = jwtTokenService.Create(user);
        var author = string.IsNullOrWhiteSpace(user.FullName) ? user.Login : user.FullName.Trim();
        db.AppendOperationLog(user.Id, author, AuditOperations.Login);
        await db.SaveChangesAsync();
        return Ok(new LoginResponse(token, user.FullName, user.Role.ToString()));
    }
}
