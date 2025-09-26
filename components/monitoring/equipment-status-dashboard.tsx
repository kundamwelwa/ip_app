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
  Square,
  HardHat,
  Truck,
  Drill,
  Loader,
  Settings,
  Filter,
  Download
} from "lucide-react";

// Types
interface EquipmentStatus {
  id: string;
  name: string;
  type: "Truck" | "Excavator" | "Drill" | "Loader" | "Dozer" | "Shovel" | "Crusher" | "Conveyor";
  model: string;
  manufacturer: string;
  serialNumber: string;
  status: "online" | "offline" | "maintenance" | "idle" | "error";
  location: string;
  operator: string;
  ipAddress?: string;
  macAddress?: string;
  lastSeen: Date;
  uptime: number;
  operatingHours: number;
  fuelLevel: number;
  temperature: number;
  pressure: number;
  vibration: number;
  signalStrength: number;
  dataRate: number;
  latency: number;
  errorCount: number;
  lastError?: string;
  maintenanceDue: Date;
  nextMaintenance: Date;
  notes?: string;
  isMonitoring: boolean;
}

interface EquipmentMetrics {
  totalEquipment: number;
  onlineEquipment: number;
  offlineEquipment: number;
  maintenanceEquipment: number;
  idleEquipment: number;
  errorEquipment: number;
  averageUptime: number;
  averageFuelLevel: number;
  averageTemperature: number;
  totalOperatingHours: number;
  errorRate: number;
}

interface EquipmentAlert {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: "offline" | "low_fuel" | "high_temperature" | "maintenance_due" | "error" | "vibration";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  detectedAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export function EquipmentStatusDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentStatus | null>(null);

  // Mock data - In a real application, this would come from API calls
  const [equipment, setEquipment] = useState<EquipmentStatus[]>([
    {
      id: "EQ001",
      name: "Mining Truck 001",
      type: "Truck",
      model: "CAT 797F",
      manufacturer: "Caterpillar",
      serialNumber: "CAT797F001",
      status: "online",
      location: "Pit A",
      operator: "John Smith",
      ipAddress: "192.168.1.10",
      macAddress: "00:1B:44:11:3A:B7",
      lastSeen: new Date("2024-01-20T10:30:00"),
      uptime: 99.5,
      operatingHours: 1250,
      fuelLevel: 85,
      temperature: 45,
      pressure: 2.5,
      vibration: 0.8,
      signalStrength: 85,
      dataRate: 100,
      latency: 12,
      errorCount: 0,
      maintenanceDue: new Date("2024-02-15"),
      nextMaintenance: new Date("2024-02-01"),
      notes: "Primary haul truck",
      isMonitoring: true,
    },
    {
      id: "EQ002",
      name: "Excavator 002",
      type: "Excavator",
      model: "CAT 6020B",
      manufacturer: "Caterpillar",
      serialNumber: "CAT6020B002",
      status: "offline",
      location: "Pit B",
      operator: "Jane Doe",
      ipAddress: "192.168.1.11",
      macAddress: "00:1B:44:11:3A:B8",
      lastSeen: new Date("2024-01-19T15:45:00"),
      uptime: 0,
      operatingHours: 980,
      fuelLevel: 0,
      temperature: 0,
      pressure: 0,
      vibration: 0,
      signalStrength: 0,
      dataRate: 0,
      latency: 0,
      errorCount: 5,
      lastError: "Connection timeout",
      maintenanceDue: new Date("2024-01-25"),
      nextMaintenance: new Date("2024-01-20"),
      notes: "Maintenance scheduled",
      isMonitoring: true,
    },
    {
      id: "EQ003",
      name: "Drill 003",
      type: "Drill",
      model: "Sandvik DD422i",
      manufacturer: "Sandvik",
      serialNumber: "SVKDD422i003",
      status: "online",
      location: "Pit C",
      operator: "Mike Johnson",
      ipAddress: "192.168.1.15",
      macAddress: "00:1B:44:11:3A:C8",
      lastSeen: new Date("2024-01-20T09:15:00"),
      uptime: 98.2,
      operatingHours: 2100,
      fuelLevel: 92,
      temperature: 42,
      pressure: 3.2,
      vibration: 1.2,
      signalStrength: 78,
      dataRate: 85,
      latency: 15,
      errorCount: 1,
      maintenanceDue: new Date("2024-03-10"),
      nextMaintenance: new Date("2024-02-15"),
      notes: "Blast hole drilling",
      isMonitoring: true,
    },
    {
      id: "EQ004",
      name: "Loader 004",
      type: "Loader",
      model: "CAT 994K",
      manufacturer: "Caterpillar",
      serialNumber: "CAT994K004",
      status: "maintenance",
      location: "Pit A",
      operator: "Sarah Wilson",
      ipAddress: "192.168.1.12",
      macAddress: "00:1B:44:11:3A:CA",
      lastSeen: new Date("2024-01-18T14:20:00"),
      uptime: 0,
      operatingHours: 1800,
      fuelLevel: 0,
      temperature: 0,
      pressure: 0,
      vibration: 0,
      signalStrength: 0,
      dataRate: 0,
      latency: 0,
      errorCount: 0,
      maintenanceDue: new Date("2024-01-18"),
      nextMaintenance: new Date("2024-01-25"),
      notes: "Scheduled maintenance",
      isMonitoring: true,
    },
    {
      id: "EQ005",
      name: "Dozer 005",
      type: "Dozer",
      model: "CAT D11T",
      manufacturer: "Caterpillar",
      serialNumber: "CATD11T005",
      status: "idle",
      location: "Pit B",
      operator: "Tom Brown",
      ipAddress: "192.168.1.13",
      macAddress: "00:1B:44:11:3A:CB",
      lastSeen: new Date("2024-01-20T11:00:00"),
      uptime: 95.8,
      operatingHours: 3200,
      fuelLevel: 45,
      temperature: 38,
      pressure: 2.1,
      vibration: 0.5,
      signalStrength: 72,
      dataRate: 60,
      latency: 18,
      errorCount: 0,
      maintenanceDue: new Date("2024-04-15"),
      nextMaintenance: new Date("2024-03-01"),
      notes: "Standby equipment",
      isMonitoring: true,
    },
  ]);

