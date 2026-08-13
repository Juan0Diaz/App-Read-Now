using System.Text;
using System.Text.Json;
using Backend.Api.Auth;
using Backend.Api.Data;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---------- Configuración (variables de entorno / secretos de Codespaces) ----------
// SUPABASE_DB_CONNECTION_STRING: cadena de conexión a Postgres (Project Settings > Database)
// SUPABASE_JWT_SECRET: JWT Secret (Project Settings > API > JWT Settings)
var connectionString = builder.Configuration["SUPABASE_DB_CONNECTION_STRING"]
    ?? throw new InvalidOperationException("Falta la variable de entorno SUPABASE_DB_CONNECTION_STRING");

var supabaseUrl = builder.Configuration["SUPABASE_URL"] ?? builder.Configuration["VITE_SUPABASE_URL"]
    ?? throw new InvalidOperationException("Falta la variable de entorno SUPABASE_URL");

// ---------- Servicios ----------
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

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
    options.AddPolicy("Administrador", p => p.RequireAssertion(ctx =>
        ctx.User.Identity?.IsAuthenticated == true &&
        (ctx.User.IsInRole("Administrador") || ctx.User.IsInRole("Publicador") || ctx.User.IsInRole("Visualizador") || ctx.User.IsInRole("authenticated"))));

    options.AddPolicy("Publicador", p => p.RequireAssertion(ctx =>
        ctx.User.Identity?.IsAuthenticated == true &&
        (ctx.User.IsInRole("Publicador") || ctx.User.IsInRole("Administrador") || ctx.User.IsInRole("Visualizador") || ctx.User.IsInRole("authenticated"))));

    options.AddPolicy("Visualizador", p => p.RequireAssertion(ctx =>
        ctx.User.Identity?.IsAuthenticated == true));
});

// CORS: en Codespaces, el frontend se sirve desde una URL dinámica tipo
// https://<nombre>-3000.app.github.dev, así que además de localhost permitimos ese patrón.
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
                origin.Contains("localhost") ||
                origin.Contains("127.0.0.1") ||
                origin.EndsWith(".app.github.dev"))
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

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();