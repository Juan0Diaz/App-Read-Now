using Backend.Api.Data;
using Backend.Api.Dtos;
using Backend.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Services;

public interface IUsuariosServices
{
    Task<Usuario?> ObtenerPorIdAsync(Guid idUsuario);
    Task<IReadOnlyList<Usuario>> ObtenerTodosAsync();
    Task<bool> ActualizarPerfilAsync(Guid idUsuario, UsuarioUpdateDto dto);
    Task<bool> CambiarMiRolAsync(Guid idUsuario, string nombreRol);
    Task<bool> EliminarCuentaAsync(Guid idUsuario);
    Task<bool> AsignarRolAsync(Guid idUsuario, string nombreRol);
}

public sealed class UsuariosServices : IUsuariosServices
{
    private readonly AppDbContext _db;

    public UsuariosServices(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Usuario?> ObtenerPorIdAsync(Guid idUsuario)
    {
        return await _db.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);
    }

    public async Task<IReadOnlyList<Usuario>> ObtenerTodosAsync()
    {
        return await _db.Usuarios
            .Include(u => u.Roles)
            .ThenInclude(r => r.Rol)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<bool> ActualizarPerfilAsync(Guid idUsuario, UsuarioUpdateDto dto)
    {
        var usuario = await _db.Usuarios.FindAsync(idUsuario);
        if (usuario is null)
        {
            return false;
        }

        usuario.Nombre = dto.Nombre;
        usuario.FechaDate = dto.FechaDate;
        usuario.NumeroTel = dto.NumeroTel;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CambiarMiRolAsync(Guid idUsuario, string nombreRol)
    {
        if (nombreRol != "Visualizador" && nombreRol != "Publicador")
        {
            return false;
        }

        var rol = await _db.Roles.FirstOrDefaultAsync(r => r.NombreRol == nombreRol);
        if (rol is null)
        {
            return false;
        }

        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var actual = await _db.UsuarioRoles.FirstOrDefaultAsync(ur => ur.IdUsuario == idUsuario);
            if (actual is null)
            {
                _db.UsuarioRoles.Add(new UsuarioRol
                {
                    IdUsuario = idUsuario,
                    IdRol = rol.IdRol
                });
            }
            else if (actual.IdRol != rol.IdRol)
            {
                _db.UsuarioRoles.Remove(actual);
                await _db.SaveChangesAsync();

                _db.UsuarioRoles.Add(new UsuarioRol
                {
                    IdUsuario = idUsuario,
                    IdRol = rol.IdRol
                });
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> EliminarCuentaAsync(Guid idUsuario)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            _db.Favoritos.RemoveRange(_db.Favoritos.Where(f => f.IdUsuario == idUsuario));
            _db.Publicaciones.RemoveRange(_db.Publicaciones.Where(p => p.IdUsuario == idUsuario));
            _db.UsuarioRoles.RemoveRange(_db.UsuarioRoles.Where(ur => ur.IdUsuario == idUsuario));

            var usuario = await _db.Usuarios.FindAsync(idUsuario);
            if (usuario is not null)
            {
                _db.Usuarios.Remove(usuario);
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> AsignarRolAsync(Guid idUsuario, string nombreRol)
    {
        var usuario = await _db.Usuarios.FindAsync(idUsuario);
        if (usuario is null)
        {
            return false;
        }

        var rol = await _db.Roles.FirstOrDefaultAsync(r => r.NombreRol == nombreRol);
        if (rol is null)
        {
            return false;
        }

        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var actual = await _db.UsuarioRoles.FirstOrDefaultAsync(ur => ur.IdUsuario == idUsuario);
            if (actual is null)
            {
                _db.UsuarioRoles.Add(new UsuarioRol { IdUsuario = idUsuario, IdRol = rol.IdRol });
            }
            else if (actual.IdRol != rol.IdRol)
            {
                _db.UsuarioRoles.Remove(actual);
                await _db.SaveChangesAsync();

                _db.UsuarioRoles.Add(new UsuarioRol { IdUsuario = idUsuario, IdRol = rol.IdRol });
            }

            if (nombreRol == "Desactivado")
            {
                _db.Favoritos.RemoveRange(_db.Favoritos.Where(f => f.IdUsuario == idUsuario));
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}