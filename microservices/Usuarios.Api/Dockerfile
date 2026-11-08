# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY microservices/Usuarios.Api/Usuarios.Api.csproj microservices/Usuarios.Api/
COPY backend/Auth/ backend/Auth/
COPY backend/Controllers/UsuariosController.cs backend/Controllers/
COPY backend/Data/AppDbContext.cs backend/Data/
COPY backend/Dtos/UsuarioDtos.cs backend/Dtos/
COPY backend/MicroServicios-Back/UsuariosServices.cs backend/MicroServicios-Back/
COPY backend/Models/ backend/Models/
RUN dotnet restore microservices/Usuarios.Api/Usuarios.Api.csproj

COPY microservices/Usuarios.Api/ microservices/Usuarios.Api/
RUN dotnet publish microservices/Usuarios.Api/Usuarios.Api.csproj \
    --configuration Release \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Usuarios.Api.dll"]