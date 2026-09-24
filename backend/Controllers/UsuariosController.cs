using System.Security.Claims;
using Backend.Api.Dtos;
using Backend.Api.Models;
using Backend.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize(Policy = "Visualizador")]
public class UsuariosController : ControllerBase
{
    private readonly IUsuariosServices _usuariosServices;

    public UsuariosController(IUsuariosServices usuariosServices)
    {
        _usuariosServices = usuariosServices;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("id_usuario")!);

    // Perfil propio (equivalente a lo que hoy hace fetchUserData en el frontend).
    [HttpGet("me")]
    public async Task<ActionResult<Usuario>> GetMe()
    {
        var usuario = await _usuariosServices.ObtenerPorIdAsync(CurrentUserId);
        if (usuario is null) return NotFound();
        return Ok(usuario);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UsuarioUpdateDto dto)
    {
        var actualizado = await _usuariosServices.ActualizarPerfilAsync(CurrentUserId, dto);
        return actualizado ? NoContent() : NotFound();
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

        var actualizado = await _usuariosServices.CambiarMiRolAsync(CurrentUserId, nombreRol);
        return actualizado ? NoContent() : BadRequest("Rol inválido");
    }

    // Borrar la cuenta propia. Antes esto eran 4 borrados sueltos hechos desde el
    // frontend (Favoritos, Publicacion, Usuario-Rol, Usuario); ahora es una sola
    // transacción — si algo falla a la mitad, no quedan datos huérfanos.
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMe()
    {
        await _usuariosServices.EliminarCuentaAsync(CurrentUserId);
        return NoContent();
    }

    // ---------- Solo Administrador ----------

    [HttpGet]
    [Authorize(Policy = "Administrador")]
    public async Task<ActionResult<IEnumerable<Usuario>>> GetAll()
        => Ok(await _usuariosServices.ObtenerTodosAsync());

    [HttpPut("{id:guid}/rol")]
    [Authorize(Policy = "Administrador")]
    public async Task<IActionResult> AssignRole(Guid id, [FromBody] string nombreRol)
    {
        var usuario = await _usuariosServices.ObtenerPorIdAsync(id);
        if (usuario is null) return NotFound("Usuario no encontrado");

        var actualizado = await _usuariosServices.AsignarRolAsync(id, nombreRol);
        return actualizado ? NoContent() : BadRequest("Rol inválido");
    }
}