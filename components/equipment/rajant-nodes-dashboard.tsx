"use client";

import { useState, useEffect } from "react";
import {
  Router,
  Plus,
  Edit,
  Trash2,
  Search,
  MapPin,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Signal,
  TrendingUp,
  TrendingDown,
  Minus,
  Network,
  Zap,
  Timer,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useEquipmentMonitoring } from "@/hooks/use-equipment-monitoring";
import { getTimeAgo, calculateUptime, formatDateForDisplay } from "@/lib/time-utils";
import { getSignalStrengthColor, getUptimeColor } from "@/lib/real-time-data";

// Types for Rajant node data (equipment with type RAJANT_NODE)
interface RajantNode {
  id: string;
  name: string;
  type: string;
  model: string | null;
  manufacturer: string | null;
  serialNumber: string | null;
  macAddress: string | null;
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE" | "UNKNOWN";
  location: string | null;
  operator: string | null;
  description: string | null;
  notes: string | null;
  lastSeen: Date | null;
  meshStrength: number | null;
  nodeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  ipAssignments?: Array<{
    id: string;
    isActive: boolean;
    assignedAt: Date;
    ipAddress: {
      id: string;
      address: string;
      status: string;
    };
  }>;
}

interface NodeFormData {
  name: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  macAddress: string;
  location: string;
  operator: string;
  nodeId: string;
  notes: string;
}

