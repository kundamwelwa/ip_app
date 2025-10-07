"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Router,
  Network,
  MapPin,
  HardHat,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Signal,
  Timer,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

// Types for network data
interface NetworkNode {
  id: string;
  name: string;
  ip: string;
  macAddress: string;
  status: "online" | "offline" | "maintenance" | "unknown";
  signalStrength: number;
  lastSeen: Date;
  location: string;
  equipmentType: string;
  meshConnections: number;
  dataRate: number;
  latency: number;
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

export function NetworkStatusDashboard() {
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

  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch real network data from API
  useEffect(() => {
    const fetchNetworkData = async () => {
      setIsLoading(true);
      try {
        setError(null);
        const response = await fetch("/api/network/status");
        if (!response.ok) {
          throw new Error("Failed to fetch network data");
        }
        const data = await response.json();
        
        setNetworkNodes(data.networkNodes);
        setNetworkStats(data.networkStats);
        setLastUpdated(new Date(data.lastUpdated));
      } catch (error) {
        console.error("Failed to fetch network data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNetworkData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchNetworkData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "offline":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "offline":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "maintenance":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNetworkHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "fair":
        return "text-yellow-600";
      case "poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatLastSeen = (date: Date | string | null | undefined) => {
    if (!date) return "Never";
    
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if it's a valid date
    if (isNaN(dateObj.getTime())) return "Invalid date";
    
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Network Status</h1>
            <p className="text-muted-foreground">
              Real-time monitoring of Rajant mesh network
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading network data...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Network Status</h1>
            <p className="text-muted-foreground">
              Real-time monitoring of Rajant mesh network
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Error Loading Network Data
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Status</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of Rajant mesh network
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={getNetworkHealthColor(networkStats.networkHealth)}>
            <Activity className="h-3 w-3 mr-1" />
            Network Health: {networkStats.networkHealth.toUpperCase()}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              setIsLoading(true);
              try {
                setError(null);
                const response = await fetch("/api/network/status");
                if (!response.ok) {
                  throw new Error("Failed to fetch network data");
                }
                const data = await response.json();
                
                setNetworkNodes(data.networkNodes);
                setNetworkStats(data.networkStats);
                setLastUpdated(new Date(data.lastUpdated));
              } catch (error) {
                console.error("Failed to fetch network data:", error);
                setError(error instanceof Error ? error.message : "An error occurred");
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Network Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.totalNodes}</div>
            <p className="text-xs text-muted-foreground">
              Active mesh network nodes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Nodes</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{networkStats.onlineNodes}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((networkStats.onlineNodes / networkStats.totalNodes) * 100)}% uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Signal</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.averageSignalStrength}%</div>
            <div className="mt-2">
              <Progress value={networkStats.averageSignalStrength} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Data Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.totalDataRate} Mbps</div>
            <p className="text-xs text-muted-foreground">
              Network throughput
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Real-time Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.averageLatency}ms</div>
            <p className="text-xs text-muted-foreground">
              Real-time ping results
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline Nodes</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{networkStats.offlineNodes}</div>
            <p className="text-xs text-muted-foreground">
              Equipment not responding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{networkStats.maintenanceNodes}</div>
            <p className="text-xs text-muted-foreground">
              Under maintenance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Health</CardTitle>
            <Signal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getNetworkHealthColor(networkStats.networkHealth)}`}>
              {networkStats.networkHealth.toUpperCase()}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall network status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Network Nodes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Network Nodes</CardTitle>
          <CardDescription>
            Real-time status of all Rajant mesh network nodes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Node ID</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Real-time Status</TableHead>
                <TableHead>Signal Strength</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Data Rate</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Mesh Connections</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {networkNodes.map((node) => (
                <TableRow key={node.id}>
                  <TableCell className="font-medium">{node.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <HardHat className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{node.name}</div>
                        <div className="text-sm text-muted-foreground">{node.equipmentType}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{node.ip}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(node.status)}>
                        {getStatusIcon(node.status)}
                        <span className="ml-1 capitalize">{node.status}</span>
                      </Badge>
                      {node.status === "online" && (
                        <Badge variant="outline" className="text-xs">
                          Live
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-16">
                        <Progress 
                          value={node.signalStrength} 
                          className="h-2"
                        />
                      </div>
                      <span className={`text-sm font-medium ${
                        node.signalStrength >= 80 ? 'text-green-600' :
                        node.signalStrength >= 60 ? 'text-yellow-600' :
                        node.signalStrength >= 40 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {node.signalStrength}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{node.location}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatLastSeen(node.lastSeen)}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center space-x-1">
                      <Zap className="h-3 w-3 text-blue-500" />
                      <span className="font-medium">{node.dataRate} Mbps</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center space-x-1">
                      <Timer className="h-3 w-3 text-purple-500" />
                      <span className={`font-medium ${
                        node.latency <= 20 ? 'text-green-600' :
                        node.latency <= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {node.latency} ms
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center space-x-1">
                      <Network className="h-3 w-3 text-indigo-500" />
                      <span className="font-medium">{node.meshConnections}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
}
