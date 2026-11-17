using System.Security.Claims;
using Backend.Api.Dtos;
using Backend.Api.Models;
using Backend.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/publicaciones")]
public class PublicacionesController : ControllerBase
{
    private readonly IPublicacionesServices _publicacionesServices;

    public PublicacionesController(IPublicacionesServices publicacionesServices)
    {
        _publicacionesServices = publicacionesServices;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("id_usuario")!);
    private bool IsAdmin => User.IsInRole("Administrador");

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var publicaciones = await _publicacionesServices.ObtenerTodasAsync();
        return User.Identity?.IsAuthenticated == true
            ? Ok(publicaciones)
            : Ok(publicaciones.Select(ToPublicacionPublica));
    }

    [HttpGet("publicador/{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PublicacionPublicaDto>>> GetPublicadorPublicaciones(Guid id)
    {
        var publicaciones = await _publicacionesServices.ObtenerPublicasPorUsuarioAsync(id);
        return Ok(publicaciones.Select(ToPublicacionPublica));
    }

    [HttpGet("mias")]
    [Authorize(Policy = "Publicador")]
    public async Task<ActionResult<IEnumerable<Publicacion>>> GetMine()
        => Ok(await _publicacionesServices.ObtenerMiasAsync(CurrentUserId));

    [HttpPost]
    [Authorize(Policy = "Publicador")]
    public async Task<ActionResult<Publicacion>> Create(PublicacionCreateDto dto)
    {
        var resultado = await _publicacionesServices.CrearAsync(CurrentUserId, IsAdmin, dto);

        return resultado.Estado switch
        {
            PublicacionOperacionEstado.NotFound => NotFound("Libro no encontrado"),
            PublicacionOperacionEstado.Forbidden => Forbid(),
            PublicacionOperacionEstado.Ok when resultado.Publicacion is { } publicacion =>
                CreatedAtAction(nameof(GetAll), new { id = publicacion.IdPublicacion }, publicacion),
            _ => throw new InvalidOperationException("No se pudo crear la publicación.")
        };
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Publicador")]
    public async Task<IActionResult> Update(Guid id, PublicacionUpdateDto dto)
    {
        var resultado = await _publicacionesServices.ActualizarAsync(id, CurrentUserId, IsAdmin, dto);

        return resultado.Estado switch
        {
            PublicacionOperacionEstado.NotFound => NotFound(),
            PublicacionOperacionEstado.Forbidden => Forbid(),
            _ => NoContent()
        };
    }

    [HttpDelete("{id:guid}/con-libro")]
    [Authorize(Policy = "Publicador")]
    public async Task<IActionResult> DeleteConLibro(Guid id)
    {
        var resultado = await _publicacionesServices.EliminarConLibroAsync(id, CurrentUserId, IsAdmin);

        return resultado.Estado switch
        {
            PublicacionOperacionEstado.NotFound => NotFound(),
            PublicacionOperacionEstado.Forbidden => Forbid(),
            _ => NoContent()
        };
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Publicador")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var resultado = await _publicacionesServices.EliminarAsync(id, CurrentUserId, IsAdmin);

        return resultado.Estado switch
        {
            PublicacionOperacionEstado.NotFound => NotFound(),
            PublicacionOperacionEstado.Forbidden => Forbid(),
            _ => NoContent()
        };
    }

    private static PublicacionPublicaDto ToPublicacionPublica(Publicacion publicacion)
        => new(
            publicacion.IdPublicacion,
            publicacion.IdUsuario,
            publicacion.IdLibro,
            publicacion.Precio,
            publicacion.Descripcion,
            publicacion.FechaPublicacion,
            publicacion.Libro,
            publicacion.Usuario is null
                ? null
                : new PublicadorPublicoDto(
                    publicacion.Usuario.IdUsuario,
                    publicacion.Usuario.Nombre ?? "Publicador"));
}