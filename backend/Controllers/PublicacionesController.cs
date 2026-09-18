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
    public async Task<ActionResult<IEnumerable<Publicacion>>> GetAll()
        => Ok(await _publicacionesServices.ObtenerTodasAsync());

    [HttpGet("mias")]
    [Authorize(Policy = "Publicador")]
    public async Task<ActionResult<IEnumerable<Publicacion>>> GetMine()
        => Ok(await _publicacionesServices.ObtenerMiasAsync(CurrentUserId));

    [HttpPost]
    [Authorize(Policy = "Publicador")]
    public async Task<ActionResult<Publicacion>> Create(PublicacionCreateDto dto)
    {
        var publicacion = await _publicacionesServices.CrearAsync(CurrentUserId, dto);
        return CreatedAtAction(nameof(GetAll), new { id = publicacion.IdPublicacion }, publicacion);
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
}