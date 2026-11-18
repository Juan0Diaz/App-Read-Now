FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY microservices/Prestamos.Api/Prestamos.Api.csproj microservices/Prestamos.Api/
COPY backend/Auth/ backend/Auth/
RUN dotnet restore microservices/Prestamos.Api/Prestamos.Api.csproj

COPY microservices/Prestamos.Api/ microservices/Prestamos.Api/
RUN dotnet publish microservices/Prestamos.Api/Prestamos.Api.csproj \
    --configuration Release \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Prestamos.Api.dll"]
