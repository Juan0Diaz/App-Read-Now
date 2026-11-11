using Generos.Api.Models;
using Generos.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Text.RegularExpressions;
using Generos.Api.Dtos;

namespace Generos.Api.Controllers;

[ApiController]
[Route("api/generos")]
public sealed class GenerosController : ControllerBase
{
    private static readonly Regex SqlSyntax = new(
        @"(?:--|/\*|\*/|;|['""`])|\b(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC(?:UTE)?|UNION|GRANT|REVOKE)\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

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
    public async Task<ActionResult<Genero>> Create(
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] GeneroRequest? request)
    {
        if (!TryNormalizeName(request?.NombreGenero, out var nombre, out var error))
        {
            return BadRequest(new { message = error });
        }

        var genero = new Genero { NombreGenero = nombre };
        var nuevoGenero = await _generosServices.CrearAsync(genero);
        return CreatedAtAction(nameof(GetAll), nuevoGenero);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Administrador")]
    public async Task<ActionResult<Genero>> Update(
        Guid id,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] GeneroRequest? request)
    {
        if (!TryNormalizeName(request?.NombreGenero, out var nombre, out var error))
        {
            return BadRequest(new { message = error });
        }

        var actualizado = await _generosServices.ActualizarAsync(id, nombre);
        return actualizado is null ? NotFound() : Ok(actualizado);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Administrador")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var eliminado = await _generosServices.EliminarAsync(id);
        return eliminado ? NoContent() : NotFound();
    }

    private static bool TryNormalizeName(string? value, out string nombre, out string error)
    {
        nombre = string.Empty;
        if (string.IsNullOrWhiteSpace(value))
        {
            error = "El nombre del género es obligatorio.";
            return false;
        }

        var normalized = value.Trim();
        if (normalized.Length > 50)
        {
            error = "El nombre del género no puede superar los 50 caracteres.";
            return false;
        }

        if (SqlSyntax.IsMatch(normalized))
        {
            error = "El nombre del género contiene sintaxis SQL no permitida.";
            return false;
        }

        nombre = normalized;
        error = string.Empty;
        return true;
    }
}