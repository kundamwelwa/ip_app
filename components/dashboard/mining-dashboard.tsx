"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Wrench,
  Router,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  HardHat,
  Network,
  Shield,
  Loader2,
  RefreshCw,
  Play,
  Pause,
  User,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEquipmentMonitoring } from "@/hooks/use-equipment-monitoring";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IPChecker } from "@/components/ip/ip-checker";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { AssignmentDialog, AssignmentFormData } from "@/components/ip/assignment-dialog";
import { EquipmentSelectionDialog } from "@/components/ip/equipment-selection-dialog";
import { ReservationDialog, ReservationFormData } from "@/components/ip/reservation-dialog";
import { MeshTopology } from "@/components/network/mesh-topology";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ToastContainer } from "@/components/ui/toast-notification";
import { processEquipmentData, calculateNetworkStats, getNetworkHealthColor, getSignalStrengthColor, getUptimeColor } from "@/lib/real-time-data";
import { getTimeAgo, formatDateForDisplay } from "@/lib/time-utils";
import { isDashboardFeatureEnabled } from "@/lib/feature-flags";

// Types for API data
interface DashboardEquipment {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  lastSeen: string;
  meshStrength: number;
  nodeId: string;
  ip: string;
  ipStatus: string;
  operator?: string;
  assignedBy?: string;
  // Real-time data
  isOnline: boolean;
  responseTime?: number;
  uptime: number;
  signalStrength: number;
  lastSeenFormatted: string;
  timeAgo: string;
  statusColor: string;
}

interface NetworkStats {
  totalNodes: number;
  activeNodes: number;
  meshStrength: number;
  bandwidth: string;
  latency: number;
  uptime: number;
  uptimeFormatted?: string;
  averageResponseTime?: number;
  totalDataRate?: number;
  networkHealth?: 'excellent' | 'good' | 'fair' | 'poor';
}

interface Alert {
  id: string;
  type: string;
  message: string;
  time: string;
  equipment: string;
}

interface DashboardData {
  equipment: DashboardEquipment[];
  networkStats: NetworkStats;
  alerts: Alert[];
  recentActivity: {
    id: string;
    action: string;
    user: string;
    entity: string;
    time: string;
  }[];
  ipSummary: {
    total: number;
    assigned: number;
    available: number;
    reserved: number;
    offline: number;
  };
}

