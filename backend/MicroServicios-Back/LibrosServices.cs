using Backend.Api.Data;
using Backend.Api.Dtos;
using Backend.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Services;

public interface ILibrosServices
{
	Task<IReadOnlyList<Libro>> ObtenerTodosAsync();
	Task<IReadOnlyList<LibroRevisionSolicitudDto>> ObtenerSolicitudesRevisionAsync();
	Task<Libro?> ObtenerPorIdAsync(Guid idLibro);
	Task<Libro?> ObtenerGestionAsync(Guid idLibro, Guid idUsuario, bool esAdmin);
	Task<Libro> CrearAsync(LibroCreateDto dto);
	Task<Libro> CrearConPublicacionAsync(Guid idUsuario, LibroConPublicacionCreateDto dto);
	Task<OperacionLibroResultado> ActualizarAsync(Guid idLibro, Guid idUsuario, bool esAdmin, LibroUpdateDto dto);
	Task<OperacionLibroResultado> RevisarAsync(Guid idLibro, LibroRevisionDto dto);
	Task<OperacionLibroResultado> ResubmitirAsync(Guid idLibro, Guid idUsuario, LibroResubmitirDto dto);
	Task<bool> EliminarAsync(Guid idLibro);
}

public enum OperacionLibroEstado
{
	Ok,
	NotFound,
	Forbidden
}

public sealed record OperacionLibroResultado(OperacionLibroEstado Estado);

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
			.Where(libro => libro.EstadoRevision == Libro.RevisionAprobado)
			.AsNoTracking()
			.ToListAsync();
	}

	public async Task<IReadOnlyList<LibroRevisionSolicitudDto>> ObtenerSolicitudesRevisionAsync()
	{
		return await (
			from libro in _db.Libros
			where libro.EstadoRevision == Libro.RevisionPendiente
			join publicacion in _db.Publicaciones on libro.IdLibro equals publicacion.IdLibro into publicaciones
			from publicacion in publicaciones.DefaultIfEmpty()
			join usuario in _db.Usuarios on publicacion.IdUsuario equals usuario.IdUsuario into usuarios
			from usuario in usuarios.DefaultIfEmpty()
			orderby libro.IdLibro descending
			select new LibroRevisionSolicitudDto(
				libro,
				usuario == null
					? null
					: new PublicadorResumenDto(usuario.IdUsuario, usuario.Nombre, usuario.Correo, usuario.NumeroTel)
			))
			.AsNoTracking()
			.ToListAsync();
	}

	public async Task<Libro?> ObtenerPorIdAsync(Guid idLibro)
	{
		return await _db.Libros
			.Include(libro => libro.Genero)
			.Include(libro => libro.Genero1)
			.Include(libro => libro.Genero2)
			.Where(libro => libro.EstadoRevision == Libro.RevisionAprobado)
			.AsNoTracking()
			.FirstOrDefaultAsync(libro => libro.IdLibro == idLibro);
	}

	public async Task<Libro?> ObtenerGestionAsync(Guid idLibro, Guid idUsuario, bool esAdmin)
	{
		var libro = await _db.Libros
			.Include(item => item.Genero)
			.Include(item => item.Genero1)
			.Include(item => item.Genero2)
			.FirstOrDefaultAsync(item => item.IdLibro == idLibro);
		if (libro is null)
		{
			return null;
		}

		if (esAdmin)
		{
			return libro;
		}

		var esPropietario = await _db.Publicaciones.AnyAsync(publicacion =>
			publicacion.IdLibro == idLibro && publicacion.IdUsuario == idUsuario);
		return esPropietario ? libro : null;
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
			PortadaUrl = dto.PortadaUrl,
			EstadoRevision = Libro.RevisionPendiente
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
				PortadaUrl = dto.PortadaUrl,
				EstadoRevision = Libro.RevisionPendiente,
				ComentarioRevision = null
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

	public async Task<OperacionLibroResultado> ActualizarAsync(Guid idLibro, Guid idUsuario, bool esAdmin, LibroUpdateDto dto)
	{
		var libro = await _db.Libros.FindAsync(idLibro);
		if (libro is null)
		{
			return new(OperacionLibroEstado.NotFound);
		}

		if (!esAdmin && !await _db.Publicaciones.AnyAsync(publicacion =>
			publicacion.IdLibro == idLibro && publicacion.IdUsuario == idUsuario))
		{
			return new(OperacionLibroEstado.Forbidden);
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

		if (!esAdmin)
		{
			libro.EstadoRevision = Libro.RevisionPendiente;
			libro.ComentarioRevision = null;
		}

		await _db.SaveChangesAsync();
		return new(OperacionLibroEstado.Ok);
	}

	public async Task<OperacionLibroResultado> RevisarAsync(Guid idLibro, LibroRevisionDto dto)
	{
		var libro = await _db.Libros.FindAsync(idLibro);
		if (libro is null)
		{
			return new(OperacionLibroEstado.NotFound);
		}

		var requiereComentario = dto.Estado == Libro.RevisionCorreccion;
		if (requiereComentario && string.IsNullOrWhiteSpace(dto.Comentario))
		{
			throw new ArgumentException("La corrección requiere un comentario.");
		}

		libro.EstadoRevision = dto.Estado;
		libro.ComentarioRevision = requiereComentario ? dto.Comentario!.Trim() : null;
		await _db.SaveChangesAsync();
		return new(OperacionLibroEstado.Ok);
	}

	public async Task<OperacionLibroResultado> ResubmitirAsync(Guid idLibro, Guid idUsuario, LibroResubmitirDto dto)
	{
		var libro = await _db.Libros.FindAsync(idLibro);
		if (libro is null)
		{
			return new(OperacionLibroEstado.NotFound);
		}

		if (!await _db.Publicaciones.AnyAsync(publicacion =>
			publicacion.IdLibro == idLibro && publicacion.IdUsuario == idUsuario))
		{
			return new(OperacionLibroEstado.Forbidden);
		}

		libro.EstadoRevision = Libro.RevisionPendiente;
		libro.ComentarioRevision = string.IsNullOrWhiteSpace(dto.Comentario) ? null : dto.Comentario.Trim();
		await _db.SaveChangesAsync();
		return new(OperacionLibroEstado.Ok);
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
