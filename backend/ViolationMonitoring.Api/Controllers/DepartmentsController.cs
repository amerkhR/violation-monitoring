using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ViolationMonitoring.Api.Data;

namespace ViolationMonitoring.Api.Controllers;

[ApiController]
[Route("api/departments")]
[Authorize]
public class DepartmentsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await db.Departments.OrderBy(x => x.Name).ToListAsync());
}
