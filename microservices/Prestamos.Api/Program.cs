using System.Text.Json;
using Backend.Api.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Prestamos.Api.Auth;
using Prestamos.Api.Data;
using Prestamos.Api.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration["SUPABASE_DB_CONNECTION_STRING"]
    ?? throw new InvalidOperationException("Falta la variable SUPABASE_DB_CONNECTION_STRING");
var supabaseUrl = builder.Configuration["SUPABASE_URL"]
    ?? builder.Configuration["VITE_SUPABASE_URL"]
    ?? throw new InvalidOperationException("Falta la variable SUPABASE_URL");
Environment.SetEnvironmentVariable("SUPABASE_URL", supabaseUrl);

builder.Services.AddDbContext<PrestamosDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<IPrestamosServices, PrestamosServices>();
builder.Services.AddScoped<IClaimsTransformation, RoleClaimsTransformation>();
builder.Services.AddHttpClient<ISupabaseJwtTokenValidator, SupabaseJwtTokenValidator>();

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddScheme<AuthenticationSchemeOptions, SupabaseJwtAuthHandler>(
        JwtBearerDefaults.AuthenticationScheme, _ => { });

builder.Services.AddAuthorization(options =>
    options.AddPolicy("Visualizador", policy => policy.RequireAuthenticatedUser()));

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
            (uri.IsLoopback || uri.Host.EndsWith(".app.github.dev", StringComparison.OrdinalIgnoreCase)))
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
app.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();
app.MapControllers();

app.Run();
