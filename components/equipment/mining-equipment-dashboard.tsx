"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Wrench,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MapPin,
  HardHat,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Wifi,
  WifiOff,
  Zap,
  Timer,
  Signal,
  Network,
  Eye,
  Link,
  Unlink,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportExportDialog } from "./import-export-dialog";
import { MiningEquipment, EquipmentFormData } from "@/types/equipment";
import { useEquipmentMonitoring } from "@/hooks/use-equipment-monitoring";
import { getTimeAgo, calculateUptime, formatDateForDisplay } from "@/lib/time-utils";
import { getSignalStrengthColor, getUptimeColor } from "@/lib/real-time-data";

// Equipment types and form data are now imported from types/equipment.ts

export function MiningEquipmentDashboard() {
  const [equipment, setEquipment] = useState<MiningEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportExportDialogOpen, setIsImportExportDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<MiningEquipment | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Real-time monitoring
  const {
    equipmentStatuses,
    monitoringStatus,
    isLoading: isMonitoringLoading,
    error: monitoringError,
    checkAllEquipment,
    checkEquipment,
    startMonitoring,
    stopMonitoring,
    getOnlineCount,
    getOfflineCount,
  } = useEquipmentMonitoring();
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: "",
    type: "",
    model: "",
    manufacturer: "",
    serialNumber: "",
    ipAddress: "",
    macAddress: "",
    location: "",
    operator: "",
    notes: "",
    status: "ONLINE",
  });

  // Equipment types for dropdown
  const equipmentTypes = [
    "Truck", "Excavator", "Drill", "Loader", "Dozer", "Shovel", "Crusher", "Conveyor"
  ];

  // Manufacturers for dropdown
  const manufacturers = [
    "Caterpillar", "Komatsu", "Liebherr", "Hitachi", "Volvo", "John Deere", "Case", "JCB"
  ];

  // Fetch real equipment data from API
  const fetchEquipmentData = async (useRealTime = false) => {
      setIsLoading(true);
      try {
        setError(null);
      const url = useRealTime ? "/api/equipment?realTime=true" : "/api/equipment";
      const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch equipment data");
        }
        const data = await response.json();
        // Handle both direct array and paginated response
        setEquipment(data.equipment || data || []);
      } catch (error) {
        console.error("Failed to fetch equipment data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchEquipmentData();
    
    // Set up real-time updates every 60 seconds
    const interval = setInterval(() => fetchEquipmentData(true), 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle real-time refresh
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await checkAllEquipment();
      await fetchEquipmentData(true);
    } catch (error) {
      console.error("Failed to refresh equipment data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "offline":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "idle":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
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
        return <Wrench className="h-4 w-4 text-yellow-600" />;
      case "idle":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get real-time status for equipment
  const getRealTimeStatus = (equipmentId: string) => {
    return equipmentStatuses.find(status => status.equipmentId === equipmentId);
  };

  // Get accurate online count combining database and real-time data
  const getAccurateOnlineCount = () => {
    if (!equipment) return 0;
    
    return equipment.filter(item => {
      const realTimeStatus = getRealTimeStatus(item.id);
      if (realTimeStatus) {
        return realTimeStatus.isOnline;
      }
      // Fallback to database status if no real-time data
      return item.status === "ONLINE";
    }).length;
  };

  // Get accurate offline count combining database and real-time data
  const getAccurateOfflineCount = () => {
    if (!equipment) return 0;
    
    return equipment.filter(item => {
      const realTimeStatus = getRealTimeStatus(item.id);
      if (realTimeStatus) {
        return !realTimeStatus.isOnline;
      }
      // Fallback to database status if no real-time data
      return item.status === "OFFLINE";
    }).length;
  };

  // Get IP assignment for equipment
  const getIPAssignment = (equipmentId: string) => {
    const equipmentItem = equipment.find(eq => eq.id === equipmentId);
    return equipmentItem?.ipAssignments?.[0]?.ipAddress?.address || "Not assigned";
  };

  // Handle IP assignment
  const handleAssignIP = async (equipmentId: string) => {
    // This would open an IP assignment dialog
    console.log("Assign IP for equipment:", equipmentId);
  };

  // Handle IP unassignment
  const handleUnassignIP = async (equipmentId: string) => {
    // This would unassign IP from equipment
    console.log("Unassign IP for equipment:", equipmentId);
  };

  const filteredEquipment = (equipment || []).filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.operator?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAddEquipment = async () => {
    try {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          model: formData.model,
          manufacturer: formData.manufacturer,
          serialNumber: formData.serialNumber,
          macAddress: formData.macAddress || null,
          location: formData.location,
          operator: formData.operator,
          notes: formData.notes,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add equipment");
      }

      const newEquipment = await response.json();
      setEquipment([...(equipment || []), newEquipment]);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to add equipment:", error);
      alert("Failed to add equipment. Please try again.");
    }
  };

  const handleEditEquipment = (item: MiningEquipment) => {
    setEditingEquipment(item);
    setFormData({
      name: item.name,
      type: item.type,
      model: item.model || "",
      manufacturer: item.manufacturer || "",
      serialNumber: item.serialNumber || "",
      ipAddress: item.ipAddress,
      macAddress: item.macAddress || "",
      location: item.location || "",
      operator: item.operator || "",
      notes: item.notes || "",
      status: item.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateEquipment = async () => {
    if (!editingEquipment) return;

    try {
      const response = await fetch(`/api/equipment/${editingEquipment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          model: formData.model,
          manufacturer: formData.manufacturer,
          serialNumber: formData.serialNumber,
          macAddress: formData.macAddress || null,
          location: formData.location,
          operator: formData.operator,
          notes: formData.notes,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update equipment");
      }

      const updatedEquipment = await response.json();
      setEquipment((equipment || []).map(item => 
        item.id === editingEquipment.id ? updatedEquipment : item
      ));
      setIsEditDialogOpen(false);
      setEditingEquipment(null);
      resetForm();
    } catch (error) {
      console.error("Failed to update equipment:", error);
      alert("Failed to update equipment. Please try again.");
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (confirm("Are you sure you want to delete this equipment?")) {
      try {
        const response = await fetch(`/api/equipment/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete equipment");
        }

        setEquipment((equipment || []).filter(item => item.id !== id));
      } catch (error) {
        console.error("Failed to delete equipment:", error);
        alert("Failed to delete equipment. Please try again.");
      }
    }
  };

  const handleImportEquipment = (newEquipment: MiningEquipment[]) => {
    setEquipment([...(equipment || []), ...newEquipment]);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      model: "",
      manufacturer: "",
      serialNumber: "",
      ipAddress: "",
      macAddress: "",
      location: "",
      operator: "",
      notes: "",
      status: "ONLINE",
    });
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return date.toLocaleDateString();
  };

  const formatOperatingHours = (hours: number | null | undefined) => {
    if (!hours) return "0 hrs";
    return `${hours.toLocaleString()} hrs`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mining Equipment</h1>
            <p className="text-muted-foreground">
              Manage and monitor all mining equipment
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading equipment data...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Mining Equipment</h1>
            <p className="text-muted-foreground">
              Manage and monitor all mining equipment
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Error Loading Equipment Data
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
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Mining Equipment</h1>
          <p className="text-sm text-muted-foreground">
            Manage and monitor all mining equipment
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
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log("Export button clicked");
              setIsImportExportDialogOpen(true);
            }}
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log("Import button clicked");
              setIsImportExportDialogOpen(true);
            }}
          >
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Equipment</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Equipment</DialogTitle>
                <DialogDescription>
                  Add a new piece of mining equipment to the system. IP and MAC addresses can be assigned later.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Equipment Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Haul Truck CAT 797F"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Equipment Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                      placeholder="e.g., 797F"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Select value={formData.manufacturer} onValueChange={(value) => setFormData({...formData, manufacturer: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manufacturer" />
                      </SelectTrigger>
                      <SelectContent>
                        {manufacturers.map(manufacturer => (
                          <SelectItem key={manufacturer} value={manufacturer}>{manufacturer}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                      placeholder="e.g., CAT797F-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ipAddress">IP Address (Optional)</Label>
                    <Input
                      id="ipAddress"
                      value={formData.ipAddress}
                      onChange={(e) => setFormData({...formData, ipAddress: e.target.value})}
                      placeholder="Will be assigned later if not provided"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="macAddress">MAC Address (Optional)</Label>
                    <Input
                      id="macAddress"
                      value={formData.macAddress}
                      onChange={(e) => setFormData({...formData, macAddress: e.target.value})}
                      placeholder="Will be assigned later if not provided"
                    />
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operator">Operator</Label>
                  <Input
                    id="operator"
                    value={formData.operator}
                    onChange={(e) => setFormData({...formData, operator: e.target.value})}
                    placeholder="e.g., John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes about the equipment..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEquipment}>
                  Add Equipment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Equipment Overview Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">Total Equipment</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="text-xl sm:text-2xl font-bold">{equipment?.length || 0}</div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Active equipment
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
              Operational
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
              Attention needed
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              {equipment?.filter(e => e.status === "MAINTENANCE").length || 0}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Under service
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
              Real-time
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">Health</CardTitle>
            <Network className="h-4 w-4 text-indigo-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="text-xl sm:text-2xl font-bold text-indigo-600">
              {equipment?.length > 0 ? Math.round((getAccurateOnlineCount() / equipment.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Network uptime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment List</CardTitle>
          <CardDescription>
            Manage and monitor all mining equipment in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] sm:w-40">
                  <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {equipmentTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] sm:w-40">
                  <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead className="min-w-[180px]">Equipment</TableHead>
                  <TableHead className="min-w-[100px]">Type</TableHead>
                  <TableHead className="min-w-[140px]">IP Address</TableHead>
                  <TableHead className="min-w-[150px]">Real-time Status</TableHead>
                  <TableHead className="min-w-[120px]">Response Time</TableHead>
                  <TableHead className="min-w-[140px]">Signal Strength</TableHead>
                  <TableHead className="min-w-[120px]">Location</TableHead>
                  <TableHead className="min-w-[120px]">Operator</TableHead>
                  <TableHead className="min-w-[140px]">Last Seen</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.map((item) => {
                const realTimeStatus = getRealTimeStatus(item.id);
                const isOnline = realTimeStatus ? realTimeStatus.isOnline : item.status === "ONLINE";
                const responseTime = realTimeStatus?.responseTime;
                const lastSeen = realTimeStatus ? realTimeStatus.lastSeen : item.lastSeen;
                const signalStrength = realTimeStatus ? Math.max(0, 100 - (responseTime || 0) / 10) : (item.meshStrength || 0);
                
                return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <HardHat className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.serialNumber}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm">{getIPAssignment(item.id)}</span>
                        {getIPAssignment(item.id) !== "Not assigned" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnassignIP(item.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Unlink className="h-3 w-3 text-red-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAssignIP(item.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Link className="h-3 w-3 text-green-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge className={isOnline ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"}>
                          {isOnline ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                          <span className="text-xs">{isOnline ? "ONLINE" : "OFFLINE"}</span>
                    </Badge>
                        {realTimeStatus && (
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-xs text-muted-foreground">Live</span>
                          </div>
                        )}
                      </div>
                  </TableCell>
                  <TableCell>
                      {responseTime ? (
                    <div className="flex items-center space-x-1">
                          <Timer className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-mono">{responseTime}ms</span>
                    </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                        <Signal className={`h-3 w-3 ${getSignalStrengthColor(signalStrength)}`} />
                        <span className="text-sm font-medium">{Math.round(signalStrength)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{item.location || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{item.operator || "Unassigned"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {lastSeen ? (
                          <div>
                            <div className="font-medium">{formatDateForDisplay(lastSeen, 'short')}</div>
                            <div className="text-xs text-muted-foreground">{getTimeAgo(lastSeen).fullText}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => checkEquipment(item.id)}
                          className="h-8 w-8 p-0"
                          title="Refresh Status"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                        size="sm"
                        onClick={() => handleEditEquipment(item)}
                          className="h-8 w-8 p-0"
                          title="Edit Equipment"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                          variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEquipment(item.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          title="Delete Equipment"
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

      {/* Edit Equipment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>
              Update equipment information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Equipment Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Equipment Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-model">Model</Label>
                <Input
                  id="edit-model"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-manufacturer">Manufacturer</Label>
                <Select value={formData.manufacturer} onValueChange={(value) => setFormData({...formData, manufacturer: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manufacturer" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers.map(manufacturer => (
                      <SelectItem key={manufacturer} value={manufacturer}>{manufacturer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-serialNumber">Serial Number</Label>
                <Input
                  id="edit-serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
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
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-operator">Operator</Label>
              <Input
                id="edit-operator"
                value={formData.operator}
                onChange={(e) => setFormData({...formData, operator: e.target.value})}
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
            <Button onClick={handleUpdateEquipment}>
              Update Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import/Export Dialog */}
      <ImportExportDialog
        isOpen={isImportExportDialogOpen}
        onClose={() => {
          console.log("Closing import/export dialog");
          setIsImportExportDialogOpen(false);
        }}
        onImport={handleImportEquipment}
        equipment={equipment}
      />
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs">
          Dialog Open: {isImportExportDialogOpen ? 'Yes' : 'No'}
        </div>
      )}
    </div>
  );
}
