using Backend.Api.Models;
using Backend.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/generos")]
public class GenerosController : ControllerBase
{
    private readonly IGenerosServices _generosServices;

    public GenerosController(IGenerosServices generosServices)
    {
        _generosServices = generosServices;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Genero>>> GetAll()
        => Ok(await _generosServices.ObtenerTodosAsync());

    [HttpPost]
    [Authorize(Policy = "Administrador")]
    public async Task<ActionResult<Genero>> Create(Genero genero)
    {
        var nuevoGenero = await _generosServices.CrearAsync(genero);
        return CreatedAtAction(nameof(GetAll), nuevoGenero);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Administrador")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var eliminado = await _generosServices.EliminarAsync(id);
        return eliminado ? NoContent() : NotFound();
    }
}