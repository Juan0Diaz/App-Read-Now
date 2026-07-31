namespace Backend.Api.Dtos;

public record LibroCreateDto(
    string Titulo,
    string Autor,
    bool Disponible,
    string? Editorial,
    string? Estado,
    DateOnly? FechaPublicacion,
    Guid? IdGenero,
    Guid? IdGenero1,
    Guid? IdGenero2,
    string? Descripcion,
    string? PortadaUrl
);

public record LibroUpdateDto(
    string? Titulo,
    string? Autor,
    bool? Disponible,
    string? Editorial,
    string? Estado,
    DateOnly? FechaPublicacion,
    Guid? IdGenero,
    Guid? IdGenero1,
    Guid? IdGenero2,
    string? Descripcion,
    string? PortadaUrl
);
