"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Wifi,
  WifiOff,
  Activity,
  Shield,
  Clock,
  MapPin,
  Server,
  Network,
  TrendingUp,
  TrendingDown,
  Zap,
  Eye,
  EyeOff,
  Play,
  Pause,
  Square
} from "lucide-react";

// Types
interface IPStatus {
  id: string;
  address: string;
  equipmentName: string;
  equipmentType: string;
  location: string;
  status: "online" | "offline" | "unreachable" | "conflict";
  lastSeen: Date;
  responseTime: number;
  packetLoss: number;
  signalStrength: number;
  dataRate: number;
  latency: number;
  uptime: number;
  lastError?: string;
  errorCount: number;
  isMonitoring: boolean;
}

interface NetworkAlert {
  id: string;
  type: "connection_lost" | "high_latency" | "packet_loss" | "conflict_detected" | "equipment_offline";
  severity: "low" | "medium" | "high" | "critical";
  ipAddress: string;
  equipmentName: string;
  message: string;
  detectedAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

interface NetworkMetrics {
  totalIPs: number;
  onlineIPs: number;
  offlineIPs: number;
  conflictIPs: number;
  averageLatency: number;
  averagePacketLoss: number;
  averageSignalStrength: number;
  totalDataRate: number;
  uptime: number;
  errorRate: number;
}

interface MonitoringConfig {
  pingInterval: number;
  timeoutThreshold: number;
  latencyThreshold: number;
  packetLossThreshold: number;
  signalStrengthThreshold: number;
  alertEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export function IPMonitoringDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Mock data - In a real application, this would come from API calls
  const [ipStatuses, setIPStatuses] = useState<IPStatus[]>([
    {
      id: "STAT001",
      address: "192.168.1.10",
      equipmentName: "Mining Truck 001",
      equipmentType: "Truck",
      location: "Pit A",
      status: "online",
      lastSeen: new Date("2024-01-20T10:30:00"),
      responseTime: 15,
      packetLoss: 0,
      signalStrength: 85,
      dataRate: 100,
      latency: 12,
      uptime: 99.5,
      errorCount: 0,
      isMonitoring: true,
    },
    {
      id: "STAT002",
      address: "192.168.1.11",
      equipmentName: "Excavator 002",
      equipmentType: "Excavator",
      location: "Pit B",
      status: "offline",
      lastSeen: new Date("2024-01-19T15:45:00"),
      responseTime: 0,
      packetLoss: 100,
      signalStrength: 0,
      dataRate: 0,
      latency: 0,
      uptime: 0,
      lastError: "Connection timeout",
      errorCount: 5,
      isMonitoring: true,
    },
    {
      id: "STAT003",
      address: "192.168.1.12",
      equipmentName: "Drill 003",
      equipmentType: "Drill",
      location: "Pit C",
      status: "unreachable",
      lastSeen: new Date("2024-01-20T09:15:00"),
      responseTime: 0,
      packetLoss: 100,
      signalStrength: 0,
      dataRate: 0,
      latency: 0,
      uptime: 0,
      lastError: "Network unreachable",
      errorCount: 3,
      isMonitoring: true,
    },
    {
      id: "STAT004",
      address: "192.168.1.13",
      equipmentName: "Loader 004",
      equipmentType: "Loader",
      location: "Pit A",
      status: "conflict",
      lastSeen: new Date("2024-01-20T11:00:00"),
      responseTime: 25,
      packetLoss: 5,
      signalStrength: 70,
      dataRate: 80,
      latency: 18,
      uptime: 95.2,
      lastError: "IP conflict detected",
      errorCount: 2,
      isMonitoring: true,
    },
  ]);

  const [alerts, setAlerts] = useState<NetworkAlert[]>([
    {
      id: "ALT001",
      type: "connection_lost",
      severity: "high",
      ipAddress: "192.168.1.11",
      equipmentName: "Excavator 002",
      message: "Connection lost to Excavator 002",
      detectedAt: new Date("2024-01-19T15:45:00"),
      acknowledged: false,
      resolved: false,
    },
    {
      id: "ALT002",
      type: "conflict_detected",
      severity: "critical",
      ipAddress: "192.168.1.13",
      equipmentName: "Loader 004",
      message: "IP conflict detected on Loader 004",
      detectedAt: new Date("2024-01-20T11:00:00"),
      acknowledged: true,
      acknowledgedBy: "Admin",
      acknowledgedAt: new Date("2024-01-20T11:05:00"),
      resolved: false,
    },
    {
      id: "ALT003",
      type: "high_latency",
      severity: "medium",
      ipAddress: "192.168.1.10",
      equipmentName: "Mining Truck 001",
      message: "High latency detected on Mining Truck 001",
      detectedAt: new Date("2024-01-20T10:30:00"),
      acknowledged: false,
      resolved: true,
      resolvedAt: new Date("2024-01-20T10:35:00"),
    },
  ]);

