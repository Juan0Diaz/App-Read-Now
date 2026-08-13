using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Api.Auth;

public class SupabaseJwtAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly string _supabaseUrl;

    public SupabaseJwtAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
        _supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL")
            ?? Environment.GetEnvironmentVariable("VITE_SUPABASE_URL")
            ?? throw new InvalidOperationException("Falta la variable de entorno SUPABASE_URL");
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var authorizationHeader = Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(authorizationHeader) || !authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return AuthenticateResult.NoResult();
        }

        var token = authorizationHeader["Bearer ".Length..].Trim();
        if (string.IsNullOrWhiteSpace(token))
        {
            return AuthenticateResult.Fail("Token vacío.");
        }

        try
        {
            var jwt = new JwtSecurityTokenHandler();
            if (!jwt.CanReadToken(token))
            {
                return AuthenticateResult.Fail("Token JWT inválido.");
            }

            var securityToken = jwt.ReadJwtToken(token);
            var kid = securityToken.Header.Kid;
            if (string.IsNullOrWhiteSpace(kid))
            {
                return AuthenticateResult.Fail("El token JWT no incluye un key id válido.");
            }

            var jwksUrl = $"{_supabaseUrl.Trim().TrimEnd('/')}/auth/v1/.well-known/jwks.json";
            if (!Uri.TryCreate(jwksUrl, UriKind.Absolute, out var jwksUri))
            {
                return AuthenticateResult.Fail($"La URL del JWKS de Supabase es inválida: {jwksUrl}");
            }

            using var client = new HttpClient();
            var jwksJson = await client.GetStringAsync(jwksUri);
            var jwks = new JsonWebKeySet(jwksJson);
            var signingKey = jwks.Keys.FirstOrDefault(k => k.Kid == kid);
            if (signingKey is null)
            {
                return AuthenticateResult.Fail("No se encontró la clave pública del token en el JWKS de Supabase.");
            }

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = signingKey,
                NameClaimType = "sub",
                RoleClaimType = ClaimTypes.Role,
                ClockSkew = TimeSpan.FromSeconds(30)
            };

            var principal = jwt.ValidateToken(token, validationParameters, out _);
            var sub = principal.FindFirst("sub")?.Value
                ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(sub))
            {
                return AuthenticateResult.Fail("El token no incluye el identificador del usuario.");
            }

            var claims = principal.Claims.ToList();
            var authenticatedRole = claims.FirstOrDefault(c => c.Type == "role")?.Value;
            if (!string.IsNullOrWhiteSpace(authenticatedRole) && !claims.Any(c => c.Type == ClaimTypes.Role))
            {
                claims.Add(new Claim(ClaimTypes.Role, authenticatedRole));
            }
            if (!claims.Any(c => c.Type == ClaimTypes.Role))
            {
                claims.Add(new Claim(ClaimTypes.Role, "Visualizador"));
            }
            if (!claims.Any(c => c.Type == "id_usuario"))
            {
                claims.Add(new Claim("id_usuario", sub));
            }
            if (!claims.Any(c => c.Type == ClaimTypes.NameIdentifier))
            {
                claims.Add(new Claim(ClaimTypes.NameIdentifier, sub));
            }

            var identity = new ClaimsIdentity(claims, Scheme.Name);
            var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name);
            return AuthenticateResult.Success(ticket);
        }
        catch (Exception ex)
        {
            return AuthenticateResult.Fail(ex);
        }
    }
}