  const [alerts, setAlerts] = useState<EquipmentAlert[]>([
    {
      id: "ALT001",
      equipmentId: "EQ002",
      equipmentName: "Excavator 002",
      type: "offline",
      severity: "high",
      message: "Excavator 002 has been offline for 24 hours",
      detectedAt: new Date("2024-01-19T15:45:00"),
      acknowledged: false,
      resolved: false,
    },
    {
      id: "ALT002",
      equipmentId: "EQ004",
      equipmentName: "Loader 004",
      type: "maintenance_due",
      severity: "medium",
      message: "Loader 004 maintenance is due",
      detectedAt: new Date("2024-01-18T14:20:00"),
      acknowledged: true,
      acknowledgedBy: "Admin",
      acknowledgedAt: new Date("2024-01-18T14:25:00"),
      resolved: false,
    },
    {
      id: "ALT003",
      equipmentId: "EQ005",
      equipmentName: "Dozer 005",
      type: "low_fuel",
      severity: "low",
      message: "Dozer 005 fuel level is low (45%)",
      detectedAt: new Date("2024-01-20T11:00:00"),
      acknowledged: false,
      resolved: true,
      resolvedAt: new Date("2024-01-20T11:30:00"),
    },
  ]);

  const [metrics, setMetrics] = useState<EquipmentMetrics>({
    totalEquipment: 5,
    onlineEquipment: 2,
    offlineEquipment: 1,
    maintenanceEquipment: 1,
    idleEquipment: 1,
    errorEquipment: 0,
    averageUptime: 58.5,
    averageFuelLevel: 44.4,
    averageTemperature: 31.25,
    totalOperatingHours: 9330,
    errorRate: 1.2,
  });

