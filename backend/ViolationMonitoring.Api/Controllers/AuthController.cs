using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ViolationMonitoring.Api.Contracts;
using ViolationMonitoring.Api.Data;
using ViolationMonitoring.Api.Services;

namespace ViolationMonitoring.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, IPasswordHasher passwordHasher, IJwtTokenService jwtTokenService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(x => x.Login == request.Login && x.IsActive);
        if (user is null || !passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid login or password.");
        }

        var token = jwtTokenService.Create(user);
        return Ok(new LoginResponse(token, user.FullName, user.Role.ToString()));
    }
}
