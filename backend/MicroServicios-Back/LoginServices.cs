using Backend.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Services;

public sealed record LoginPerfilDto(
	Guid IdUsuario,
	string Correo,
	string? Nombre,
	DateOnly? FechaDate,
	string? NumeroTel,
	string Rol);

public interface ILoginServices
{
	Task<LoginPerfilDto?> ObtenerPerfilAsync(Guid idUsuario);
}

public sealed class LoginServices : ILoginServices
{
	private readonly AppDbContext _db;

	public LoginServices(AppDbContext db)
	{
		_db = db;
	}

	public async Task<LoginPerfilDto?> ObtenerPerfilAsync(Guid idUsuario)
	{
		var usuario = await _db.Usuarios
			.AsNoTracking()
			.Where(usuario => usuario.IdUsuario == idUsuario)
			.Select(usuario => new
			{
				usuario.IdUsuario,
				usuario.Correo,
				usuario.Nombre,
				usuario.FechaDate,
				usuario.NumeroTel,
				Rol = usuario.Roles
					.Select(usuarioRol => usuarioRol.Rol!.NombreRol)
					.FirstOrDefault()
			})
			.FirstOrDefaultAsync();

		if (usuario is null)
		{
			return null;
		}

		return new LoginPerfilDto(
			usuario.IdUsuario,
			usuario.Correo,
			usuario.Nombre,
			usuario.FechaDate,
			usuario.NumeroTel,
			usuario.Rol ?? "Visualizador");
	}
}
