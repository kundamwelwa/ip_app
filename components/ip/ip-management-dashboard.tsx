"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
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
  Network
} from "lucide-react";

// Types
interface IPAddress {
  id: string;
  address: string;
  subnet: string;
  gateway: string;
  dns: string[];
  status: "available" | "assigned" | "reserved" | "conflict";
  assignedTo?: string;
  equipmentId?: string;
  equipmentName?: string;
  equipmentType?: string;
  location?: string;
  assignedBy?: string;
  assignedAt?: Date;
  lastSeen?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IPAssignment {
  id: string;
  ipAddress: string;
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  location: string;
  assignedBy: string;
  assignedAt: Date;
  lastSeen: Date;
  status: "active" | "offline" | "conflict";
  notes?: string;
}

interface IPConflict {
  id: string;
  ipAddress: string;
  conflictingEquipment: string[];
  detectedAt: Date;
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "resolved";
  resolution?: string;
}

interface IPAuditLog {
  id: string;
  ipAddress: string;
  action: "assigned" | "unassigned" | "modified" | "conflict_detected" | "conflict_resolved";
  equipmentId?: string;
  equipmentName?: string;
  performedBy: string;
  performedAt: Date;
  details: string;
  oldValue?: string;
  newValue?: string;
}

export function IPManagementDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingIP, setEditingIP] = useState<IPAddress | null>(null);
  const [assigningIP, setAssigningIP] = useState<IPAddress | null>(null);

  // Mock data - In a real application, this would come from API calls
  const [ipAddresses, setIPAddresses] = useState<IPAddress[]>([
    {
      id: "IP001",
      address: "192.168.1.10",
      subnet: "192.168.1.0/24",
      gateway: "192.168.1.1",
      dns: ["8.8.8.8", "8.8.4.4"],
      status: "assigned",
      assignedTo: "Truck-001",
      equipmentId: "EQ001",
      equipmentName: "Mining Truck 001",
      equipmentType: "Truck",
      location: "Pit A",
      assignedBy: "Admin",
      assignedAt: new Date("2024-01-15"),
      lastSeen: new Date("2024-01-20"),
      notes: "Primary haul truck",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-20"),
    },
    {
      id: "IP002",
      address: "192.168.1.11",
      subnet: "192.168.1.0/24",
      gateway: "192.168.1.1",
      dns: ["8.8.8.8", "8.8.4.4"],
      status: "available",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      id: "IP003",
      address: "192.168.1.12",
      subnet: "192.168.1.0/24",
      gateway: "192.168.1.1",
      dns: ["8.8.8.8", "8.8.4.4"],
      status: "conflict",
      assignedTo: "Shovel-002",
      equipmentId: "EQ002",
      equipmentName: "Excavator 002",
      equipmentType: "Excavator",
      location: "Pit B",
      assignedBy: "Admin",
      assignedAt: new Date("2024-01-18"),
      lastSeen: new Date("2024-01-19"),
      notes: "IP conflict detected",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-19"),
    },
    {
      id: "IP004",
      address: "192.168.1.13",
      subnet: "192.168.1.0/24",
      gateway: "192.168.1.1",
      dns: ["8.8.8.8", "8.8.4.4"],
      status: "reserved",
      notes: "Reserved for new equipment",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
  ]);

  const [assignments, setAssignments] = useState<IPAssignment[]>([
    {
      id: "ASG001",
      ipAddress: "192.168.1.10",
      equipmentId: "EQ001",
      equipmentName: "Mining Truck 001",
      equipmentType: "Truck",
      location: "Pit A",
      assignedBy: "Admin",
      assignedAt: new Date("2024-01-15"),
      lastSeen: new Date("2024-01-20"),
      status: "active",
      notes: "Primary haul truck",
    },
    {
      id: "ASG002",
      ipAddress: "192.168.1.12",
      equipmentId: "EQ002",
      equipmentName: "Excavator 002",
      equipmentType: "Excavator",
      location: "Pit B",
      assignedBy: "Admin",
      assignedAt: new Date("2024-01-18"),
      lastSeen: new Date("2024-01-19"),
      status: "conflict",
      notes: "IP conflict detected",
    },
  ]);

  const [conflicts, setConflicts] = useState<IPConflict[]>([
    {
      id: "CFL001",
      ipAddress: "192.168.1.12",
      conflictingEquipment: ["Excavator 002", "Unknown Device"],
      detectedAt: new Date("2024-01-19"),
      severity: "high",
      status: "active",
    },
  ]);

  const [auditLogs, setAuditLogs] = useState<IPAuditLog[]>([
    {
      id: "AUD001",
      ipAddress: "192.168.1.10",
      action: "assigned",
      equipmentId: "EQ001",
      equipmentName: "Mining Truck 001",
      performedBy: "Admin",
      performedAt: new Date("2024-01-15"),
      details: "IP address assigned to Mining Truck 001",
    },
    {
      id: "AUD002",
      ipAddress: "192.168.1.12",
      action: "conflict_detected",
      equipmentId: "EQ002",
      equipmentName: "Excavator 002",
      performedBy: "System",
      performedAt: new Date("2024-01-19"),
      details: "IP conflict detected with unknown device",
    },
  ]);

  const [formData, setFormData] = useState({
    address: "",
    subnet: "",
    gateway: "",
    dns: "",
    notes: "",
  });

  const [assignmentFormData, setAssignmentFormData] = useState({
    equipmentId: "",
    equipmentName: "",
    equipmentType: "",
    location: "",
    notes: "",
  });

  // Statistics
  const totalIPs = ipAddresses.length;
  const assignedIPs = ipAddresses.filter(ip => ip.status === "assigned").length;
  const availableIPs = ipAddresses.filter(ip => ip.status === "available").length;
  const conflictIPs = ipAddresses.filter(ip => ip.status === "conflict").length;
  const reservedIPs = ipAddresses.filter(ip => ip.status === "reserved").length;

  const assignmentRate = totalIPs > 0 ? (assignedIPs / totalIPs) * 100 : 0;
  const conflictRate = totalIPs > 0 ? (conflictIPs / totalIPs) * 100 : 0;

  // Filter functions
  const filteredIPs = ipAddresses.filter(ip => {
    const matchesSearch = ip.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ip.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ip.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || ip.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "assigned":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "available":
        return <Wifi className="h-4 w-4 text-blue-500" />;
      case "conflict":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "reserved":
        return <Shield className="h-4 w-4 text-yellow-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      assigned: "default",
      available: "secondary",
      conflict: "destructive",
      reserved: "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleAddIP = () => {
    const newIP: IPAddress = {
      id: `IP${String(ipAddresses.length + 1).padStart(3, '0')}`,
      address: formData.address,
      subnet: formData.subnet,
      gateway: formData.gateway,
      dns: formData.dns.split(',').map(d => d.trim()),
      status: "available",
      notes: formData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setIPAddresses([...ipAddresses, newIP]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditIP = (ip: IPAddress) => {
    setEditingIP(ip);
    setFormData({
      address: ip.address,
      subnet: ip.subnet,
      gateway: ip.gateway,
      dns: ip.dns.join(', '),
      notes: ip.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateIP = () => {
    if (!editingIP) return;

    const updatedIPs = ipAddresses.map(ip => 
      ip.id === editingIP.id 
        ? { 
            ...ip, 
            ...formData, 
            dns: formData.dns.split(',').map(d => d.trim()),
            updatedAt: new Date() 
          }
        : ip
    );

    setIPAddresses(updatedIPs);
    setIsEditDialogOpen(false);
    setEditingIP(null);
    resetForm();
  };

  const handleAssignIP = (ip: IPAddress) => {
    setAssigningIP(ip);
    setAssignmentFormData({
      equipmentId: "",
      equipmentName: "",
      equipmentType: "",
      location: "",
      notes: "",
    });
    setIsAssignDialogOpen(true);
  };

  const handleConfirmAssignment = () => {
    if (!assigningIP) return;

    const newAssignment: IPAssignment = {
      id: `ASG${String(assignments.length + 1).padStart(3, '0')}`,
      ipAddress: assigningIP.address,
      equipmentId: assignmentFormData.equipmentId,
      equipmentName: assignmentFormData.equipmentName,
      equipmentType: assignmentFormData.equipmentType as "Truck" | "Excavator" | "Drill" | "Loader" | "Dozer" | "Shovel" | "Crusher" | "Conveyor",
      location: assignmentFormData.location,
      assignedBy: "Admin",
      assignedAt: new Date(),
      lastSeen: new Date(),
      status: "active",
      notes: assignmentFormData.notes,
    };

    const updatedIPs = ipAddresses.map(ip => 
      ip.id === assigningIP.id 
        ? { 
            ...ip, 
            status: "assigned" as const,
            assignedTo: assignmentFormData.equipmentName,
            equipmentId: assignmentFormData.equipmentId,
            equipmentName: assignmentFormData.equipmentName,
            equipmentType: assignmentFormData.equipmentType,
            location: assignmentFormData.location,
            assignedBy: "Admin",
            assignedAt: new Date(),
            lastSeen: new Date(),
            notes: assignmentFormData.notes,
            updatedAt: new Date()
          }
        : ip
    );

    setIPAddresses(updatedIPs);
    setAssignments([...assignments, newAssignment]);
    setIsAssignDialogOpen(false);
    setAssigningIP(null);
    resetAssignmentForm();
  };

  const handleUnassignIP = (ip: IPAddress) => {
    const updatedIPs = ipAddresses.map(item => 
      item.id === ip.id 
        ? { 
            ...item, 
            status: "available" as const,
            assignedTo: undefined,
            equipmentId: undefined,
            equipmentName: undefined,
            equipmentType: undefined,
            location: undefined,
            assignedBy: undefined,
            assignedAt: undefined,
            lastSeen: undefined,
            updatedAt: new Date()
          }
        : item
    );

    setIPAddresses(updatedIPs);
    setAssignments(assignments.filter(assignment => assignment.ipAddress !== ip.address));
  };

  const handleDeleteIP = (id: string) => {
    if (confirm("Are you sure you want to delete this IP address?")) {
      setIPAddresses(ipAddresses.filter(ip => ip.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      address: "",
      subnet: "",
      gateway: "",
      dns: "",
      notes: "",
    });
  };

  const resetAssignmentForm = () => {
    setAssignmentFormData({
      equipmentId: "",
      equipmentName: "",
      equipmentType: "",
      location: "",
      notes: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IP Management</h1>
          <p className="text-muted-foreground">
            Manage IP addresses, assignments, and network conflicts
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add IP Address
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total IP Addresses</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIPs}</div>
            <p className="text-xs text-muted-foreground">
              Network capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedIPs}</div>
            <p className="text-xs text-muted-foreground">
              {assignmentRate.toFixed(1)}% utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Wifi className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableIPs}</div>
            <p className="text-xs text-muted-foreground">
              Ready for assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conflicts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conflictIPs}</div>
            <p className="text-xs text-muted-foreground">
              {conflictRate.toFixed(1)}% conflict rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="addresses">IP Addresses</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>IP Address Distribution</CardTitle>
                <CardDescription>
                  Current status of all IP addresses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Assigned</span>
                    <span className="text-sm text-muted-foreground">{assignedIPs}</span>
                  </div>
                  <Progress value={assignmentRate} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Available</span>
                    <span className="text-sm text-muted-foreground">{availableIPs}</span>
                  </div>
                  <Progress value={(availableIPs / totalIPs) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conflicts</span>
                    <span className="text-sm text-muted-foreground">{conflictIPs}</span>
                  </div>
                  <Progress value={conflictRate} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Reserved</span>
                    <span className="text-sm text-muted-foreground">{reservedIPs}</span>
                  </div>
                  <Progress value={(reservedIPs / totalIPs) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest IP address changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {log.action === "assigned" && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {log.action === "conflict_detected" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        {log.action === "unassigned" && <XCircle className="h-4 w-4 text-gray-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {log.ipAddress} - {log.action.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.equipmentName} • {log.performedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* IP Addresses Tab */}
        <TabsContent value="addresses" className="space-y-4">
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
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="conflict">Conflict</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>IP Addresses</CardTitle>
              <CardDescription>
                Manage all IP addresses in the network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIPs.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell className="font-medium">{ip.address}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(ip.status)}
                          {getStatusBadge(ip.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ip.assignedTo ? (
                          <div>
                            <div className="font-medium">{ip.assignedTo}</div>
                            <div className="text-sm text-muted-foreground">{ip.equipmentType}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ip.location ? (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{ip.location}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ip.lastSeen ? (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{ip.lastSeen.toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {ip.status === "available" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignIP(ip)}
                            >
                              Assign
                            </Button>
                          )}
                          {ip.status === "assigned" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnassignIP(ip)}
                            >
                              Unassign
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditIP(ip)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteIP(ip.id)}
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
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IP Assignments</CardTitle>
              <CardDescription>
                Current IP address assignments to equipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.ipAddress}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.equipmentName}</div>
                          <div className="text-sm text-muted-foreground">ID: {assignment.equipmentId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{assignment.equipmentType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{assignment.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {assignment.status === "active" && <Activity className="h-4 w-4 text-green-500" />}
                          {assignment.status === "offline" && <WifiOff className="h-4 w-4 text-red-500" />}
                          {assignment.status === "conflict" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          <Badge variant={assignment.status === "active" ? "default" : "destructive"}>
                            {assignment.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{assignment.lastSeen.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
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
        </TabsContent>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IP Conflicts</CardTitle>
              <CardDescription>
                Detected IP address conflicts and their resolution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Conflicting Equipment</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts.map((conflict) => (
                    <TableRow key={conflict.id}>
                      <TableCell className="font-medium">{conflict.ipAddress}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {conflict.conflictingEquipment.map((equipment, index) => (
                            <div key={index} className="text-sm">{equipment}</div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          conflict.severity === "critical" ? "destructive" :
                          conflict.severity === "high" ? "destructive" :
                          conflict.severity === "medium" ? "secondary" : "outline"
                        }>
                          {conflict.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{conflict.detectedAt.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={conflict.status === "active" ? "destructive" : "default"}>
                          {conflict.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            Resolve
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
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

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                Complete history of IP address changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.ipAddress}</TableCell>
                      <TableCell>
                        <Badge variant={
                          log.action === "assigned" ? "default" :
                          log.action === "unassigned" ? "secondary" :
                          log.action === "conflict_detected" ? "destructive" : "outline"
                        }>
                          {log.action.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.equipmentName ? (
                          <div>
                            <div className="font-medium">{log.equipmentName}</div>
                            <div className="text-sm text-muted-foreground">ID: {log.equipmentId}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{log.performedBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{log.performedAt.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add IP Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add IP Address</DialogTitle>
            <DialogDescription>
              Add a new IP address to the network pool
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">IP Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="192.168.1.10"
                />
              </div>
              <div>
                <Label htmlFor="subnet">Subnet</Label>
                <Input
                  id="subnet"
                  value={formData.subnet}
                  onChange={(e) => setFormData({ ...formData, subnet: e.target.value })}
                  placeholder="192.168.1.0/24"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gateway">Gateway</Label>
                <Input
                  id="gateway"
                  value={formData.gateway}
                  onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                  placeholder="192.168.1.1"
                />
              </div>
              <div>
                <Label htmlFor="dns">DNS Servers</Label>
                <Input
                  id="dns"
                  value={formData.dns}
                  onChange={(e) => setFormData({ ...formData, dns: e.target.value })}
                  placeholder="8.8.8.8, 8.8.4.4"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this IP address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddIP}>Add IP Address</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit IP Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit IP Address</DialogTitle>
            <DialogDescription>
              Update IP address configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-address">IP Address</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="192.168.1.10"
                />
              </div>
              <div>
                <Label htmlFor="edit-subnet">Subnet</Label>
                <Input
                  id="edit-subnet"
                  value={formData.subnet}
                  onChange={(e) => setFormData({ ...formData, subnet: e.target.value })}
                  placeholder="192.168.1.0/24"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-gateway">Gateway</Label>
                <Input
                  id="edit-gateway"
                  value={formData.gateway}
                  onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                  placeholder="192.168.1.1"
                />
              </div>
              <div>
                <Label htmlFor="edit-dns">DNS Servers</Label>
                <Input
                  id="edit-dns"
                  value={formData.dns}
                  onChange={(e) => setFormData({ ...formData, dns: e.target.value })}
                  placeholder="8.8.8.8, 8.8.4.4"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this IP address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateIP}>Update IP Address</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign IP Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign IP Address</DialogTitle>
            <DialogDescription>
              Assign {assigningIP?.address} to equipment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equipment-id">Equipment ID</Label>
                <Input
                  id="equipment-id"
                  value={assignmentFormData.equipmentId}
                  onChange={(e) => setAssignmentFormData({ ...assignmentFormData, equipmentId: e.target.value })}
                  placeholder="EQ001"
                />
              </div>
              <div>
                <Label htmlFor="equipment-name">Equipment Name</Label>
                <Input
                  id="equipment-name"
                  value={assignmentFormData.equipmentName}
                  onChange={(e) => setAssignmentFormData({ ...assignmentFormData, equipmentName: e.target.value })}
                  placeholder="Mining Truck 001"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equipment-type">Equipment Type</Label>
                <Select
                  value={assignmentFormData.equipmentType}
                  onValueChange={(value) => setAssignmentFormData({ ...assignmentFormData, equipmentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
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
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={assignmentFormData.location}
                  onChange={(e) => setAssignmentFormData({ ...assignmentFormData, location: e.target.value })}
                  placeholder="Pit A"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="assignment-notes">Notes</Label>
              <Textarea
                id="assignment-notes"
                value={assignmentFormData.notes}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, notes: e.target.value })}
                placeholder="Additional notes about this assignment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAssignment}>Assign IP Address</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
