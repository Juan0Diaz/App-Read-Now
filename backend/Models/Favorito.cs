namespace Backend.Api.Models;

// Coincide con la tabla public."Favoritos"
public class Favorito
{
    public Guid IdFavorito { get; set; }

    public Guid IdLibro { get; set; }
    public Libro? Libro { get; set; }

    public Guid? IdUsuario { get; set; }
    public Usuario? Usuario { get; set; }
}
