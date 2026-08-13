using System.Text;
using Backend.Api.Auth;
using Backend.Api.Data;
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

var jwtSecret = builder.Configuration["SUPABASE_JWT_SECRET"]
    ?? throw new InvalidOperationException("Falta la variable de entorno SUPABASE_JWT_SECRET");

// ---------- Servicios ----------
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<IClaimsTransformation, RoleClaimsTransformation>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Supabase firma los JWT de usuario con HS256 usando el JWT Secret del proyecto.
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = (builder.Configuration["SUPABASE_URL"] ?? builder.Configuration["VITE_SUPABASE_URL"]) is { } url
                ? $"{url.TrimEnd('/')}/auth/v1"
                : null,
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Administrador", p => p.RequireRole("Administrador"));
    options.AddPolicy("Publicador", p => p.RequireRole("Publicador", "Administrador"));
    // Antes: "cualquier usuario autenticado" pasaba, incluyendo a los Desactivados
    // (porque 'Desactivado' no es un rol que la política revisara). Ahora exige
    // explícitamente uno de los 3 roles activos.
    options.AddPolicy("Visualizador", p => p.RequireRole("Visualizador", "Publicador", "Administrador"));
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

builder.Services.AddControllers();
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