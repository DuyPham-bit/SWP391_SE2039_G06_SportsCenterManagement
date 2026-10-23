# Multi-stage Dockerfile for ASP.NET Core 10 Web API
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project definition files for layer caching
COPY Backend/Backend/SportsCenterManagement.DAL/SportsCenterManagement.DAL.csproj Backend/Backend/SportsCenterManagement.DAL/
COPY Backend/Backend/SportsCenterManagement.BLL/SportsCenterManagement.BLL.csproj Backend/Backend/SportsCenterManagement.BLL/
COPY Backend/Backend/SportsCenterManagement.API/SportsCenterManagement.API.csproj Backend/Backend/SportsCenterManagement.API/

# Restore dependencies
RUN dotnet restore Backend/Backend/SportsCenterManagement.API/SportsCenterManagement.API.csproj

# Copy all source files and publish release
COPY Backend/Backend/ Backend/Backend/
WORKDIR /src/Backend/Backend/SportsCenterManagement.API
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage using ASP.NET Core 10 runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "SportsCenterManagement.API.dll"]