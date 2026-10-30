# Multi-stage Dockerfile for ASP.NET Core 10 Web API
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project definition files for layer caching
COPY Backend/SportsCenterManagement.DAL/SportsCenterManagement.DAL.csproj Backend/SportsCenterManagement.DAL/
COPY Backend/SportsCenterManagement.BLL/SportsCenterManagement.BLL.csproj Backend/SportsCenterManagement.BLL/
COPY Backend/SportsCenterManagement.API/SportsCenterManagement.API.csproj Backend/SportsCenterManagement.API/

# Restore dependencies
RUN dotnet restore Backend/SportsCenterManagement.API/SportsCenterManagement.API.csproj

# Copy all source files and publish release
COPY Backend/ Backend/
WORKDIR /src/Backend/SportsCenterManagement.API
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage using ASP.NET Core 10 runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "SportsCenterManagement.API.dll"]
