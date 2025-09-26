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
  Minus,
  MapPin,
  Wifi,
  Signal,
  Router,
  HardHat,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Types for mesh network data
interface MeshConnection {
  id: string;
  fromNode: string;
  toNode: string;
  signalStrength: number;
  dataRate: number;
  latency: number;
  status: "active" | "weak" | "disconnected";
  lastUpdated: Date;
}

interface MeshTopology {
  nodes: {
    id: string;
    name: string;
    x: number;
    y: number;
    status: "online" | "offline" | "degraded";
    connections: number;
  }[];
  connections: MeshConnection[];
}

interface NetworkPerformance {
  totalThroughput: number;
  averageLatency: number;
  packetLoss: number;
  networkEfficiency: number;
  coverageArea: number;
  redundancyLevel: number;
}

export function MeshNetworkDashboard() {
  const [topology, setTopology] = useState<MeshTopology>({
    nodes: [],
    connections: [],
  });
  const [performance, setPerformance] = useState<NetworkPerformance>({
    totalThroughput: 0,
    averageLatency: 0,
    packetLoss: 0,
    networkEfficiency: 0,
    coverageArea: 0,
    redundancyLevel: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Simulate real-time data fetching
  useEffect(() => {
    const fetchMeshData = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate realistic mesh topology
        const meshTopology: MeshTopology = {
          nodes: [
            { id: "RAJ-001", name: "Haul Truck", x: 100, y: 150, status: "online", connections: 3 },
            { id: "RAJ-002", name: "Excavator", x: 200, y: 100, status: "online", connections: 4 },
            { id: "RAJ-003", name: "Drill", x: 300, y: 200, status: "offline", connections: 0 },
            { id: "RAJ-004", name: "Loader", x: 150, y: 250, status: "degraded", connections: 1 },
            { id: "RAJ-005", name: "Dozer", x: 250, y: 300, status: "online", connections: 2 },
            { id: "RAJ-006", name: "Shovel", x: 350, y: 150, status: "online", connections: 3 },
            { id: "RAJ-007", name: "Crusher", x: 400, y: 250, status: "online", connections: 2 },
            { id: "RAJ-008", name: "Conveyor", x: 50, y: 200, status: "online", connections: 2 },
          ],
          connections: [
            {
              id: "CONN-001",
              fromNode: "RAJ-001",
              toNode: "RAJ-002",
              signalStrength: 85,
              dataRate: 54,
              latency: 12,
              status: "active",
              lastUpdated: new Date(),
            },
            {
              id: "CONN-002",
              fromNode: "RAJ-001",
              toNode: "RAJ-004",
              signalStrength: 72,
              dataRate: 36,
              latency: 18,
              status: "active",
              lastUpdated: new Date(),
            },
            {
              id: "CONN-003",
              fromNode: "RAJ-002",
              toNode: "RAJ-006",
              signalStrength: 90,
              dataRate: 48,
              latency: 8,
              status: "active",
              lastUpdated: new Date(),
            },
            {
              id: "CONN-004",
              fromNode: "RAJ-002",
              toNode: "RAJ-005",
              signalStrength: 78,
              dataRate: 42,
              latency: 15,
              status: "active",
              lastUpdated: new Date(),
            },
            {
              id: "CONN-005",
              fromNode: "RAJ-004",
              toNode: "RAJ-005",
              signalStrength: 45,
              dataRate: 12,
              latency: 25,
              status: "weak",
              lastUpdated: new Date(),
            },
            {
              id: "CONN-006",
              fromNode: "RAJ-006",
              toNode: "RAJ-007",
              signalStrength: 88,
              dataRate: 50,
              latency: 10,
              status: "active",
              lastUpdated: new Date(),
            },
            {
              id: "CONN-007",
              fromNode: "RAJ-008",
              toNode: "RAJ-001",
              signalStrength: 82,
              dataRate: 46,
              latency: 14,
              status: "active",
              lastUpdated: new Date(),
            },
            {
              id: "CONN-008",
              fromNode: "RAJ-008",
              toNode: "RAJ-004",
              signalStrength: 75,
              dataRate: 38,
              latency: 16,
              status: "active",
              lastUpdated: new Date(),
            },
          ],
        };

        const networkPerformance: NetworkPerformance = {
          totalThroughput: 326,
          averageLatency: 15,
          packetLoss: 0.2,
          networkEfficiency: 87,
          coverageArea: 95,
          redundancyLevel: 3.2,
        };

        setTopology(meshTopology);
        setPerformance(networkPerformance);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to fetch mesh data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeshData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchMeshData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "offline":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "degraded":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
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
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600";
      case "weak":
        return "text-yellow-600";
      case "disconnected":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getPerformanceColor = (value: number, type: string) => {
    if (type === "latency" || type === "packetLoss") {
      if (value <= 10) return "text-green-600";
      if (value <= 20) return "text-yellow-600";
      return "text-red-600";
    } else {
      if (value >= 90) return "text-green-600";
      if (value >= 70) return "text-yellow-600";
      return "text-red-600";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mesh Network</h1>
            <p className="text-muted-foreground">
              Real-time mesh network topology and performance
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mesh Network</h1>
          <p className="text-muted-foreground">
            Real-time mesh network topology and performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Network Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Throughput</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.totalThroughput} Mbps</div>
            <p className="text-xs text-muted-foreground">
              Network bandwidth utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(performance.averageLatency, "latency")}`}>
              {performance.averageLatency} ms
            </div>
            <p className="text-xs text-muted-foreground">
              End-to-end delay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Efficiency</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.networkEfficiency}%</div>
            <div className="mt-2">
              <Progress value={performance.networkEfficiency} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packet Loss</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(performance.packetLoss, "packetLoss")}`}>
              {performance.packetLoss}%
            </div>
            <p className="text-xs text-muted-foreground">
              Data loss rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage Area</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.coverageArea}%</div>
            <p className="text-xs text-muted-foreground">
              Network coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redundancy Level</CardTitle>
            <Signal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.redundancyLevel}</div>
            <p className="text-xs text-muted-foreground">
              Average connections per node
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mesh Network Tabs */}
      <Tabs defaultValue="topology" className="space-y-4">
        <TabsList>
          <TabsTrigger value="topology">Network Topology</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="topology" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Topology</CardTitle>
              <CardDescription>
                Visual representation of the mesh network nodes and their connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-96 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/25">
                <div className="absolute inset-0 p-4">
                  {/* Simple SVG representation of mesh topology */}
                  <svg className="w-full h-full" viewBox="0 0 500 400">
                    {/* Connections */}
                    {topology.connections.map((conn) => {
                      const fromNode = topology.nodes.find(n => n.id === conn.fromNode);
                      const toNode = topology.nodes.find(n => n.id === conn.toNode);
                      if (!fromNode || !toNode) return null;
                      
                      return (
                        <line
                          key={conn.id}
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          stroke={conn.status === "active" ? "#22c55e" : conn.status === "weak" ? "#eab308" : "#ef4444"}
                          strokeWidth={conn.status === "active" ? 3 : 2}
                          strokeDasharray={conn.status === "disconnected" ? "5,5" : "0"}
                          opacity={conn.status === "disconnected" ? 0.5 : 1}
                        />
                      );
                    })}
                    
                    {/* Nodes */}
                    {topology.nodes.map((node) => (
                      <g key={node.id}>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="20"
                          fill={node.status === "online" ? "#22c55e" : node.status === "offline" ? "#ef4444" : "#f59e0b"}
                          stroke="#fff"
                          strokeWidth="2"
                        />
                        <text
                          x={node.x}
                          y={node.y + 5}
                          textAnchor="middle"
                          className="text-xs font-medium fill-white"
                        >
                          {node.id.split('-')[1]}
                        </text>
                        <text
                          x={node.x}
                          y={node.y + 35}
                          textAnchor="middle"
                          className="text-xs fill-muted-foreground"
                        >
                          {node.name}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
                <div className="absolute bottom-4 left-4 flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Online</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>Degraded</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Offline</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mesh Connections</CardTitle>
              <CardDescription>
                Detailed view of all mesh network connections and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topology.connections.map((conn) => {
                  const fromNode = topology.nodes.find(n => n.id === conn.fromNode);
                  const toNode = topology.nodes.find(n => n.id === conn.toNode);
                  
                  return (
                    <div key={conn.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Router className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{conn.fromNode}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium">{conn.toNode}</span>
                        </div>
                        <Badge className={getStatusColor(conn.status)}>
                          {conn.status === "active" ? <CheckCircle className="h-3 w-3 mr-1" /> : 
                           conn.status === "weak" ? <AlertTriangle className="h-3 w-3 mr-1" /> :
                           <XCircle className="h-3 w-3 mr-1" />}
                          {conn.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{conn.signalStrength}%</div>
                          <div className="text-muted-foreground">Signal</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{conn.dataRate} Mbps</div>
                          <div className="text-muted-foreground">Data Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{conn.latency} ms</div>
                          <div className="text-muted-foreground">Latency</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Network Health</CardTitle>
                <CardDescription>
                  Overall mesh network health metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Network Efficiency</span>
                    <span>{performance.networkEfficiency}%</span>
                  </div>
                  <Progress value={performance.networkEfficiency} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Coverage Area</span>
                    <span>{performance.coverageArea}%</span>
                  </div>
                  <Progress value={performance.coverageArea} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Redundancy Level</span>
                    <span>{performance.redundancyLevel}</span>
                  </div>
                  <Progress value={(performance.redundancyLevel / 5) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Throughput</span>
                  <span className="font-medium">{performance.totalThroughput} Mbps</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Latency</span>
                  <span className={`font-medium ${getPerformanceColor(performance.averageLatency, "latency")}`}>
                    {performance.averageLatency} ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Packet Loss</span>
                  <span className={`font-medium ${getPerformanceColor(performance.packetLoss, "packetLoss")}`}>
                    {performance.packetLoss}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Connections</span>
                  <span className="font-medium">{topology.connections.filter(c => c.status === "active").length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
}
