using System.Text.Json.Serialization;

namespace Backend.Api.Dtos;

public record UsuarioUpdateDto(
    [property: JsonPropertyName("nombre")] string? Nombre,
    [property: JsonPropertyName("fecha_date")] DateOnly? FechaDate,
    [property: JsonPropertyName("numero_tel")] string? NumeroTel
);

public record PublicadorPublicoDto(
    [property: JsonPropertyName("id_usuario")] Guid IdUsuario,
    [property: JsonPropertyName("nombre")] string Nombre
);
