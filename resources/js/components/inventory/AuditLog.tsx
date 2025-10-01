import { Activity, Clock, Search, Shield, User } from "lucide-react";
import { useState } from "react";
import { mockParts, mockTransactions } from "../../data/inventory/mockData";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");

  const transactionTypes = [...new Set(mockTransactions.map(t => t.type))];
  const users = [...new Set(mockTransactions.map(t => t.performedBy))];

  const filteredTransactions = mockTransactions.filter(transaction => {
    const part = mockParts.find(p => p.id === transaction.partId);
    const matchesSearch = part?.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part?.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.jobOrderId?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesUser = userFilter === "all" || transaction.performedBy === userFilter;

    return matchesSearch && matchesType && matchesUser;
  });

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'CONSUME':
        return <Badge variant="destructive">Consume</Badge>;
      case 'RESERVE':
        return <Badge className="bg-primary text-primary-foreground">Reserve</Badge>;
      case 'RETURN':
        return <Badge className="bg-primary text-primary-foreground">Return</Badge>;
      case 'ADJUST':
        return <Badge className="bg-primary/70 text-primary-foreground">Adjust</Badge>;
      case 'RESTOCK':
        return <Badge className="bg-primary text-primary-foreground">Restock</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getQuantityDisplay = (transaction: any) => {
    const sign = transaction.quantity > 0 ? '+' : '';
    const color = transaction.quantity > 0 ? 'text-primary' : 'text-destructive';
    return <span className={color}>{sign}{transaction.quantity}</span>;
  };

  const todayTransactions = filteredTransactions.filter(
    t => t.timestamp.toDateString() === new Date().toDateString()
  ).length;

  const totalTransactions = filteredTransactions.length;
  const uniqueUsers = new Set(filteredTransactions.map(t => t.performedBy)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-muted-foreground">
          Immutable record of all inventory transactions and changes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              All recorded transactions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Today's Activity</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{todayTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Transactions today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Users</CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">
              Users with activity
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Data Integrity</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">100%</div>
            <p className="text-xs text-muted-foreground">
              Audit compliance
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Transaction Filters</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by part number, job order, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border text-foreground"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-input border-border text-foreground">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Types</SelectItem>
                {transactionTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-input border-border text-foreground">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Users</SelectItem>
                {users.map(user => (
                  <SelectItem key={user} value={user}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground">Timestamp</TableHead>
                  <TableHead className="text-foreground">Transaction ID</TableHead>
                  <TableHead className="text-foreground">Type</TableHead>
                  <TableHead className="text-foreground">Part Number</TableHead>
                  <TableHead className="text-foreground">Description</TableHead>
                  <TableHead className="text-foreground">Quantity</TableHead>
                  <TableHead className="text-foreground">Job Order</TableHead>
                  <TableHead className="text-foreground">Performed By</TableHead>
                  <TableHead className="text-foreground">Reason/Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map((transaction) => {
                    const part = mockParts.find(p => p.id === transaction.partId);
                    return (
                      <TableRow key={transaction.id} className="border-border hover:bg-muted/50">
                        <TableCell className="font-mono text-sm text-foreground">
                          {transaction.timestamp.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-foreground">{transaction.id}</TableCell>
                        <TableCell>{getTransactionBadge(transaction.type)}</TableCell>
                        <TableCell className="font-medium text-foreground">{part?.partNumber}</TableCell>
                        <TableCell className="text-foreground">{part?.description}</TableCell>
                        <TableCell>{getQuantityDisplay(transaction)}</TableCell>
                        <TableCell>
                          {transaction.jobOrderId ? (
                            <Badge variant="outline">{transaction.jobOrderId}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-foreground">{transaction.performedBy}</TableCell>
                        <TableCell className="max-w-xs truncate text-foreground">
                          {transaction.reason || transaction.mechanic || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Audit Trail Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Transaction Types</h4>
              <div className="space-y-1">
                {transactionTypes.map(type => {
                  const count = filteredTransactions.filter(t => t.type === type).length;
                  return (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-foreground">{type}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Recent Activity</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">Last 24 hours</span>
                  <span className="text-muted-foreground">{todayTransactions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">This week</span>
                  <span className="text-muted-foreground">
                    {filteredTransactions.filter(t => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return t.timestamp >= weekAgo;
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">This month</span>
                  <span className="text-muted-foreground">
                    {filteredTransactions.filter(t => {
                      const monthAgo = new Date();
                      monthAgo.setMonth(monthAgo.getMonth() - 1);
                      return t.timestamp >= monthAgo;
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
