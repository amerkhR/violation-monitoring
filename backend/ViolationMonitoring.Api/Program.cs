using System.IO;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ViolationMonitoring.Api.Data;
using ViolationMonitoring.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>("database");

var rawConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=ViolationMonitoring.db";
var dbPath = rawConnectionString.Replace("Data Source=", "", StringComparison.OrdinalIgnoreCase).Trim();
if (!Path.IsPathRooted(dbPath))
{
    dbPath = Path.Combine(builder.Environment.ContentRootPath, dbPath);
}
var absoluteConnectionString = $"Data Source={dbPath}";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(absoluteConnectionString));

builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IViolationScoringService, ViolationScoringService>();

var jwtSection = builder.Configuration.GetSection("Jwt");
var signingKey = jwtSection["Key"] ?? throw new InvalidOperationException("JWT key not configured.");
if (string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("DefaultConnection")))
{
    throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");
}

if (signingKey.Length < 32)
{
    throw new InvalidOperationException("JWT key must be at least 32 characters.");
}
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();
var useHttpsRedirection = builder.Configuration.GetValue("UseHttpsRedirection", false);

if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

if (useHttpsRedirection)
{
    app.UseHttpsRedirection();
}
app.UseStaticFiles();
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
    SeedData.Initialize(db, scope.ServiceProvider.GetRequiredService<IPasswordHasher>());
}

app.Run();
Console.WriteLine("Application started");
