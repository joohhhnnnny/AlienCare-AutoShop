import { AlertTriangle, CheckCircle, Package, Search } from "lucide-react";
import { useState } from "react";
import { mockParts } from "../data/mockData";
import { Part } from "../types/inventory";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export function InventoryTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");

  const categories = [...new Set(mockParts.map(part => part.category))];

  const filteredParts = mockParts.filter(part => {
    const matchesSearch = part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || part.category === categoryFilter;
    const matchesStock = stockFilter === "all" ||
                        (stockFilter === "low" && part.currentStock <= part.minThreshold) ||
                        (stockFilter === "good" && part.currentStock > part.minThreshold);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const getStockStatus = (part: Part) => {
    const stockPercentage = part.currentStock / part.maxCapacity;
    const isBelowThreshold = part.currentStock <= part.minThreshold;

    if (isBelowThreshold) {
      return part.currentStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK';
    } else if (stockPercentage >= 0.8) {
      return 'HIGH_STOCK';
    } else {
      return 'NORMAL_STOCK';
    }
  };

  const getStockBadge = (part: Part) => {
    const status = getStockStatus(part);

    switch (status) {
      case 'OUT_OF_STOCK':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Out of Stock
        </Badge>;
      case 'LOW_STOCK':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Low Stock
        </Badge>;
      case 'HIGH_STOCK':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Package className="h-3 w-3" />
          High Stock
        </Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Good Stock
        </Badge>;
    }
  };

  const getStockBarColor = (part: Part) => {
    const status = getStockStatus(part);
    switch (status) {
      case 'OUT_OF_STOCK':
      case 'LOW_STOCK':
        return 'bg-destructive';
      case 'HIGH_STOCK':
        return 'bg-blue-500';
      default:
        return 'bg-green-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Parts Inventory</h1>
        <p className="text-muted-foreground">
          Manage and monitor all parts and consumables
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Filters</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by part number or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="good">Good Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-medium">{part.partNumber}</TableCell>
                    <TableCell>{part.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{part.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{part.currentStock} / {part.maxCapacity}</span>
                          <span className="text-muted-foreground">
                            Min: {part.minThreshold}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getStockBarColor(part)}`}
                            style={{ width: `${Math.min((part.currentStock / part.maxCapacity) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStockBadge(part)}</TableCell>
                    <TableCell>₱{part.unitCost.toFixed(2)}</TableCell>
                    <TableCell>{part.location}</TableCell>
                    <TableCell>{part.supplier}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredParts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No parts found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
