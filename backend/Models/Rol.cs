namespace Backend.Api.Models;

// Coincide con la tabla public."Rol"
public class Rol
{
    public Guid IdRol { get; set; }
    public string NombreRol { get; set; } = string.Empty; // 'Visualizador' | 'Publicador' | 'Administrador'
}
