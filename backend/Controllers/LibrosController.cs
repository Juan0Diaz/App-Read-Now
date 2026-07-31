using Backend.Api.Data;
using Backend.Api.Dtos;
using Backend.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/libros")]
public class LibrosController : ControllerBase
{
    private readonly AppDbContext _db;
    public LibrosController(AppDbContext db) => _db = db;

    // Catálogo público: cualquiera puede ver los libros (visualizador incluido).
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Libro>>> GetAll()
    {
        var libros = await _db.Libros
            .Include(l => l.Genero)
            .Include(l => l.Genero1)
            .Include(l => l.Genero2)
            .AsNoTracking()
            .ToListAsync();
        return Ok(libros);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<Libro>> GetById(Guid id)
    {
        var libro = await _db.Libros
            .Include(l => l.Genero)
            .Include(l => l.Genero1)
            .Include(l => l.Genero2)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.IdLibro == id);

        return libro is null ? NotFound() : Ok(libro);
    }

    // Crear libro: solo Publicador o Administrador.
    [HttpPost]
    [Authorize(Policy = "Publicador")]
    public async Task<ActionResult<Libro>> Create(LibroCreateDto dto)
    {
        var libro = new Libro
        {
            IdLibro = Guid.NewGuid(),
            Titulo = dto.Titulo,
            Autor = dto.Autor,
            Disponible = dto.Disponible,
            Editorial = dto.Editorial,
            Estado = dto.Estado,
            FechaPublicacion = dto.FechaPublicacion,
            IdGenero = dto.IdGenero,
            IdGenero1 = dto.IdGenero1,
            IdGenero2 = dto.IdGenero2,
            Descripcion = dto.Descripcion,
            PortadaUrl = dto.PortadaUrl
        };

        _db.Libros.Add(libro);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = libro.IdLibro }, libro);
    }

    // Editar libro: Publicador o Administrador.
    // (Si más adelante quieres que un Publicador solo edite SUS libros, se restringe
    // aquí comparando el id_usuario del token contra el dueño de la Publicacion asociada.)
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Publicador")]
    public async Task<IActionResult> Update(Guid id, LibroUpdateDto dto)
    {
        var libro = await _db.Libros.FindAsync(id);
        if (libro is null) return NotFound();

        if (dto.Titulo is not null) libro.Titulo = dto.Titulo;
        if (dto.Autor is not null) libro.Autor = dto.Autor;
        if (dto.Disponible is not null) libro.Disponible = dto.Disponible.Value;
        if (dto.Editorial is not null) libro.Editorial = dto.Editorial;
        if (dto.Estado is not null) libro.Estado = dto.Estado;
        if (dto.FechaPublicacion is not null) libro.FechaPublicacion = dto.FechaPublicacion;
        if (dto.IdGenero is not null) libro.IdGenero = dto.IdGenero;
        if (dto.IdGenero1 is not null) libro.IdGenero1 = dto.IdGenero1;
        if (dto.IdGenero2 is not null) libro.IdGenero2 = dto.IdGenero2;
        if (dto.Descripcion is not null) libro.Descripcion = dto.Descripcion;
        if (dto.PortadaUrl is not null) libro.PortadaUrl = dto.PortadaUrl;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Eliminar libro: solo Administrador.
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Administrador")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var libro = await _db.Libros.FindAsync(id);
        if (libro is null) return NotFound();

        _db.Libros.Remove(libro);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
