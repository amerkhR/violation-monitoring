# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV HTTP_PROXY=$HTTP_PROXY \
    HTTPS_PROXY=$HTTPS_PROXY \
    NO_PROXY=$NO_PROXY \
    NUGET_CERT_REVOCATION_MODE=offline

COPY NuGet.Config ViolationMonitoring.Api.csproj ./
RUN --mount=type=cache,target=/root/.nuget/packages \
    dotnet restore "ViolationMonitoring.Api.csproj"

COPY . .
RUN --mount=type=cache,target=/root/.nuget/packages \
    dotnet publish "ViolationMonitoring.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir -p /app/data /app/wwwroot/uploads/images /app/wwwroot/uploads/videos /app/wwwroot/uploads/employee-photos
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "ViolationMonitoring.Api.dll"]