export function MiningDashboard() {
  // Set default tab based on enabled features
  const getDefaultTab = () => {
    if (isDashboardFeatureEnabled("showEquipmentSection")) return "equipment";
    if (isDashboardFeatureEnabled("showAlertsSection")) return "alerts";
    if (isDashboardFeatureEnabled("showOverviewTab")) return "overview";
    return "equipment";
  };
  const [selectedTab, setSelectedTab] = useState(getDefaultTab());
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEquipmentSelectionOpen, setIsEquipmentSelectionOpen] = useState(false);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [currentIP, setCurrentIP] = useState("");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Toast notifications
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "warning" | "info" }>>([]);
  
  // Confirmation dialogs
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [unassignIP, setUnassignIP] = useState("");
  const [unassignLoading, setUnassignLoading] = useState(false);

  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Equipment monitoring
  const {
    equipmentStatuses,
    monitoringStatus,
    isLoading: isMonitoringLoading,
    error: monitoringError,
    checkAllEquipment,
    startMonitoring,
    stopMonitoring,
    getOnlineCount,
    getOfflineCount,
  } = useEquipmentMonitoring();

  // Fetch dashboard data function
  const fetchDashboardData = async (useRealTime = false) => {
      try {
        setLoading(true);
      const url = useRealTime ? "/api/dashboard?realTime=true" : "/api/dashboard";
      const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const data = await response.json();
      
      // Process equipment data with real-time information
      const processedEquipment = processEquipmentData(data.equipment, equipmentStatuses);
      const realTimeNetworkStats = calculateNetworkStats(processedEquipment, data.networkStats);
      
      // Update the data with processed real-time information
      const enhancedData = {
        ...data,
        equipment: processedEquipment,
        networkStats: {
          ...data.networkStats,
          ...realTimeNetworkStats
        }
      };
      
      setDashboardData(enhancedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
            Error Loading Dashboard
          </h3>
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p>No dashboard data available</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONLINE":
        return "quantum-status-online";
      case "OFFLINE":
        return "quantum-status-offline";
      case "MAINTENANCE":
        return "quantum-status-maintenance";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ONLINE":
        return <CheckCircle className="h-4 w-4 quantum-signal-excellent" />;
      case "OFFLINE":
        return <XCircle className="h-4 w-4 quantum-signal-poor" />;
      case "MAINTENANCE":
        return <Clock className="h-4 w-4 quantum-signal-fair" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const handleAssignIP = (ip: string) => {
    setCurrentIP(ip);
    setIsEquipmentSelectionOpen(true);
  };

  const handleReserveIP = (ip: string) => {
    setCurrentIP(ip);
    setIsReserveDialogOpen(true);
  };

  const handleViewDetails = (ip: string) => {
    console.log("Viewing details for IP:", ip);
    const equipment = dashboardData?.equipment.find(eq => eq.ip === ip);
    if (equipment) {
      showToast(`Equipment: ${equipment.name} | Status: ${equipment.isOnline ? 'ONLINE' : 'OFFLINE'} | Location: ${equipment.location}`, "info");
    } else {
      showToast(`IP ${ip} is available for assignment`, "info");
    }
  };

  const handleUnassign = (ip: string) => {
    setUnassignIP(ip);
    setUnassignDialogOpen(true);
  };

  const confirmUnassign = async () => {
    if (!unassignIP) return;

    try {
      setUnassignLoading(true);
      const response = await fetch(`/api/ip-assignments?ip=${encodeURIComponent(unassignIP)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to unassign IP address");
      }

      setUnassignDialogOpen(false);
      showToast(`IP address ${unassignIP} has been successfully unassigned and is now available`, "success");
      await fetchDashboardData();
    } catch (error) {
      console.error("Error unassigning IP address:", error);
      showToast(`Failed to unassign IP address: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setUnassignLoading(false);
    }
  };

  const handleRefresh = async (ip: string) => {
    console.log("Refreshing status for IP:", ip);
    await fetchDashboardData();
    showToast(`Status refreshed for IP address ${ip}`, "success");
  };

  const handleConfirmAssignment = (data: AssignmentFormData) => {
    console.log("Assigning IP:", currentIP, "to equipment:", data);
    setIsAssignDialogOpen(false);
  };

  const handleEquipmentSelection = async (equipmentId: string, equipmentName: string) => {
    try {
      // First, check if the IP is already assigned
      const checkResponse = await fetch(`/api/ip-addresses/check?ip=${encodeURIComponent(currentIP)}`);
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.status === "assigned") {
          showToast(`IP address ${currentIP} is already assigned to ${checkData.assignment.equipment.name}. Cannot assign to another equipment.`, "error");
          return;
        }
      }

      const response = await fetch("/api/ip-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ipAddress: currentIP,
          equipmentId: equipmentId,
          notes: `Assigned to ${equipmentName}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign IP address");
      }

      showToast(`IP address ${currentIP} successfully assigned to ${equipmentName}`, "success");
      await fetchDashboardData();
      setIsEquipmentSelectionOpen(false);
      
    } catch (error) {
      console.error("Error assigning IP address:", error);
      showToast(`Failed to assign IP address: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  };

  const handleConfirmReservation = (data: ReservationFormData) => {
    console.log("Reserving IP:", currentIP, "for reason:", data);
    setIsReserveDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 dark:from-blue-400 dark:via-blue-300 dark:to-cyan-400 bg-clip-text text-transparent">
            Welcome to the main Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring of Rajant mesh network and mining equipment
          </p>
        </div>
        {isDashboardFeatureEnabled("showMonitoringControls") && (
          <div className="flex items-center space-x-2">
            <Badge className="quantum-status-online quantum-pulse">
              <Activity className="mr-1 h-3 w-3" />
              Live Monitoring
            </Badge>
            <div className="flex items-center space-x-2">
              {isDashboardFeatureEnabled("showRealTimeCheckButton") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDashboardData(true)}
                  disabled={loading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Real-time Check
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={monitoringStatus.isRunning ? stopMonitoring : () => startMonitoring()}
                disabled={isMonitoringLoading}
              >
                {monitoringStatus.isRunning ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Stop Monitor
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Monitor
                  </>
                )}
              </Button>
              <Badge variant={monitoringStatus.isRunning ? "default" : "secondary"}>
                {monitoringStatus.isRunning ? "Monitoring Active" : "Monitoring Inactive"}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* IP Address Checker Section */}
      {isDashboardFeatureEnabled("ipChecker") && (
        <IPChecker
          onAssignIP={handleAssignIP}
          onReserveIP={handleReserveIP}
          onViewDetails={handleViewDetails}
          onUnassign={handleUnassign}
          onRefresh={handleRefresh}
          onAssignmentComplete={async () => {
            // This will trigger the IP checker to refresh
            console.log("Assignment completed, refreshing IP status");
            await fetchDashboardData();
          }}
        />
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isDashboardFeatureEnabled("showTotalEquipmentsCard") && (
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="dashboard-card-title text-sm font-medium">Total Equipment</CardTitle>
              <Truck className="dashboard-card-icon h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="card-number-large">{dashboardData.equipment.length}</div>
              <p className="card-text-secondary text-xs">
                {equipmentStatuses.length > 0 ? getOnlineCount() : dashboardData.equipment.filter(eq => eq.status === "ONLINE").length} online
                {equipmentStatuses.length > 0 && (
                  <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                    (Real-time: {getOnlineCount()}/{equipmentStatuses.length})
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {isDashboardFeatureEnabled("showTotalIPAddressesCard") && (
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="dashboard-card-title text-sm font-medium">Total IP Addresses</CardTitle>
              <Network className="dashboard-card-icon h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="card-number-large">{dashboardData.ipSummary.total}</div>
              <p className="card-text-secondary text-xs">
                IP addresses in system
              </p>
            </CardContent>
          </Card>
        )}

        {isDashboardFeatureEnabled("showAssignedIPAddressesCard") && (
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="dashboard-card-title text-sm font-medium">Assigned IPs</CardTitle>
              <CheckCircle className="dashboard-card-icon h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="card-number-large text-green-700 dark:text-green-400">{dashboardData.ipSummary.assigned}</div>
              <p className="card-text-secondary text-xs">
                {dashboardData.ipSummary.total > 0 
                  ? `${Math.round((dashboardData.ipSummary.assigned / dashboardData.ipSummary.total) * 100)}% of total`
                  : "No IPs available"}
              </p>
            </CardContent>
          </Card>
        )}

        {isDashboardFeatureEnabled("showUnassignedIPAddressesCard") && (
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="dashboard-card-title text-sm font-medium">Unassigned IPs</CardTitle>
              <XCircle className="dashboard-card-icon h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="card-number-large text-blue-700 dark:text-blue-400">{dashboardData.ipSummary.available}</div>
              <p className="card-text-secondary text-xs">
                Available for assignment
              </p>
            </CardContent>
          </Card>
        )}

        {isDashboardFeatureEnabled("showMeshNodesCard") && (
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="dashboard-card-title text-sm font-medium">Mesh Nodes</CardTitle>
              <Router className="dashboard-card-icon h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="card-number-large">{dashboardData.networkStats.activeNodes}</div>
              <p className="card-text-secondary text-xs">
                {dashboardData.networkStats.totalNodes} total nodes
              </p>
            </CardContent>
          </Card>
        )}

        {isDashboardFeatureEnabled("showNetworkUptimeCard") && (
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="dashboard-card-title text-sm font-medium">Network Uptime</CardTitle>
              <Shield className="dashboard-card-icon h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className={`card-number-large ${getUptimeColor(dashboardData.networkStats.uptime)}`}>
                {dashboardData.networkStats.uptime}%
              </div>
              <p className="card-text-secondary text-xs">
                {dashboardData.networkStats.uptimeFormatted || 'Last 30 days'}
              </p>
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className={`h-2 rounded-full ${
                        dashboardData.networkStats.uptime >= 95 
                          ? 'bg-green-500' 
                          : dashboardData.networkStats.uptime >= 85 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${dashboardData.networkStats.uptime}%` }}
                    ></div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {dashboardData.networkStats.networkHealth || 'good'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isDashboardFeatureEnabled("showMeshStrengthCard") && (
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="dashboard-card-title text-sm font-medium">Mesh Strength</CardTitle>
              <Network className="dashboard-card-icon h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className={`card-number-large ${getSignalStrengthColor(dashboardData.networkStats.meshStrength)}`}>
                {dashboardData.networkStats.meshStrength}%
              </div>
              <p className="card-text-secondary text-xs">
                Average signal quality
              </p>
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className={`h-2 rounded-full ${
                        dashboardData.networkStats.meshStrength >= 80 
                          ? 'bg-blue-500' 
                          : dashboardData.networkStats.meshStrength >= 60 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${dashboardData.networkStats.meshStrength}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {dashboardData.networkStats.averageResponseTime ? `${dashboardData.networkStats.averageResponseTime}ms avg` : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          {isDashboardFeatureEnabled("showOverviewTab") && (
            <TabsTrigger value="overview">Overview</TabsTrigger>
          )}
          {isDashboardFeatureEnabled("showEquipmentSection") && (
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
          )}
          {isDashboardFeatureEnabled("showNetworkTab") && (
            <TabsTrigger value="network">Network</TabsTrigger>
          )}
          {isDashboardFeatureEnabled("showAlertsSection") && (
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          )}
        </TabsList>

        {isDashboardFeatureEnabled("showOverviewTab") && (
          <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Equipment Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Equipment Status</CardTitle>
                <CardDescription>Current status of all mining equipment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.equipment.map((equipment) => (
                    <div key={equipment.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(equipment.status)}
                        <div>
                          <p className="font-medium">{equipment.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {equipment.location}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(equipment.status)}>
                        {equipment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Network Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Real-time Network Performance</CardTitle>
                <CardDescription>Live network metrics and performance data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Bandwidth</span>
                    <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{dashboardData.networkStats.bandwidth}</span>
                      <Badge variant="outline" className="text-xs">
                        Live
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Latency</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        dashboardData.networkStats.latency <= 20 ? 'text-green-700 dark:text-green-400' :
                        dashboardData.networkStats.latency <= 50 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'
                      }`}>
                        {dashboardData.networkStats.latency}ms
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Real-time
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Mesh Strength</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                          className={`h-2 rounded-full ${
                            dashboardData.networkStats.meshStrength >= 80 
                              ? 'bg-blue-500' 
                              : dashboardData.networkStats.meshStrength >= 60 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${dashboardData.networkStats.meshStrength}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${getSignalStrengthColor(dashboardData.networkStats.meshStrength)}`}>
                        {dashboardData.networkStats.meshStrength}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Nodes</span>
                    <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {dashboardData.networkStats.activeNodes}/{dashboardData.networkStats.totalNodes}
                    </span>
                      <Badge variant={dashboardData.networkStats.activeNodes === dashboardData.networkStats.totalNodes ? "default" : "secondary"} className="text-xs">
                        {dashboardData.networkStats.activeNodes === dashboardData.networkStats.totalNodes ? 'All Online' : 'Partial'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Data Rate</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        {dashboardData.networkStats.totalDataRate || 0} Mbps
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Total
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Network Health</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${getNetworkHealthColor(dashboardData.networkStats.networkHealth || 'good')}`}>
                        {dashboardData.networkStats.networkHealth || 'good'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {dashboardData.networkStats.uptime}% uptime
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        )}

        {isDashboardFeatureEnabled("showEquipmentSection") && (
          <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Details</CardTitle>
              <CardDescription>Detailed view of all mining equipment and their network status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Real-time Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>IP Assigned By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.equipment.map((equipment) => {
                    // Use processed equipment data with real-time information
                    const isOnline = equipment.isOnline;
                    const responseTime = equipment.responseTime;
                    const uptime = equipment.uptime;
                    const signalStrength = equipment.signalStrength;
                    const timeAgo = equipment.timeAgo;
                    const lastSeenFormatted = equipment.lastSeenFormatted;
                    
                    return (
                    <TableRow key={equipment.id}>
                      <TableCell className="font-medium">{equipment.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{equipment.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">{equipment.ip}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(isOnline ? "ONLINE" : "OFFLINE")}
                          <Badge className={getStatusColor(isOnline ? "ONLINE" : "OFFLINE")}>
                            {isOnline ? "ONLINE" : "OFFLINE"}
                          </Badge>
                          {isOnline && (
                            <Badge variant="outline" className="text-xs">
                              Real-time
                            </Badge>
                          )}
                          {responseTime && (
                            <span className="text-xs text-muted-foreground">
                              {responseTime}ms
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-sm">{equipment.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {equipment.operator ? (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium">{equipment.operator}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {equipment.ip !== "Not assigned" && equipment.assignedBy ? (
                          <div className="text-sm">
                            <div className="font-medium">{equipment.assignedBy}</div>
                            <div className="text-xs text-muted-foreground">IP Assignment</div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {isDashboardFeatureEnabled("showNetworkTopologySection") && (
          <TabsContent value="network" className="space-y-4">
            <MeshTopology />
          </TabsContent>
        )}

        {isDashboardFeatureEnabled("showAlertsSection") && (
          <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Recent alerts and notifications from the mesh network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.equipment} • {alert.time}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}
      </Tabs>

      {/* Quick Actions Section */}
      {isDashboardFeatureEnabled("showQuickActionsSection") && (
        <QuickActions />
      )}

      {/* Equipment Selection Dialog */}
      <EquipmentSelectionDialog
        isOpen={isEquipmentSelectionOpen}
        onClose={() => setIsEquipmentSelectionOpen(false)}
        ipAddress={currentIP}
        onConfirm={handleEquipmentSelection}
      />

      {/* Assignment Dialog */}
      <AssignmentDialog
        isOpen={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        ipAddress={currentIP}
        onConfirm={handleConfirmAssignment}
      />

      {/* Reservation Dialog */}
      <ReservationDialog
        isOpen={isReserveDialogOpen}
        onClose={() => setIsReserveDialogOpen(false)}
        ipAddress={currentIP}
        onConfirm={handleConfirmReservation}
      />

      {/* Unassign IP Confirmation Dialog */}
      <ConfirmationDialog
        open={unassignDialogOpen}
        onOpenChange={setUnassignDialogOpen}
        title="Unassign IP Address"
        description={`Are you sure you want to unassign IP address ${unassignIP}?`}
        confirmText="Unassign IP"
        cancelText="Cancel"
        onConfirm={confirmUnassign}
        variant="warning"
        loading={unassignLoading}
        details={[
          "The IP address will be freed up for assignment to other equipment",
          "Equipment will lose network connectivity until a new IP is assigned",
        ]}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
