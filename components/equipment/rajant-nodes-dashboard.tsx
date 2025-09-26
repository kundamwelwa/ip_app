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

// Types for Rajant node data
interface RajantNode {
  id: string;
  name: string;
  model: string;
  firmwareVersion: string;
  ipAddress: string;
  macAddress: string;
  status: "online" | "offline" | "maintenance" | "degraded";
  location: string;
  equipmentId: string;
  signalStrength: number;
  meshConnections: number;
  dataRate: number;
  latency: number;
  temperature: number;
  uptime: number;
  lastSeen: Date;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NodeFormData {
  name: string;
  model: string;
  firmwareVersion: string;
  ipAddress: string;
  macAddress: string;
  location: string;
  equipmentId: string;
  notes: string;
}

export function RajantNodesDashboard() {
  const [nodes, setNodes] = useState<RajantNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<RajantNode | null>(null);
  const [formData, setFormData] = useState<NodeFormData>({
    name: "",
    model: "",
    firmwareVersion: "",
    ipAddress: "",
    macAddress: "",
    location: "",
    equipmentId: "",
    notes: "",
  });

  // Rajant node models
  const nodeModels = [
    "BreadCrumb 2x2", "BreadCrumb 3x3", "BreadCrumb 4x4", "BreadCrumb 6x6",
    "BreadCrumb 8x8", "BreadCrumb 12x12", "BreadCrumb 16x16", "BreadCrumb 24x24"
  ];

  // Simulate real-time data fetching
  useEffect(() => {
    const fetchNodesData = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const nodesData: RajantNode[] = [
          {
            id: "RAJ-001",
            name: "Haul Truck Node",
            model: "BreadCrumb 4x4",
            firmwareVersion: "3.2.1.4",
            ipAddress: "192.168.1.100",
            macAddress: "00:1B:44:11:3A:B7",
            status: "online",
            location: "Pit A - Level 3",
            equipmentId: "EQ001",
            signalStrength: 85,
            meshConnections: 3,
            dataRate: 54,
            latency: 12,
            temperature: 45,
            uptime: 99.8,
            lastSeen: new Date(),
            notes: "Excellent signal strength, stable connections",
            createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
          {
            id: "RAJ-002",
            name: "Excavator Node",
            model: "BreadCrumb 3x3",
            firmwareVersion: "3.2.1.4",
            ipAddress: "192.168.1.101",
            macAddress: "00:1B:44:11:3A:B8",
            status: "online",
            location: "Pit A - Level 2",
            equipmentId: "EQ002",
            signalStrength: 92,
            meshConnections: 4,
            dataRate: 48,
            latency: 8,
            temperature: 42,
            uptime: 99.9,
            lastSeen: new Date(),
            notes: "High performance node, optimal positioning",
            createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
          {
            id: "RAJ-003",
            name: "Drill Node",
            model: "BreadCrumb 6x6",
            firmwareVersion: "3.1.8.2",
            ipAddress: "192.168.1.102",
            macAddress: "00:1B:44:11:3A:B9",
            status: "offline",
            location: "Pit B - Level 1",
            equipmentId: "EQ003",
            signalStrength: 0,
            meshConnections: 0,
            dataRate: 0,
            latency: 0,
            temperature: 0,
            uptime: 0,
            lastSeen: new Date(Date.now() - 15 * 60 * 1000),
            notes: "Node offline - equipment maintenance required",
            createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 15 * 60 * 1000),
          },
          {
            id: "RAJ-004",
            name: "Loader Node",
            model: "BreadCrumb 4x4",
            firmwareVersion: "3.2.1.4",
            ipAddress: "192.168.1.103",
            macAddress: "00:1B:44:11:3A:BA",
            status: "degraded",
            location: "Maintenance Bay",
            equipmentId: "EQ004",
            signalStrength: 45,
            meshConnections: 1,
            dataRate: 12,
            latency: 25,
            temperature: 55,
            uptime: 98.5,
            lastSeen: new Date(Date.now() - 5 * 60 * 1000),
            notes: "Degraded performance - firmware update recommended",
            createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
          {
            id: "RAJ-005",
            name: "Dozer Node",
            model: "BreadCrumb 3x3",
            firmwareVersion: "3.2.1.4",
            ipAddress: "192.168.1.104",
            macAddress: "00:1B:44:11:3A:BB",
            status: "online",
            location: "Pit C - Level 4",
            equipmentId: "EQ005",
            signalStrength: 78,
            meshConnections: 2,
            dataRate: 36,
            latency: 15,
            temperature: 48,
            uptime: 99.2,
            lastSeen: new Date(),
            notes: "Stable operation, good mesh connectivity",
            createdAt: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
        ];

        setNodes(nodesData);
      } catch (error) {
        console.error("Failed to fetch nodes data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNodesData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchNodesData, 30000);
    
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
      case "maintenance":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSignalStrengthColor = (strength: number) => {
    if (strength >= 80) return "text-green-600";
    if (strength >= 60) return "text-yellow-600";
    if (strength >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getTemperatureColor = (temp: number) => {
    if (temp <= 50) return "text-green-600";
    if (temp <= 60) return "text-yellow-600";
    if (temp <= 70) return "text-orange-600";
    return "text-red-600";
  };

  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.equipmentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || node.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddNode = () => {
    const newNode: RajantNode = {
      id: `RAJ-${String(nodes.length + 1).padStart(3, '0')}`,
      name: formData.name,
      model: formData.model,
      firmwareVersion: formData.firmwareVersion,
      ipAddress: formData.ipAddress,
      macAddress: formData.macAddress,
      status: "online",
      location: formData.location,
      equipmentId: formData.equipmentId,
      signalStrength: 85,
      meshConnections: 2,
      dataRate: 36,
      latency: 15,
      temperature: 45,
      uptime: 100,
      lastSeen: new Date(),
      notes: formData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setNodes([...nodes, newNode]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditNode = (node: RajantNode) => {
    setEditingNode(node);
    setFormData({
      name: node.name,
      model: node.model,
      firmwareVersion: node.firmwareVersion,
      ipAddress: node.ipAddress,
      macAddress: node.macAddress,
      location: node.location,
      equipmentId: node.equipmentId,
      notes: node.notes,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateNode = () => {
    if (!editingNode) return;

    const updatedNodes = nodes.map(node => 
      node.id === editingNode.id 
        ? { ...node, ...formData, updatedAt: new Date() }
        : node
    );

    setNodes(updatedNodes);
    setIsEditDialogOpen(false);
    setEditingNode(null);
    resetForm();
  };

  const handleDeleteNode = (id: string) => {
    if (confirm("Are you sure you want to delete this node?")) {
      setNodes(nodes.filter(node => node.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      model: "",
      firmwareVersion: "",
      ipAddress: "",
      macAddress: "",
      location: "",
      equipmentId: "",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rajant Nodes</h1>
          <p className="text-muted-foreground">
            Monitor and manage Rajant mesh network nodes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Node
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
                    <Label htmlFor="firmwareVersion">Firmware Version</Label>
                    <Input
                      id="firmwareVersion"
                      value={formData.firmwareVersion}
                      onChange={(e) => setFormData({...formData, firmwareVersion: e.target.value})}
                      placeholder="e.g., 3.2.1.4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ipAddress">IP Address</Label>
                    <Input
                      id="ipAddress"
                      value={formData.ipAddress}
                      onChange={(e) => setFormData({...formData, ipAddress: e.target.value})}
                      placeholder="e.g., 192.168.1.100"
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
                    <Label htmlFor="equipmentId">Equipment ID</Label>
                    <Input
                      id="equipmentId"
                      value={formData.equipmentId}
                      onChange={(e) => setFormData({...formData, equipmentId: e.target.value})}
                      placeholder="e.g., EQ001"
                    />
                  </div>
                </div>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
            <Router className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nodes.length}</div>
            <p className="text-xs text-muted-foreground">
              Active Rajant nodes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Nodes</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {nodes.filter(n => n.status === "online").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((nodes.filter(n => n.status === "online").length / nodes.length) * 100)}% uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Signal</CardTitle>
            <Signal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(nodes.filter(n => n.status === "online").reduce((sum, n) => sum + n.signalStrength, 0) / nodes.filter(n => n.status === "online").length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Signal strength
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesh Connections</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nodes.reduce((sum, n) => sum + n.meshConnections, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total connections
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Node ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Signal Strength</TableHead>
                <TableHead>Temperature</TableHead>
                <TableHead>Mesh Connections</TableHead>
                <TableHead>Data Rate</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNodes.map((node) => (
                <TableRow key={node.id}>
                  <TableCell className="font-medium">{node.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Router className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{node.name}</div>
                        <div className="text-sm text-muted-foreground">{node.equipmentId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{node.model}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{node.ipAddress}</TableCell>
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
                      <span className={`text-sm ${getSignalStrengthColor(node.signalStrength)}`}>
                        {node.signalStrength}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${getTemperatureColor(node.temperature)}`}>
                      {node.temperature}°C
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{node.meshConnections}</TableCell>
                  <TableCell className="text-sm">{node.dataRate} Mbps</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatLastSeen(node.lastSeen)}
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
              ))}
            </TableBody>
          </Table>
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
                <Label htmlFor="edit-firmwareVersion">Firmware Version</Label>
                <Input
                  id="edit-firmwareVersion"
                  value={formData.firmwareVersion}
                  onChange={(e) => setFormData({...formData, firmwareVersion: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ipAddress">IP Address</Label>
                <Input
                  id="edit-ipAddress"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({...formData, ipAddress: e.target.value})}
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
                <Label htmlFor="edit-equipmentId">Equipment ID</Label>
                <Input
                  id="edit-equipmentId"
                  value={formData.equipmentId}
                  onChange={(e) => setFormData({...formData, equipmentId: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
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
