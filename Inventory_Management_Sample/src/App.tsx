import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import { LayoutDashboard, Package, AlertTriangle, BookOpen, FileText, Shield } from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { InventoryTable } from "./components/InventoryTable";
import { StockAlerts } from "./components/StockAlerts";
import { ReservationPanel } from "./components/ReservationPanel";
import { UsageReports } from "./components/UsageReports";
import { AuditLog } from "./components/AuditLog";
import { mockAlerts } from "./data/mockData";

export default function App() {
  const unacknowledgedAlerts = mockAlerts.filter(alert => !alert.acknowledged).length;
  const criticalAlerts = mockAlerts.filter(alert => alert.urgency === 'CRITICAL').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Alien Care Autoshop</h1>
              <p className="text-muted-foreground">Inventory Management System</p>
            </div>
            <div className="flex items-center gap-4">
              {criticalAlerts > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {criticalAlerts} Critical Alert{criticalAlerts > 1 ? 's' : ''}
                </Badge>
              )}
              <Badge variant="outline">INV v2.1.0</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2 relative">
              <AlertTriangle className="h-4 w-4" />
              Alerts
              {unacknowledgedAlerts > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {unacknowledgedAlerts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Reservations
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryTable />
          </TabsContent>

          <TabsContent value="alerts">
            <StockAlerts />
          </TabsContent>

          <TabsContent value="reservations">
            <ReservationPanel />
          </TabsContent>

          <TabsContent value="reports">
            <UsageReports />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}