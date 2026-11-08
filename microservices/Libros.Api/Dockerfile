FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY microservices/Libros.Api/Libros.Api.csproj microservices/Libros.Api/
RUN dotnet restore microservices/Libros.Api/Libros.Api.csproj

COPY microservices/Libros.Api/ microservices/Libros.Api/
COPY backend/Auth/ backend/Auth/
COPY backend/Controllers/LibrosController.cs backend/Controllers/
COPY backend/Data/AppDbContext.cs backend/Data/
COPY backend/Dtos/LibroDtos.cs backend/Dtos/
COPY backend/MicroServicios-Back/LibrosServices.cs backend/MicroServicios-Back/
COPY backend/Models/ backend/Models/
RUN dotnet publish microservices/Libros.Api/Libros.Api.csproj \
    --configuration Release \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Libros.Api.dll"]