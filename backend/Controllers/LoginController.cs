using System.Security.Claims;
using Backend.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/login")]
[Authorize(Policy = "Visualizador")]
public class LoginController : ControllerBase
{
	private readonly ILoginServices _loginServices;

	public LoginController(ILoginServices loginServices)
	{
		_loginServices = loginServices;
	}

	[HttpGet("me")]
	public async Task<ActionResult<LoginPerfilDto>> GetMe()
	{
		var claim = User.FindFirstValue("id_usuario");
		if (!Guid.TryParse(claim, out var idUsuario))
		{
			return Unauthorized();
		}

		var perfil = await _loginServices.ObtenerPerfilAsync(idUsuario);
		return perfil is null ? NotFound("Perfil de usuario no encontrado") : Ok(perfil);
	}
}
