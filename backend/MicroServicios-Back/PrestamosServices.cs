using Backend.Api.Data;
using Backend.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Services;

public interface IPrestamosServices
{
	Task<IReadOnlyList<UsuarioPrestamo>> ObtenerMisPrestamosAsync(Guid idUsuario);
	Task<PrestamoSolicitudResultado> SolicitarAsync(Guid idUsuario, Guid idLibro);
}

public enum PrestamoSolicitudEstado
{
	Creado,
	LibroNoEncontrado,
	LibroNoDisponible
}

public sealed record PrestamoSolicitudResultado(PrestamoSolicitudEstado Estado);

public sealed class PrestamosServices : IPrestamosServices
{
	private readonly AppDbContext _db;

	public PrestamosServices(AppDbContext db)
	{
		_db = db;
	}

	public async Task<IReadOnlyList<UsuarioPrestamo>> ObtenerMisPrestamosAsync(Guid idUsuario)
	{
		return await _db.UsuarioPrestamos
			.Include(prestamo => prestamo.Libro)
			.Where(prestamo => prestamo.IdUsuario == idUsuario)
			.AsNoTracking()
			.ToListAsync();
	}

	public async Task<PrestamoSolicitudResultado> SolicitarAsync(Guid idUsuario, Guid idLibro)
	{
		var libro = await _db.Libros.FindAsync(idLibro);
		if (libro is null)
		{
			return new(PrestamoSolicitudEstado.LibroNoEncontrado);
		}

		if (!libro.Disponible)
		{
			return new(PrestamoSolicitudEstado.LibroNoDisponible);
		}

		await using var transaction = await _db.Database.BeginTransactionAsync();
		try
		{
			_db.UsuarioPrestamos.Add(new UsuarioPrestamo
			{
				IdUsuario = idUsuario,
				IdLibro = idLibro,
				Disponible = true
			});

			libro.Disponible = false;

			await _db.SaveChangesAsync();
			await transaction.CommitAsync();
			return new(PrestamoSolicitudEstado.Creado);
		}
		catch
		{
			await transaction.RollbackAsync();
			throw;
		}
	}
}