using Microsoft.EntityFrameworkCore;
using ViolationMonitoring.Api.Domain;

namespace ViolationMonitoring.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Violation> Violations => Set<Violation>();
    public DbSet<ViolationType> ViolationTypes => Set<ViolationType>();
    public DbSet<Report> Reports => Set<Report>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(x => x.Login).IsUnique();
        modelBuilder.Entity<Department>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<Employee>().Property(x => x.HireDate).HasConversion<DateOnlyConverter>();
        modelBuilder.Entity<User>()
            .HasOne(x => x.Employee)
            .WithOne()
            .HasForeignKey<User>(x => x.EmployeeId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<Violation>()
            .HasOne(x => x.Inspector)
            .WithMany()
            .HasForeignKey(x => x.InspectorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class DateOnlyConverter : Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateOnly, DateTime>
{
    public DateOnlyConverter() : base(
        value => value.ToDateTime(TimeOnly.MinValue),
        value => DateOnly.FromDateTime(value))
    {
    }
}
