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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedImportDialog } from "../import-export/enhanced-import-dialog";
import { EnhancedExportDialog } from "../import-export/enhanced-export-dialog";
import { IPAddressTagInput } from "./ip-address-tag-input";
import { MiningEquipment, EquipmentFormData, IPAddressInput } from "@/types/equipment";
import { useEquipmentMonitoring } from "@/hooks/use-equipment-monitoring";
import { getTimeAgo, calculateUptime, formatDateForDisplay } from "@/lib/time-utils";
import { getSignalStrengthColor, getUptimeColor } from "@/lib/real-time-data";
import { isEquipmentFeatureEnabled } from "@/lib/feature-flags";
import { BulkActionToolbar, BulkSelectCheckbox } from "@/components/ui/bulk-action-toolbar";
import { BulkConfirmationDialog, BulkConfirmationItem } from "@/components/ui/bulk-confirmation-dialog";
import { exportSelectedEquipment } from "@/lib/export-utils";
import { AdvancedFilters, ActiveFilter } from "@/components/ui/advanced-filters";

// Equipment types and form data are now imported from types/equipment.ts

export function MiningEquipmentDashboard() {
  const [equipment, setEquipment] = useState<MiningEquipment[]>([]);
  const [totalEquipmentCount, setTotalEquipmentCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEnhancedImportDialogOpen, setIsEnhancedImportDialogOpen] = useState(false);
  const [isEnhancedExportDialogOpen, setIsEnhancedExportDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<MiningEquipment | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Custom alerts and confirmation dialogs
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; equipmentId: string | null; equipmentName: string | null }>({
    isOpen: false,
    equipmentId: null,
    equipmentName: null,
  });

  // Bulk selection state
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<ActiveFilter[]>([]);

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
    assignIPsOnCreation: true,
    numberOfIPs: 1,
    ipAddresses: [],
  });

  // Store IP addresses as simple strings for the tag input
  const [ipAddressStrings, setIpAddressStrings] = useState<string[]>([]);

  // Helper function to show toast messages
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  };

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
      // Fetch ALL equipment by using a high limit
      const url = useRealTime 
        ? "/api/equipment?realTime=true&limit=10000" 
        : "/api/equipment?limit=10000";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch equipment data");
      }
      const data = await response.json();
      // Handle both direct array and paginated response
      const equipmentList = data.equipment || data || [];
      setEquipment(equipmentList);
      // Use pagination total if available, otherwise use array length
      setTotalEquipmentCount(data.pagination?.total || equipmentList.length);
    } catch (error) {
      console.error("Failed to fetch equipment data:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipmentData();
  }, []);

  // Check for addIP URL parameter and automatically open add dialog
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ipToAdd = urlParams.get('addIP');

    if (ipToAdd) {
      // Open the add dialog
      setIsAddDialogOpen(true);

      // Pre-configure for IP assignment
      setIpAddressStrings([ipToAdd]);

      // Show toast message
      showToast(`Ready to add IP ${ipToAdd} with new equipment`, "info");

      // Clean up URL
      window.history.replaceState({}, '', '/equipment');
    }
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

  // Get all IP assignments for equipment
  const getIPAssignments = (equipmentId: string) => {
    const equipmentItem = equipment.find(eq => eq.id === equipmentId);
    return equipmentItem?.ipAssignments?.map(assignment => assignment.ipAddress) || [];
  };

  // Get IP assignment for equipment (for backwards compatibility with stats cards)
  const getIPAssignment = (equipmentId: string) => {
    const ips = getIPAssignments(equipmentId);
    return ips.length > 0 ? ips[0].address : "Not assigned";
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

    // Advanced filters
    const matchesAdvancedFilters = advancedFilters.every(filter => {
      switch (filter.id) {
        case "manufacturer":
          return item.manufacturer?.toLowerCase() === filter.value.toLowerCase();
        case "location":
          return item.location?.toLowerCase().includes(filter.value.toLowerCase()) || false;
        case "operator":
          return item.operator?.toLowerCase().includes(filter.value.toLowerCase()) || false;
        case "ipAssignment":
          if (filter.value === "assigned") {
            const ips = getIPAssignments(item.id);
            return ips.length > 0;
          }
          if (filter.value === "unassigned") {
            const ips = getIPAssignments(item.id);
            return ips.length === 0;
          }
          return true;
        default:
          return true;
      }
    });

    return matchesSearch && matchesType && matchesStatus && matchesAdvancedFilters;
  });

  const handleAddEquipment = async () => {
    try {
      // Validate that at least one IP address exists
      if (!ipAddressStrings || ipAddressStrings.length === 0) {
        showToast("Equipment must have at least one IP address assigned.", "error");
        return;
      }

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
          // Convert string IPs to the expected format
          ipAddresses: ipAddressStrings.map(address => ({
            address,
            subnet: "",
            gateway: "",
            dns: "",
            notes: "",
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add equipment");
      }

      const newEquipment = await response.json();
      setEquipment([...(equipment || []), newEquipment]);
      setIsAddDialogOpen(false);
      resetForm();
      showToast(`Equipment "${newEquipment.name}" added successfully!`, "success");
    } catch (error) {
      console.error("Failed to add equipment:", error);
      showToast(error instanceof Error ? error.message : "Failed to add equipment. Please try again.", "error");
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
      assignIPsOnCreation: false,
      numberOfIPs: 1,
      ipAddresses: [],
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
      showToast(`Equipment "${updatedEquipment.name}" updated successfully!`, "success");
    } catch (error) {
      console.error("Failed to update equipment:", error);
      showToast("Failed to update equipment. Please try again.", "error");
    }
  };

  const handleDeleteClick = (item: MiningEquipment) => {
    setDeleteConfirmation({
      isOpen: true,
      equipmentId: item.id,
      equipmentName: item.name,
    });
  };

  const handleDeleteEquipment = async () => {
    if (!deleteConfirmation.equipmentId) return;

    try {
      const response = await fetch(`/api/equipment/${deleteConfirmation.equipmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete equipment");
      }

      const equipmentName = deleteConfirmation.equipmentName;
      setDeleteConfirmation({ isOpen: false, equipmentId: null, equipmentName: null });
      
      // Refresh equipment data from server to ensure UI is in sync
      await fetchEquipmentData();
      
      showToast(`Equipment "${equipmentName}" deleted successfully!`, "success");
    } catch (error) {
      console.error("Failed to delete equipment:", error);
      showToast(error instanceof Error ? error.message : "Failed to delete equipment. Please try again.", "error");
      setDeleteConfirmation({ isOpen: false, equipmentId: null, equipmentName: null });
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
      assignIPsOnCreation: true,
      numberOfIPs: 1,
      ipAddresses: [],
    });
    setIpAddressStrings([]);
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return date.toLocaleDateString();
  };

  const formatOperatingHours = (hours: number | null | undefined) => {
    if (!hours) return "0 hrs";
    return `${hours.toLocaleString()} hrs`;
  };

  // Bulk selection handlers
  const handleSelectAllEquipment = () => {
    if (selectedEquipmentIds.size === filteredEquipment.length) {
      setSelectedEquipmentIds(new Set());
    } else {
      setSelectedEquipmentIds(new Set(filteredEquipment.map(eq => eq.id)));
    }
  };

  const handleSelectEquipment = (equipmentId: string) => {
    const newSelected = new Set(selectedEquipmentIds);
    if (newSelected.has(equipmentId)) {
      newSelected.delete(equipmentId);
    } else {
      newSelected.add(equipmentId);
    }
    setSelectedEquipmentIds(newSelected);
  };

  const handleClearEquipmentSelection = () => {
    setSelectedEquipmentIds(new Set());
  };

  // Bulk delete handler
  const handleBulkDeleteEquipment = async () => {
    try {
      setBulkActionLoading(true);
      const response = await fetch("/api/equipment/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipmentIds: Array.from(selectedEquipmentIds) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete equipment");
      }

      const result = await response.json();
      showToast(result.message || "Equipment deleted successfully", "success");
      await fetchEquipmentData();
      setSelectedEquipmentIds(new Set());
      setBulkDeleteDialogOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete equipment";
      showToast(errorMessage, "error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Export selected equipment
  const handleExportSelectedEquipment = () => {
    const selectedEquipment = equipment.filter(eq => selectedEquipmentIds.has(eq.id));
    exportSelectedEquipment(selectedEquipment, `selected-equipment-${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast(`Exported ${selectedEquipment.length} equipment item${selectedEquipment.length !== 1 ? 's' : ''}`, "success");
  };

  // Get selected equipment items for confirmation dialog
  const getSelectedEquipmentItems = (): BulkConfirmationItem[] => {
    return equipment
      .filter(eq => selectedEquipmentIds.has(eq.id))
      .map(eq => ({
        id: eq.id,
        label: eq.name,
        sublabel: `${eq.type} - ${eq.serialNumber || 'No S/N'}`,
        status: eq.status,
      }));
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
            {isEquipmentFeatureEnabled("showRefreshButton") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            )}
            {isEquipmentFeatureEnabled("showStartStopButtons") && (
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
            )}
          </div>

          {isEquipmentFeatureEnabled("showImportExportButtons") && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("Export button clicked");
                  setIsEnhancedExportDialogOpen(true);
                }}
              >
                <Upload className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("Import button clicked");
                  setIsEnhancedImportDialogOpen(true);
                }}
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Import</span>
              </Button>
            </>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Equipment</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto dialog-scroll">
              <DialogHeader>
                <DialogTitle>Add New Equipment</DialogTitle>
                <DialogDescription>
                  Add a new piece of mining equipment to the system. You must assign at least one IP address.
                </DialogDescription>
              </DialogHeader>
              <TooltipProvider>
                <div className="grid gap-6 py-4" style={{ paddingRight: '4px' }}>
                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <HardHat className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-base">Basic Information</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label htmlFor="name" className="cursor-help">
                              Name <span className="text-red-500">*</span>
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enter a descriptive name for the equipment</p>
                          </TooltipContent>
                        </Tooltip>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Haul Truck 01"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label htmlFor="type" className="cursor-help">
                              Type <span className="text-red-500">*</span>
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Select the category of equipment</p>
                          </TooltipContent>
                        </Tooltip>
                        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
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
                  </div>

                  {/* IP Address Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Network className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-base">Network Configuration</h3>
                    </div>

                    <div className="space-y-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Label className="cursor-help">
                            IP Addresses <span className="text-red-500">*</span>
                          </Label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add one or more IP addresses for this equipment</p>
                          <p className="text-xs mt-1">Type an IP address and click Add or press Enter</p>
                        </TooltipContent>
                      </Tooltip>
                      <IPAddressTagInput
                        ipAddresses={ipAddressStrings}
                        onChange={setIpAddressStrings}
                      />
                    </div>
                  </div>

                  {/* Equipment Details Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Wrench className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-base">Equipment Details</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label htmlFor="manufacturer" className="cursor-help">
                              Manufacturer
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Select the equipment manufacturer</p>
                          </TooltipContent>
                        </Tooltip>
                        <Select value={formData.manufacturer} onValueChange={(value) => setFormData({ ...formData, manufacturer: value })}>
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
                      <div className="space-y-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label htmlFor="model" className="cursor-help">
                              Model
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enter the equipment model number</p>
                          </TooltipContent>
                        </Tooltip>
                        <Input
                          id="model"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          placeholder="797F"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label htmlFor="serialNumber" className="cursor-help">
                              Serial Number
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enter the unique serial number</p>
                          </TooltipContent>
                        </Tooltip>
                        <Input
                          id="serialNumber"
                          value={formData.serialNumber}
                          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                          placeholder="CAT797F-001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label htmlFor="macAddress" className="cursor-help">
                              MAC Address
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Optional: Enter the MAC address if known</p>
                          </TooltipContent>
                        </Tooltip>
                        <Input
                          id="macAddress"
                          value={formData.macAddress}
                          onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                          placeholder="00:1A:2B:3C:4D:5E"
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location & Assignment Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-base">Location & Assignment</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label htmlFor="location" className="cursor-help">
                              Location
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Specify where this equipment is located</p>
                          </TooltipContent>
                        </Tooltip>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="Pit A - Level 3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label htmlFor="operator" className="cursor-help">
                              Operator
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Assign an operator to this equipment</p>
                          </TooltipContent>
                        </Tooltip>
                        <Input
                          id="operator"
                          value={formData.operator}
                          onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                          placeholder="John Smith"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Label htmlFor="notes" className="cursor-help">
                            Notes
                          </Label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add any additional notes or information</p>
                        </TooltipContent>
                      </Tooltip>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </TooltipProvider>
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
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {isEquipmentFeatureEnabled("showTotalEquipmentCard") && (
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">Total Equipment</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-xl sm:text-2xl font-bold">{totalEquipmentCount || equipment?.length || 0}</div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                Active equipment
              </p>
            </CardContent>
          </Card>
        )}

        {isEquipmentFeatureEnabled("showAssignedEquipmentCard") && (
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">Assigned IPs</CardTitle>
              <Link className="h-4 w-4 text-green-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">
                {equipment?.filter(e => getIPAssignment(e.id) !== "Not assigned").length || 0}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                With IP addresses
              </p>
            </CardContent>
          </Card>
        )}

        {isEquipmentFeatureEnabled("showUnassignedEquipmentCard") && (
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium line-clamp-1">Unassigned IPs</CardTitle>
              <Unlink className="h-4 w-4 text-blue-600 flex-shrink-0" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">
                {equipment?.filter(e => getIPAssignment(e.id) === "Not assigned").length || 0}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                Without IP addresses
              </p>
            </CardContent>
          </Card>
        )}

        {isEquipmentFeatureEnabled("showOnlineCard") && (
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
        )}

        {isEquipmentFeatureEnabled("showOfflineCard") && (
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
        )}

        {isEquipmentFeatureEnabled("showMaintenanceCard") && (
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
        )}

        {isEquipmentFeatureEnabled("showMonitoringCard") && (
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
        )}

        {isEquipmentFeatureEnabled("showHealthCard") && (
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
        )}
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
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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

            {/* Advanced Filters */}
            <AdvancedFilters
              filters={[
                {
                  id: "manufacturer",
                  label: "Manufacturer",
                  type: "select",
                  options: manufacturers.map(m => ({ value: m, label: m })),
                },
                {
                  id: "location",
                  label: "Location",
                  type: "text",
                  placeholder: "Filter by location",
                },
                {
                  id: "operator",
                  label: "Operator",
                  type: "text",
                  placeholder: "Filter by operator name",
                },
                {
                  id: "ipAssignment",
                  label: "IP Assignment",
                  type: "select",
                  options: [
                    { value: "assigned", label: "Has IP Address" },
                    { value: "unassigned", label: "No IP Address" },
                  ],
                },
              ]}
              activeFilters={advancedFilters}
              onApplyFilters={setAdvancedFilters}
              onClearFilters={() => setAdvancedFilters([])}
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <BulkSelectCheckbox
                      checked={selectedEquipmentIds.size > 0 && selectedEquipmentIds.size === filteredEquipment.length}
                      onCheckedChange={handleSelectAllEquipment}
                    />
                  </TableHead>
                  <TableHead className="min-w-[180px]">Equipment</TableHead>
                  <TableHead className="min-w-[100px]">Type</TableHead>
                  <TableHead className="min-w-[140px]">IP Address</TableHead>
                  {isEquipmentFeatureEnabled("showRealTimeStatusColumn") && (
                    <TableHead className="min-w-[150px]">Real-time Status</TableHead>
                  )}
                  {isEquipmentFeatureEnabled("showResponseTimeColumn") && (
                    <TableHead className="min-w-[120px]">Response Time</TableHead>
                  )}
                  {isEquipmentFeatureEnabled("showSignalStrengthColumn") && (
                    <TableHead className="min-w-[140px]">Signal Strength</TableHead>
                  )}
                  <TableHead className="min-w-[120px]">Location</TableHead>
                  <TableHead className="min-w-[120px]">Operator</TableHead>
                  {isEquipmentFeatureEnabled("showLastSeenColumn") && (
                    <TableHead className="min-w-[140px]">Last Seen</TableHead>
                  )}
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
                    <TableRow
                      key={item.id}
                      className={selectedEquipmentIds.has(item.id) ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <BulkSelectCheckbox
                          checked={selectedEquipmentIds.has(item.id)}
                          onCheckedChange={() => handleSelectEquipment(item.id)}
                        />
                      </TableCell>
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
                        {(() => {
                          const ipAddresses = getIPAssignments(item.id);
                          if (ipAddresses.length === 0) {
                            return (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Not assigned</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAssignIP(item.id)}
                                  className="h-6 w-6 p-0"
                                  title="Assign IP Address"
                                >
                                  <Link className="h-3 w-3 text-green-500" />
                                </Button>
                              </div>
                            );
                          }

                          if (ipAddresses.length === 1) {
                            return (
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {ipAddresses[0].address}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUnassignIP(item.id)}
                                  className="h-6 w-6 p-0"
                                  title="Unassign IP Address"
                                >
                                  <Unlink className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            );
                          }

                          // Multiple IP addresses - show first one with indicator
                          return (
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {ipAddresses[0].address}
                              </Badge>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-6 px-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm hover:from-blue-600 hover:to-indigo-600">
                                    <Network className="h-3 w-3 mr-1" />
                                    +{ipAddresses.length - 1} more
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="start">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <Network className="h-4 w-4 text-blue-500" />
                                        All IP Addresses ({ipAddresses.length})
                                      </h4>
                                    </div>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                      {ipAddresses.map((ip, index) => (
                                        <div
                                          key={ip.id}
                                          className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                                              {index + 1}
                                            </div>
                                            <span className="font-mono text-sm font-medium">{ip.address}</span>
                                          </div>
                                          <Badge variant="outline" className="text-xs">
                                            {ip.status}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnassignIP(item.id)}
                                className="h-6 w-6 p-0"
                                title="Manage IP Addresses"
                              >
                                <Unlink className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          );
                        })()}
                      </TableCell>
                      {isEquipmentFeatureEnabled("showRealTimeStatusColumn") && (
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
                      )}
                      {isEquipmentFeatureEnabled("showResponseTimeColumn") && (
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
                      )}
                      {isEquipmentFeatureEnabled("showSignalStrengthColumn") && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Signal className={`h-3 w-3 ${getSignalStrengthColor(signalStrength)}`} />
                            <span className="text-sm font-medium">{Math.round(signalStrength)}%</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{item.location || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{item.operator || "Unassigned"}</TableCell>
                      {isEquipmentFeatureEnabled("showLastSeenColumn") && (
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
                      )}
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
                            onClick={() => handleDeleteClick(item)}
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto dialog-scroll">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>
              Update equipment information. IP addresses are managed separately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Equipment Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Haul Truck CAT 797F"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Equipment Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
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
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., 797F"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-manufacturer">Manufacturer</Label>
                <Select value={formData.manufacturer} onValueChange={(value) => setFormData({ ...formData, manufacturer: value })}>
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
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="e.g., CAT797F-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-macAddress">MAC Address (Optional)</Label>
                <Input
                  id="edit-macAddress"
                  value={formData.macAddress}
                  onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                  placeholder="Will be assigned later if not provided"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Pit A - Level 3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-operator">Operator</Label>
              <Input
                id="edit-operator"
                value={formData.operator}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                placeholder="e.g., John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about the equipment..."
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

      {/* Enhanced Import Dialog */}
      <EnhancedImportDialog
        isOpen={isEnhancedImportDialogOpen}
        onClose={() => {
          console.log("Closing enhanced import dialog");
          setIsEnhancedImportDialogOpen(false);
        }}
        onSuccess={() => {
          console.log("Import successful, refreshing equipment list");
          fetchEquipmentData();
        }}
      />

      {/* Enhanced Export Dialog */}
      <EnhancedExportDialog
        isOpen={isEnhancedExportDialogOpen}
        onClose={() => {
          console.log("Closing enhanced export dialog");
          setIsEnhancedExportDialogOpen(false);
        }}
        equipment={equipment}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmation.isOpen} onOpenChange={(open) => {
        if (!open) {
          setDeleteConfirmation({ isOpen: false, equipmentId: null, equipmentName: null });
        }
      }}>
        <DialogContent className="sm:max-w-[500px] border-2 border-red-200 dark:border-red-900">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Delete Equipment</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleteConfirmation.equipmentName}</span>?
            </p>
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <p className="text-sm text-red-900 dark:text-red-100">
                ⚠️ This equipment will be permanently removed from the system.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmation({ isOpen: false, equipmentId: null, equipmentName: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEquipment}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
          <Card className={`min-w-[300px] shadow-lg border-2 ${toast.type === "success" ? "border-green-500 bg-green-50 dark:bg-green-950/30" :
              toast.type === "error" ? "border-red-500 bg-red-50 dark:bg-red-950/30" :
                "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            }`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start space-x-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${toast.type === "success" ? "bg-green-100 dark:bg-green-950/50" :
                    toast.type === "error" ? "bg-red-100 dark:bg-red-950/50" :
                      "bg-blue-100 dark:bg-blue-950/50"
                  }`}>
                  {toast.type === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {toast.type === "error" && <XCircle className="h-5 w-5 text-red-600" />}
                  {toast.type === "info" && <AlertTriangle className="h-5 w-5 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${toast.type === "success" ? "text-green-900 dark:text-green-100" :
                      toast.type === "error" ? "text-red-900 dark:text-red-100" :
                        "text-blue-900 dark:text-blue-100"
                    }`}>
                    {toast.message}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setToast(null)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedEquipmentIds.size}
        totalCount={filteredEquipment.length}
        onClear={handleClearEquipmentSelection}
        onSelectAll={handleSelectAllEquipment}
        actions={[
          {
            id: "delete",
            label: "Delete Selected",
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive",
            onClick: () => setBulkDeleteDialogOpen(true),
          },
          {
            id: "export",
            label: "Export Selection",
            icon: <Download className="h-4 w-4" />,
            variant: "outline",
            onClick: handleExportSelectedEquipment,
          },
        ]}
      />

      {/* Bulk Delete Confirmation */}
      <BulkConfirmationDialog
        isOpen={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDeleteEquipment}
        title="Delete Equipment"
        description="Are you sure you want to delete this equipment?"
        items={getSelectedEquipmentItems()}
        confirmText="Delete All"
        variant="danger"
        isLoading={bulkActionLoading}
        warningMessage="⚠️ This action cannot be undone. All selected equipment and their IP assignments will be permanently removed from the system."
      />

    </div>
  );
}
