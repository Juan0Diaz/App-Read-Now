using Backend.Api.Data;
using Backend.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Services;

public interface IFavoritosServices
{
	Task<IReadOnlyList<Favorito>> ObtenerMisFavoritosAsync(Guid idUsuario);
	Task AgregarAsync(Guid idUsuario, Guid idLibro);
	Task<bool> QuitarAsync(Guid idUsuario, Guid idLibro);
}

public sealed class FavoritosServices : IFavoritosServices
{
	private readonly AppDbContext _db;

	public FavoritosServices(AppDbContext db)
	{
		_db = db;
	}

	public async Task<IReadOnlyList<Favorito>> ObtenerMisFavoritosAsync(Guid idUsuario)
	{
		return await _db.Favoritos
			.Include(favorito => favorito.Libro!)
			.ThenInclude(libro => libro.Genero)
			.Where(favorito => favorito.IdUsuario == idUsuario)
			.AsNoTracking()
			.ToListAsync();
	}

	public async Task AgregarAsync(Guid idUsuario, Guid idLibro)
	{
		var yaExiste = await _db.Favoritos
			.AnyAsync(favorito => favorito.IdUsuario == idUsuario && favorito.IdLibro == idLibro);

		if (yaExiste)
		{
			return;
		}

		_db.Favoritos.Add(new Favorito
		{
			IdFavorito = Guid.NewGuid(),
			IdUsuario = idUsuario,
			IdLibro = idLibro
		});

		await _db.SaveChangesAsync();
	}

	public async Task<bool> QuitarAsync(Guid idUsuario, Guid idLibro)
	{
		var favorito = await _db.Favoritos
			.FirstOrDefaultAsync(f => f.IdUsuario == idUsuario && f.IdLibro == idLibro);

		if (favorito is null)
		{
			return false;
		}

		_db.Favoritos.Remove(favorito);
		await _db.SaveChangesAsync();
		return true;
	}
}