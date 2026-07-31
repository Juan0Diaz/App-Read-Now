using Backend.Api.Data;
using Backend.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/generos")]
public class GenerosController : ControllerBase
{
    private readonly AppDbContext _db;
    public GenerosController(AppDbContext db) => _db = db;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Genero>>> GetAll()
        => Ok(await _db.Generos.AsNoTracking().ToListAsync());

    [HttpPost]
    [Authorize(Policy = "Administrador")]
    public async Task<ActionResult<Genero>> Create(Genero genero)
    {
        genero.IdGenero = Guid.NewGuid();
        _db.Generos.Add(genero);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), genero);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Administrador")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var genero = await _db.Generos.FindAsync(id);
        if (genero is null) return NotFound();
        _db.Generos.Remove(genero);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
