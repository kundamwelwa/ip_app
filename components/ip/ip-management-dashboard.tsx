"use client";

import { useState, useEffect } from "react";
import { 
  Loader2, 
  RefreshCw, 
  Save, 
  Lock, 
  FileText, 
  Network, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Activity,
  Wifi,
  WifiOff,
  Shield,
  Server,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Filter,
} from "lucide-react";
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
import { EquipmentSelectionDialog } from "@/components/ip/equipment-selection-dialog";
import { Toast } from "@/components/ui/toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { useConfirmation } from "@/hooks/use-confirmation";

// Types
interface IPAddress {
  id: string;
  address: string;
  subnet: string;
  gateway: string | null;
  dns: string | null;
  status: "AVAILABLE" | "ASSIGNED" | "RESERVED" | "OFFLINE";
  isReserved?: boolean;
  assignedTo?: string;
  equipmentId?: string;
  equipmentName?: string;
  equipmentType?: string;
  location?: string;
  assignedBy?: string;
  assignedAt?: string | Date;
  lastSeen?: string | Date;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  assignments?: Array<{
    id: string;
    equipment?: {
      id: string;
      name: string;
      type: string;
      location: string | null;
    };
    user?: {
      firstName: string;
      lastName: string;
    };
    assignedAt: string;
    isActive: boolean;
  }>;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [equipmentList, setEquipmentList] = useState<Array<{ id: string; name: string; type: string }>>([]);

  // Toast and Confirmation hooks
  const { toast, hideToast, showSuccess, showError, showWarning } = useToast();
  const { confirmation, showConfirmation, hideConfirmation, confirm } = useConfirmation();

  // Real data from API
  const [ipAddresses, setIPAddresses] = useState<IPAddress[]>([]);

  const [assignments, setAssignments] = useState<IPAssignment[]>([]);
  
  // Fetch IP addresses from API
  const fetchIPAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/ip-addresses?limit=1000");
      
      if (!response.ok) {
        throw new Error("Failed to fetch IP addresses");
      }
      
      const data = await response.json();
      
      // Transform API data to match component format
      const transformedIPs: IPAddress[] = data.ipAddresses.map((ip: any) => ({
        id: ip.id,
        address: ip.address,
        subnet: ip.subnet,
        gateway: ip.gateway || "",
        dns: ip.dns || "",
        status: ip.status as "AVAILABLE" | "ASSIGNED" | "RESERVED" | "OFFLINE",
        isReserved: ip.isReserved || false,
        notes: ip.notes || null,
        createdAt: new Date(ip.createdAt),
        updatedAt: new Date(ip.updatedAt),
        assignments: ip.assignments || [],
        // Get assignment info if exists
        assignedTo: ip.assignments?.[0]?.equipment?.name,
        equipmentId: ip.assignments?.[0]?.equipment?.id,
        equipmentName: ip.assignments?.[0]?.equipment?.name,
        equipmentType: ip.assignments?.[0]?.equipment?.type,
        location: ip.assignments?.[0]?.equipment?.location || "",
        assignedBy: ip.assignments?.[0]?.user 
          ? `${ip.assignments[0].user.firstName} ${ip.assignments[0].user.lastName}` 
          : undefined,
        assignedAt: ip.assignments?.[0]?.assignedAt 
          ? new Date(ip.assignments[0].assignedAt) 
          : undefined,
      }));
      