  // Auto-refresh simulation
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // In a real application, this would fetch fresh data from the API
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Statistics
  const totalEquipment = equipment.length;
  const onlineEquipment = equipment.filter(eq => eq.status === "online").length;
  const offlineEquipment = equipment.filter(eq => eq.status === "offline").length;
  const maintenanceEquipment = equipment.filter(eq => eq.status === "maintenance").length;
  const idleEquipment = equipment.filter(eq => eq.status === "idle").length;
  const errorEquipment = equipment.filter(eq => eq.status === "error").length;

  const activeAlerts = alerts.filter(alert => !alert.resolved).length;
  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged && !alert.resolved).length;
  const criticalAlerts = alerts.filter(alert => alert.severity === "critical" && !alert.resolved).length;

  // Filter functions
  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.operator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || eq.status === filterStatus;
    const matchesType = filterType === "all" || eq.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case "maintenance":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "idle":
        return <Pause className="h-4 w-4 text-blue-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      online: "default",
      offline: "destructive",
      maintenance: "secondary",
      idle: "outline",
      error: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Truck":
        return <Truck className="h-4 w-4" />;
      case "Excavator":
        return <HardHat className="h-4 w-4" />;
      case "Drill":
        return <Drill className="h-4 w-4" />;
      case "Loader":
        return <Loader className="h-4 w-4" />;
      default:
        return <HardHat className="h-4 w-4" />;
    }
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
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case "low_fuel":
        return <TrendingDown className="h-4 w-4 text-yellow-500" />;
      case "high_temperature":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "maintenance_due":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "vibration":
        return <Activity className="h-4 w-4 text-yellow-500" />;
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

  const handleToggleEquipmentMonitoring = (equipmentId: string) => {
    const updatedEquipment = equipment.map(eq => 
      eq.id === equipmentId 
        ? { ...eq, isMonitoring: !eq.isMonitoring }
        : eq
    );
    setEquipment(updatedEquipment);
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

  const handleViewEquipmentDetails = (equipment: EquipmentStatus) => {
    setSelectedEquipment(equipment);
    setIsAlertDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment Status</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of mining equipment status and performance
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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
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
            <span className="font-medium">{onlineEquipment}</span> online, 
            <span className="font-medium text-red-500 ml-1">{offlineEquipment}</span> offline
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
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <HardHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEquipment}</div>
            <p className="text-xs text-muted-foreground">
              All equipment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineEquipment}</div>
            <p className="text-xs text-muted-foreground">
              {totalEquipment > 0 ? ((onlineEquipment / totalEquipment) * 100).toFixed(1) : 0}% operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offlineEquipment}</div>
            <p className="text-xs text-muted-foreground">
              {maintenanceEquipment} maintenance, {idleEquipment} idle
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
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Status Distribution</CardTitle>
                <CardDescription>
                  Current status of all equipment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Online</span>
                    <span className="text-sm text-muted-foreground">{onlineEquipment}</span>
                  </div>
                  <Progress value={totalEquipment > 0 ? (onlineEquipment / totalEquipment) * 100 : 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Offline</span>
                    <span className="text-sm text-muted-foreground">{offlineEquipment}</span>
                  </div>
                  <Progress value={totalEquipment > 0 ? (offlineEquipment / totalEquipment) * 100 : 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Maintenance</span>
                    <span className="text-sm text-muted-foreground">{maintenanceEquipment}</span>
                  </div>
                  <Progress value={totalEquipment > 0 ? (maintenanceEquipment / totalEquipment) * 100 : 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Idle</span>
                    <span className="text-sm text-muted-foreground">{idleEquipment}</span>
                  </div>
                  <Progress value={totalEquipment > 0 ? (idleEquipment / totalEquipment) * 100 : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>
                  Latest equipment alerts and notifications
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

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search equipment..."
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
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Truck">Truck</SelectItem>
                <SelectItem value="Excavator">Excavator</SelectItem>
                <SelectItem value="Drill">Drill</SelectItem>
                <SelectItem value="Loader">Loader</SelectItem>
                <SelectItem value="Dozer">Dozer</SelectItem>
                <SelectItem value="Shovel">Shovel</SelectItem>
                <SelectItem value="Crusher">Crusher</SelectItem>
                <SelectItem value="Conveyor">Conveyor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Equipment Status</CardTitle>
              <CardDescription>
                Real-time status of all mining equipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.map((eq) => (
                    <TableRow key={eq.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{eq.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {eq.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(eq.type)}
                          <Badge variant="outline">{eq.type}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(eq.status)}
                          {getStatusBadge(eq.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{eq.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>{eq.operator}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{eq.uptime.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{eq.lastSeen.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleEquipmentMonitoring(eq.id)}
                          >
                            {eq.isMonitoring ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewEquipmentDetails(eq)}
                          >
                            <Settings className="h-3 w-3" />
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
              <CardTitle>Equipment Alerts</CardTitle>
              <CardDescription>
                Active and resolved equipment alerts
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
                          <div className="text-sm text-muted-foreground">ID: {alert.equipmentId}</div>
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
                  Equipment performance over time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Uptime</span>
                    <span className="text-sm text-muted-foreground">{metrics.averageUptime.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.averageUptime} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Fuel Level</span>
                    <span className="text-sm text-muted-foreground">{metrics.averageFuelLevel.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.averageFuelLevel} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Temperature</span>
                    <span className="text-sm text-muted-foreground">{metrics.averageTemperature.toFixed(1)}°C</span>
                  </div>
                  <Progress value={Math.min(100, (metrics.averageTemperature / 100) * 100)} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Operating Hours</span>
                    <span className="text-sm text-muted-foreground">{metrics.totalOperatingHours.toLocaleString()}</span>
                  </div>
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
                      {equipment.reduce((sum, eq) => sum + eq.errorCount, 0)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Equipment with Errors</span>
                    <span className="text-sm text-muted-foreground">{errorEquipment}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Maintenance Due</span>
                    <span className="text-sm text-muted-foreground">
                      {equipment.filter(eq => eq.maintenanceDue <= new Date()).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Equipment Details Dialog */}
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Equipment Details</DialogTitle>
            <DialogDescription>
              Detailed information for {selectedEquipment?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedEquipment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Equipment Name</Label>
                  <div className="p-3 border rounded-md bg-muted">
                    <div className="font-medium">{selectedEquipment.name}</div>
                    <div className="text-sm text-muted-foreground">ID: {selectedEquipment.id}</div>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="p-3 border rounded-md bg-muted">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedEquipment.status)}
                      {getStatusBadge(selectedEquipment.status)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <div className="p-3 border rounded-md bg-muted">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{selectedEquipment.location}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Operator</Label>
                  <div className="p-3 border rounded-md bg-muted">
                    <span>{selectedEquipment.operator}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Uptime</Label>
                  <div className="p-3 border rounded-md bg-muted">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{selectedEquipment.uptime.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Operating Hours</Label>
                  <div className="p-3 border rounded-md bg-muted">
                    <span>{selectedEquipment.operatingHours.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fuel Level</Label>
                  <div className="p-3 border rounded-md bg-muted">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${selectedEquipment.fuelLevel}%` }}
                        />
                      </div>
                      <span className="text-sm">{selectedEquipment.fuelLevel}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Temperature</Label>
                  <div className="p-3 border rounded-md bg-muted">
                    <span>{selectedEquipment.temperature}°C</span>
                  </div>
                </div>
              </div>
              {selectedEquipment.lastError && (
                <div>
                  <Label>Last Error</Label>
                  <div className="p-3 border rounded-md bg-muted">
                    <span className="text-red-600">{selectedEquipment.lastError}</span>
                  </div>
                </div>
              )}
              <div>
                <Label>Notes</Label>
                <div className="p-3 border rounded-md bg-muted">
                  <span>{selectedEquipment.notes || "No notes available"}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAlertDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => setIsAlertDialogOpen(false)}>
              View Full Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
