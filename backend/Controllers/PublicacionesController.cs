using System.Security.Claims;
using Backend.Api.Data;
using Backend.Api.Dtos;
using Backend.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/publicaciones")]
public class PublicacionesController : ControllerBase
{
    private readonly AppDbContext _db;
    public PublicacionesController(AppDbContext db) => _db = db;

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue("id_usuario")!);

    private bool IsAdmin => User.IsInRole("Administrador");

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Publicacion>>> GetAll()
    {
        var publicaciones = await _db.Publicaciones
            .Include(p => p.Libro)
            .AsNoTracking()
            .ToListAsync();
        return Ok(publicaciones);
    }

    // Publicaciones del usuario autenticado (para su panel de "Publicador").
    [HttpGet("mias")]
    [Authorize(Policy = "Publicador")]
    public async Task<ActionResult<IEnumerable<Publicacion>>> GetMine()
    {
        var publicaciones = await _db.Publicaciones
            .Include(p => p.Libro)
            .Where(p => p.IdUsuario == CurrentUserId)
            .AsNoTracking()
            .ToListAsync();
        return Ok(publicaciones);
    }

    [HttpPost]
    [Authorize(Policy = "Publicador")]
    public async Task<ActionResult<Publicacion>> Create(PublicacionCreateDto dto)
    {
        var publicacion = new Publicacion
        {
            IdPublicacion = Guid.NewGuid(),
            IdUsuario = CurrentUserId,
            IdLibro = dto.IdLibro,
            Precio = dto.Precio,
            Descripcion = dto.Descripcion,
            FechaPublicacion = dto.FechaPublicacion ?? DateOnly.FromDateTime(DateTime.UtcNow)
        };

        _db.Publicaciones.Add(publicacion);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), publicacion);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Publicador")]
    public async Task<IActionResult> Update(Guid id, PublicacionUpdateDto dto)
    {
        var publicacion = await _db.Publicaciones.FindAsync(id);
        if (publicacion is null) return NotFound();

        // Un Publicador solo puede editar SUS propias publicaciones; el Administrador, todas.
        if (!IsAdmin && publicacion.IdUsuario != CurrentUserId) return Forbid();

        if (dto.Precio is not null) publicacion.Precio = dto.Precio;
        if (dto.Descripcion is not null) publicacion.Descripcion = dto.Descripcion;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Publicador")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var publicacion = await _db.Publicaciones.FindAsync(id);
        if (publicacion is null) return NotFound();

        if (!IsAdmin && publicacion.IdUsuario != CurrentUserId) return Forbid();

        _db.Publicaciones.Remove(publicacion);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
