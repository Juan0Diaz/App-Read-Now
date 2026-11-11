namespace Prestamos.Api.Models;

public sealed class UsuarioPrestamo
{
    public Guid IdUsuario { get; set; }
    public Guid IdLibro { get; set; }
    public bool? Disponible { get; set; }
    public Libro? Libro { get; set; }
}
