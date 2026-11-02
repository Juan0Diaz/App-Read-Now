using Generos.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Generos.Api.Data;

public sealed class GenerosDbContext : DbContext
{
    public GenerosDbContext(DbContextOptions<GenerosDbContext> options) : base(options) { }

    public DbSet<Genero> Generos => Set<Genero>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<UsuarioRol> UsuarioRoles => Set<UsuarioRol>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Genero>(entity =>
        {
            entity.ToTable("Genero");
            entity.HasKey(genero => genero.IdGenero);
            entity.Property(genero => genero.IdGenero).HasColumnName("id_genero");
            entity.Property(genero => genero.NombreGenero).HasColumnName("nombre_genero");
        });

        modelBuilder.Entity<Rol>(entity =>
        {
            entity.ToTable("Rol");
            entity.HasKey(rol => rol.IdRol);
            entity.Property(rol => rol.IdRol).HasColumnName("id_Rol");
            entity.Property(rol => rol.NombreRol).HasColumnName("nombre_Rol");
        });

        modelBuilder.Entity<UsuarioRol>(entity =>
        {
            entity.ToTable("Usuario-Rol");
            entity.HasKey(usuarioRol => new { usuarioRol.IdUsuario, usuarioRol.IdRol });
            entity.Property(usuarioRol => usuarioRol.IdUsuario).HasColumnName("id_usuario");
            entity.Property(usuarioRol => usuarioRol.IdRol).HasColumnName("id_Rol");
        });
    }
}