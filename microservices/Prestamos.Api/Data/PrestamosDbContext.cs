using Microsoft.EntityFrameworkCore;
using Prestamos.Api.Models;

namespace Prestamos.Api.Data;

public sealed class PrestamosDbContext : DbContext
{
    public PrestamosDbContext(DbContextOptions<PrestamosDbContext> options) : base(options) { }

    public DbSet<Genero> Generos => Set<Genero>();
    public DbSet<Libro> Libros => Set<Libro>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<UsuarioPrestamo> UsuarioPrestamos => Set<UsuarioPrestamo>();
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

        modelBuilder.Entity<Libro>(entity =>
        {
            entity.ToTable("Libro");
            entity.HasKey(libro => libro.IdLibro);
            entity.Property(libro => libro.IdLibro).HasColumnName("id_libro");
            entity.Property(libro => libro.Titulo).HasColumnName("titulo");
            entity.Property(libro => libro.Autor).HasColumnName("autor");
            entity.Property(libro => libro.Disponible).HasColumnName("disponible");
            entity.Property(libro => libro.Editorial).HasColumnName("editorial");
            entity.Property(libro => libro.Estado).HasColumnName("estado");
            entity.Property(libro => libro.FechaPublicacion).HasColumnName("fecha_publicacion");
            entity.Property(libro => libro.IdGenero).HasColumnName("id_genero");
            entity.Property(libro => libro.IdGenero1).HasColumnName("id_genero_1");
            entity.Property(libro => libro.IdGenero2).HasColumnName("id_genero_2");
            entity.Property(libro => libro.Descripcion).HasColumnName("descripcion");
            entity.Property(libro => libro.PortadaUrl).HasColumnName("portada_url");
            entity.Property(libro => libro.EstadoRevision).HasColumnName("estado_revision");
            entity.Property(libro => libro.ComentarioRevision).HasColumnName("comentario_revision");

            entity.HasOne(libro => libro.Genero).WithMany().HasForeignKey(libro => libro.IdGenero);
            entity.HasOne(libro => libro.Genero1).WithMany().HasForeignKey(libro => libro.IdGenero1);
            entity.HasOne(libro => libro.Genero2).WithMany().HasForeignKey(libro => libro.IdGenero2);
        });

        modelBuilder.Entity<UsuarioPrestamo>(entity =>
        {
            entity.ToTable("Usuario_Prestamo");
            entity.HasKey(prestamo => new { prestamo.IdUsuario, prestamo.IdLibro });
            entity.Property(prestamo => prestamo.IdUsuario).HasColumnName("id_usuario");
            entity.Property(prestamo => prestamo.IdLibro).HasColumnName("id_libro");
            entity.Property(prestamo => prestamo.Disponible).HasColumnName("Disponible");
            entity.HasOne(prestamo => prestamo.Libro).WithMany().HasForeignKey(prestamo => prestamo.IdLibro);
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
