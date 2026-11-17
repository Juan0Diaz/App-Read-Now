using System.Text.Json.Serialization;
using Backend.Api.Models;

namespace Backend.Api.Dtos;

public record PublicacionCreateDto(
    Guid? IdLibro,
    decimal? Precio,
    string? Descripcion,
    [property: JsonPropertyName("fecha_publicacion")] DateOnly? FechaPublicacion
);

public record PublicacionUpdateDto(
    decimal? Precio,
    string? Descripcion,
    [property: JsonPropertyName("fecha_publicacion")] DateOnly? FechaPublicacion
);

public record PublicacionPublicaDto(
    [property: JsonPropertyName("id_publicacion")] Guid IdPublicacion,
    [property: JsonPropertyName("id_usuario")] Guid IdUsuario,
    [property: JsonPropertyName("id_libro")] Guid? IdLibro,
    [property: JsonPropertyName("precio")] decimal? Precio,
    [property: JsonPropertyName("descripcion")] string? Descripcion,
    [property: JsonPropertyName("fecha_publicacion")] DateOnly? FechaPublicacion,
    [property: JsonPropertyName("libro")] Libro? Libro,
    [property: JsonPropertyName("usuario")] PublicadorPublicoDto? Usuario
);
