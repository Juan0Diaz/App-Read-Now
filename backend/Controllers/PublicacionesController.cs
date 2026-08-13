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
            .Include(p => p.Usuario)
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

    // Antes, el frontend hacía esto en 3 pasos sueltos (borrar Favoritos, borrar
    // Publicacion, borrar Libro — con un "parche" manual si el borrado del libro
    // fallaba por llaves foráneas). Aquí es una sola transacción: si el borrado
    // físico del libro falla (porque otra Publicacion o un Prestamo lo referencian),
    // usamos un savepoint para retroceder solo esa parte y hacer borrado lógico,
    // sin abortar toda la transacción (así funciona Postgres: un solo error dentro
    // de una transacción normal la invalida completa si no se usa un savepoint).
    [HttpDelete("{id:guid}/con-libro")]
    [Authorize(Policy = "Publicador")]
    public async Task<IActionResult> DeleteConLibro(Guid id)
    {
        var publicacion = await _db.Publicaciones.FindAsync(id);
        if (publicacion is null) return NotFound();

        var esAdmin = User.IsInRole("Administrador");
        var userId = Guid.Parse(User.FindFirstValue("id_usuario")!);
        if (!esAdmin && publicacion.IdUsuario != userId) return Forbid();

        var idLibro = publicacion.IdLibro;

        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            if (idLibro is not null)
            {
                _db.Favoritos.RemoveRange(_db.Favoritos.Where(f => f.IdLibro == idLibro));
            }

            _db.Publicaciones.Remove(publicacion);
            await _db.SaveChangesAsync();

            if (idLibro is not null)
            {
                var libro = await _db.Libros.FindAsync(idLibro.Value);
                if (libro is not null)
                {
                    await transaction.CreateSavepointAsync("antes_de_borrar_libro");
                    try
                    {
                        _db.Libros.Remove(libro);
                        await _db.SaveChangesAsync();
                    }
                    catch (DbUpdateException)
                    {
                        // Otro Prestamo o Publicacion todavía referencia este libro:
                        // retrocedemos solo este intento y lo marcamos como eliminado.
                        await transaction.RollbackToSavepointAsync("antes_de_borrar_libro");
                        _db.ChangeTracker.Clear();
                        var libroParaOcultar = await _db.Libros.FindAsync(idLibro.Value);
                        if (libroParaOcultar is not null)
                        {
                            libroParaOcultar.Disponible = false;
                            libroParaOcultar.Estado = "Eliminado";
                            await _db.SaveChangesAsync();
                        }
                    }
                }
            }

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

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