using System.Security.Claims;
using Generos.Api.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;

namespace Generos.Api.Auth;

public sealed class RoleClaimsTransformation : IClaimsTransformation
{
    private const string BusinessRoleResolvedClaim = "app:business_role_resolved";
    private readonly GenerosDbContext _db;

    public RoleClaimsTransformation(GenerosDbContext db)
    {
        _db = db;
    }

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity is not ClaimsIdentity identity || !identity.IsAuthenticated ||
            identity.HasClaim(claim => claim.Type == BusinessRoleResolvedClaim))
        {
            return principal;
        }

        foreach (var roleClaim in identity.FindAll(ClaimTypes.Role).ToList())
        {
            identity.RemoveClaim(roleClaim);
        }

        var subject = principal.FindFirst("sub")?.Value
            ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(subject, out var userId))
        {
            identity.AddClaim(new Claim(BusinessRoleResolvedClaim, "true"));
            return principal;
        }

        var roleName = await (
            from userRole in _db.UsuarioRoles
            join role in _db.Roles on userRole.IdRol equals role.IdRol
            where userRole.IdUsuario == userId
            select role.NombreRol
        ).FirstOrDefaultAsync();

        identity.AddClaim(new Claim(ClaimTypes.Role, roleName ?? "Visualizador"));
        identity.AddClaim(new Claim("id_usuario", userId.ToString()));
        identity.AddClaim(new Claim(BusinessRoleResolvedClaim, "true"));
        return principal;
    }
}