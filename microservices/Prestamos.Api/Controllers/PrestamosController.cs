using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Prestamos.Api.Models;
using Prestamos.Api.Services;

namespace Prestamos.Api.Controllers;

[ApiController]
[Route("api/prestamos")]
[Authorize(Policy = "Visualizador")]
public sealed class PrestamosController : ControllerBase
{
    private readonly IPrestamosServices _prestamosServices;

    public PrestamosController(IPrestamosServices prestamosServices)
    {
        _prestamosServices = prestamosServices;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("id_usuario")!);

    [HttpGet("mios")]
    public async Task<ActionResult<IEnumerable<UsuarioPrestamo>>> GetMine()
    {
        var prestamos = await _prestamosServices.ObtenerMisPrestamosAsync(CurrentUserId);
        return Ok(prestamos);
    }

    [HttpPost("{idLibro:guid}")]
    public async Task<IActionResult> SolicitarPrestamo(Guid idLibro)
    {
        var resultado = await _prestamosServices.SolicitarAsync(CurrentUserId, idLibro);

        return resultado.Estado switch
        {
            PrestamoSolicitudEstado.LibroNoEncontrado => NotFound("Libro no encontrado"),
            PrestamoSolicitudEstado.LibroNoDisponible => Conflict("Este libro ya no está disponible"),
            _ => NoContent()
        };
    }
}
