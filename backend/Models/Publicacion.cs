namespace Backend.Api.Models;

// Coincide con la tabla public."Publicacion"
public class Publicacion
{
    public Guid IdPublicacion { get; set; }

    public Guid IdUsuario { get; set; }
    public Usuario? Usuario { get; set; }

    public Guid? IdLibro { get; set; }
    public Libro? Libro { get; set; }

    public decimal? Precio { get; set; }
    public string? Descripcion { get; set; }
    public DateOnly? FechaPublicacion { get; set; }
}
