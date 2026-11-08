using System.Security.Claims;
using Backend.Api.Models;
using Favoritos.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Favoritos.Api.Controllers;

[ApiController]
[Route("api/favoritos")]
[Authorize]
public sealed class FavoritosController : ControllerBase
{
    private readonly IFavoritosServices _favoritosServices;

    public FavoritosController(IFavoritosServices favoritosServices)
    {
        _favoritosServices = favoritosServices;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("id_usuario")!);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Favorito>>> GetMine()
        => Ok(await _favoritosServices.ObtenerMisFavoritosAsync(CurrentUserId));

    [HttpPost("{idLibro:guid}")]
    public async Task<IActionResult> Add(Guid idLibro)
    {
        var agregado = await _favoritosServices.AgregarAsync(CurrentUserId, idLibro);
        return agregado ? NoContent() : Conflict("Solo puedes agregar libros aprobados a favoritos.");
    }

    [HttpDelete("{idLibro:guid}")]
    public async Task<IActionResult> Remove(Guid idLibro)
    {
        var eliminado = await _favoritosServices.QuitarAsync(CurrentUserId, idLibro);
        return eliminado ? NoContent() : NotFound();
    }
}