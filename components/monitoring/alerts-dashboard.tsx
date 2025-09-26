"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Bell,
  Filter,
  Download,
  RefreshCw,
  Settings
} from "lucide-react";

// Types
interface Alert {
  id: string;
  type: "equipment_offline" | "low_fuel" | "high_temperature" | "maintenance_due" | "ip_conflict" | "network_error";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  equipmentId?: string;
  equipmentName?: string;
  ipAddress?: string;
  detectedAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  notes?: string;
}

export function AlertsDashboard() {
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Mock data
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "ALT001",
      type: "equipment_offline",
      severity: "high",
      title: "Equipment Offline",
      message: "Excavator 002 has been offline for 24 hours",
      equipmentId: "EQ002",
      equipmentName: "Excavator 002",
      detectedAt: new Date("2024-01-19T15:45:00"),
      acknowledged: false,
      resolved: false,
    },
    {
      id: "ALT002",
      type: "maintenance_due",
      severity: "medium",
      title: "Maintenance Due",
      message: "Loader 004 maintenance is due",
      equipmentId: "EQ004",
      equipmentName: "Loader 004",
      detectedAt: new Date("2024-01-18T14:20:00"),
      acknowledged: true,
      acknowledgedBy: "Admin",
      acknowledgedAt: new Date("2024-01-18T14:25:00"),
      resolved: false,
    },
    {
      id: "ALT003",
      type: "ip_conflict",
      severity: "critical",
      title: "IP Conflict Detected",
      message: "IP conflict detected on 192.168.1.12",
      ipAddress: "192.168.1.12",
      detectedAt: new Date("2024-01-20T11:00:00"),
      acknowledged: false,
      resolved: false,
    },
    {
      id: "ALT004",
      type: "low_fuel",
      severity: "low",
      title: "Low Fuel Level",
      message: "Dozer 005 fuel level is low (45%)",
      equipmentId: "EQ005",
      equipmentName: "Dozer 005",
      detectedAt: new Date("2024-01-20T11:00:00"),
      acknowledged: false,
      resolved: true,
      resolvedAt: new Date("2024-01-20T11:30:00"),
      resolvedBy: "Operator",
    },
  ]);

  // Statistics
  const totalAlerts = alerts.length;
  const activeAlerts = alerts.filter(alert => !alert.resolved).length;
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged && !alert.resolved).length;
  const resolvedAlerts = alerts.filter(alert => alert.resolved).length;
  const criticalAlerts = alerts.filter(alert => alert.severity === "critical" && !alert.resolved).length;

  // Filter functions
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === "all" || alert.severity === filterSeverity;
    const matchesType = filterType === "all" || alert.type === filterType;
    
    return matchesSearch && matchesSeverity && matchesType;
  });

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: "outline",
      medium: "secondary",
      high: "destructive",
      critical: "destructive",
    } as const;

    return (
      <Badge variant={variants[severity as keyof typeof variants] || "outline"}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "equipment_offline":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "low_fuel":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "high_temperature":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "maintenance_due":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "ip_conflict":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "network_error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    const updatedAlerts = alerts.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            acknowledged: true, 
            acknowledgedBy: "Current User", 
            acknowledgedAt: new Date() 
          }
        : alert
    );
    setAlerts(updatedAlerts);
  };

  const handleResolveAlert = (alertId: string) => {
    const updatedAlerts = alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, resolved: true, resolvedAt: new Date(), resolvedBy: "Current User" }
        : alert
    );
    setAlerts(updatedAlerts);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Alerts</h1>
          <p className="text-muted-foreground">
            Monitor and manage system alerts and notifications
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              All alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acknowledgedAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Under review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {totalAlerts > 0 ? ((resolvedAlerts / totalAlerts) * 100).toFixed(1) : 0}% resolution rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All Alerts</TabsTrigger>
        </TabsList>

        {/* Active Alerts Tab */}
        <TabsContent value="active" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="equipment_offline">Equipment Offline</SelectItem>
                <SelectItem value="low_fuel">Low Fuel</SelectItem>
                <SelectItem value="high_temperature">High Temperature</SelectItem>
                <SelectItem value="maintenance_due">Maintenance Due</SelectItem>
                <SelectItem value="ip_conflict">IP Conflict</SelectItem>
                <SelectItem value="network_error">Network Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>
                Unresolved system alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.filter(alert => !alert.resolved).map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getAlertIcon(alert.type)}
                          <span className="capitalize">{alert.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(alert.severity)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground max-w-xs truncate">{alert.message}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {alert.equipmentName ? (
                          <div>
                            <div className="font-medium">{alert.equipmentName}</div>
                            <div className="text-sm text-muted-foreground">ID: {alert.equipmentId}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{alert.detectedAt.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {alert.acknowledged && (
                            <Badge variant="outline" className="text-xs">Acknowledged</Badge>
                          )}
                          {!alert.acknowledged && (
                            <Badge variant="destructive" className="text-xs">Active</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {!alert.acknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Acknowledged Tab */}
        <TabsContent value="acknowledged" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acknowledged Alerts</CardTitle>
              <CardDescription>
                Alerts that have been acknowledged but not yet resolved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Acknowledged</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.filter(alert => alert.acknowledged && !alert.resolved).map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getAlertIcon(alert.type)}
                          <span className="capitalize">{alert.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(alert.severity)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground max-w-xs truncate">{alert.message}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {alert.equipmentName ? (
                          <div>
                            <div className="font-medium">{alert.equipmentName}</div>
                            <div className="text-sm text-muted-foreground">ID: {alert.equipmentId}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{alert.acknowledgedAt?.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resolved Tab */}
        <TabsContent value="resolved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resolved Alerts</CardTitle>
              <CardDescription>
                Alerts that have been resolved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Resolved</TableHead>
                    <TableHead>Resolved By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.filter(alert => alert.resolved).map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getAlertIcon(alert.type)}
                          <span className="capitalize">{alert.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(alert.severity)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground max-w-xs truncate">{alert.message}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {alert.equipmentName ? (
                          <div>
                            <div className="font-medium">{alert.equipmentName}</div>
                            <div className="text-sm text-muted-foreground">ID: {alert.equipmentId}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{alert.resolvedAt?.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>{alert.resolvedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Alerts Tab */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Alerts</CardTitle>
              <CardDescription>
                Complete history of all system alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getAlertIcon(alert.type)}
                          <span className="capitalize">{alert.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(alert.severity)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground max-w-xs truncate">{alert.message}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {alert.equipmentName ? (
                          <div>
                            <div className="font-medium">{alert.equipmentName}</div>
                            <div className="text-sm text-muted-foreground">ID: {alert.equipmentId}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{alert.detectedAt.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {alert.resolved && (
                            <Badge variant="default" className="text-xs">Resolved</Badge>
                          )}
                          {alert.acknowledged && !alert.resolved && (
                            <Badge variant="outline" className="text-xs">Acknowledged</Badge>
                          )}
                          {!alert.acknowledged && !alert.resolved && (
                            <Badge variant="destructive" className="text-xs">Active</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {!alert.acknowledged && !alert.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          {!alert.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveAlert(alert.id)}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
