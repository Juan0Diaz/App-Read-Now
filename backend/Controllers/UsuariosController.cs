using System.Security.Claims;
using Backend.Api.Data;
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
    public async Task<IActionResult> UpdateMe([FromBody] Usuario datos)
    {
        var usuario = await _db.Usuarios.FindAsync(CurrentUserId);
        if (usuario is null) return NotFound();

        usuario.Nombre = datos.Nombre;
        usuario.NumeroTel = datos.NumeroTel;
        await _db.SaveChangesAsync();
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

        var actual = await _db.UsuarioRoles.FirstOrDefaultAsync(ur => ur.IdUsuario == id);
        if (actual is null)
        {
            _db.UsuarioRoles.Add(new UsuarioRol { IdUsuario = id, IdRol = rol.IdRol });
        }
        else
        {
            actual.IdRol = rol.IdRol;
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }
}
