using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Backend.Api.Models;

namespace Backend.Api.Dtos;

public record LibroCreateDto(
    [property: JsonPropertyName("titulo")] string Titulo,
    [property: JsonPropertyName("autor")] string Autor,
    [property: JsonPropertyName("disponible")] bool Disponible,
    [property: JsonPropertyName("editorial")] string? Editorial,
    [property: JsonPropertyName("estado")] string? Estado,
    [property: JsonPropertyName("fecha_publicacion")] DateOnly? FechaPublicacion,
    [property: JsonPropertyName("id_genero")] Guid? IdGenero,
    [property: JsonPropertyName("id_genero_1")] Guid? IdGenero1,
    [property: JsonPropertyName("id_genero_2")] Guid? IdGenero2,
    [property: JsonPropertyName("descripcion")] string? Descripcion,
    [property: JsonPropertyName("portada_url")] string? PortadaUrl
);

public record LibroUpdateDto(
    [property: JsonPropertyName("titulo")] string? Titulo,
    [property: JsonPropertyName("autor")] string? Autor,
    [property: JsonPropertyName("disponible")] bool? Disponible,
    [property: JsonPropertyName("editorial")] string? Editorial,
    [property: JsonPropertyName("estado")] string? Estado,
    [property: JsonPropertyName("fecha_publicacion")] DateOnly? FechaPublicacion,
    [property: JsonPropertyName("id_genero")] Guid? IdGenero,
    [property: JsonPropertyName("id_genero_1")] Guid? IdGenero1,
    [property: JsonPropertyName("id_genero_2")] Guid? IdGenero2,
    [property: JsonPropertyName("descripcion")] string? Descripcion,
    [property: JsonPropertyName("portada_url")] string? PortadaUrl
);

// Crea el Libro y su Publicacion asociada en una sola llamada, dentro de una
// transacción — reemplaza el patrón anterior del frontend de "insertar libro,
// luego insertar publicación" como dos pasos sueltos.
public record LibroConPublicacionCreateDto(
    [property: JsonPropertyName("titulo")] string Titulo,
    [property: JsonPropertyName("autor")] string Autor,
    [property: JsonPropertyName("editorial")] string? Editorial,
    [property: JsonPropertyName("fecha_publicacion")] DateOnly? FechaPublicacion,
    [property: JsonPropertyName("id_genero")] Guid? IdGenero,
    [property: JsonPropertyName("id_genero_1")] Guid? IdGenero1,
    [property: JsonPropertyName("id_genero_2")] Guid? IdGenero2,
    [property: JsonPropertyName("descripcion")] string? Descripcion,
    [property: JsonPropertyName("portada_url")] string? PortadaUrl
);

public record LibroRevisionDto(
    [property: JsonPropertyName("estado")]
    [RegularExpression("^(Aprobado|Corrección)$", ErrorMessage = "El estado debe ser Aprobado o Corrección.")]
    string Estado,
    [property: JsonPropertyName("comentario")]
    [StringLength(1000, ErrorMessage = "El comentario no puede exceder 1000 caracteres.")]
    string? Comentario = null
);

public record LibroResubmitirDto(
    [property: JsonPropertyName("comentario")]
    [StringLength(1000, ErrorMessage = "El comentario no puede exceder 1000 caracteres.")]
    string? Comentario = null
);

public record PublicadorResumenDto(
    [property: JsonPropertyName("id_usuario")] Guid IdUsuario,
    [property: JsonPropertyName("nombre")] string? Nombre,
    [property: JsonPropertyName("correo")] string Correo,
    [property: JsonPropertyName("numero_tel")] string? NumeroTel
);

public record LibroRevisionSolicitudDto(
    [property: JsonPropertyName("libro")] Libro Libro,
    [property: JsonPropertyName("publicador")] PublicadorResumenDto? Publicador
);