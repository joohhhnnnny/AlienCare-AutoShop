import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertTriangle, Package, TrendingDown, TrendingUp } from "lucide-react";
import { mockParts, mockAlerts, mockTransactions } from "../data/mockData";

export function Dashboard() {
  const totalParts = mockParts.length;
  const lowStockParts = mockParts.filter(part => part.currentStock <= part.minThreshold).length;
  const totalValue = mockParts.reduce((sum, part) => sum + (part.currentStock * part.unitCost), 0);
  const pendingAlerts = mockAlerts.filter(alert => !alert.acknowledged).length;
  
  const todayTransactions = mockTransactions.filter(
    t => t.timestamp.toDateString() === new Date().toDateString()
  ).length;

  const criticalAlerts = mockAlerts.filter(alert => alert.urgency === 'CRITICAL').length;

  return (
    <div className="space-y-6">
      <div>
        <h1>Inventory Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time overview of Alien Care Autoshop inventory status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Parts</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalParts}</div>
            <p className="text-xs text-muted-foreground">
              Active inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Low Stock Items</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-destructive">{lowStockParts}</div>
            <p className="text-xs text-muted-foreground">
              Below minimum threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total stock value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pending Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-orange-500">{pendingAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Critical Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalAlerts > 0 ? (
              mockAlerts
                .filter(alert => alert.urgency === 'CRITICAL')
                .map(alert => {
                  const part = mockParts.find(p => p.id === alert.partId);
                  return (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg bg-destructive/5">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <div>
                          <p className="font-medium">{part?.partNumber}</p>
                          <p className="text-sm text-muted-foreground">{part?.description}</p>
                        </div>
                      </div>
                      <Badge variant="destructive">Critical</Badge>
                    </div>
                  );
                })
            ) : (
              <p className="text-sm text-muted-foreground">No critical alerts</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Total Transactions</span>
              <span className="font-medium">{todayTransactions}</span>
            </div>
            <div className="space-y-2">
              {mockTransactions
                .filter(t => t.timestamp.toDateString() === new Date().toDateString())
                .slice(0, 5)
                .map(transaction => {
                  const part = mockParts.find(p => p.id === transaction.partId);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Badge variant={transaction.type === 'CONSUME' ? 'destructive' : 'secondary'}>
                          {transaction.type}
                        </Badge>
                        <span>{part?.partNumber}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {transaction.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}