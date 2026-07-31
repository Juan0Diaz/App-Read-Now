namespace Backend.Api.Models;

// Coincide con la tabla public."Usuario_Prestamo"
public class UsuarioPrestamo
{
    public Guid IdUsuario { get; set; }
    public Usuario? Usuario { get; set; }

    public Guid IdLibro { get; set; }
    public Libro? Libro { get; set; }

    public bool? Disponible { get; set; }
}
