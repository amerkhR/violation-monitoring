FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore "ViolationMonitoring.Api.csproj"
RUN dotnet publish "ViolationMonitoring.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir -p /app/wwwroot/uploads/images /app/wwwroot/uploads/videos
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "ViolationMonitoring.Api.dll"]
