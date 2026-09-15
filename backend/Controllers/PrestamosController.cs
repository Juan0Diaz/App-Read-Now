using System.Security.Claims;
using Backend.Api.Models;
using Backend.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/prestamos")]
[Authorize(Policy = "Visualizador")] // cualquier usuario autenticado puede pedir prestado
public class PrestamosController : ControllerBase
{
    private readonly IPrestamosServices _prestamoService;

    public PrestamosController(IPrestamosServices prestamoService)
    {
        _prestamoService = prestamoService;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue("id_usuario")!);

    [HttpGet("mios")]
    public async Task<ActionResult<IEnumerable<UsuarioPrestamo>>> GetMine()
    {
        var prestamos = await _prestamoService.ObtenerMisPrestamosAsync(CurrentUserId);
        return Ok(prestamos);
    }

    [HttpPost("{idLibro:guid}")]
    public async Task<IActionResult> SolicitarPrestamo(Guid idLibro)
    {
        var resultado = await _prestamoService.SolicitarAsync(CurrentUserId, idLibro);

        return resultado.Estado switch
        {
            PrestamoSolicitudEstado.LibroNoEncontrado => NotFound("Libro no encontrado"),
            PrestamoSolicitudEstado.LibroNoDisponible => Conflict("Este libro ya no está disponible"),
            _ => NoContent()
        };
    }
}