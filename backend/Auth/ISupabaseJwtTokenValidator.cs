using System.Security.Claims;

namespace Backend.Api.Auth;

public interface ISupabaseJwtTokenValidator
{
    Task<ClaimsPrincipal> ValidateAsync(string token, CancellationToken cancellationToken);
}
