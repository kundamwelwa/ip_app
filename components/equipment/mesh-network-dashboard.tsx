"use client";

import { useState, useEffect } from "react";
import {
  Network,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wifi,
  Signal,
  Router,
  Zap,
  Timer,
  Shield,
  Link2,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEquipmentMonitoring } from "@/hooks/use-equipment-monitoring";
import { getTimeAgo, formatDateForDisplay } from "@/lib/time-utils";
import { getSignalStrengthColor, getNetworkHealthColor } from "@/lib/real-time-data";

// Types for mesh network data
interface MeshNode {
  id: string;
  name: string;
  type: string;
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE" | "UNKNOWN";
  ipAddress: string;
  location: string;
  meshStrength: number;
  connections: number;
  lastSeen: Date;
}

interface NetworkStats {
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  maintenanceNodes: number;
  averageSignalStrength: number;
  totalDataRate: number;
  averageLatency: number;
  networkHealth: "excellent" | "good" | "fair" | "poor";
}

export function MeshNetworkDashboard() {
  const [nodes, setNodes] = useState<MeshNode[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalNodes: 0,
    onlineNodes: 0,
    offlineNodes: 0,
    maintenanceNodes: 0,
    averageSignalStrength: 0,
    totalDataRate: 0,
    averageLatency: 0,
    networkHealth: "good",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("overview");

  // Equipment monitoring
  const {
    equipmentStatuses,
    monitoringStatus,
    checkAllEquipment,
    startMonitoring,
    stopMonitoring,
  } = useEquipmentMonitoring();

  // Fetch mesh network data
  const fetchMeshData = async (useRealTime = false) => {
    try {
      if (useRealTime) {
        setIsRefreshing(true);
        await checkAllEquipment();
      } else {
        setIsLoading(true);
      }
      
      const response = await fetch("/api/network/status");
      if (!response.ok) {
        throw new Error("Failed to fetch network status");
      }

      const data = await response.json();
      
      // Transform network nodes to mesh nodes
      const meshNodes: MeshNode[] = data.networkNodes.map((node: any) => ({
        id: node.id,
        name: node.name,
        type: node.equipmentType,
        status: node.status.toUpperCase() as "ONLINE" | "OFFLINE" | "MAINTENANCE" | "UNKNOWN",
        ipAddress: node.ip,
        location: node.location,
        meshStrength: node.signalStrength,
        connections: node.meshConnections,
        lastSeen: new Date(node.lastSeen),
      }));

      setNodes(meshNodes);
      setNetworkStats(data.networkStats);
      setError(null);
    } catch (err) {
      console.error("Error fetching mesh data:", err);
      setError(err instanceof Error ? err.message : "Failed to load mesh network data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMeshData();
    
    // Set up periodic refresh
    const interval = setInterval(() => fetchMeshData(), 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    await fetchMeshData(true);
  };

  const getStatusColor = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case "ONLINE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "OFFLINE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "UNKNOWN":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case "ONLINE":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "OFFLINE":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "MAINTENANCE":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "UNKNOWN":
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mesh Network</h1>
            <p className="text-muted-foreground">
              Rajant mesh network topology and performance
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading mesh network data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mesh Network</h1>
            <p className="text-muted-foreground">
              Rajant mesh network topology and performance
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Error Loading Mesh Network
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <Button onClick={() => fetchMeshData()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Mesh Network</h1>
          <p className="text-sm text-muted-foreground">
            Real-time Rajant mesh network topology and performance monitoring
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
          <Button 
            variant={monitoringStatus.isRunning ? "destructive" : "default"}
            size="sm"
            onClick={monitoringStatus.isRunning ? stopMonitoring : () => startMonitoring(30000)}
          >
            {monitoringStatus.isRunning ? (
              <>
                <XCircle className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Stop Monitor</span>
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Start Monitor</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Network Overview Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">Total Nodes</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="text-xl sm:text-2xl font-bold">{networkStats.totalNodes}</div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Mesh devices
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">Online</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {networkStats.onlineNodes}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Active connections
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">Offline</CardTitle>
            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {networkStats.offlineNodes}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Disconnected
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">Signal</CardTitle>
            <Signal className="h-4 w-4 text-blue-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className={`text-xl sm:text-2xl font-bold ${getSignalStrengthColor(networkStats.averageSignalStrength)}`}>
              {networkStats.averageSignalStrength}%
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Avg strength
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">Data Rate</CardTitle>
            <Zap className="h-4 w-4 text-purple-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              {networkStats.totalDataRate}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Mbps total
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">Health</CardTitle>
            <Shield className="h-4 w-4 text-indigo-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className={`text-lg sm:text-xl font-bold ${getNetworkHealthColor(networkStats.networkHealth)}`}>
              {networkStats.networkHealth}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Network status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topology">Topology</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Network Health Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Network Health
                </CardTitle>
                <CardDescription>Overall mesh network status and metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Network Status</span>
                    <Badge className={getNetworkHealthColor(networkStats.networkHealth)}>
                      {networkStats.networkHealth.toUpperCase()}
                    </Badge>
                  </div>
                  <Progress 
                    value={
                      networkStats.networkHealth === "excellent" ? 100 :
                      networkStats.networkHealth === "good" ? 75 :
                      networkStats.networkHealth === "fair" ? 50 : 25
                    } 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Node Availability</span>
                    <span className="text-sm text-muted-foreground">
                      {networkStats.totalNodes > 0 
                        ? Math.round((networkStats.onlineNodes / networkStats.totalNodes) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={networkStats.totalNodes > 0 
                      ? (networkStats.onlineNodes / networkStats.totalNodes) * 100 
                      : 0} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Signal Quality</span>
                    <span className={`text-sm font-medium ${getSignalStrengthColor(networkStats.averageSignalStrength)}`}>
                      {networkStats.averageSignalStrength}%
                    </span>
                  </div>
                  <Progress 
                    value={networkStats.averageSignalStrength} 
                    className="h-2"
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Latency</p>
                      <p className="text-lg font-bold">{networkStats.averageLatency}ms</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Throughput</p>
                      <p className="text-lg font-bold">{networkStats.totalDataRate} Mbps</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Node Distribution Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Network className="mr-2 h-5 w-5" />
                  Node Distribution
                </CardTitle>
                <CardDescription>Equipment status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Online Nodes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-green-600">{networkStats.onlineNodes}</span>
                      <Progress value={(networkStats.onlineNodes / networkStats.totalNodes) * 100} className="w-24 h-2" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Offline Nodes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-red-600">{networkStats.offlineNodes}</span>
                      <Progress value={(networkStats.offlineNodes / networkStats.totalNodes) * 100} className="w-24 h-2" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Maintenance</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-yellow-600">{networkStats.maintenanceNodes}</span>
                      <Progress value={(networkStats.maintenanceNodes / networkStats.totalNodes) * 100} className="w-24 h-2" />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{networkStats.totalNodes}</p>
                      <p className="text-sm text-muted-foreground">Total Mesh Nodes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Nodes Table */}
          <Card>
            <CardHeader>
              <CardTitle>Mesh Nodes</CardTitle>
              <CardDescription>All devices in the mesh network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Node ID</TableHead>
                      <TableHead className="min-w-[150px]">Name</TableHead>
                      <TableHead className="min-w-[100px]">Type</TableHead>
                      <TableHead className="min-w-[140px]">IP Address</TableHead>
                      <TableHead className="min-w-[120px]">Status</TableHead>
                      <TableHead className="min-w-[130px]">Signal Strength</TableHead>
                      <TableHead className="min-w-[100px]">Connections</TableHead>
                      <TableHead className="min-w-[140px]">Last Seen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nodes.map((node) => {
                      const timeAgo = getTimeAgo(node.lastSeen);
                      return (
                        <TableRow key={node.id}>
                          <TableCell className="font-medium font-mono">{node.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Router className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium truncate">{node.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{node.location}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{node.type}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{node.ipAddress}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(node.status)}>
                              {getStatusIcon(node.status)}
                              <span className="ml-1">{node.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-16">
                                <Progress value={node.meshStrength} className="h-2" />
                              </div>
                              <span className={`text-sm ${getSignalStrengthColor(node.meshStrength)}`}>
                                {node.meshStrength}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Link2 className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{node.connections}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{formatDateForDisplay(node.lastSeen, 'short')}</div>
                              <div className="text-xs text-muted-foreground">{timeAgo.fullText}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topology Tab */}
        <TabsContent value="topology" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Network className="mr-2 h-5 w-5" />
                Network Topology
              </CardTitle>
              <CardDescription>Visual representation of mesh network connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Network className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Topology Visualization</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Network topology map showing {networkStats.totalNodes} nodes with {networkStats.onlineNodes} active connections.
                      Interactive mesh visualization coming soon.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-4">
                    <div className="bg-background p-3 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{networkStats.onlineNodes}</p>
                      <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                    <div className="bg-background p-3 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{networkStats.offlineNodes}</p>
                      <p className="text-xs text-muted-foreground">Offline</p>
                    </div>
                    <div className="bg-background p-3 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{networkStats.averageSignalStrength}%</p>
                      <p className="text-xs text-muted-foreground">Signal</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{networkStats.averageLatency}ms</div>
                <p className="text-xs text-muted-foreground">Network response time</p>
                <div className="mt-4">
                  <Progress 
                    value={Math.max(0, 100 - networkStats.averageLatency)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Throughput</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{networkStats.totalDataRate} Mbps</div>
                <p className="text-xs text-muted-foreground">Aggregate data rate</p>
                <div className="mt-4">
                  <Progress 
                    value={Math.min(100, (networkStats.totalDataRate / 500) * 100)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network Efficiency</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {networkStats.totalNodes > 0 
                    ? Math.round((networkStats.onlineNodes / networkStats.totalNodes) * 100) 
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Uptime ratio</p>
                <div className="mt-4">
                  <Progress 
                    value={networkStats.totalNodes > 0 
                      ? (networkStats.onlineNodes / networkStats.totalNodes) * 100 
                      : 0} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Detailed network performance by node</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Node</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Signal Strength</TableHead>
                      <TableHead>Connections</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nodes.map((node) => (
                      <TableRow key={node.id}>
                        <TableCell className="font-medium">{node.name}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(node.status)}>
                            {node.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={node.meshStrength} className="w-20 h-2" />
                            <span className={`text-sm ${getSignalStrengthColor(node.meshStrength)}`}>
                              {node.meshStrength}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{node.connections}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{node.location}</TableCell>
                        <TableCell>
                          {node.status === "ONLINE" ? (
                            <Badge variant="outline" className="text-green-600">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Optimal
                            </Badge>
                          ) : node.status === "MAINTENANCE" ? (
                            <Badge variant="outline" className="text-yellow-600">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Limited
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              No Data
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