  const [metrics, setMetrics] = useState<NetworkMetrics>({
    totalIPs: 4,
    onlineIPs: 1,
    offlineIPs: 1,
    conflictIPs: 1,
    averageLatency: 13.75,
    averagePacketLoss: 26.25,
    averageSignalStrength: 38.75,
    totalDataRate: 180,
    uptime: 48.675,
    errorRate: 2.5,
  });

  const [config, setConfig] = useState<MonitoringConfig>({
    pingInterval: 30,
    timeoutThreshold: 5000,
    latencyThreshold: 100,
    packetLossThreshold: 5,
    signalStrengthThreshold: 50,
    alertEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  // Auto-refresh simulation
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // In a real application, this would fetch fresh data from the API
      // For now, we'll just update the timestamp
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Statistics
  const totalIPs = ipStatuses.length;
  const onlineIPs = ipStatuses.filter(ip => ip.status === "online").length;
  const offlineIPs = ipStatuses.filter(ip => ip.status === "offline").length;
  const unreachableIPs = ipStatuses.filter(ip => ip.status === "unreachable").length;
  const conflictIPs = ipStatuses.filter(ip => ip.status === "conflict").length;

  const activeAlerts = alerts.filter(alert => !alert.resolved).length;
  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged && !alert.resolved).length;
  const criticalAlerts = alerts.filter(alert => alert.severity === "critical" && !alert.resolved).length;

  // Filter functions
  const filteredIPs = ipStatuses.filter(ip => {
    const matchesSearch = ip.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ip.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ip.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || ip.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case "unreachable":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case "conflict":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      online: "default",
      offline: "destructive",
      unreachable: "secondary",
      conflict: "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

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
      case "connection_lost":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case "high_latency":
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case "packet_loss":
        return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case "conflict_detected":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "equipment_offline":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const handleToggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  const handleRefresh = () => {
    setLastUpdate(new Date());
    // In a real application, this would trigger a data refresh
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
        ? { ...alert, resolved: true, resolvedAt: new Date() }
        : alert
    );
    setAlerts(updatedAlerts);
  };

  const handleUpdateConfig = () => {
    // In a real application, this would save the configuration
    setIsConfigDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IP Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of IP addresses and network status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleToggleMonitoring}
            className={isMonitoring ? "text-green-600" : "text-red-600"}
          >
            {isMonitoring ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Monitoring
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Monitoring
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setIsConfigDialogOpen(true)}>
            <Shield className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-medium">{onlineIPs}</span> online, 
            <span className="font-medium text-red-500 ml-1">{offlineIPs + unreachableIPs}</span> offline
          </div>
          <div className="text-sm">
            <span className="font-medium text-yellow-500">{activeAlerts}</span> active alerts
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total IPs</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIPs}</div>
            <p className="text-xs text-muted-foreground">
              All monitored IPs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineIPs}</div>
            <p className="text-xs text-muted-foreground">
              {totalIPs > 0 ? ((onlineIPs / totalIPs) * 100).toFixed(1) : 0}% uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offlineIPs + unreachableIPs}</div>
            <p className="text-xs text-muted-foreground">
              {offlineIPs + unreachableIPs} offline, {unreachableIPs} unreachable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts} critical, {unacknowledgedAlerts} unacknowledged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="status">IP Status</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Network Health</CardTitle>
                <CardDescription>
                  Overall network performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm text-muted-foreground">{metrics.uptime.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.uptime} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Latency</span>
                    <span className="text-sm text-muted-foreground">{metrics.averageLatency}ms</span>
                  </div>
                  <Progress value={Math.min(100, (metrics.averageLatency / 100) * 100)} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Packet Loss</span>
                    <span className="text-sm text-muted-foreground">{metrics.averagePacketLoss.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.averagePacketLoss} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Signal Strength</span>
                    <span className="text-sm text-muted-foreground">{metrics.averageSignalStrength.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.averageSignalStrength} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>
                  Latest network alerts and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {alert.equipmentName} - {alert.message}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {alert.detectedAt.toLocaleDateString()}
                          </span>
                          {getSeverityBadge(alert.severity)}
                          {alert.acknowledged && (
                            <Badge variant="outline" className="text-xs">Acknowledged</Badge>
                          )}
                          {alert.resolved && (
                            <Badge variant="default" className="text-xs">Resolved</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* IP Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search IP addresses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="unreachable">Unreachable</SelectItem>
                <SelectItem value="conflict">Conflict</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>IP Status Monitor</CardTitle>
              <CardDescription>
                Real-time status of all monitored IP addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Signal Strength</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIPs.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell className="font-medium">{ip.address}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ip.equipmentName}</div>
                          <div className="text-sm text-muted-foreground">{ip.equipmentType} • {ip.location}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(ip.status)}
                          {getStatusBadge(ip.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ip.responseTime > 0 ? (
                          <div className="flex items-center space-x-1">
                            <Activity className="h-3 w-3" />
                            <span>{ip.responseTime}ms</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ip.signalStrength > 0 ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${ip.signalStrength}%` }}
                              />
                            </div>
                            <span className="text-sm">{ip.signalStrength}%</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{ip.uptime.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{ip.lastSeen.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const updatedIPs = ipStatuses.map(item => 
                                item.id === ip.id 
                                  ? { ...item, isMonitoring: !item.isMonitoring }
                                  : item
                              );
                              setIPStatuses(updatedIPs);
                            }}
                          >
                            {ip.isMonitoring ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button size="sm" variant="outline">
                            <RefreshCw className="h-3 w-3" />
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

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Alerts</CardTitle>
              <CardDescription>
                Active and resolved network alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
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
                          <div className="font-medium">{alert.equipmentName}</div>
                          <div className="text-sm text-muted-foreground">{alert.ipAddress}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{alert.message}</TableCell>
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
                          {alert.resolved && (
                            <Badge variant="default" className="text-xs">Resolved</Badge>
                          )}
                          {!alert.acknowledged && !alert.resolved && (
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
                          {!alert.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveAlert(alert.id)}
                            >
                              <Square className="h-3 w-3" />
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

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Network performance over time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Latency</span>
                    <span className="text-sm text-muted-foreground">{metrics.averageLatency}ms</span>
                  </div>
                  <Progress value={Math.min(100, (metrics.averageLatency / 100) * 100)} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Packet Loss</span>
                    <span className="text-sm text-muted-foreground">{metrics.averagePacketLoss.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.averagePacketLoss} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Signal Strength</span>
                    <span className="text-sm text-muted-foreground">{metrics.averageSignalStrength.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.averageSignalStrength} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Rate</span>
                    <span className="text-sm text-muted-foreground">{metrics.totalDataRate} Mbps</span>
                  </div>
                  <Progress value={Math.min(100, (metrics.totalDataRate / 1000) * 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Statistics</CardTitle>
                <CardDescription>
                  Error rates and failure analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Error Rate</span>
                    <span className="text-sm text-muted-foreground">{metrics.errorRate}%</span>
                  </div>
                  <Progress value={metrics.errorRate} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Errors</span>
                    <span className="text-sm text-muted-foreground">
                      {ipStatuses.reduce((sum, ip) => sum + ip.errorCount, 0)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conflicts</span>
                    <span className="text-sm text-muted-foreground">{conflictIPs}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Unreachable</span>
                    <span className="text-sm text-muted-foreground">{unreachableIPs}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Monitoring Configuration</DialogTitle>
            <DialogDescription>
              Configure monitoring settings and thresholds
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ping-interval">Ping Interval (seconds)</Label>
                <Input
                  id="ping-interval"
                  type="number"
                  value={config.pingInterval}
                  onChange={(e) => setConfig({ ...config, pingInterval: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="timeout-threshold">Timeout Threshold (ms)</Label>
                <Input
                  id="timeout-threshold"
                  type="number"
                  value={config.timeoutThreshold}
                  onChange={(e) => setConfig({ ...config, timeoutThreshold: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latency-threshold">Latency Threshold (ms)</Label>
                <Input
                  id="latency-threshold"
                  type="number"
                  value={config.latencyThreshold}
                  onChange={(e) => setConfig({ ...config, latencyThreshold: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="packet-loss-threshold">Packet Loss Threshold (%)</Label>
                <Input
                  id="packet-loss-threshold"
                  type="number"
                  value={config.packetLossThreshold}
                  onChange={(e) => setConfig({ ...config, packetLossThreshold: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="signal-threshold">Signal Strength Threshold (%)</Label>
                <Input
                  id="signal-threshold"
                  type="number"
                  value={config.signalStrengthThreshold}
                  onChange={(e) => setConfig({ ...config, signalStrengthThreshold: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notifications</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="email-notifications"
                      checked={config.emailNotifications}
                      onChange={(e) => setConfig({ ...config, emailNotifications: e.target.checked })}
                    />
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sms-notifications"
                      checked={config.smsNotifications}
                      onChange={(e) => setConfig({ ...config, smsNotifications: e.target.checked })}
                    />
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateConfig}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
