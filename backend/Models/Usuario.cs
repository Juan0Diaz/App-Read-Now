using System.Text.Json.Serialization;

namespace Backend.Api.Models;

// Coincide con la tabla public."Usuario"
// Nota: la autenticación real la maneja Supabase Auth (auth.users).
// Esta tabla es el "perfil" público/aplicativo del usuario.
public class Usuario
{
    [JsonPropertyName("id_usuario")]
    public Guid IdUsuario { get; set; }

    [JsonPropertyName("nombre")]
    public string? Nombre { get; set; }

    [JsonPropertyName("correo")]
    public string Correo { get; set; } = string.Empty;

    // Se mantiene por compatibilidad con el esquema existente, pero el backend
    // NUNCA debe usar esta columna para autenticar: eso lo hace Supabase Auth.
    [JsonIgnore]
    public string Contrasena { get; set; } = string.Empty;

    [JsonPropertyName("fecha_date")]
    public DateOnly? FechaDate { get; set; }

    [JsonPropertyName("numero_tel")]
    public string? NumeroTel { get; set; }

    [JsonPropertyName("roles")]
    public ICollection<UsuarioRol> Roles { get; set; } = new List<UsuarioRol>();
}