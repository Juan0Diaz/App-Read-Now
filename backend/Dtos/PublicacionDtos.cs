using System.Text.Json.Serialization;

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
