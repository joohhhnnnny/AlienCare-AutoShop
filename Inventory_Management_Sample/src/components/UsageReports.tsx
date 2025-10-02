import { Download, FileText, Package, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { mockParts, mockTransactions } from "../data/mockData";
import { UsageReport } from "../types/inventory";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

// Custom Peso Icon Component
const PesoIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 3v18" />
    <path d="M6 8h7a3 3 0 0 0 0-6H6" />
    <path d="M6 11h7a3 3 0 0 0 0-6" />
    <path d="M4 8h10" />
    <path d="M4 11h10" />
  </svg>
);

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

  // Chart data for consumption by category
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

  // Chart data for top consumed parts
  const topPartsData = usageData
    .sort((a, b) => b.consumed - a.consumed)
    .slice(0, 5)
    .map(item => ({
      partNumber: item.partNumber,
      consumed: item.consumed,
      cost: item.cost
    }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
          <h1>Usage Reports</h1>
          <p className="text-muted-foreground">
            Analyze parts consumption and cost tracking
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Report</SelectItem>
              <SelectItem value="weekly">Weekly Report</SelectItem>
              <SelectItem value="monthly">Monthly Report</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Parts Consumed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalConsumed}</div>
            <p className="text-xs text-muted-foreground">
              {reportPeriod} period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Cost</CardTitle>
            <PesoIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">₱{totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Parts consumption value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Most Used Part</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg">{mostUsedPart.partNumber}</div>
            <p className="text-xs text-muted-foreground">
              {mostUsedPart.consumed} units consumed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Categories</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{categoryData.filter(c => c.consumed > 0).length}</div>
            <p className="text-xs text-muted-foreground">
              Categories with usage
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Consumption by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData.filter(d => d.consumed > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, consumed }) => `${category}: ${consumed}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="consumed"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Consumed Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPartsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="partNumber" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="consumed" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Usage Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Consumed</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Returned</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Usage Intensity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageData
                  .sort((a, b) => b.consumed - a.consumed)
                  .map((item) => {
                    const usageIntensity = item.consumed > 10 ? 'HIGH' : item.consumed > 5 ? 'MEDIUM' : 'LOW';
                    return (
                      <TableRow key={item.partId}>
                        <TableCell className="font-medium">{item.partNumber}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.consumed}</TableCell>
                        <TableCell>{item.reserved}</TableCell>
                        <TableCell>{item.returned}</TableCell>
                        <TableCell>₱{item.cost.toFixed(2)}</TableCell>
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
