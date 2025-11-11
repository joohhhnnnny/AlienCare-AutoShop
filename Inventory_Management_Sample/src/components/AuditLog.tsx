import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Search, Shield, Clock, User, Activity } from "lucide-react";
import { mockTransactions, mockParts } from "../data/mockData";

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
        return <Badge className="bg-blue-500">Reserve</Badge>;
      case 'RETURN':
        return <Badge className="bg-green-500">Return</Badge>;
      case 'ADJUST':
        return <Badge className="bg-orange-500">Adjust</Badge>;
      case 'RESTOCK':
        return <Badge className="bg-purple-500">Restock</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getQuantityDisplay = (transaction: { quantity: number }) => {
    const sign = transaction.quantity > 0 ? '+' : '';
    const color = transaction.quantity > 0 ? 'text-green-600' : 'text-red-600';
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
        <h1>Audit Log</h1>
        <p className="text-muted-foreground">
          Immutable record of all inventory transactions and changes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              All recorded transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Today's Activity</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-blue-500">{todayTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Transactions today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Users</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">{uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">
              Users with activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Data Integrity</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-500">100%</div>
            <p className="text-xs text-muted-foreground">
              Audit compliance
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Filters</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by part number, job order, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {transactionTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map(user => (
                  <SelectItem key={user} value={user}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Job Order</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Reason/Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map((transaction) => {
                    const part = mockParts.find(p => p.id === transaction.partId);
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-sm">
                          {transaction.timestamp.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{transaction.id}</TableCell>
                        <TableCell>{getTransactionBadge(transaction.type)}</TableCell>
                        <TableCell className="font-medium">{part?.partNumber}</TableCell>
                        <TableCell>{part?.description}</TableCell>
                        <TableCell>{getQuantityDisplay(transaction)}</TableCell>
                        <TableCell>
                          {transaction.jobOrderId ? (
                            <Badge variant="outline">{transaction.jobOrderId}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{transaction.performedBy}</TableCell>
                        <TableCell className="max-w-xs truncate">
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

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Transaction Types</h4>
              <div className="space-y-1">
                {transactionTypes.map(type => {
                  const count = filteredTransactions.filter(t => t.type === type).length;
                  return (
                    <div key={type} className="flex justify-between text-sm">
                      <span>{type}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Recent Activity</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Last 24 hours</span>
                  <span className="text-muted-foreground">{todayTransactions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>This week</span>
                  <span className="text-muted-foreground">
                    {filteredTransactions.filter(t => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return t.timestamp >= weekAgo;
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>This month</span>
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