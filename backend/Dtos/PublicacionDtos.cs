namespace Backend.Api.Dtos;

public record PublicacionCreateDto(
    Guid? IdLibro,
    decimal? Precio,
    string? Descripcion,
    DateOnly? FechaPublicacion
);

public record PublicacionUpdateDto(
    decimal? Precio,
    string? Descripcion
);
