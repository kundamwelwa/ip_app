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
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Simulate real-time data fetching
  useEffect(() => {
    const fetchNetworkData = async () => {
      setIsLoading(true);
      try {
        // In a real application, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        // Generate realistic network data
        const nodes: NetworkNode[] = [
          {
            id: "RAJ-001",
            name: "Haul Truck CAT 797F",
            ip: "192.168.1.100",
            macAddress: "00:1B:44:11:3A:B7",
            status: "online",
            signalStrength: 85,
            lastSeen: new Date(),
            location: "Pit A - Level 3",
            equipmentType: "Truck",
            meshConnections: 3,
            dataRate: 54,
            latency: 12,
          },
          {
            id: "RAJ-002",
            name: "Excavator CAT 6020B",
            ip: "192.168.1.101",
            macAddress: "00:1B:44:11:3A:B8",
            status: "online",
            signalStrength: 92,
            lastSeen: new Date(),
            location: "Pit A - Level 2",
            equipmentType: "Excavator",
            meshConnections: 4,
            dataRate: 48,
            latency: 8,
          },
          {
            id: "RAJ-003",
            name: "Drill CAT MD6640",
            ip: "192.168.1.102",
            macAddress: "00:1B:44:11:3A:B9",
            status: "offline",
            signalStrength: 0,
            lastSeen: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
            location: "Pit B - Level 1",
            equipmentType: "Drill",
            meshConnections: 0,
            dataRate: 0,
            latency: 0,
          },
          {
            id: "RAJ-004",
            name: "Loader CAT 994K",
            ip: "192.168.1.103",
            macAddress: "00:1B:44:11:3A:BA",
            status: "maintenance",
            signalStrength: 45,
            lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
            location: "Maintenance Bay",
            equipmentType: "Loader",
            meshConnections: 1,
            dataRate: 12,
            latency: 25,
          },
          {
            id: "RAJ-005",
            name: "Dozer CAT D11T",
            ip: "192.168.1.104",
            macAddress: "00:1B:44:11:3A:BB",
            status: "online",
            signalStrength: 78,
            lastSeen: new Date(),
            location: "Pit C - Level 4",
            equipmentType: "Dozer",
            meshConnections: 2,
            dataRate: 36,
            latency: 15,
          },
        ];

        // Calculate network statistics
        const stats: NetworkStats = {
          totalNodes: nodes.length,
          onlineNodes: nodes.filter(n => n.status === "online").length,
          offlineNodes: nodes.filter(n => n.status === "offline").length,
          maintenanceNodes: nodes.filter(n => n.status === "maintenance").length,
          averageSignalStrength: Math.round(
            nodes.filter(n => n.status === "online").reduce((sum, n) => sum + n.signalStrength, 0) /
            nodes.filter(n => n.status === "online").length
          ),
          totalDataRate: nodes.reduce((sum, n) => sum + n.dataRate, 0),
          averageLatency: Math.round(
            nodes.filter(n => n.status === "online").reduce((sum, n) => sum + n.latency, 0) /
            nodes.filter(n => n.status === "online").length
          ),
          networkHealth: "good",
        };

        setNetworkNodes(nodes);
        setNetworkStats(stats);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to fetch network data:", error);
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

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
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
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
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
                <TableHead>Status</TableHead>
                <TableHead>Signal Strength</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Data Rate</TableHead>
                <TableHead>Latency</TableHead>
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
                    <Badge className={getStatusColor(node.status)}>
                      {getStatusIcon(node.status)}
                      <span className="ml-1 capitalize">{node.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-16">
                        <Progress value={node.signalStrength} className="h-2" />
                      </div>
                      <span className="text-sm">{node.signalStrength}%</span>
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
                  <TableCell className="text-sm">{node.dataRate} Mbps</TableCell>
                  <TableCell className="text-sm">{node.latency} ms</TableCell>
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
