using System.Security.Claims;
using Backend.Api.Data;
using Backend.Api.Dtos;
using Backend.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize(Policy = "Visualizador")]
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _db;
    public UsuariosController(AppDbContext db) => _db = db;

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("id_usuario")!);

    // Perfil propio (equivalente a lo que hoy hace fetchUserData en el frontend).
    [HttpGet("me")]
    public async Task<ActionResult<Usuario>> GetMe()
    {
        var usuario = await _db.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.IdUsuario == CurrentUserId);

        if (usuario is null) return NotFound();
        return Ok(usuario);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UsuarioUpdateDto dto)
    {
        var usuario = await _db.Usuarios.FindAsync(CurrentUserId);
        if (usuario is null) return NotFound();

        usuario.Nombre = dto.Nombre;
        usuario.FechaDate = dto.FechaDate;
        usuario.NumeroTel = dto.NumeroTel;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Cambio de rol propio: solo entre Visualizador y Publicador. Nunca permite
    // que alguien se autoasigne Administrador, y nunca toca 'Desactivado' — eso
    // solo lo puede hacer un Administrador vía PUT /{id}/rol.
    [HttpPut("me/rol")]
    public async Task<IActionResult> CambiarMiRol([FromBody] string nombreRol)
    {
        if (nombreRol != "Visualizador" && nombreRol != "Publicador")
        {
            return BadRequest("Solo puedes cambiar tu propio rol entre Visualizador y Publicador.");
        }

        var rol = await _db.Roles.FirstOrDefaultAsync(r => r.NombreRol == nombreRol);
        if (rol is null) return BadRequest("Rol inválido");

        var actual = await _db.UsuarioRoles.FirstOrDefaultAsync(ur => ur.IdUsuario == CurrentUserId);
        if (actual is null)
        {
            _db.UsuarioRoles.Add(new UsuarioRol { IdUsuario = CurrentUserId, IdRol = rol.IdRol });
        }
        else
        {
            actual.IdRol = rol.IdRol;
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Borrar la cuenta propia. Antes esto eran 4 borrados sueltos hechos desde el
    // frontend (Favoritos, Publicacion, Usuario-Rol, Usuario); ahora es una sola
    // transacción — si algo falla a la mitad, no quedan datos huérfanos.
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMe()
    {
        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            _db.Favoritos.RemoveRange(_db.Favoritos.Where(f => f.IdUsuario == CurrentUserId));
            _db.Publicaciones.RemoveRange(_db.Publicaciones.Where(p => p.IdUsuario == CurrentUserId));
            _db.UsuarioRoles.RemoveRange(_db.UsuarioRoles.Where(ur => ur.IdUsuario == CurrentUserId));

            var usuario = await _db.Usuarios.FindAsync(CurrentUserId);
            if (usuario is not null) _db.Usuarios.Remove(usuario);

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

    // ---------- Solo Administrador ----------

    [HttpGet]
    [Authorize(Policy = "Administrador")]
    public async Task<ActionResult<IEnumerable<Usuario>>> GetAll()
        => Ok(await _db.Usuarios.Include(u => u.Roles).ThenInclude(r => r.Rol).AsNoTracking().ToListAsync());

    [HttpPut("{id:guid}/rol")]
    [Authorize(Policy = "Administrador")]
    public async Task<IActionResult> AssignRole(Guid id, [FromBody] string nombreRol)
    {
        var usuario = await _db.Usuarios.FindAsync(id);
        if (usuario is null) return NotFound("Usuario no encontrado");

        var rol = await _db.Roles.FirstOrDefaultAsync(r => r.NombreRol == nombreRol);
        if (rol is null) return BadRequest("Rol inválido");

        await using var transaction = await _db.Database.BeginTransactionAsync();

        var actual = await _db.UsuarioRoles.FirstOrDefaultAsync(ur => ur.IdUsuario == id);
        if (actual is null)
        {
            _db.UsuarioRoles.Add(new UsuarioRol { IdUsuario = id, IdRol = rol.IdRol });
        }
        else
        {
            actual.IdRol = rol.IdRol;
        }

        // Regla de negocio: al desactivar a alguien, se le quitan sus favoritos.
        if (nombreRol == "Desactivado")
        {
            _db.Favoritos.RemoveRange(_db.Favoritos.Where(f => f.IdUsuario == id));
        }

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();
        return NoContent();
    }
}