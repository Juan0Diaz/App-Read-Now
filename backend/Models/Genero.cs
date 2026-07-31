namespace Backend.Api.Models;

// Coincide con la tabla public."Genero"
public class Genero
{
    public Guid IdGenero { get; set; }
    public string NombreGenero { get; set; } = string.Empty;
}
