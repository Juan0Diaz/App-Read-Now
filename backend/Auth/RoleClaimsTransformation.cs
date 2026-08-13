using System.Security.Claims;
using Backend.Api.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Auth;

/// <summary>
/// El JWT de Supabase Auth solo prueba identidad (quién es el usuario), no el rol de
/// negocio (Visualizador/Publicador/Administrador). Esta clase se ejecuta después de
/// validar el JWT y añade el rol como un claim estándar de .NET (ClaimTypes.Role),
/// para poder usar [Authorize(Roles = "Administrador")] normalmente en los controladores.
/// </summary>
public class RoleClaimsTransformation : IClaimsTransformation
{
    private readonly AppDbContext _db;

    public RoleClaimsTransformation(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        var identity = principal.Identity as ClaimsIdentity;
        if (identity is null || !identity.IsAuthenticated) return principal;

        // Evita volver a consultar si ya se resolvió el rol en este request
        if (identity.HasClaim(c => c.Type == ClaimTypes.Role)) return principal;

        // El claim "sub" del JWT de Supabase es el id_usuario (uuid) de auth.users,
        // que es el mismo id_usuario que usas en tu tabla "Usuario".
        var subClaim = principal.FindFirst("sub") ?? principal.FindFirst(ClaimTypes.NameIdentifier);
        if (subClaim is null || !Guid.TryParse(subClaim.Value, out var userId))
        {
            return principal;
        }

        var nombreRol = await _db.UsuarioRoles
            .Where(ur => ur.IdUsuario == userId)
            .Select(ur => ur.Rol!.NombreRol)
            .FirstOrDefaultAsync();

        // Si el usuario no tiene fila en Usuario-Rol, asumimos el rol base de acceso,
        // de modo que cualquier usuario válido pueda usar la aplicación sin depender
        // de una configuración manual por cuenta.
        identity.AddClaim(new Claim(ClaimTypes.Role, nombreRol ?? "Visualizador"));
        identity.AddClaim(new Claim("id_usuario", userId.ToString()));

        return principal;
    }
}
