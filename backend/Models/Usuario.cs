namespace Backend.Api.Models;

// Coincide con la tabla public."Usuario"
// Nota: la autenticación real la maneja Supabase Auth (auth.users).
// Esta tabla es el "perfil" público/aplicativo del usuario.
public class Usuario
{
    public Guid IdUsuario { get; set; }
    public string? Nombre { get; set; }
    public string Correo { get; set; } = string.Empty;

    // Se mantiene por compatibilidad con el esquema existente, pero el backend
    // NUNCA debe usar esta columna para autenticar: eso lo hace Supabase Auth.
    public string Contrasena { get; set; } = string.Empty;

    public DateOnly? FechaDate { get; set; }
    public string? NumeroTel { get; set; }

    public ICollection<UsuarioRol> Roles { get; set; } = new List<UsuarioRol>();
}
