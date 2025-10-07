"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Network,
  Wifi,
  WifiOff,
  Signal,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface MeshNode {
  id: string;
  name: string;
  type: "RAJANT_NODE" | "EQUIPMENT";
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE";
  meshStrength: number;
  location: string;
  lastSeen: string;
  connections: string[];
  ipAddress?: string;
  equipmentType?: string;
}

interface MeshTopologyData {
  nodes: MeshNode[];
  totalConnections: number;
  averageStrength: number;
  networkHealth: number;
  lastUpdated: string;
}

export function MeshTopology() {
  const [topologyData, setTopologyData] = useState<MeshTopologyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTopologyData = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch("/api/network/topology");
      if (!response.ok) {
        throw new Error("Failed to fetch mesh topology data");
      }
      const data = await response.json();
      setTopologyData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTopologyData();
  }, []);

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case "ONLINE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "OFFLINE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getSignalStrengthColor = (strength: number) => {
    if (strength >= 80) return "text-green-600";
    if (strength >= 60) return "text-yellow-600";
    if (strength >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getNetworkHealthColor = (health: number) => {
    if (health >= 90) return "text-green-600";
    if (health >= 70) return "text-yellow-600";
    if (health >= 50) return "text-orange-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <span>Mesh Network Topology</span>
          </CardTitle>
          <CardDescription>Real-time mesh network visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading topology...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <span>Mesh Network Topology</span>
          </CardTitle>
          <CardDescription>Real-time mesh network visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchTopologyData} variant="outline" className="mt-2">
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topologyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <span>Mesh Network Topology</span>
          </CardTitle>
          <CardDescription>Real-time mesh network visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p>No topology data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="quantum-card">
      <CardHeader className="quantum-card-header">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2 text-indingo-700">
              <Network className="h-5 w-5 text-indigo-800" />
              <span>Mesh Network Topology</span>
            </CardTitle>
            <CardDescription className="text-gray-700">Real-time mesh network visualization</CardDescription>
          </div>
          <Button
            onClick={fetchTopologyData}
            disabled={isRefreshing}
            className="quantum-button-primary"
            size="sm"
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Network Health Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network Health</span>
                <span className={`text-sm font-bold ${getNetworkHealthColor(topologyData.networkHealth)}`}>
                  {topologyData.networkHealth}%
                </span>
              </div>
              <Progress value={topologyData.networkHealth} className="h-2 quantum-progress" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Signal</span>
                <span className={`text-sm font-bold ${getSignalStrengthColor(topologyData.averageStrength)}`}>
                  {topologyData.averageStrength}%
                </span>
              </div>
              <Progress value={topologyData.averageStrength} className="h-2 quantum-progress" />
            </div>
          </div>

          {/* Network Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{topologyData.nodes.length}</div>
              <div className="text-xs text-muted-foreground">Total Nodes</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{topologyData.totalConnections}</div>
              <div className="text-xs text-muted-foreground">Connections</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {topologyData.nodes.filter(n => n.status === "ONLINE").length}
              </div>
              <div className="text-xs text-muted-foreground">Online</div>
            </div>
          </div>

          {/* Mesh Nodes */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Mesh Nodes</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {topologyData.nodes.map((node) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {node.type === "RAJANT_NODE" ? (
                        <Network className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Wifi className="h-4 w-4 text-green-600" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{node.name}</div>
                        <div className="text-xs text-muted-foreground">{node.location}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Signal className={`h-3 w-3 ${getSignalStrengthColor(node.meshStrength)}`} />
                        <span className="text-xs font-medium">{node.meshStrength}%</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getNodeStatusColor(node.status)}`}
                      >
                        {node.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Last Updated */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Last updated: {new Date(topologyData.lastUpdated).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="h-3 w-3" />
              <span>Real-time monitoring</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
