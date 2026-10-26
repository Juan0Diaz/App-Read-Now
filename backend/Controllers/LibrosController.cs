using System.Security.Claims;
using Backend.Api.Dtos;
using Backend.Api.Models;
using Backend.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/libros")]
public class LibrosController : ControllerBase
{
    private readonly ILibrosServices _librosServices;

    public LibrosController(ILibrosServices librosServices)
    {
        _librosServices = librosServices;
    }

    // Catálogo público: solo libros aprobados.
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Libro>>> GetAll()
        => Ok(await _librosServices.ObtenerTodosAsync());

    [HttpGet("gestion/{id:guid}")]
    [Authorize(Policy = "Publicador")]
    public async Task<ActionResult<Libro>> GetForManagement(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue("id_usuario")!);
        var libro = await _librosServices.ObtenerGestionAsync(id, userId, User.IsInRole("Administrador"));
        return libro is null ? NotFound() : Ok(libro);
    }

    [HttpGet("revision-solicitudes")]
    [Authorize(Policy = "Administrador")]
    public async Task<ActionResult<IEnumerable<Libro>>> GetRevisionSolicitudes()
        => Ok(await _librosServices.ObtenerSolicitudesRevisionAsync());

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<Libro>> GetById(Guid id)
    {
        var libro = await _librosServices.ObtenerPorIdAsync(id);

        return libro is null ? NotFound() : Ok(libro);
    }

    // Crear libro: solo Publicador o Administrador.
    [HttpPost]
    [Authorize(Policy = "Publicador")]
    public async Task<ActionResult<Libro>> Create(LibroCreateDto dto)
    {
        var libro = await _librosServices.CrearAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = libro.IdLibro }, libro);
    }

    // Crea el Libro y su Publicacion en una sola transacción — reemplaza el patrón
    // anterior del frontend de hacer dos inserts sueltos (si el segundo fallaba,
    // quedaba un libro "huérfano" sin publicación).
    [HttpPost("publicar")]
    [Authorize(Policy = "Publicador")]
    public async Task<ActionResult<Libro>> CrearConPublicacion(LibroConPublicacionCreateDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue("id_usuario")!);
        var libro = await _librosServices.CrearConPublicacionAsync(userId, dto);
        return CreatedAtAction(nameof(GetById), new { id = libro.IdLibro }, libro);
    }

    // Editar libro: Publicador o Administrador.
    // (Si más adelante quieres que un Publicador solo edite SUS libros, se restringe
    // aquí comparando el id_usuario del token contra el dueño de la Publicacion asociada.)
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Publicador")]
    public async Task<IActionResult> Update(Guid id, LibroUpdateDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue("id_usuario")!);
        var resultado = await _librosServices.ActualizarAsync(
            id,
            userId,
            User.IsInRole("Administrador"),
            dto);

        return resultado.Estado switch
        {
            OperacionLibroEstado.NotFound => NotFound(),
            OperacionLibroEstado.Forbidden => Forbid(),
            _ => NoContent()
        };
    }

    [HttpPatch("{id:guid}/revision")]
    [Authorize(Policy = "Administrador")]
    public async Task<IActionResult> Revisar(Guid id, LibroRevisionDto dto)
    {
        if (dto.Estado == Libro.RevisionCorreccion && string.IsNullOrWhiteSpace(dto.Comentario))
        {
            return BadRequest("Una solicitud de corrección requiere un comentario.");
        }

        var resultado = await _librosServices.RevisarAsync(id, dto);
        return resultado.Estado switch
        {
            OperacionLibroEstado.NotFound => NotFound(),
            _ => NoContent()
        };
    }

    [HttpPost("{id:guid}/resubmitir")]
    [Authorize(Policy = "Publicador")]
    public async Task<IActionResult> Resubmitir(Guid id, LibroResubmitirDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue("id_usuario")!);
        var resultado = await _librosServices.ResubmitirAsync(id, userId, dto);

        return resultado.Estado switch
        {
            OperacionLibroEstado.NotFound => NotFound(),
            OperacionLibroEstado.Forbidden => Forbid(),
            _ => NoContent()
        };
    }

    // Eliminar libro: solo Administrador.
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Administrador")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var eliminado = await _librosServices.EliminarAsync(id);
        return eliminado ? NoContent() : NotFound();
    }
}
