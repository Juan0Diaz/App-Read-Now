using System.Security.Claims;
using Backend.Api.Models;
using Backend.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/favoritos")]
[Authorize(Policy = "Visualizador")] // cualquier usuario autenticado (Visualizador+)
public class FavoritosController : ControllerBase
{
    private readonly IFavoritosServices _favoritosServices;

    public FavoritosController(IFavoritosServices favoritosServices)
    {
        _favoritosServices = favoritosServices;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("id_usuario")!);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Favorito>>> GetMine()
    {
        var favoritos = await _favoritosServices.ObtenerMisFavoritosAsync(CurrentUserId);
        return Ok(favoritos);
    }

    [HttpPost("{idLibro:guid}")]
    public async Task<IActionResult> Add(Guid idLibro)
    {
        await _favoritosServices.AgregarAsync(CurrentUserId, idLibro);
        return NoContent();
    }

    [HttpDelete("{idLibro:guid}")]
    public async Task<IActionResult> Remove(Guid idLibro)
    {
        var eliminado = await _favoritosServices.QuitarAsync(CurrentUserId, idLibro);
        return eliminado ? NoContent() : NotFound();
    }
}