export function RajantNodesDashboard() {
  const [nodes, setNodes] = useState<RajantNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<RajantNode | null>(null);
  const [formData, setFormData] = useState<NodeFormData>({
    name: "",
    model: "",
    manufacturer: "",
    serialNumber: "",
    macAddress: "",
    location: "",
    operator: "",
    nodeId: "",
    notes: "",
  });

  // Equipment monitoring hook
  const {
    equipmentStatuses,
    monitoringStatus,
    checkAllEquipment,
    startMonitoring,
    stopMonitoring,
  } = useEquipmentMonitoring();

  // Rajant node models (BreadCrumb series)
  const nodeModels = [
    "BreadCrumb 2x2", "BreadCrumb 3x3", "BreadCrumb 4x4", "BreadCrumb 6x6",
    "BreadCrumb 8x8", "BreadCrumb 12x12", "BreadCrumb 16x16", "BreadCrumb 24x24"
  ];

  // Rajant manufacturers
  const manufacturers = ["Rajant Corporation"];

  // Fetch Rajant nodes from equipment API
  const fetchNodesData = async (useRealTime = false) => {
    try {
      setError(null);
      const url = `/api/equipment?type=RAJANT_NODE&limit=100${useRealTime ? '&realTime=true' : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch Rajant nodes");
      }
      
      const data = await response.json();
      const nodesData: RajantNode[] = data.equipment.map((item: any) => ({
        ...item,
        lastSeen: item.lastSeen ? new Date(item.lastSeen) : null,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));
      
      setNodes(nodesData);
    } catch (error) {
      console.error("Error fetching nodes:", error);
      setError("Failed to load Rajant nodes. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchNodesData();
    };
    
    loadData();
  }, []);

  // Handle full refresh with real-time check
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await checkAllEquipment();
    await fetchNodesData(true);
  };

  // Get real-time status for a node
  const getRealTimeStatus = (nodeId: string) => {
    return equipmentStatuses.find(status => status.equipmentId === nodeId);
  };

  // Get accurate online count
  const getAccurateOnlineCount = () => {
    return nodes.filter(node => {
      const realTimeStatus = getRealTimeStatus(node.id);
      return realTimeStatus ? realTimeStatus.isOnline : node.status === "ONLINE";
    }).length;
  };

  // Get accurate offline count
  const getAccurateOfflineCount = () => {
    return nodes.filter(node => {
      const realTimeStatus = getRealTimeStatus(node.id);
      if (realTimeStatus) {
        return !realTimeStatus.isOnline && node.status !== "MAINTENANCE";
      }
      return node.status === "OFFLINE";
    }).length;
  };

  // Get IP assignment for a node
  const getIPAssignment = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.ipAssignments || node.ipAssignments.length === 0) {
      return "Not assigned";
    }
    const activeAssignment = node.ipAssignments.find(assignment => assignment.isActive);
    return activeAssignment ? activeAssignment.ipAddress.address : "Not assigned";
  };

  // Helper functions for status display
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
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Filter nodes based on search and status
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (node.nodeId && node.nodeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (node.location && node.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Get real-time status for filtering
    const realTimeStatus = getRealTimeStatus(node.id);
    const currentStatus = realTimeStatus 
      ? (realTimeStatus.isOnline ? "ONLINE" : "OFFLINE")
      : node.status;
    
    const matchesStatus = filterStatus === "all" || currentStatus.toUpperCase() === filterStatus.toUpperCase();
    
    return matchesSearch && matchesStatus;
  });

  // Add new Rajant node using equipment API
  const handleAddNode = async () => {
    try {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: "RAJANT_NODE",
          model: formData.model,
          manufacturer: formData.manufacturer || "Rajant Corporation",
          serialNumber: formData.serialNumber,
          macAddress: formData.macAddress,
          location: formData.location,
          operator: formData.operator,
          nodeId: formData.nodeId,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create Rajant node");
      }

      // Refresh nodes list
      await fetchNodesData();
      setIsAddDialogOpen(false);
      resetForm();
      alert("Rajant node added successfully!");
    } catch (error) {
      console.error("Error adding node:", error);
      alert("Failed to add Rajant node. Please try again.");
    }
  };

  // Edit node - populate form
  const handleEditNode = (node: RajantNode) => {
    setEditingNode(node);
    setFormData({
      name: node.name,
      model: node.model || "",
      manufacturer: node.manufacturer || "Rajant Corporation",
      serialNumber: node.serialNumber || "",
      macAddress: node.macAddress || "",
      location: node.location || "",
      operator: node.operator || "",
      nodeId: node.nodeId || "",
      notes: node.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  // Update node using equipment API
  const handleUpdateNode = async () => {
    if (!editingNode) return;

    try {
      const response = await fetch(`/api/equipment/${editingNode.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: "RAJANT_NODE",
          model: formData.model,
          manufacturer: formData.manufacturer,
          serialNumber: formData.serialNumber,
          macAddress: formData.macAddress,
          location: formData.location,
          operator: formData.operator,
          nodeId: formData.nodeId,
          notes: formData.notes,
          status: editingNode.status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update Rajant node");
      }

      // Refresh nodes list
      await fetchNodesData();
      setIsEditDialogOpen(false);
      setEditingNode(null);
      resetForm();
      alert("Rajant node updated successfully!");
    } catch (error) {
      console.error("Error updating node:", error);
      alert("Failed to update Rajant node. Please try again.");
    }
  };

  // Delete node using equipment API
  const handleDeleteNode = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Rajant node? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/equipment/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete Rajant node");
      }

      // Refresh nodes list
      await fetchNodesData();
      alert("Rajant node deleted successfully!");
    } catch (error) {
      console.error("Error deleting node:", error);
      alert(error instanceof Error ? error.message : "Failed to delete Rajant node. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      model: "",
      manufacturer: "",
      serialNumber: "",
      macAddress: "",
      location: "",
      operator: "",
      nodeId: "",
      notes: "",
    });
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
            <h1 className="text-3xl font-bold tracking-tight">Rajant Nodes</h1>
            <p className="text-muted-foreground">
              Monitor and manage Rajant mesh network nodes
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading nodes data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Rajant Nodes</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage Rajant mesh network nodes
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Real-time monitoring controls */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefreshAll}
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
                  <WifiOff className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Stop</span>
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Start</span>
                </>
              )}
            </Button>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Node</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Rajant Node</DialogTitle>
                <DialogDescription>
                  Add a new Rajant mesh network node to the system.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Node Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Haul Truck Node"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Node Model</Label>
                    <Select value={formData.model} onValueChange={(value) => setFormData({...formData, model: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {nodeModels.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                      placeholder="e.g., Rajant Corporation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                      placeholder="e.g., RAJ-2024-001"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="macAddress">MAC Address</Label>
                    <Input
                      id="macAddress"
                      value={formData.macAddress}
                      onChange={(e) => setFormData({...formData, macAddress: e.target.value})}
                      placeholder="e.g., 00:1B:44:11:3A:B7"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nodeId">Node ID</Label>
                    <Input
                      id="nodeId"
                      value={formData.nodeId}
                      onChange={(e) => setFormData({...formData, nodeId: e.target.value})}
                      placeholder="e.g., BreadCrumb-LX"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g., Pit A - Level 3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="operator">Operator</Label>
                    <Input
                      id="operator"
                      value={formData.operator}
                      onChange={(e) => setFormData({...formData, operator: e.target.value})}
                      placeholder="e.g., John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes about the node..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddNode}>
                  Add Node
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Nodes Overview Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">Total Nodes</CardTitle>
            <Router className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="text-xl sm:text-2xl font-bold">{nodes.length}</div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Rajant mesh nodes
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
              {getAccurateOnlineCount()}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {nodes.length > 0 ? Math.round((getAccurateOnlineCount() / nodes.length) * 100) : 0}% uptime
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
              {getAccurateOfflineCount()}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">Monitoring</CardTitle>
            <Activity className="h-4 w-4 text-blue-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {monitoringStatus.isRunning ? "ON" : "OFF"}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Real-time status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Nodes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rajant Nodes</CardTitle>
          <CardDescription>
            Real-time status and performance of all Rajant mesh network nodes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="degraded">Degraded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Node ID</TableHead>
                  <TableHead className="min-w-[150px]">Name</TableHead>
                  <TableHead className="min-w-[120px]">Model</TableHead>
                  <TableHead className="min-w-[140px]">IP Address</TableHead>
                  <TableHead className="min-w-[120px]">Real-time Status</TableHead>
                  <TableHead className="min-w-[130px]">Mesh Strength</TableHead>
                  <TableHead className="min-w-[140px]">Last Seen</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNodes.map((node) => {
                  const realTimeStatus = getRealTimeStatus(node.id);
                  const currentStatus = realTimeStatus 
                    ? (realTimeStatus.isOnline ? "ONLINE" : "OFFLINE")
                    : node.status;
                  const responseTime = realTimeStatus?.responseTime;
                  const ipAddress = getIPAssignment(node.id);
                  const uptime = calculateUptime(node.lastSeen);
                  const timeAgo = getTimeAgo(node.lastSeen);
                  
                  return (
                    <TableRow key={node.id}>
                      <TableCell className="font-medium">{node.nodeId || node.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Router className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{node.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{node.location || "No location"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="truncate">{node.model || "N/A"}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{ipAddress}</TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <Badge className={getStatusColor(currentStatus)}>
                            {getStatusIcon(currentStatus)}
                            <span className="ml-1 capitalize">{currentStatus}</span>
                          </Badge>
                          {responseTime && (
                            <span className="text-xs text-muted-foreground">
                              {responseTime}ms
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16">
                            <Progress value={node.meshStrength || 0} className="h-2" />
                          </div>
                          <span className={`text-sm ${getSignalStrengthColor(node.meshStrength || 0)}`}>
                            {node.meshStrength || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{formatDateForDisplay(node.lastSeen, 'short')}</div>
                          <div className={`text-xs ${realTimeStatus?.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                            {timeAgo.fullText}
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <span className="text-xs text-muted-foreground">Uptime:</span>
                            <span className={`text-xs font-medium ${getUptimeColor(uptime)}`}>
                              {uptime.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditNode(node)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteNode(node.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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

      {/* Edit Node Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Rajant Node</DialogTitle>
            <DialogDescription>
              Update node information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Node Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-model">Node Model</Label>
                <Select value={formData.model} onValueChange={(value) => setFormData({...formData, model: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeModels.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-manufacturer">Manufacturer</Label>
                <Input
                  id="edit-manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-serialNumber">Serial Number</Label>
                <Input
                  id="edit-serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-macAddress">MAC Address</Label>
                <Input
                  id="edit-macAddress"
                  value={formData.macAddress}
                  onChange={(e) => setFormData({...formData, macAddress: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nodeId">Node ID</Label>
                <Input
                  id="edit-nodeId"
                  value={formData.nodeId}
                  onChange={(e) => setFormData({...formData, nodeId: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-operator">Operator</Label>
                <Input
                  id="edit-operator"
                  value={formData.operator}
                  onChange={(e) => setFormData({...formData, operator: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateNode}>
              Update Node
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
