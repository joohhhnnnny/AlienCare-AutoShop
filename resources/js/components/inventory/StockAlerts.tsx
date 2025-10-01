import { AlertTriangle, CheckCircle, Clock, Package } from "lucide-react";
import { useState } from "react";
import { mockAlerts, mockParts } from "../../data/inventory/mockData";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function StockAlerts() {
  const [alerts, setAlerts] = useState(mockAlerts);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? { ...alert, acknowledged: true, acknowledgedBy: 'Current User' }
        : alert
    ));
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4 text-primary" />;
      case 'MEDIUM':
        return <Clock className="h-4 w-4 text-primary/80" />;
      default:
        return <Package className="h-4 w-4 text-primary/60" />;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return <Badge variant="destructive">Critical</Badge>;
      case 'HIGH':
        return <Badge className="bg-primary text-primary-foreground">High</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-primary/80 text-primary-foreground">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stock Alerts</h1>
        <p className="text-muted-foreground">
          Monitor and manage low stock notifications
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {unacknowledgedAlerts.filter(a => a.urgency === 'CRITICAL').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Immediate attention required
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {unacknowledgedAlerts.filter(a => a.urgency === 'HIGH').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Action needed soon
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Unacknowledged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{unacknowledgedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Pending review
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Unacknowledged Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {unacknowledgedAlerts.length > 0 ? (
              unacknowledgedAlerts.map(alert => {
                const part = mockParts.find(p => p.id === alert.partId);
                return (
                  <div key={alert.id} className="border border-border rounded-lg p-4 space-y-3 bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getUrgencyIcon(alert.urgency)}
                        <div>
                          <p className="font-medium text-foreground">{part?.partNumber}</p>
                          <p className="text-sm text-muted-foreground">{part?.description}</p>
                        </div>
                      </div>
                      {getUrgencyBadge(alert.urgency)}
                    </div>

                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Current Stock: {alert.currentStock}</span>
                      <span>Threshold: {alert.threshold}</span>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-destructive"
                        style={{ width: `${Math.min((alert.currentStock / alert.threshold) * 100, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Created: {alert.createdAt.toLocaleDateString()}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Acknowledge
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p>All alerts have been acknowledged</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle className="h-5 w-5 text-primary" />
              Acknowledged Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {acknowledgedAlerts.length > 0 ? (
              acknowledgedAlerts.map(alert => {
                const part = mockParts.find(p => p.id === alert.partId);
                return (
                  <div key={alert.id} className="border border-border rounded-lg p-4 space-y-3 opacity-75 bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{part?.partNumber}</p>
                          <p className="text-sm text-muted-foreground">{part?.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline">Acknowledged</Badge>
                    </div>

                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Stock: {alert.currentStock}</span>
                      <span>By: {alert.acknowledgedBy}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No acknowledged alerts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
