using Backend.Api.Data;
using Backend.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Services;

public interface IGenerosServices
{
	Task<IReadOnlyList<Genero>> ObtenerTodosAsync();
	Task<Genero> CrearAsync(Genero genero);
	Task<bool> EliminarAsync(Guid idGenero);
}

public sealed class GenerosServices : IGenerosServices
{
	private readonly AppDbContext _db;

	public GenerosServices(AppDbContext db)
	{
		_db = db;
	}

	public async Task<IReadOnlyList<Genero>> ObtenerTodosAsync()
	{
		return await _db.Generos
			.AsNoTracking()
			.ToListAsync();
	}

	public async Task<Genero> CrearAsync(Genero genero)
	{
		genero.IdGenero = Guid.NewGuid();
		_db.Generos.Add(genero);
		await _db.SaveChangesAsync();
		return genero;
	}

	public async Task<bool> EliminarAsync(Guid idGenero)
	{
		var genero = await _db.Generos.FindAsync(idGenero);
		if (genero is null)
		{
			return false;
		}

		_db.Generos.Remove(genero);
		await _db.SaveChangesAsync();
		return true;
	}
}