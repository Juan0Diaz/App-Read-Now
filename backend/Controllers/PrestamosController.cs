using System.Security.Claims;
using Backend.Api.Data;
using Backend.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/prestamos")]
[Authorize(Policy = "Visualizador")] // cualquier usuario autenticado puede pedir prestado
public class PrestamosController : ControllerBase
{
    private readonly AppDbContext _db;
    public PrestamosController(AppDbContext db) => _db = db;

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("id_usuario")!);

    [HttpGet("mios")]
    public async Task<ActionResult<IEnumerable<UsuarioPrestamo>>> GetMine()
    {
        var prestamos = await _db.UsuarioPrestamos
            .Include(p => p.Libro)
            .Where(p => p.IdUsuario == CurrentUserId)
            .AsNoTracking()
            .ToListAsync();
        return Ok(prestamos);
    }

    // Antes esto eran dos llamadas sueltas desde el frontend (insertar el préstamo,
    // luego actualizar el libro) sin garantía de que ambas se completaran juntas.
    // Aquí se hace en una sola transacción: o pasan las dos, o no pasa ninguna.
    [HttpPost("{idLibro:guid}")]
    public async Task<IActionResult> SolicitarPrestamo(Guid idLibro)
    {
        var libro = await _db.Libros.FindAsync(idLibro);
        if (libro is null) return NotFound("Libro no encontrado");
        if (!libro.Disponible) return Conflict("Este libro ya no está disponible");

        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            _db.UsuarioPrestamos.Add(new UsuarioPrestamo
            {
                IdUsuario = CurrentUserId,
                IdLibro = idLibro,
                Disponible = true
            });

            libro.Disponible = false;

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        return NoContent();
    }
}