using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace ViolationMonitoring.Api.Controllers;

[ApiController]
public class ErrorController : ControllerBase
{
    [Route("/error")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public IActionResult Error()
    {
        var feature = HttpContext.Features.Get<IExceptionHandlerFeature>();
        return Problem(
            title: "Unhandled server error",
            detail: feature?.Error.Message,
            statusCode: StatusCodes.Status500InternalServerError);
    }
}
