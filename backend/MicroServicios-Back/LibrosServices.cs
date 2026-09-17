using Backend.Api.Data;
using Backend.Api.Dtos;
using Backend.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Services;

public interface ILibrosServices
{
	Task<IReadOnlyList<Libro>> ObtenerTodosAsync();
	Task<Libro?> ObtenerPorIdAsync(Guid idLibro);
	Task<Libro> CrearAsync(LibroCreateDto dto);
	Task<Libro> CrearConPublicacionAsync(Guid idUsuario, LibroConPublicacionCreateDto dto);
	Task<bool> ActualizarAsync(Guid idLibro, LibroUpdateDto dto);
	Task<bool> EliminarAsync(Guid idLibro);
}

public sealed class LibrosServices : ILibrosServices
{
	private readonly AppDbContext _db;

	public LibrosServices(AppDbContext db)
	{
		_db = db;
	}

	public async Task<IReadOnlyList<Libro>> ObtenerTodosAsync()
	{
		return await _db.Libros
			.Include(libro => libro.Genero)
			.Include(libro => libro.Genero1)
			.Include(libro => libro.Genero2)
			.AsNoTracking()
			.ToListAsync();
	}

	public async Task<Libro?> ObtenerPorIdAsync(Guid idLibro)
	{
		return await _db.Libros
			.Include(libro => libro.Genero)
			.Include(libro => libro.Genero1)
			.Include(libro => libro.Genero2)
			.AsNoTracking()
			.FirstOrDefaultAsync(libro => libro.IdLibro == idLibro);
	}

	public async Task<Libro> CrearAsync(LibroCreateDto dto)
	{
		var libro = new Libro
		{
			IdLibro = Guid.NewGuid(),
			Titulo = dto.Titulo,
			Autor = dto.Autor,
			Disponible = dto.Disponible,
			Editorial = dto.Editorial,
			Estado = dto.Estado,
			FechaPublicacion = dto.FechaPublicacion,
			IdGenero = dto.IdGenero,
			IdGenero1 = dto.IdGenero1,
			IdGenero2 = dto.IdGenero2,
			Descripcion = dto.Descripcion,
			PortadaUrl = dto.PortadaUrl
		};

		_db.Libros.Add(libro);
		await _db.SaveChangesAsync();
		return libro;
	}

	public async Task<Libro> CrearConPublicacionAsync(Guid idUsuario, LibroConPublicacionCreateDto dto)
	{
		await using var transaction = await _db.Database.BeginTransactionAsync();
		try
		{
			var libro = new Libro
			{
				IdLibro = Guid.NewGuid(),
				Titulo = dto.Titulo,
				Autor = dto.Autor,
				Disponible = true,
				Editorial = dto.Editorial,
				Estado = "Nuevo",
				FechaPublicacion = dto.FechaPublicacion,
				IdGenero = dto.IdGenero,
				IdGenero1 = dto.IdGenero1,
				IdGenero2 = dto.IdGenero2,
				Descripcion = dto.Descripcion,
				PortadaUrl = dto.PortadaUrl
			};

			_db.Libros.Add(libro);
			_db.Publicaciones.Add(new Publicacion
			{
				IdPublicacion = Guid.NewGuid(),
				IdUsuario = idUsuario,
				IdLibro = libro.IdLibro,
				Precio = 0,
				Descripcion = "Agregado al catálogo",
				FechaPublicacion = DateOnly.FromDateTime(DateTime.UtcNow)
			});

			await _db.SaveChangesAsync();
			await transaction.CommitAsync();
			return libro;
		}
		catch
		{
			await transaction.RollbackAsync();
			throw;
		}
	}

	public async Task<bool> ActualizarAsync(Guid idLibro, LibroUpdateDto dto)
	{
		var libro = await _db.Libros.FindAsync(idLibro);
		if (libro is null)
		{
			return false;
		}

		if (dto.Titulo is not null) libro.Titulo = dto.Titulo;
		if (dto.Autor is not null) libro.Autor = dto.Autor;
		if (dto.Disponible is not null) libro.Disponible = dto.Disponible.Value;
		if (dto.Editorial is not null) libro.Editorial = dto.Editorial;
		if (dto.Estado is not null) libro.Estado = dto.Estado;
		if (dto.FechaPublicacion is not null) libro.FechaPublicacion = dto.FechaPublicacion;
		if (dto.IdGenero is not null) libro.IdGenero = dto.IdGenero;
		if (dto.IdGenero1 is not null) libro.IdGenero1 = dto.IdGenero1;
		if (dto.IdGenero2 is not null) libro.IdGenero2 = dto.IdGenero2;
		if (dto.Descripcion is not null) libro.Descripcion = dto.Descripcion;
		if (dto.PortadaUrl is not null) libro.PortadaUrl = dto.PortadaUrl;

		await _db.SaveChangesAsync();
		return true;
	}

	public async Task<bool> EliminarAsync(Guid idLibro)
	{
		var libro = await _db.Libros.FindAsync(idLibro);
		if (libro is null)
		{
			return false;
		}

		_db.Libros.Remove(libro);
		await _db.SaveChangesAsync();
		return true;
	}
}
