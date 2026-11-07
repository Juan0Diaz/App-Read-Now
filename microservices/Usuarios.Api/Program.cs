using System.Text.Json;
using Backend.Api.Auth;
using Backend.Api.Data;
using Backend.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration["SUPABASE_DB_CONNECTION_STRING"]
    ?? throw new InvalidOperationException("Falta la variable SUPABASE_DB_CONNECTION_STRING");
var supabaseUrl = builder.Configuration["SUPABASE_URL"]
    ?? builder.Configuration["VITE_SUPABASE_URL"]
    ?? throw new InvalidOperationException("Falta la variable SUPABASE_URL");
Environment.SetEnvironmentVariable("SUPABASE_URL", supabaseUrl);

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<IUsuariosServices, UsuariosServices>();
builder.Services.AddScoped<IClaimsTransformation, RoleClaimsTransformation>();
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddScheme<AuthenticationSchemeOptions, SupabaseJwtAuthHandler>(JwtBearerDefaults.AuthenticationScheme, _ => { });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Administrador", policy => policy.RequireRole("Administrador"));
    options.AddPolicy("Visualizador", policy => policy.RequireAuthenticatedUser());
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
                Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
                (uri.IsLoopback ||
                 uri.Host.EndsWith(".app.github.dev", StringComparison.OrdinalIgnoreCase) ||
                 uri.Host.Equals("juan0diaz.github.io", StringComparison.OrdinalIgnoreCase)))
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.SnakeCaseLower;
    });

var app = builder.Build();

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/health/live", () => Results.Ok(new { status = "ok" })).AllowAnonymous();
app.MapGet("/health", async (AppDbContext db, CancellationToken cancellationToken) =>
{
    try
    {
        await db.Database.SqlQueryRaw<int>("SELECT 1 AS \"Value\"").SingleAsync(cancellationToken);
        return Results.Ok(new { status = "ok", supabase = "connected" });
    }
    catch (Exception exception)
    {
        app.Logger.LogError(exception, "No se pudo comprobar la conexión con Supabase.");
        return Results.Problem(
            statusCode: StatusCodes.Status503ServiceUnavailable,
            title: "Supabase no está disponible.");
    }
}).AllowAnonymous();
app.MapControllers();

app.Run();