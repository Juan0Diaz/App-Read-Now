namespace Backend.Api.Models;

// Coincide con la tabla public."Libro"
public class Libro
{
    public Guid IdLibro { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Autor { get; set; } = string.Empty;
    public bool Disponible { get; set; } = true;
    public string? Editorial { get; set; }
    public string? Estado { get; set; } // 'Nuevo', 'Usado', 'Digital', etc.
    public DateOnly? FechaPublicacion { get; set; }

    public Guid? IdGenero { get; set; }
    public Genero? Genero { get; set; }

    public Guid? IdGenero1 { get; set; }
    public Genero? Genero1 { get; set; }

    public Guid? IdGenero2 { get; set; }
    public Genero? Genero2 { get; set; }

    public string? Descripcion { get; set; }
    public string? PortadaUrl { get; set; }
}
