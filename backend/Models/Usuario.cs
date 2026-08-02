namespace Backend.Api.Models;


// Coincide con la tabla. "Usuario"
public class Usuario
{
    public Guid IdUsuario { get; set; }
    public string? Nombre { get; set; }
    public string Correo { get; set; } = string.Empty;

    
    public string Contrasena { get; set; } = string.Empty;

    public DateOnly? FechaDate { get; set; }
    public string? NumeroTel { get; set; }

    public ICollection<UsuarioRol> Roles { get; set; } = new List<UsuarioRol>();
}
