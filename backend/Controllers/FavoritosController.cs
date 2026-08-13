using System.Security.Claims;
using Backend.Api.Data;
using Backend.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/favoritos")]
[Authorize(Policy = "Visualizador")] // cualquier usuario autenticado (Visualizador+)
public class FavoritosController : ControllerBase
{
    private readonly AppDbContext _db;
    public FavoritosController(AppDbContext db) => _db = db;

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("id_usuario")!);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Favorito>>> GetMine()
    {
        var favoritos = await _db.Favoritos
            .Include(f => f.Libro!).ThenInclude(l => l.Genero)
            .Where(f => f.IdUsuario == CurrentUserId)
            .AsNoTracking()
            .ToListAsync();
        return Ok(favoritos);
    }

    [HttpPost("{idLibro:guid}")]
    public async Task<IActionResult> Add(Guid idLibro)
    {
        var yaExiste = await _db.Favoritos
            .AnyAsync(f => f.IdUsuario == CurrentUserId && f.IdLibro == idLibro);
        if (yaExiste) return NoContent();

        _db.Favoritos.Add(new Favorito
        {
            IdFavorito = Guid.NewGuid(),
            IdUsuario = CurrentUserId,
            IdLibro = idLibro
        });
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{idLibro:guid}")]
    public async Task<IActionResult> Remove(Guid idLibro)
    {
        var favorito = await _db.Favoritos
            .FirstOrDefaultAsync(f => f.IdUsuario == CurrentUserId && f.IdLibro == idLibro);
        if (favorito is null) return NotFound();

        _db.Favoritos.Remove(favorito);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}