using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Api.Auth;

public sealed class SupabaseJwtTokenValidator : ISupabaseJwtTokenValidator
{
    private readonly HttpClient _httpClient;
    private readonly string _supabaseUrl;

    public SupabaseJwtTokenValidator(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _supabaseUrl = configuration["SUPABASE_URL"]
            ?? configuration["VITE_SUPABASE_URL"]
            ?? throw new InvalidOperationException("Falta la variable de entorno SUPABASE_URL");
    }

    public async Task<ClaimsPrincipal> ValidateAsync(string token, CancellationToken cancellationToken)
    {
        var jwt = new JwtSecurityTokenHandler();
        if (!jwt.CanReadToken(token))
        {
            throw new SecurityTokenException("Token JWT inválido.");
        }

        var securityToken = jwt.ReadJwtToken(token);
        var kid = securityToken.Header.Kid;
        if (string.IsNullOrWhiteSpace(kid))
        {
            throw new SecurityTokenException("El token JWT no incluye un key id válido.");
        }

        var jwksUrl = $"{_supabaseUrl.Trim().TrimEnd('/')}/auth/v1/.well-known/jwks.json";
        if (!Uri.TryCreate(jwksUrl, UriKind.Absolute, out var jwksUri))
        {
            throw new SecurityTokenException($"La URL del JWKS de Supabase es inválida: {jwksUrl}");
        }

        var jwksJson = await _httpClient.GetStringAsync(jwksUri, cancellationToken);
        var jwks = new JsonWebKeySet(jwksJson);
        var signingKey = jwks.Keys.FirstOrDefault(key => key.Kid == kid);
        if (signingKey is null)
        {
            throw new SecurityTokenException("No se encontró la clave pública del token en el JWKS de Supabase.");
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

        return jwt.ValidateToken(token, validationParameters, out _);
    }
}
