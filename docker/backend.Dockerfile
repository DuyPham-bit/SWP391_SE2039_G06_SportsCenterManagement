FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Backend/Backend/ ./

RUN dotnet publish SportsCenterManagement.API/SportsCenterManagement.API.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish ./

ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

# Render supplies PORT at runtime. Keep 8080 as the local Docker Compose
# default, while allowing any PaaS-assigned port without rebuilding the image.
ENTRYPOINT ["sh", "-c", "exec dotnet SportsCenterManagement.API.dll --urls http://0.0.0.0:${PORT:-8080}"]
