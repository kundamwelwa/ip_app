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
  Network,
  Link,
  Unlink,
  RefreshCw
} from "lucide-react";

// Types
interface Equipment {
  id: string;
  name: string;
  type: "Truck" | "Excavator" | "Drill" | "Loader" | "Dozer" | "Shovel" | "Crusher" | "Conveyor";
  model: string;
  manufacturer: string;
  serialNumber: string;
  status: "online" | "offline" | "maintenance";
  location: string;
  operator: string;
  lastSeen: Date;
  ipAddress?: string;
  macAddress?: string;
  notes?: string;
}

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

interface AssignmentRequest {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  location: string;
  requestedBy: string;
  requestedAt: Date;
  status: "pending" | "approved" | "rejected" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  reason: string;
  notes?: string;
  assignedIP?: string;
  assignedBy?: string;
  assignedAt?: Date;
}

export function IPAssignmentDashboard() {
  const [activeTab, setActiveTab] = useState("assignments");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedIP, setSelectedIP] = useState<IPAddress | null>(null);

  // Equipment data from API
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch equipment data from API
  useEffect(() => {
    fetchEquipmentData();
  }, []);

  const fetchEquipmentData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/equipment");
      if (!response.ok) {
        throw new Error("Failed to fetch equipment");
      }
      const data = await response.json();
      
      // Transform API data to match our interface
      const transformedEquipment = data.equipment.map((eq: any) => ({
        id: eq.id,
        name: eq.name,
        type: eq.type,
        model: eq.model || "",
        manufacturer: eq.manufacturer || "",
        serialNumber: eq.serialNumber || "",
        status: eq.status.toLowerCase(),
        location: eq.location || "",
        operator: eq.operator || "", // This should preserve the original operator
        lastSeen: new Date(eq.lastSeen || eq.updatedAt),
        ipAddress: eq.ipAssignments?.[0]?.ipAddress?.address,
        macAddress: eq.macAddress,
        notes: eq.notes
      }));
      
      setEquipment(transformedEquipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      // Fallback to mock data if API fails
      setEquipment([
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
      lastSeen: new Date("2024-01-20"),
      ipAddress: "192.168.1.10",
      macAddress: "00:1B:44:11:3A:B7",
      notes: "Primary haul truck",
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
      lastSeen: new Date("2024-01-19"),
      notes: "Maintenance scheduled",
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
      lastSeen: new Date("2024-01-20"),
      ipAddress: "192.168.1.15",
      macAddress: "00:1B:44:11:3A:C8",
      notes: "Blast hole drilling",
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
      lastSeen: new Date("2024-01-18"),
      notes: "Scheduled maintenance",
    },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const [ipAddresses, setIPAddresses] = useState<IPAddress[]>([
    {
      id: "IP001",
      address: "192.168.1.10",
      subnet: "192.168.1.0/24",
      gateway: "192.168.1.1",
      dns: ["8.8.8.8", "8.8.4.4"],
      status: "assigned",
      assignedTo: "Mining Truck 001",
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
      status: "available",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
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

  const [assignmentRequests, setAssignmentRequests] = useState<AssignmentRequest[]>([
    {
      id: "REQ001",
      equipmentId: "EQ002",
      equipmentName: "Excavator 002",
      equipmentType: "Excavator",
      location: "Pit B",
      requestedBy: "Jane Doe",
      requestedAt: new Date("2024-01-19"),
      status: "pending",
      priority: "high",
      reason: "Equipment needs IP for remote monitoring",
      notes: "Critical for safety monitoring",
    },
    {
      id: "REQ002",
      equipmentId: "EQ004",
      equipmentName: "Loader 004",
      equipmentType: "Loader",
      location: "Pit A",
      requestedBy: "Sarah Wilson",
      requestedAt: new Date("2024-01-18"),
      status: "approved",
      priority: "medium",
      reason: "Maintenance completion - IP needed",
      notes: "Ready for IP assignment",
      assignedIP: "192.168.1.14",
      assignedBy: "Admin",
      assignedAt: new Date("2024-01-18"),
    },
  ]);

  const [formData, setFormData] = useState({
    equipmentId: "",
    equipmentName: "",
    equipmentType: "",
    location: "",
    reason: "",
    priority: "medium",
    notes: "",
  });

  // Statistics
  const totalEquipment = equipment.length;
  const onlineEquipment = equipment.filter(eq => eq.status === "online").length;
  const offlineEquipment = equipment.filter(eq => eq.status === "offline").length;
  const maintenanceEquipment = equipment.filter(eq => eq.status === "maintenance").length;
  const assignedEquipment = equipment.filter(eq => eq.ipAddress).length;
  const unassignedEquipment = equipment.filter(eq => !eq.ipAddress).length;

  const totalIPs = ipAddresses.length;
  const availableIPs = ipAddresses.filter(ip => ip.status === "available").length;
  const assignedIPs = ipAddresses.filter(ip => ip.status === "assigned").length;
  const reservedIPs = ipAddresses.filter(ip => ip.status === "reserved").length;

  const pendingRequests = assignmentRequests.filter(req => req.status === "pending").length;
  const approvedRequests = assignmentRequests.filter(req => req.status === "approved").length;
  const completedRequests = assignmentRequests.filter(req => req.status === "completed").length;

  // Filter functions
  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.operator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || eq.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const availableIPsList = ipAddresses.filter(ip => ip.status === "available");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case "maintenance":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      online: "default",
      offline: "destructive",
      maintenance: "secondary",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: "destructive",
      high: "destructive",
      medium: "secondary",
      low: "outline",
    } as const;

    return (
      <Badge variant={variants[priority as keyof typeof variants] || "outline"}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const handleAssignIP = (equipment: Equipment, ip: IPAddress) => {
    setSelectedEquipment(equipment);
    setSelectedIP(ip);
    setIsAssignDialogOpen(true);
  };

  const handleConfirmAssignment = () => {
    if (!selectedEquipment || !selectedIP) return;

    // Update equipment with IP address
    const updatedEquipment = equipment.map(eq => 
      eq.id === selectedEquipment.id 
        ? { ...eq, ipAddress: selectedIP.address, macAddress: "00:1B:44:11:3A:B7" }
        : eq
    );

    // Update IP address status
    const updatedIPs = ipAddresses.map(ip => 
      ip.id === selectedIP.id 
        ? { 
            ...ip, 
            status: "assigned" as const,
            assignedTo: selectedEquipment.name,
            equipmentId: selectedEquipment.id,
            equipmentName: selectedEquipment.name,
            equipmentType: selectedEquipment.type,
            location: selectedEquipment.location,
            assignedBy: "Admin",
            assignedAt: new Date(),
            lastSeen: new Date(),
            updatedAt: new Date()
          }
        : ip
    );

    setEquipment(updatedEquipment);
    setIPAddresses(updatedIPs);
    setIsAssignDialogOpen(false);
    setSelectedEquipment(null);
    setSelectedIP(null);
  };

  const handleUnassignIP = (equipmentItem: Equipment) => {
    if (confirm(`Are you sure you want to unassign IP address from ${equipmentItem.name}?`)) {
      // Update equipment to remove IP address
      const updatedEquipment = equipment.map(eq => 
        eq.id === equipmentItem.id 
          ? { ...eq, ipAddress: undefined, macAddress: undefined }
          : eq
      );

      // Update IP address status
      const updatedIPs = ipAddresses.map(ip => 
        ip.assignedTo === equipmentItem.name 
          ? { 
              ...ip, 
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
          : ip
      );

      setEquipment(updatedEquipment);
      setIPAddresses(updatedIPs);
    }
  };

  const handleRequestAssignment = () => {
    const newRequest: AssignmentRequest = {
      id: `REQ${String(assignmentRequests.length + 1).padStart(3, '0')}`,
      equipmentId: formData.equipmentId,
      equipmentName: formData.equipmentName,
      equipmentType: formData.equipmentType as "Truck" | "Excavator" | "Drill" | "Loader" | "Dozer" | "Shovel" | "Crusher" | "Conveyor",
      location: formData.location,
      requestedBy: "Current User",
      requestedAt: new Date(),
      status: "pending",
      priority: formData.priority as "low" | "medium" | "high" | "urgent",
      reason: formData.reason,
      notes: formData.notes,
    };

    setAssignmentRequests([...assignmentRequests, newRequest]);
    setIsRequestDialogOpen(false);
    resetForm();
  };

  const handleApproveRequest = (requestId: string) => {
    const updatedRequests = assignmentRequests.map(req => 
      req.id === requestId 
        ? { ...req, status: "approved" as const, assignedBy: "Admin", assignedAt: new Date() }
        : req
    );
    setAssignmentRequests(updatedRequests);
  };

  const handleRejectRequest = (requestId: string) => {
    const updatedRequests = assignmentRequests.map(req => 
      req.id === requestId 
        ? { ...req, status: "rejected" as const }
        : req
    );
    setAssignmentRequests(updatedRequests);
  };

  const resetForm = () => {
    setFormData({
      equipmentId: "",
      equipmentName: "",
      equipmentType: "",
      location: "",
      reason: "",
      priority: "medium",
      notes: "",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading equipment data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IP Assignment</h1>
          <p className="text-muted-foreground">
            Assign IP addresses to equipment and manage assignments
          </p>
        </div>
        <Button onClick={() => setIsRequestDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Request Assignment
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Link className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedEquipment}</div>
            <p className="text-xs text-muted-foreground">
              {totalEquipment > 0 ? ((assignedEquipment / totalEquipment) * 100).toFixed(1) : 0}% assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available IPs</CardTitle>
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
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="available">Available IPs</TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Assignments</CardTitle>
              <CardDescription>
                Equipment with assigned IP addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.filter(eq => eq.ipAddress).map((eq) => (
                    <TableRow key={eq.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{eq.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {eq.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{eq.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{eq.ipAddress}</TableCell>
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
                            onClick={() => handleUnassignIP(eq)}
                          >
                            <Unlink className="h-3 w-3" />
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
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Equipment</CardTitle>
              <CardDescription>
                All equipment in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Operator</TableHead>
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
                        <Badge variant="outline">{eq.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(eq.status)}
                          {getStatusBadge(eq.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {eq.ipAddress ? (
                          <div className="flex items-center space-x-1">
                            <Network className="h-3 w-3" />
                            <span className="font-medium">{eq.ipAddress}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{eq.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>{eq.operator}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {!eq.ipAddress && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const availableIP = availableIPsList[0];
                                if (availableIP) {
                                  handleAssignIP(eq, availableIP);
                                }
                              }}
                            >
                              <Link className="h-3 w-3" />
                            </Button>
                          )}
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

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Requests</CardTitle>
              <CardDescription>
                IP assignment requests awaiting approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignmentRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.equipmentName}</div>
                          <div className="text-sm text-muted-foreground">ID: {request.equipmentId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(request.priority)}
                      </TableCell>
                      <TableCell>{request.requestedBy}</TableCell>
                      <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                      <TableCell>
                        <Badge variant={
                          request.status === "pending" ? "secondary" :
                          request.status === "approved" ? "default" :
                          request.status === "rejected" ? "destructive" : "outline"
                        }>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{request.requestedAt.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {request.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveRequest(request.id)}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectRequest(request.id)}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
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

        {/* Available IPs Tab */}
        <TabsContent value="available" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available IP Addresses</CardTitle>
              <CardDescription>
                IP addresses available for assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Subnet</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>DNS</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableIPsList.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell className="font-medium">{ip.address}</TableCell>
                      <TableCell>{ip.subnet}</TableCell>
                      <TableCell>{ip.gateway}</TableCell>
                      <TableCell>{ip.dns.join(', ')}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Available</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{ip.createdAt.toLocaleDateString()}</span>
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
      </Tabs>

      {/* Assign IP Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign IP Address</DialogTitle>
            <DialogDescription>
              Assign {selectedIP?.address} to {selectedEquipment?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Equipment</Label>
                <div className="p-3 border rounded-md bg-muted">
                  <div className="font-medium">{selectedEquipment?.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedEquipment?.type} • {selectedEquipment?.location}</div>
                </div>
              </div>
              <div>
                <Label>IP Address</Label>
                <div className="p-3 border rounded-md bg-muted">
                  <div className="font-medium">{selectedIP?.address}</div>
                  <div className="text-sm text-muted-foreground">{selectedIP?.subnet}</div>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="assignment-notes">Assignment Notes</Label>
              <Textarea
                id="assignment-notes"
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

      {/* Request Assignment Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request IP Assignment</DialogTitle>
            <DialogDescription>
              Request an IP address assignment for equipment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="req-equipment-id">Equipment ID</Label>
                <Input
                  id="req-equipment-id"
                  value={formData.equipmentId}
                  onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                  placeholder="EQ001"
                />
              </div>
              <div>
                <Label htmlFor="req-equipment-name">Equipment Name</Label>
                <Input
                  id="req-equipment-name"
                  value={formData.equipmentName}
                  onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
                  placeholder="Mining Truck 001"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="req-equipment-type">Equipment Type</Label>
                <Select
                  value={formData.equipmentType}
                  onValueChange={(value) => setFormData({ ...formData, equipmentType: value })}
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
                <Label htmlFor="req-location">Location</Label>
                <Input
                  id="req-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Pit A"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="req-priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="req-reason">Reason</Label>
                <Input
                  id="req-reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Why is IP needed?"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="req-notes">Notes</Label>
              <Textarea
                id="req-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this request"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestAssignment}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
