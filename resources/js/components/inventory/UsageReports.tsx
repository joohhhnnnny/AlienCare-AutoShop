import { DollarSign, Download, FileText, Package, TrendingUp } from "lucide-react";
import { useState } from "react";
import { mockParts, mockTransactions } from "../../data/inventory/mockData";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

interface UsageReport {
  partId: string;
  partNumber: string;
  description: string;
  consumed: number;
  reserved: number;
  returned: number;
  cost: number;
}

export function UsageReports() {
  const [reportPeriod, setReportPeriod] = useState("daily");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [...new Set(mockParts.map(part => part.category))];

  // Generate usage report data
  const generateUsageReport = (): UsageReport[] => {
    const reportData: { [key: string]: UsageReport } = {};

    mockTransactions.forEach(transaction => {
      const part = mockParts.find(p => p.id === transaction.partId);
      if (!part) return;

      if (!reportData[part.id]) {
        reportData[part.id] = {
          partId: part.id,
          partNumber: part.partNumber,
          description: part.description,
          consumed: 0,
          reserved: 0,
          returned: 0,
          cost: 0
        };
      }

      const quantity = Math.abs(transaction.quantity);
      switch (transaction.type) {
        case 'CONSUME':
          reportData[part.id].consumed += quantity;
          reportData[part.id].cost += quantity * part.unitCost;
          break;
        case 'RESERVE':
          reportData[part.id].reserved += quantity;
          break;
        case 'RETURN':
          reportData[part.id].returned += quantity;
          break;
      }
    });

    return Object.values(reportData).filter(report => {
      if (selectedCategory === "all") return true;
      const part = mockParts.find(p => p.id === report.partId);
      return part?.category === selectedCategory;
    });
  };

  const usageData = generateUsageReport();
  const totalConsumed = usageData.reduce((sum, item) => sum + item.consumed, 0);
  const totalCost = usageData.reduce((sum, item) => sum + item.cost, 0);
  const mostUsedPart = usageData.reduce((max, item) =>
    item.consumed > max.consumed ? item : max, usageData[0] || { consumed: 0, partNumber: 'N/A' }
  );

  // Category data for summary
  const categoryData = categories.map(category => {
    const categoryParts = mockParts.filter(part => part.category === category);
    const consumed = usageData
      .filter(usage => categoryParts.some(part => part.id === usage.partId))
      .reduce((sum, usage) => sum + usage.consumed, 0);

    return {
      category,
      consumed,
      cost: usageData
        .filter(usage => categoryParts.some(part => part.id === usage.partId))
        .reduce((sum, usage) => sum + usage.cost, 0)
    };
  });

  const exportReport = () => {
    // Mock export functionality
    const csvContent = [
      'Part Number,Description,Consumed,Reserved,Returned,Cost',
      ...usageData.map(item =>
        `${item.partNumber},${item.description},${item.consumed},${item.reserved},${item.returned},${item.cost.toFixed(2)}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-report-${reportPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usage Reports</h1>
          <p className="text-muted-foreground">
            Analyze parts consumption and cost tracking
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-48 bg-input border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="daily">Daily Report</SelectItem>
              <SelectItem value="weekly">Weekly Report</SelectItem>
              <SelectItem value="monthly">Monthly Report</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 bg-input border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportReport} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Parts Consumed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalConsumed}</div>
            <p className="text-xs text-muted-foreground">
              {reportPeriod} period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Parts consumption value
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Most Used Part</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground">{mostUsedPart.partNumber}</div>
            <p className="text-xs text-muted-foreground">
              {mostUsedPart.consumed} units consumed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Categories</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{categoryData.filter(c => c.consumed > 0).length}</div>
            <p className="text-xs text-muted-foreground">
              Categories with usage
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Consumption by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Pie Chart */}
              <div className="flex-1 flex justify-center">
                <div className="relative">
                  <svg width="280" height="280" viewBox="0 0 280 280" className="transform -rotate-90">
                    {(() => {
                      const filteredData = categoryData.filter(data => data.consumed > 0);
                      const total = filteredData.reduce((sum, data) => sum + data.consumed, 0);
                      let cumulativePercentage = 0;
                      // System color palette - golden, amber, orange, purple, red
                      const colors = ['#dfb400', '#f59e0b', '#f97316', '#a855f7', '#ef4444'];

                      return filteredData.map((data, index) => {
                        const percentage = (data.consumed / total) * 100;
                        const startAngle = (cumulativePercentage / 100) * 360;
                        const endAngle = ((cumulativePercentage + percentage) / 100) * 360;

                        const startAngleRad = (startAngle * Math.PI) / 180;
                        const endAngleRad = (endAngle * Math.PI) / 180;

                        const largeArc = percentage > 50 ? 1 : 0;

                        const x1 = 140 + 90 * Math.cos(startAngleRad);
                        const y1 = 140 + 90 * Math.sin(startAngleRad);
                        const x2 = 140 + 90 * Math.cos(endAngleRad);
                        const y2 = 140 + 90 * Math.sin(endAngleRad);

                        const pathData = [
                          `M 140 140`,
                          `L ${x1} ${y1}`,
                          `A 90 90 0 ${largeArc} 1 ${x2} ${y2}`,
                          'Z'
                        ].join(' ');

                        cumulativePercentage += percentage;

                        return (
                          <path
                            key={data.category}
                            d={pathData}
                            fill={colors[index % colors.length]}
                            stroke="hsl(var(--background))"
                            strokeWidth="3"
                            className="hover:opacity-90 transition-all duration-200 cursor-pointer"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                          />
                        );
                      });
                    })()}
                  </svg>

                  {/* Center label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm font-medium text-muted-foreground">Total</div>
                      <div className="text-lg font-bold text-foreground">
                        {categoryData.filter(d => d.consumed > 0).reduce((sum, d) => sum + d.consumed, 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">units</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-4">
                <h4 className="font-semibold text-foreground mb-3">Category Breakdown</h4>
                {categoryData
                  .filter(data => data.consumed > 0)
                  .sort((a, b) => b.consumed - a.consumed)
                  .map((data, index) => {
                    const total = categoryData.filter(d => d.consumed > 0).reduce((sum, d) => sum + d.consumed, 0);
                    const percentage = ((data.consumed / total) * 100).toFixed(1);
                    const colors = ['#dfb400', '#f59e0b', '#f97316', '#a855f7', '#ef4444'];

                    return (
                      <div key={data.category} className="group hover:bg-muted/50 p-3 rounded-lg transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full border-2 border-background shadow-sm"
                              style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <div>
                              <div className="font-medium text-foreground">{data.category}</div>
                              <div className="text-sm text-muted-foreground">${data.cost.toFixed(2)} total cost</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-foreground">{data.consumed} units</div>
                            <div className="text-sm text-muted-foreground">{percentage}%</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-8">
            <CardTitle className="text-foreground">Top Consumed Parts</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-10">
              {/* Bar Chart */}
              <div className="relative mt-8">
                <div className="flex items-end justify-between gap-4 h-72 p-6 bg-muted/20 rounded-lg">
                  {usageData
                    .sort((a, b) => b.consumed - a.consumed)
                    .slice(0, 5)
                    .map((item, index) => {
                      const maxConsumed = Math.max(...usageData.slice(0, 5).map(d => d.consumed));
                      const barHeight = maxConsumed > 0 ? (item.consumed / maxConsumed) * 200 : 0;
                      // System color palette - golden, amber, orange, purple, red
                      const colors = ['#dfb400', '#f59e0b', '#f97316', '#a855f7', '#ef4444'];

                      return (
                        <div key={item.partId} className="flex flex-col items-center flex-1 group">
                          {/* Value label above bar */}
                          <div className="mb-3 text-center">
                            <div className="font-bold text-foreground text-lg">{item.consumed}</div>
                            <div className="text-xs text-muted-foreground">units</div>
                          </div>

                          {/* Bar */}
                          <div className="relative flex items-end">
                            <div
                              className="w-16 rounded-t-lg transition-all duration-500 ease-out group-hover:shadow-lg group-hover:scale-105 relative overflow-hidden"
                              style={{
                                height: `${Math.max(barHeight, 8)}px`,
                                backgroundColor: colors[index % colors.length],
                                minHeight: '8px'
                              }}
                            >
                              {/* Gradient overlay for depth */}
                              <div
                                className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"
                              />

                              {/* Shimmer effect on hover */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            </div>
                          </div>

                          {/* Part info below bar */}
                          <div className="mt-4 text-center max-w-[90px]">
                            <div className="font-semibold text-foreground text-sm truncate">{item.partNumber}</div>
                            <div className="text-xs text-muted-foreground font-medium mt-1">${item.cost.toFixed(2)}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Y-axis labels */}
                <div className="absolute left-0 top-6 bottom-16 flex flex-col justify-between text-xs text-muted-foreground">
                  {Array.from({ length: 5 }, (_, i) => {
                    const maxConsumed = Math.max(...usageData.slice(0, 5).map(d => d.consumed));
                    const value = Math.round((maxConsumed * (4 - i)) / 4);
                    return (
                      <div key={i} className="flex items-center">
                        <span className="w-6 text-right">{value}</span>
                        <div className="w-2 h-px bg-border ml-1" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Legend */}
              <div className="space-y-3 pt-8 border-t border-border">
                <h4 className="font-semibold text-foreground mb-4">Part Details</h4>
                {usageData
                  .sort((a, b) => b.consumed - a.consumed)
                  .slice(0, 5)
                  .map((item, index) => {
                    const colors = ['#dfb400', '#f59e0b', '#f97316', '#a855f7', '#ef4444'];
                    return (
                      <div key={`legend-${item.partId}`} className="group hover:bg-muted/30 p-3 rounded-lg transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div
                              className="w-4 h-4 rounded-sm border-2 border-background shadow-sm flex-shrink-0"
                              style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-foreground">{item.partNumber}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {item.description}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <div className="font-bold text-foreground">{item.consumed} units</div>
                            <div className="text-sm text-muted-foreground">${item.cost.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Detailed Usage Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground">Part Number</TableHead>
                  <TableHead className="text-foreground">Description</TableHead>
                  <TableHead className="text-foreground">Consumed</TableHead>
                  <TableHead className="text-foreground">Reserved</TableHead>
                  <TableHead className="text-foreground">Returned</TableHead>
                  <TableHead className="text-foreground">Total Cost</TableHead>
                  <TableHead className="text-foreground">Usage Intensity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageData
                  .sort((a, b) => b.consumed - a.consumed)
                  .map((item) => {
                    const usageIntensity = item.consumed > 10 ? 'HIGH' : item.consumed > 5 ? 'MEDIUM' : 'LOW';
                    return (
                      <TableRow key={item.partId} className="border-border hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground">{item.partNumber}</TableCell>
                        <TableCell className="text-foreground">{item.description}</TableCell>
                        <TableCell className="text-foreground">{item.consumed}</TableCell>
                        <TableCell className="text-foreground">{item.reserved}</TableCell>
                        <TableCell className="text-foreground">{item.returned}</TableCell>
                        <TableCell className="text-foreground">${item.cost.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            usageIntensity === 'HIGH' ? 'destructive' :
                            usageIntensity === 'MEDIUM' ? 'default' : 'secondary'
                          }>
                            {usageIntensity}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
          {usageData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No usage data found for the selected period and category
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
