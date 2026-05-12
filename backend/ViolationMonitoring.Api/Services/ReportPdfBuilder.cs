using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ViolationMonitoring.Api.Contracts;

namespace ViolationMonitoring.Api.Services;

public sealed class ReportPdfBuilder
{
    private static readonly string[] ChartPalette =
    [
        "#4472C4", "#ED7D31", "#A5A5A5", "#FFC000", "#5B9BD5",
        "#70AD47", "#264478", "#9E480E", "#997300", "#43682B"
    ];

    public static byte[] Build(
        string authorLine,
        string tabNumberLine,
        string createdAtLocal,
        string periodDescription,
        string rangeDescription,
        IReadOnlyList<(string Label, int Count)> byViolationType,
        IReadOnlyList<(string Label, int Count)> byDepartment,
        IReadOnlyList<(string EmployeeName, int Count)> topEmployees)
    {
        return Document.Create(document =>
        {
            document.Page(page =>
            {
                page.Margin(36);
                page.DefaultTextStyle(t => t.FontSize(10).FontFamily("Lato"));

                page.Header().Row(row =>
                {
                    row.RelativeItem().Text("Отчёт по нарушениям").FontSize(18).SemiBold();
                });

                page.Content().Column(main =>
                {
                    main.Spacing(14);

                    main.Item().Text(authorLine);
                    main.Item().Text(tabNumberLine);
                    main.Item().Text($"Дата формирования: {createdAtLocal}");
                    main.Item().Text($"Период: {periodDescription}");
                    main.Item().Text($"Диапазон данных: {rangeDescription}").FontColor(Colors.Grey.Darken2);

                    main.Item().PaddingTop(6).Text("По типам нарушений").FontSize(14).SemiBold();
                    main.Item().Element(c => DrawDistributionChart(c, byViolationType));

                    main.Item().PaddingTop(8).Text("По отделам").FontSize(14).SemiBold();
                    main.Item().Element(c => DrawDistributionChart(c, byDepartment));

                    main.Item().PaddingTop(8).Text("Сотрудники с максимумом нарушений").FontSize(14).SemiBold();
                    main.Item().Element(c => DrawTopEmployeesTable(c, topEmployees));
                });
            });
        }).GeneratePdf();
    }

    private static void DrawDistributionChart(IContainer container, IReadOnlyList<(string Label, int Count)> items)
    {
        var data = items.Where(x => x.Count > 0).OrderByDescending(x => x.Count).ToList();
        if (data.Count == 0)
        {
            container.Text("Нет данных за выбранный период.").Italic().FontColor(Colors.Grey.Medium);
            return;
        }

        var total = data.Sum(x => x.Count);
        container.Row(row =>
        {
            row.Spacing(16);
            row.RelativeItem(2).Column(barCol =>
            {
                barCol.Item().Height(36).Row(r =>
                {
                    r.Spacing(2);
                    foreach (var (idx, item) in data.Select((x, i) => (i, x)))
                    {
                        var w = total > 0 ? (float)item.Count / total : 0f;
                        var color = ChartPalette[idx % ChartPalette.Length];
                        r.RelativeItem(w <= 0 ? 0.01f : w).Height(36).Background(color);
                    }
                });
            });

            row.RelativeItem(3).Column(leg =>
            {
                leg.Spacing(4);
                foreach (var (idx, item) in data.Select((x, i) => (i, x)))
                {
                    var color = ChartPalette[idx % ChartPalette.Length];
                    leg.Item().Row(lr =>
                    {
                        lr.ConstantItem(14).Height(14).Background(color);
                        lr.RelativeItem().PaddingLeft(8).AlignMiddle()
                            .Text($"{item.Label}: {item.Count}");
                    });
                }
            });
        });
    }

    private static void DrawTopEmployeesTable(IContainer container, IReadOnlyList<(string EmployeeName, int Count)> rows)
    {
        if (rows.Count == 0)
        {
            container.Text("Нет данных за выбранный период.").Italic().FontColor(Colors.Grey.Medium);
            return;
        }

        container.Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.RelativeColumn(3);
                c.ConstantColumn(80);
            });

            table.Header(h =>
            {
                h.Cell().Element(H).Text("Сотрудник");
                h.Cell().Element(H).AlignRight().Text("Нарушений");
            });

            foreach (var r in rows)
            {
                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(4).Text(r.EmployeeName);
                table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(4).AlignRight().Text(r.Count.ToString());
            }
        });
    }

    private static IContainer H(IContainer c) =>
        c.DefaultTextStyle(t => t.SemiBold()).PaddingVertical(4).BorderBottom(1).BorderColor(Colors.Grey.Medium);
}

public static class ReportPeriodHelper
{
    public static string ToRussianLabel(ReportPeriod period) => period switch
    {
        ReportPeriod.Daily => "Дневной",
        ReportPeriod.Monthly => "Месячный",
        ReportPeriod.Quarterly => "Квартальный",
        ReportPeriod.Yearly => "Годовой",
        _ => period.ToString()
    };

    public static (DateTime FromUtc, DateTime ToUtc) GetUtcRange(ReportPeriod period, DateTime nowUtc)
    {
        var to = nowUtc;
        return period switch
        {
            ReportPeriod.Daily => (nowUtc.Date, to),
            ReportPeriod.Monthly => (new DateTime(nowUtc.Year, nowUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc), to),
            ReportPeriod.Quarterly => (QuarterStartUtc(nowUtc), to),
            ReportPeriod.Yearly => (new DateTime(nowUtc.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc), to),
            _ => (nowUtc.Date, to)
        };
    }

    private static DateTime QuarterStartUtc(DateTime nowUtc)
    {
        var quarterIndex = (nowUtc.Month - 1) / 3;
        var startMonth = quarterIndex * 3 + 1;
        return new DateTime(nowUtc.Year, startMonth, 1, 0, 0, 0, DateTimeKind.Utc);
    }
}