      setIPAddresses(transformedIPs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching IP addresses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch equipment list for assignment
  const fetchEquipment = async () => {
    try {
      const response = await fetch("/api/equipment?limit=1000");
      if (response.ok) {
        const data = await response.json();
        setEquipmentList(data.equipment.map((eq: any) => ({
          id: eq.id,
          name: eq.name,
          type: eq.type,
        })));
      }
    } catch (err) {
      console.error("Error fetching equipment:", err);
    }
  };

  // Fetch conflicts
  const fetchConflicts = async () => {
    try {
      const response = await fetch("/api/ip-addresses/conflicts");
      if (response.ok) {
        const data = await response.json();
        // Transform conflicts data
        const transformedConflicts: IPConflict[] = data.conflicts.map((conflict: any) => ({
          id: conflict.ipAddress,
          ipAddress: conflict.ipAddress,
          conflictingEquipment: conflict.assignments.map((a: any) => a.equipmentName),
          detectedAt: new Date(),
          severity: conflict.conflictCount > 2 ? "high" : "medium" as "low" | "medium" | "high" | "critical",
          status: "active" as "active" | "resolved",
        }));
        setConflicts(transformedConflicts);
      }
    } catch (err) {
      console.error("Error fetching conflicts:", err);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      // Fetch from audit logs API which has proper IP-related logs
      const response = await fetch("/api/audit-logs?entityType=IP_ADDRESS&limit=50");
      if (response.ok) {
        const data = await response.json();
        // Transform audit logs to IPAuditLog format
        const transformedLogs: IPAuditLog[] = data.auditLogs.map((log: any) => {
          // Get IP address from the included ipAddress relation or from details
          let ipAddress = "Unknown";
          if (log.ipAddress?.address) {
            ipAddress = log.ipAddress.address;
          } else if (log.details?.ipAddress) {
            ipAddress = log.details.ipAddress;
          }
          
          // Get equipment name from the included equipment relation or from details
          let equipmentName = undefined;
          if (log.equipment?.name) {
            equipmentName = log.equipment.name;
          } else if (log.details?.equipmentName) {
            equipmentName = log.details.equipmentName;
          }
          
          return {
            id: log.id,
            ipAddress: ipAddress,
            action: log.action.includes("ASSIGNED") || log.action.includes("ASSIGN") ? "assigned" :
                   log.action.includes("UNASSIGNED") || log.action.includes("UNASSIGN") ? "unassigned" :
                   log.action.includes("UPDATED") || log.action.includes("MODIFIED") ? "modified" :
                   log.action.includes("CONFLICT") ? "conflict_detected" :
                   "modified" as IPAuditLog["action"],
            equipmentName: equipmentName,
            performedBy: log.user ? `${log.user.firstName} ${log.user.lastName}` : "System",
            performedAt: new Date(log.createdAt),
            details: log.action,
          };
        });
        setAuditLogs(transformedLogs);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      // Fallback to empty array
      setAuditLogs([]);
    }
  };

  // Fetch assignments from IP assignments
  const fetchAssignments = async () => {
    try {
      // We'll derive assignments from IP addresses with active assignments
      const assignmentsFromIPs: IPAssignment[] = [];
      ipAddresses.forEach((ip) => {
        if (ip.status === "ASSIGNED" && ip.assignments && ip.assignments.length > 0) {
          const assignment = ip.assignments[0];
          if (assignment.isActive && assignment.equipment) {
            assignmentsFromIPs.push({
              id: assignment.id,
              ipAddress: ip.address,
              equipmentId: assignment.equipment.id,
              equipmentName: assignment.equipment.name,
              equipmentType: assignment.equipment.type,
              location: assignment.equipment.location || "",
              assignedBy: assignment.user 
                ? `${assignment.user.firstName} ${assignment.user.lastName}` 
                : "System",
              assignedAt: new Date(assignment.assignedAt),
              lastSeen: ip.lastSeen ? new Date(ip.lastSeen) : new Date(),
      status: "active",
              notes: undefined,
            });
          }
        }
      });
      setAssignments(assignmentsFromIPs);
    } catch (err) {
      console.error("Error processing assignments:", err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchIPAddresses();
    fetchEquipment();
    fetchConflicts();
  }, []);

  // Check for addIP URL parameter and automatically open add dialog
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ipToAdd = urlParams.get('addIP');
    
    if (ipToAdd) {
      // Open the add dialog
      setIsAddDialogOpen(true);
      
      // Pre-fill the IP address field
      setFormData(prev => ({
        ...prev,
        address: ipToAdd,
      }));

      // Show toast message
      showSuccess(`Ready to add IP ${ipToAdd} to the database`);

      // Clean up URL
      window.history.replaceState({}, '', '/ip-management');
    }
  }, []);

  // Update assignments when IP addresses change
  useEffect(() => {
    if (ipAddresses.length > 0) {
      fetchAssignments();
      fetchAuditLogs();
    }
  }, [ipAddresses]);

  // Real-time refresh interval (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchIPAddresses();
      fetchConflicts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const [conflicts, setConflicts] = useState<IPConflict[]>([]);
  const [auditLogs, setAuditLogs] = useState<IPAuditLog[]>([]);

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
  const assignedIPs = ipAddresses.filter(ip => ip.status === "ASSIGNED").length;
  const availableIPs = ipAddresses.filter(ip => ip.status === "AVAILABLE").length;
  const conflictIPs = conflicts.filter(c => c.status === "active").length;
  const reservedIPs = ipAddresses.filter(ip => ip.status === "RESERVED" || ip.isReserved).length;

  const assignmentRate = totalIPs > 0 ? (assignedIPs / totalIPs) * 100 : 0;
  const conflictRate = totalIPs > 0 ? (conflictIPs / totalIPs) * 100 : 0;

  // Filter functions
  const filteredIPs = ipAddresses.filter(ip => {
    const matchesSearch = ip.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ip.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ip.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase());
    const normalizedStatus = ip.status.toLowerCase();
    const normalizedFilter = filterStatus.toLowerCase();
    const matchesStatus = filterStatus === "all" || normalizedStatus === normalizedFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "ASSIGNED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "AVAILABLE":
        return <Wifi className="h-4 w-4 text-blue-500" />;
      case "OFFLINE":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case "RESERVED":
        return <Shield className="h-4 w-4 text-yellow-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ASSIGNED: "default",
      AVAILABLE: "secondary",
      OFFLINE: "destructive",
      RESERVED: "outline",
    };

    return (
      <Badge variant={variants[normalizedStatus] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
      </Badge>
    );
  };

  const handleAddIP = async () => {
    if (!formData.address || !formData.subnet) {
      setError("IP address and subnet are required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/ip-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
      address: formData.address,
      subnet: formData.subnet,
          gateway: formData.gateway || null,
          dns: formData.dns ? formData.dns.split(',').map((d: string) => d.trim()).join(',') : null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add IP address");
      }

      await fetchIPAddresses();
    setIsAddDialogOpen(false);
    resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add IP address");
      console.error("Error adding IP address:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditIP = (ip: IPAddress) => {
    setEditingIP(ip);
    setFormData({
      address: ip.address,
      subnet: ip.subnet,
      gateway: ip.gateway || "",
      dns: typeof ip.dns === "string" ? ip.dns : (ip.dns && typeof ip.dns !== "string" ? String(ip.dns) : ""),
      notes: ip.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateIP = async () => {
    if (!editingIP) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/ip-addresses/${editingIP.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subnet: formData.subnet,
          gateway: formData.gateway || null,
          dns: formData.dns ? formData.dns.split(',').map((d: string) => d.trim()).join(',') : null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update IP address");
      }

      await fetchIPAddresses();
    setIsEditDialogOpen(false);
    setEditingIP(null);
    resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update IP address");
      console.error("Error updating IP address:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignIP = (ip: IPAddress) => {
    setAssigningIP(ip);
    setIsAssignDialogOpen(true);
  };

  const handleConfirmAssignment = async (equipmentId: string) => {
    if (!assigningIP) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/ip-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ipAddressId: assigningIP.id,
          equipmentId: equipmentId,
          notes: assignmentFormData.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign IP address");
      }

      await fetchIPAddresses();
    setIsAssignDialogOpen(false);
    setAssigningIP(null);
    resetAssignmentForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign IP address");
      console.error("Error assigning IP address:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassignIP = (ip: IPAddress) => {
    if (!ip.assignments || ip.assignments.length === 0) return;

    const activeAssignment = ip.assignments.find(a => a.isActive);
    if (!activeAssignment) return;

    showConfirmation({
      title: "Unassign IP Address",
      description: "Are you sure you want to unassign this IP address from the equipment?",
      confirmText: "Unassign",
      variant: "warning",
      itemName: ip.address,
      onConfirm: async () => {
        try {
          setSubmitting(true);
          setError(null);

          const response = await fetch(`/api/ip-assignments?ipAddressId=${ip.id}&equipmentId=${activeAssignment.equipment?.id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to unassign IP address");
          }

          await fetchIPAddresses();
          showSuccess(`IP address ${ip.address} unassigned successfully`);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Failed to unassign IP address";
          setError(errorMessage);
          showError(errorMessage);
          console.error("Error unassigning IP address:", err);
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const handleDeleteIP = (id: string, address: string) => {
    showConfirmation({
      title: "Delete IP Address",
      description: "This IP address will be permanently removed from the system. This action cannot be undone.",
      confirmText: "Delete IP Address",
      variant: "danger",
      itemName: address,
      onConfirm: async () => {
        try {
          setSubmitting(true);
          setError(null);

          const response = await fetch(`/api/ip-addresses/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete IP address");
          }

          await fetchIPAddresses();
          showSuccess(`IP address ${address} deleted successfully`);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Failed to delete IP address";
          setError(errorMessage);
          showError(errorMessage);
          console.error("Error deleting IP address:", err);
        } finally {
          setSubmitting(false);
        }
      },
    });
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
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              fetchIPAddresses();
              fetchConflicts();
              fetchAuditLogs();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add IP Address
        </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

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
                <SelectItem value="offline">Offline</SelectItem>
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
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
                            <span>{ip.lastSeen instanceof Date ? ip.lastSeen.toLocaleDateString() : new Date(ip.lastSeen).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {(ip.status === "AVAILABLE" || ip.status === "RESERVED") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignIP(ip)}
                              disabled={submitting}
                            >
                              Assign
                            </Button>
                          )}
                          {ip.status === "ASSIGNED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnassignIP(ip)}
                              disabled={submitting}
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
                            onClick={() => handleDeleteIP(ip.id, ip.address)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
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
                        {assignment.location ? (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{assignment.location}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
                          <span className="font-medium">{log.equipmentName}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{log.performedBy}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {log.performedAt.toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {log.performedAt.toLocaleTimeString()}
                          </span>
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
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
          <DialogHeader className="space-y-3 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">Add IP Address</DialogTitle>
            <DialogDescription className="text-base">
              Add a new IP address to the network pool with its configuration details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6 overflow-y-auto flex-1 pr-2">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                </div>
              </div>
            )}
            
            {/* Network Information Section */}
            <div className="space-y-5">
              <div className="flex items-center space-x-2 pb-2 border-b border-border">
                <Network className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Network Information</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="address" className="text-sm font-semibold text-foreground flex items-center space-x-1">
                    <span>IP Address</span>
                    <span className="text-red-500">*</span>
                  </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., 192.168.1.10"
                    className="h-11 bg-background border-2 focus:border-primary"
                />
                  <p className="text-xs text-muted-foreground mt-1">The IPv4 address for this device</p>
              </div>
                <div className="space-y-2.5">
                  <Label htmlFor="subnet" className="text-sm font-semibold text-foreground flex items-center space-x-1">
                    <span>Subnet Mask</span>
                    <span className="text-red-500">*</span>
                  </Label>
                <Input
                  id="subnet"
                  value={formData.subnet}
                  onChange={(e) => setFormData({ ...formData, subnet: e.target.value })}
                    placeholder="e.g., 192.168.1.0/24"
                    className="h-11 bg-background border-2 focus:border-primary"
                />
                  <p className="text-xs text-muted-foreground mt-1">Network subnet in CIDR notation</p>
              </div>
            </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="gateway" className="text-sm font-semibold text-foreground flex items-center space-x-1">
                    <span>Gateway</span>
                    <span className="text-red-500">*</span>
                  </Label>
                <Input
                  id="gateway"
                  value={formData.gateway}
                  onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                    placeholder="e.g., 192.168.1.1"
                    className="h-11 bg-background border-2 focus:border-primary"
                />
                  <p className="text-xs text-muted-foreground mt-1">Default gateway address</p>
              </div>
                <div className="space-y-2.5">
                  <Label htmlFor="dns" className="text-sm font-semibold text-foreground">
                    DNS Servers
                  </Label>
                <Input
                  id="dns"
                  value={formData.dns}
                  onChange={(e) => setFormData({ ...formData, dns: e.target.value })}
                    placeholder="e.g., 8.8.8.8, 8.8.4.4"
                    className="h-11 bg-background border-2 focus:border-primary"
                />
                  <p className="text-xs text-muted-foreground mt-1">Comma-separated DNS server addresses</p>
              </div>
            </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-5">
              <div className="flex items-center space-x-2 pb-2 border-b border-border">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Additional Information</h3>
              </div>
              
              <div className="space-y-2.5">
                <Label htmlFor="notes" className="text-sm font-semibold text-foreground">
                  Notes (Optional)
                </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes or comments about this IP address..."
                  className="min-h-[100px] bg-background border-2 focus:border-primary resize-none"
              />
                <p className="text-xs text-muted-foreground">Any relevant information about this IP address</p>
            </div>
          </div>
          </div>
          <DialogFooter className="gap-2 pt-4 border-t border-border flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
                setError(null);
              }}
              disabled={submitting}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button onClick={handleAddIP} disabled={submitting} className="min-w-[140px]">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add IP Address
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit IP Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
          <DialogHeader className="space-y-3 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">Edit IP Address</DialogTitle>
            <DialogDescription className="text-base">
              Update IP address configuration and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6 overflow-y-auto flex-1 pr-2">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                </div>
              </div>
            )}
            
            {/* Network Information Section */}
            <div className="space-y-5">
              <div className="flex items-center space-x-2 pb-2 border-b border-border">
                <Network className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Network Information</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="edit-address" className="text-sm font-semibold text-foreground">
                    IP Address
                  </Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                    disabled
                    className="h-11 bg-muted/50 border-2 cursor-not-allowed"
                  placeholder="192.168.1.10"
                />
                  <p className="text-xs text-amber-600 dark:text-amber-500 font-medium flex items-center space-x-1">
                    <Lock className="h-3 w-3" />
                    <span>IP address cannot be modified</span>
                  </p>
              </div>
                <div className="space-y-2.5">
                  <Label htmlFor="edit-subnet" className="text-sm font-semibold text-foreground flex items-center space-x-1">
                    <span>Subnet Mask</span>
                    <span className="text-red-500">*</span>
                  </Label>
                <Input
                  id="edit-subnet"
                  value={formData.subnet}
                  onChange={(e) => setFormData({ ...formData, subnet: e.target.value })}
                    placeholder="e.g., 192.168.1.0/24"
                    className="h-11 bg-background border-2 focus:border-primary"
                />
                  <p className="text-xs text-muted-foreground mt-1">Network subnet in CIDR notation</p>
              </div>
            </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="edit-gateway" className="text-sm font-semibold text-foreground flex items-center space-x-1">
                    <span>Gateway</span>
                    <span className="text-red-500">*</span>
                  </Label>
                <Input
                  id="edit-gateway"
                  value={formData.gateway}
                  onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                    placeholder="e.g., 192.168.1.1"
                    className="h-11 bg-background border-2 focus:border-primary"
                />
                  <p className="text-xs text-muted-foreground mt-1">Default gateway address</p>
              </div>
                <div className="space-y-2.5">
                  <Label htmlFor="edit-dns" className="text-sm font-semibold text-foreground">
                    DNS Servers
                  </Label>
                <Input
                  id="edit-dns"
                  value={formData.dns}
                  onChange={(e) => setFormData({ ...formData, dns: e.target.value })}
                    placeholder="e.g., 8.8.8.8, 8.8.4.4"
                    className="h-11 bg-background border-2 focus:border-primary"
                />
                  <p className="text-xs text-muted-foreground mt-1">Comma-separated DNS server addresses</p>
              </div>
            </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-5">
              <div className="flex items-center space-x-2 pb-2 border-b border-border">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Additional Information</h3>
              </div>
              
              <div className="space-y-2.5">
                <Label htmlFor="edit-notes" className="text-sm font-semibold text-foreground">
                  Notes (Optional)
                </Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes or comments about this IP address..."
                  className="min-h-[100px] bg-background border-2 focus:border-primary resize-none"
              />
                <p className="text-xs text-muted-foreground">Any relevant information about this IP address</p>
            </div>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4 border-t border-border flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingIP(null);
                resetForm();
                setError(null);
              }}
              disabled={submitting}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateIP} disabled={submitting} className="min-w-[140px]">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update IP
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign IP Dialog */}
      <EquipmentSelectionDialog
        isOpen={isAssignDialogOpen}
        onClose={() => {
          setIsAssignDialogOpen(false);
          setAssigningIP(null);
          resetAssignmentForm();
        }}
        ipAddress={assigningIP?.address || ""}
        onConfirm={async (equipmentId: string, equipmentName: string) => {
          await handleConfirmAssignment(equipmentId);
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {/* Confirmation Dialog */}
      {confirmation && (
        <ConfirmationDialog
          isOpen={confirmation.isOpen}
          onClose={hideConfirmation}
          onConfirm={confirm}
          title={confirmation.title}
          description={confirmation.description}
          confirmText={confirmation.confirmText}
          cancelText={confirmation.cancelText}
          variant={confirmation.variant}
          itemName={confirmation.itemName}
        />
      )}
    </div>
  );
}
