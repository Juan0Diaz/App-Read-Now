using Backend.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<UsuarioRol> UsuarioRoles => Set<UsuarioRol>();
    public DbSet<Genero> Generos => Set<Genero>();
    public DbSet<Libro> Libros => Set<Libro>();
    public DbSet<Publicacion> Publicaciones => Set<Publicacion>();
    public DbSet<Favorito> Favoritos => Set<Favorito>();
    public DbSet<UsuarioPrestamo> UsuarioPrestamos => Set<UsuarioPrestamo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ---------- Usuario ----------
        modelBuilder.Entity<Usuario>(e =>
        {
            e.ToTable("Usuario");
            e.HasKey(x => x.IdUsuario);
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.Nombre).HasColumnName("nombre");
            e.Property(x => x.Correo).HasColumnName("correo");
            e.Property(x => x.Contrasena).HasColumnName("contrasena");
            e.Property(x => x.FechaDate).HasColumnName("fecha_date");
            e.Property(x => x.NumeroTel).HasColumnName("numero_tel");
        });

        // ---------- Rol ----------
        modelBuilder.Entity<Rol>(e =>
        {
            e.ToTable("Rol");
            e.HasKey(x => x.IdRol);
            e.Property(x => x.IdRol).HasColumnName("id_Rol");
            e.Property(x => x.NombreRol).HasColumnName("nombre_Rol");
        });

        // ---------- Usuario-Rol ----------
        modelBuilder.Entity<UsuarioRol>(e =>
        {
            e.ToTable("Usuario-Rol");
            e.HasKey(x => new { x.IdUsuario, x.IdRol });
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.IdRol).HasColumnName("id_Rol");

            e.HasOne(x => x.Usuario)
                .WithMany(u => u.Roles)
                .HasForeignKey(x => x.IdUsuario);

            e.HasOne(x => x.Rol)
                .WithMany()
                .HasForeignKey(x => x.IdRol);
        });

        // ---------- Genero ----------
        modelBuilder.Entity<Genero>(e =>
        {
            e.ToTable("Genero");
            e.HasKey(x => x.IdGenero);
            e.Property(x => x.IdGenero).HasColumnName("id_genero");
            e.Property(x => x.NombreGenero).HasColumnName("nombre_genero");
        });

        // ---------- Libro ----------
        modelBuilder.Entity<Libro>(e =>
        {
            e.ToTable("Libro");
            e.HasKey(x => x.IdLibro);
            e.Property(x => x.IdLibro).HasColumnName("id_libro");
            e.Property(x => x.Titulo).HasColumnName("titulo");
            e.Property(x => x.Autor).HasColumnName("autor");
            e.Property(x => x.Disponible).HasColumnName("disponible");
            e.Property(x => x.Editorial).HasColumnName("editorial");
            e.Property(x => x.Estado).HasColumnName("estado");
            e.Property(x => x.FechaPublicacion).HasColumnName("fecha_publicacion");
            e.Property(x => x.IdGenero).HasColumnName("id_genero");
            e.Property(x => x.Descripcion).HasColumnName("descripcion");
            e.Property(x => x.IdGenero1).HasColumnName("id_genero_1");
            e.Property(x => x.IdGenero2).HasColumnName("id_genero_2");
            e.Property(x => x.PortadaUrl).HasColumnName("portada_url");

            e.HasOne(x => x.Genero).WithMany().HasForeignKey(x => x.IdGenero).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Genero1).WithMany().HasForeignKey(x => x.IdGenero1).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Genero2).WithMany().HasForeignKey(x => x.IdGenero2).OnDelete(DeleteBehavior.SetNull);
        });

        // ---------- Publicacion ----------
        modelBuilder.Entity<Publicacion>(e =>
        {
            e.ToTable("Publicacion");
            e.HasKey(x => x.IdPublicacion);
            e.Property(x => x.IdPublicacion).HasColumnName("id_publicacion");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.IdLibro).HasColumnName("id_libro");
            e.Property(x => x.Precio).HasColumnName("precio");
            e.Property(x => x.Descripcion).HasColumnName("descripcion");
            e.Property(x => x.FechaPublicacion).HasColumnName("fecha_publicacion");

            e.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.IdUsuario);
            e.HasOne(x => x.Libro).WithMany().HasForeignKey(x => x.IdLibro);
        });

        // ---------- Favoritos ----------
        modelBuilder.Entity<Favorito>(e =>
        {
            e.ToTable("Favoritos");
            e.HasKey(x => x.IdFavorito);
            e.Property(x => x.IdFavorito).HasColumnName("id_favorito");
            e.Property(x => x.IdLibro).HasColumnName("id_libro");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");

            e.HasOne(x => x.Libro).WithMany().HasForeignKey(x => x.IdLibro);
            e.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.IdUsuario);
        });

        // ---------- Usuario_Prestamo ----------
        modelBuilder.Entity<UsuarioPrestamo>(e =>
        {
            e.ToTable("Usuario_Prestamo");
            e.HasKey(x => new { x.IdUsuario, x.IdLibro });
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.IdLibro).HasColumnName("id_libro");
            e.Property(x => x.Disponible).HasColumnName("Disponible");

            e.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.IdUsuario);
            e.HasOne(x => x.Libro).WithMany().HasForeignKey(x => x.IdLibro);
        });
    }
}
