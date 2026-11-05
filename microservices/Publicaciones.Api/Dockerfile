# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY microservices/Publicaciones.Api/Publicaciones.Api.csproj microservices/Publicaciones.Api/
COPY backend/Auth/ backend/Auth/
COPY backend/Data/AppDbContext.cs backend/Data/
COPY backend/Models/ backend/Models/
RUN dotnet restore microservices/Publicaciones.Api/Publicaciones.Api.csproj

COPY microservices/Publicaciones.Api/ microservices/Publicaciones.Api/
RUN dotnet publish microservices/Publicaciones.Api/Publicaciones.Api.csproj \
    --configuration Release \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Publicaciones.Api.dll"]