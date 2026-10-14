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
		var generos = await _db.Generos
			.AsNoTracking()
			.ToListAsync();

		if (generos.Count == 0)
		{
			var defaults = new[]
			{
				new Genero { IdGenero = Guid.NewGuid(), NombreGenero = "Ficción" },
				new Genero { IdGenero = Guid.NewGuid(), NombreGenero = "Ciencia" },
				new Genero { IdGenero = Guid.NewGuid(), NombreGenero = "Historia" },
				new Genero { IdGenero = Guid.NewGuid(), NombreGenero = "Romance" },
				new Genero { IdGenero = Guid.NewGuid(), NombreGenero = "Tecnología" },
				new Genero { IdGenero = Guid.NewGuid(), NombreGenero = "Biografía" }
			};

			_db.Generos.AddRange(defaults);
			await _db.SaveChangesAsync();
			return defaults;
		}

		return generos;
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