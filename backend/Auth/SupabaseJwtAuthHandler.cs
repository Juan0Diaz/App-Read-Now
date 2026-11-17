using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Backend.Api.Auth;

public class SupabaseJwtAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly ISupabaseJwtTokenValidator _tokenValidator;

    public SupabaseJwtAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        ISupabaseJwtTokenValidator tokenValidator)
        : base(options, logger, encoder)
    {
        _tokenValidator = tokenValidator;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var authorizationHeader = Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(authorizationHeader) ||
            !authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
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
            var principal = await _tokenValidator.ValidateAsync(token, Context.RequestAborted);
            var sub = principal.FindFirst("sub")?.Value
                ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(sub))
            {
                return AuthenticateResult.Fail("El token no incluye el identificador del usuario.");
            }

            var claims = principal.Claims.ToList();
            var authenticatedRole = claims.FirstOrDefault(claim => claim.Type == "role")?.Value;
            if (!string.IsNullOrWhiteSpace(authenticatedRole) && !claims.Any(claim => claim.Type == ClaimTypes.Role))
            {
                claims.Add(new Claim(ClaimTypes.Role, authenticatedRole));
            }
            if (!claims.Any(claim => claim.Type == ClaimTypes.Role))
            {
                claims.Add(new Claim(ClaimTypes.Role, "Visualizador"));
            }
            if (!claims.Any(claim => claim.Type == "id_usuario"))
            {
                claims.Add(new Claim("id_usuario", sub));
            }
            if (!claims.Any(claim => claim.Type == ClaimTypes.NameIdentifier))
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
