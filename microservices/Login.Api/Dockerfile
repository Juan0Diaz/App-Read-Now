# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY microservices/Login.Api/Login.Api.csproj microservices/Login.Api/
COPY backend/Auth/ backend/Auth/
COPY backend/Controllers/LoginController.cs backend/Controllers/
COPY backend/Data/AppDbContext.cs backend/Data/
COPY backend/MicroServicios-Back/LoginServices.cs backend/MicroServicios-Back/
COPY backend/Models/ backend/Models/
RUN dotnet restore microservices/Login.Api/Login.Api.csproj

COPY microservices/Login.Api/ microservices/Login.Api/
RUN dotnet publish microservices/Login.Api/Login.Api.csproj \
    --configuration Release \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Login.Api.dll"]
