using Backend.Api.Data;
using Backend.Api.Dtos;
using Backend.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Services;

public interface IPublicacionesServices
{
    Task<IReadOnlyList<Publicacion>> ObtenerTodasAsync();
    Task<IReadOnlyList<Publicacion>> ObtenerMiasAsync(Guid idUsuario);
    Task<Publicacion> CrearAsync(Guid idUsuario, PublicacionCreateDto dto);
    Task<PublicacionOperacionResultado> ActualizarAsync(Guid idPublicacion, Guid idUsuario, bool esAdmin, PublicacionUpdateDto dto);
    Task<PublicacionOperacionResultado> EliminarAsync(Guid idPublicacion, Guid idUsuario, bool esAdmin);
    Task<PublicacionOperacionResultado> EliminarConLibroAsync(Guid idPublicacion, Guid idUsuario, bool esAdmin);
}

public enum PublicacionOperacionEstado
{
    Ok,
    NotFound,
    Forbidden
}

public sealed record PublicacionOperacionResultado(PublicacionOperacionEstado Estado);

public sealed class PublicacionesServices : IPublicacionesServices
{
    private readonly AppDbContext _db;

    public PublicacionesServices(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Publicacion>> ObtenerTodasAsync()
    {
        return await _db.Publicaciones
            .Include(publicacion => publicacion.Libro)
            .Include(publicacion => publicacion.Usuario)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Publicacion>> ObtenerMiasAsync(Guid idUsuario)
    {
        return await _db.Publicaciones
            .Include(publicacion => publicacion.Libro)
            .Where(publicacion => publicacion.IdUsuario == idUsuario)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Publicacion> CrearAsync(Guid idUsuario, PublicacionCreateDto dto)
    {
        var publicacion = new Publicacion
        {
            IdPublicacion = Guid.NewGuid(),
            IdUsuario = idUsuario,
            IdLibro = dto.IdLibro,
            Precio = dto.Precio,
            Descripcion = dto.Descripcion,
            FechaPublicacion = dto.FechaPublicacion ?? DateOnly.FromDateTime(DateTime.UtcNow)
        };

        _db.Publicaciones.Add(publicacion);
        await _db.SaveChangesAsync();
        return publicacion;
    }

    public async Task<PublicacionOperacionResultado> ActualizarAsync(Guid idPublicacion, Guid idUsuario, bool esAdmin, PublicacionUpdateDto dto)
    {
        var publicacion = await _db.Publicaciones.FindAsync(idPublicacion);
        if (publicacion is null)
        {
            return new(PublicacionOperacionEstado.NotFound);
        }

        if (!esAdmin && publicacion.IdUsuario != idUsuario)
        {
            return new(PublicacionOperacionEstado.Forbidden);
        }

        if (dto.Precio is not null) publicacion.Precio = dto.Precio;
        if (dto.Descripcion is not null) publicacion.Descripcion = dto.Descripcion;

        await _db.SaveChangesAsync();
        return new(PublicacionOperacionEstado.Ok);
    }

    public async Task<PublicacionOperacionResultado> EliminarAsync(Guid idPublicacion, Guid idUsuario, bool esAdmin)
    {
        var publicacion = await _db.Publicaciones.FindAsync(idPublicacion);
        if (publicacion is null)
        {
            return new(PublicacionOperacionEstado.NotFound);
        }

        if (!esAdmin && publicacion.IdUsuario != idUsuario)
        {
            return new(PublicacionOperacionEstado.Forbidden);
        }

        _db.Publicaciones.Remove(publicacion);
        await _db.SaveChangesAsync();
        return new(PublicacionOperacionEstado.Ok);
    }

    public async Task<PublicacionOperacionResultado> EliminarConLibroAsync(Guid idPublicacion, Guid idUsuario, bool esAdmin)
    {
        var publicacion = await _db.Publicaciones.FindAsync(idPublicacion);
        if (publicacion is null)
        {
            return new(PublicacionOperacionEstado.NotFound);
        }

        if (!esAdmin && publicacion.IdUsuario != idUsuario)
        {
            return new(PublicacionOperacionEstado.Forbidden);
        }

        var idLibro = publicacion.IdLibro;

        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            if (idLibro is not null)
            {
                _db.Favoritos.RemoveRange(_db.Favoritos.Where(f => f.IdLibro == idLibro));
            }

            _db.Publicaciones.Remove(publicacion);
            await _db.SaveChangesAsync();

            if (idLibro is not null)
            {
                var libro = await _db.Libros.FindAsync(idLibro.Value);
                if (libro is not null)
                {
                    await transaction.CreateSavepointAsync("antes_de_borrar_libro");
                    try
                    {
                        _db.Libros.Remove(libro);
                        await _db.SaveChangesAsync();
                    }
                    catch (DbUpdateException)
                    {
                        await transaction.RollbackToSavepointAsync("antes_de_borrar_libro");
                        _db.ChangeTracker.Clear();

                        var libroParaOcultar = await _db.Libros.FindAsync(idLibro.Value);
                        if (libroParaOcultar is not null)
                        {
                            libroParaOcultar.Disponible = false;
                            libroParaOcultar.Estado = "Eliminado";
                            await _db.SaveChangesAsync();
                        }
                    }
                }
            }

            await transaction.CommitAsync();
            return new(PublicacionOperacionEstado.Ok);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
