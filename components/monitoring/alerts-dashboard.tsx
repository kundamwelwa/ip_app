"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Bell,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Check,
  Loader2,
  Shield,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";

// Types
interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  equipmentId?: string;
  ipAddressId?: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  isResolved: boolean;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
  equipment?: {
    id: string;
    name: string;
    type: string;
  };
  ipAddress?: {
    id: string;
    address: string;
  };
  acknowledger?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  rejecter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  resolver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AlertStats {
  total: number;
  byStatus: {
    pending: number;
    acknowledged: number;
    approved: number;
    rejected: number;
    resolved: number;
  };
  bySeverity: {
    critical: number;
    error: number;
    warning: number;
    info: number;
    low: number;
  };
  metrics: {
    resolutionRate: number;
    avgResolutionTimeHours: number;
    activeAlerts: number;
    requiresAttention: number;
  };
}

interface AlertsDashboardProps {
  session: any;
}

export function AlertsDashboard({ session }: AlertsDashboardProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");

  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      emailEnabled: true,
      emailRecipients: "",
      criticalOnly: false,
      digestFrequency: "realtime", // realtime, hourly, daily
    },
    autoAcknowledge: {
      enabled: false,
      afterMinutes: 30,
      severityThreshold: "WARNING", // Only auto-acknowledge WARNING and below
    },
    retention: {
      resolvedDays: 30,
      rejectedDays: 15,
      autoArchive: true,
    },
    escalation: {
      enabled: false,
      escalateAfterHours: 24,
      escalateTo: "",
    },
    alertTypes: {
      EQUIPMENT_OFFLINE: true,
      IP_CONFLICT: true,
      MESH_WEAK_SIGNAL: true,
      MAINTENANCE_REQUIRED: true,
      NETWORK_DISCONNECTION: true,
      SECURITY_BREACH: true,
      SYSTEM_ERROR: true,
      EQUIPMENT_ADDED: false,
      EQUIPMENT_UPDATED: false,
      EQUIPMENT_DELETED: false,
      IP_ASSIGNED: false,
      IP_UNASSIGNED: false,
      IP_ADDRESS_ADDED: false,
      IP_ADDRESS_UPDATED: false,
      IP_ADDRESS_DELETED: false,
      USER_CREATED: false,
      USER_UPDATED: false,
      USER_DELETED: false,
      CONFIG_CHANGED: true,
    },
    severityThresholds: {
      cpuUsage: 80,
      memoryUsage: 85,
      diskUsage: 90,
      signalStrength: 30,
    },
  });

  const userRole = session?.user?.role || "TECHNICIAN";
  const isAdmin = userRole === "ADMIN";
  const isManager = userRole === "MANAGER";

  // Fetch alerts
  const fetchAlerts = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterSeverity !== "all") params.append("severity", filterSeverity);
      if (filterType !== "all") params.append("type", filterType);
      params.append("limit", "100");

      const response = await fetch(`/api/alerts?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch alerts");

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/alerts/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAlerts(false);
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [filterStatus, filterSeverity, filterType]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAlerts(false);
    fetchStats();
  };

  // Handle acknowledge
  const handleAcknowledge = async (alertId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to acknowledge alert");
      }

      await fetchAlerts(false);
      await fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to acknowledge alert");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle approve (Admin only)
  const handleApprove = async (alertId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/alerts/${alertId}/approve`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve alert");
      }

      await fetchAlerts(false);
      await fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve alert");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject (Admin only)
  const handleRejectSubmit = async () => {
    if (!selectedAlert) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/alerts/${selectedAlert.id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject alert");
      }

      setRejectDialogOpen(false);
      setRejectionReason("");
      await fetchAlerts(false);
      await fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject alert");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle resolve
  const handleResolveSubmit = async () => {
    if (!selectedAlert) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/alerts/${selectedAlert.id}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionNote }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to resolve alert");
      }

      setResolveDialogOpen(false);
      setResolutionNote("");
      await fetchAlerts(false);
      await fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resolve alert");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle settings save
  const handleSaveSettings = async () => {
    try {
      setActionLoading(true);
      // TODO: Implement API endpoint to save settings
      // For now, just save to localStorage
      localStorage.setItem("alertSettings", JSON.stringify(settings));
      alert("Settings saved successfully!");
      setSettingsDialogOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setActionLoading(false);
    }
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("alertSettings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (err) {
        console.error("Failed to load saved settings:", err);
      }
    }
  }, []);

  // Filter alerts based on search and tab
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.equipment?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.ipAddress?.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "pending" && alert.status === "PENDING") ||
      (activeTab === "acknowledged" && alert.status === "ACKNOWLEDGED") ||
      (activeTab === "approved" && alert.status === "APPROVED") ||
      (activeTab === "needsApproval" && (alert.status === "PENDING" || alert.status === "ACKNOWLEDGED")) ||
      (activeTab === "resolved" && alert.status === "RESOLVED");

    return matchesSearch && matchesTab;
  });

  const getSeverityBadge = (severity: string) => {
    const colors = {
      CRITICAL: "bg-red-600 text-white hover:bg-red-700",
      ERROR: "bg-red-500 text-white hover:bg-red-600",
      WARNING: "bg-yellow-500 text-white hover:bg-yellow-600",
      INFO: "bg-blue-500 text-white hover:bg-blue-600",
      LOW: "bg-gray-500 text-white hover:bg-gray-600",
    };

    return (
      <Badge className={colors[severity as keyof typeof colors] || "bg-gray-500"}>
        {severity}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      PENDING: "bg-orange-500 text-white",
      ACKNOWLEDGED: "bg-blue-500 text-white",
      APPROVED: "bg-green-500 text-white",
      REJECTED: "bg-red-500 text-white",
      RESOLVED: "bg-gray-500 text-white",
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || "bg-gray-500"}>
        {status}
      </Badge>
    );
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "ERROR":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "INFO":
        return <Bell className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date().getTime();
    const then = new Date(dateString).getTime();
    const diff = now - then;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Alerts</h1>
          <p className="text-muted-foreground">
            Monitor and manage system alerts with role-based approval workflow
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isAdmin && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSettingsDialogOpen(true)}
            >
            <Settings className="h-4 w-4 mr-2" />
              Settings
          </Button>
          )}
        </div>
      </div>

      {/* Role Badge */}
      <div className="flex items-center space-x-2">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Your Role:</span>
        <Badge variant={isAdmin ? "default" : "outline"}>
          {userRole}
        </Badge>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
                {stats.metrics.activeAlerts} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.byStatus.pending}
              </div>
            <p className="text-xs text-muted-foreground">
                Needs attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.bySeverity.critical}
              </div>
            <p className="text-xs text-muted-foreground">
                Urgent issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.byStatus.resolved}
              </div>
            <p className="text-xs text-muted-foreground">
                {stats.metrics.resolutionRate.toFixed(1)}% rate
            </p>
          </CardContent>
        </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Resolution</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.metrics.avgResolutionTimeHours.toFixed(1)}h
      </div>
              <p className="text-xs text-muted-foreground">
                Average time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/40 p-1 grid w-full grid-cols-6 gap-1">
          <TabsTrigger 
            value="all"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            All Alerts
          </TabsTrigger>
          <TabsTrigger 
            value="pending"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            <div className="flex items-center gap-2">
              <span>Pending</span>
              {stats && stats.byStatus.pending > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                  {stats.byStatus.pending}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger 
              value="needsApproval"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
            >
              <div className="flex items-center gap-2">
                <span>Needs Approval</span>
                {stats && (stats.byStatus.pending + stats.byStatus.acknowledged > 0) && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0">
                    {stats.byStatus.pending + stats.byStatus.acknowledged}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="acknowledged"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            Acknowledged
          </TabsTrigger>
          <TabsTrigger 
            value="approved"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            Approved
          </TabsTrigger>
          <TabsTrigger 
            value="resolved"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            Resolved
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

        {/* Alert List */}
        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all" && "All Alerts"}
                {activeTab === "pending" && "Pending Alerts"}
                {activeTab === "needsApproval" && "Alerts Needing Approval"}
                {activeTab === "acknowledged" && "Acknowledged Alerts"}
                {activeTab === "approved" && "Approved Alerts"}
                {activeTab === "resolved" && "Resolved Alerts"}
              </CardTitle>
              <CardDescription>
                {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Alert</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                      <TableHead>Related</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAlerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No alerts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                            {getAlertIcon(alert.severity)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{alert.title}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {alert.message}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {alert.type.replace(/_/g, ' ')}
                              </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(alert.severity)}
                      </TableCell>
                      <TableCell>
                            {getStatusBadge(alert.status)}
                      </TableCell>
                      <TableCell>
                            {alert.equipment && (
                              <div className="text-sm">
                                <div className="font-medium">{alert.equipment.name}</div>
                                <div className="text-muted-foreground">
                                  {alert.equipment.type}
                          </div>
                              </div>
                            )}
                            {alert.ipAddress && (
                              <div className="text-sm font-mono">
                                {alert.ipAddress.address}
                        </div>
                          )}
                            {!alert.equipment && !alert.ipAddress && (
                              <span className="text-muted-foreground">—</span>
                          )}
                      </TableCell>
                      <TableCell>
                            <div className="text-sm">
                              <div>{formatRelativeTime(alert.createdAt)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(alert.createdAt)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedAlert(alert);
                                  setViewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {/* Acknowledge button */}
                              {alert.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                                  onClick={() => handleAcknowledge(alert.id)}
                                  disabled={actionLoading}
                            >
                                  <Check className="h-4 w-4" />
                            </Button>
                          )}

                              {/* Approve button (Admin only) */}
                              {isAdmin && (alert.status === "PENDING" || alert.status === "ACKNOWLEDGED") && (
                          <Button
                            size="sm"
                            variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleApprove(alert.id)}
                                  disabled={actionLoading}
                          >
                                  <ThumbsUp className="h-4 w-4" />
                          </Button>
                              )}

                              {/* Reject button (Admin only) */}
                              {isAdmin && (alert.status === "PENDING" || alert.status === "ACKNOWLEDGED") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    setSelectedAlert(alert);
                                    setRejectDialogOpen(true);
                                  }}
                                  disabled={actionLoading}
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </Button>
                              )}

                              {/* Resolve button */}
                              {!alert.isResolved && 
                               (isAdmin || isManager || 
                                (alert.status === "ACKNOWLEDGED" || alert.status === "APPROVED")) && (
                          <Button
                            size="sm"
                            variant="outline"
                                  onClick={() => {
                                    setSelectedAlert(alert);
                                    setResolveDialogOpen(true);
                                  }}
                                  disabled={actionLoading}
                                >
                                  <CheckCircle className="h-4 w-4" />
                          </Button>
                              )}
                        </div>
                      </TableCell>
                    </TableRow>
                      ))
                    )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Alert Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedAlert && getAlertIcon(selectedAlert.severity)}
              <span>Alert Details</span>
            </DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-6">
              {/* Alert Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Severity</Label>
                  <div className="mt-1">{getSeverityBadge(selectedAlert.severity)}</div>
                        </div>
                        <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedAlert.status)}</div>
                        </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold">Title</Label>
                  <p className="mt-1 text-sm">{selectedAlert.title}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold">Message</Label>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedAlert.message}</p>
                </div>
                          <div>
                  <Label className="text-sm font-semibold">Type</Label>
                  <p className="mt-1 text-sm">{selectedAlert.type.replace(/_/g, ' ')}</p>
                          </div>
                <div>
                  <Label className="text-sm font-semibold">Created</Label>
                  <p className="mt-1 text-sm">{formatDate(selectedAlert.createdAt)}</p>
                </div>
              </div>

              {/* Related Entities */}
              {(selectedAlert.equipment || selectedAlert.ipAddress) && (
                <div>
                  <Label className="text-sm font-semibold">Related To</Label>
                  {selectedAlert.equipment && (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">{selectedAlert.equipment.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedAlert.equipment.type}</p>
                    </div>
                  )}
                  {selectedAlert.ipAddress && (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-mono">{selectedAlert.ipAddress.address}</p>
                        </div>
                  )}
                </div>
              )}

              {/* Workflow Info */}
              <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-semibold">Workflow History</Label>
                
                {selectedAlert.acknowledger && (
                  <div className="flex items-start space-x-3">
                    <Check className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Acknowledged</p>
                      <p className="text-xs text-muted-foreground">
                        by {selectedAlert.acknowledger.firstName} {selectedAlert.acknowledger.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(selectedAlert.acknowledgedAt!)}
                      </p>
                        </div>
                  </div>
                )}

                {selectedAlert.approver && (
                  <div className="flex items-start space-x-3">
                    <ThumbsUp className="h-4 w-4 text-green-500 mt-0.5" />
                        <div>
                      <p className="text-sm font-medium">Approved</p>
                      <p className="text-xs text-muted-foreground">
                        by {selectedAlert.approver.firstName} {selectedAlert.approver.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(selectedAlert.approvedAt!)}
                      </p>
                        </div>
                  </div>
                )}

                {selectedAlert.rejecter && (
                  <div className="flex items-start space-x-3">
                    <ThumbsDown className="h-4 w-4 text-red-500 mt-0.5" />
                          <div>
                      <p className="text-sm font-medium">Rejected</p>
                      <p className="text-xs text-muted-foreground">
                        by {selectedAlert.rejecter.firstName} {selectedAlert.rejecter.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(selectedAlert.rejectedAt!)}
                      </p>
                      {selectedAlert.resolutionNote && (
                        <p className="text-xs mt-1 italic">{selectedAlert.resolutionNote}</p>
                      )}
                          </div>
                  </div>
                )}

                {selectedAlert.resolver && (
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Resolved</p>
                      <p className="text-xs text-muted-foreground">
                        by {selectedAlert.resolver.firstName} {selectedAlert.resolver.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(selectedAlert.resolvedAt!)}
                      </p>
                      {selectedAlert.resolutionNote && (
                        <p className="text-xs mt-1 italic">{selectedAlert.resolutionNote}</p>
                      )}
                        </div>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              {selectedAlert.details && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold">Additional Details</Label>
                  <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedAlert.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Alert</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this alert
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
                        </div>
          </div>
          <DialogFooter>
                            <Button
                              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}
                            >
              Cancel
                            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Reject Alert
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Add a resolution note for this alert
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resolution-note">Resolution Note (Optional)</Label>
              <Textarea
                id="resolution-note"
                placeholder="Describe how this alert was resolved..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
                            <Button
                              variant="outline"
              onClick={() => {
                setResolveDialogOpen(false);
                setResolutionNote("");
              }}
                            >
              Cancel
                            </Button>
            <Button
              onClick={handleResolveSubmit}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve Alert
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Alert System Settings</span>
            </DialogTitle>
            <DialogDescription>
              Configure alert notifications, thresholds, and system behavior
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="autoActions">Auto Actions</TabsTrigger>
              <TabsTrigger value="alertTypes">Alert Types</TabsTrigger>
              <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
              <TabsTrigger value="retention">Retention</TabsTrigger>
            </TabsList>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for alerts
                    </p>
                        </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailEnabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        emailEnabled: e.target.checked
                      }
                    })}
                    className="h-4 w-4"
                  />
                </div>

                {settings.notifications.emailEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email-recipients">Email Recipients</Label>
                      <Input
                        id="email-recipients"
                        placeholder="user1@example.com, user2@example.com"
                        value={settings.notifications.emailRecipients}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            emailRecipients: e.target.value
                          }
                        })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated list of email addresses
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Critical Alerts Only</Label>
                        <p className="text-xs text-muted-foreground">
                          Only send emails for critical and error severity alerts
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.criticalOnly}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            criticalOnly: e.target.checked
                          }
                        })}
                        className="h-4 w-4"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="digest-frequency">Digest Frequency</Label>
                      <Select
                        value={settings.notifications.digestFrequency}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            digestFrequency: value
                          }
                        })}
                      >
                        <SelectTrigger id="digest-frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realtime">Real-time (Instant)</SelectItem>
                          <SelectItem value="hourly">Hourly Digest</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Auto Actions Tab */}
            <TabsContent value="autoActions" className="space-y-4 mt-4">
              <div className="space-y-6">
                {/* Auto Acknowledge */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Auto Acknowledge</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically acknowledge low-priority alerts after a time period
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoAcknowledge.enabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        autoAcknowledge: {
                          ...settings.autoAcknowledge,
                          enabled: e.target.checked
                        }
                      })}
                      className="h-4 w-4"
                    />
                  </div>

                  {settings.autoAcknowledge.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="auto-ack-time">Time Before Auto-Acknowledge (minutes)</Label>
                        <Input
                          id="auto-ack-time"
                          type="number"
                          min="5"
                          max="1440"
                          value={settings.autoAcknowledge.afterMinutes}
                          onChange={(e) => setSettings({
                            ...settings,
                            autoAcknowledge: {
                              ...settings.autoAcknowledge,
                              afterMinutes: parseInt(e.target.value)
                            }
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="severity-threshold">Maximum Severity Level</Label>
                        <Select
                          value={settings.autoAcknowledge.severityThreshold}
                          onValueChange={(value) => setSettings({
                            ...settings,
                            autoAcknowledge: {
                              ...settings.autoAcknowledge,
                              severityThreshold: value
                            }
                          })}
                        >
                          <SelectTrigger id="severity-threshold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low Only</SelectItem>
                            <SelectItem value="INFO">Info and Below</SelectItem>
                            <SelectItem value="WARNING">Warning and Below</SelectItem>
                            <SelectItem value="ERROR">Error and Below</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Critical alerts will never be auto-acknowledged
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Escalation */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Alert Escalation</Label>
                      <p className="text-sm text-muted-foreground">
                        Escalate unresolved critical alerts to management
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.escalation.enabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        escalation: {
                          ...settings.escalation,
                          enabled: e.target.checked
                        }
                      })}
                      className="h-4 w-4"
                    />
                  </div>

                  {settings.escalation.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="escalate-time">Escalate After (hours)</Label>
                        <Input
                          id="escalate-time"
                          type="number"
                          min="1"
                          max="168"
                          value={settings.escalation.escalateAfterHours}
                          onChange={(e) => setSettings({
                            ...settings,
                            escalation: {
                              ...settings.escalation,
                              escalateAfterHours: parseInt(e.target.value)
                            }
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="escalate-to">Escalate To</Label>
                        <Input
                          id="escalate-to"
                          placeholder="manager@example.com"
                          value={settings.escalation.escalateTo}
                          onChange={(e) => setSettings({
                            ...settings,
                            escalation: {
                              ...settings.escalation,
                              escalateTo: e.target.value
                            }
                          })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Alert Types Tab */}
            <TabsContent value="alertTypes" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Enable/Disable Alert Types</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Control which types of alerts are generated by the system
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(settings.alertTypes).map(([type, enabled]) => (
                    <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                      <Label className="text-sm font-medium cursor-pointer">
                        {type.replace(/_/g, ' ')}
                      </Label>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          alertTypes: {
                            ...settings.alertTypes,
                            [type]: e.target.checked
                          }
                        })}
                        className="h-4 w-4"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Thresholds Tab */}
            <TabsContent value="thresholds" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">System Thresholds</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure threshold values that trigger alerts
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpu-threshold">CPU Usage Alert Threshold (%)</Label>
                  <Input
                    id="cpu-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.severityThresholds.cpuUsage}
                    onChange={(e) => setSettings({
                      ...settings,
                      severityThresholds: {
                        ...settings.severityThresholds,
                        cpuUsage: parseInt(e.target.value)
                      }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert when CPU usage exceeds this percentage
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memory-threshold">Memory Usage Alert Threshold (%)</Label>
                  <Input
                    id="memory-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.severityThresholds.memoryUsage}
                    onChange={(e) => setSettings({
                      ...settings,
                      severityThresholds: {
                        ...settings.severityThresholds,
                        memoryUsage: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disk-threshold">Disk Usage Alert Threshold (%)</Label>
                  <Input
                    id="disk-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.severityThresholds.diskUsage}
                    onChange={(e) => setSettings({
                      ...settings,
                      severityThresholds: {
                        ...settings.severityThresholds,
                        diskUsage: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signal-threshold">Minimum Signal Strength (%)</Label>
                  <Input
                    id="signal-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.severityThresholds.signalStrength}
                    onChange={(e) => setSettings({
                      ...settings,
                      severityThresholds: {
                        ...settings.severityThresholds,
                        signalStrength: parseInt(e.target.value)
                      }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert when signal strength falls below this percentage
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Retention Tab */}
            <TabsContent value="retention" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Data Retention Policies</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure how long alerts are kept in the system
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolved-retention">Resolved Alerts Retention (days)</Label>
                  <Input
                    id="resolved-retention"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.retention.resolvedDays}
                    onChange={(e) => setSettings({
                      ...settings,
                      retention: {
                        ...settings.retention,
                        resolvedDays: parseInt(e.target.value)
                      }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Delete resolved alerts after this many days
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rejected-retention">Rejected Alerts Retention (days)</Label>
                  <Input
                    id="rejected-retention"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.retention.rejectedDays}
                    onChange={(e) => setSettings({
                      ...settings,
                      retention: {
                        ...settings.retention,
                        rejectedDays: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Auto-Archive</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically archive old alerts based on retention policies
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.retention.autoArchive}
                    onChange={(e) => setSettings({
                      ...settings,
                      retention: {
                        ...settings.retention,
                        autoArchive: e.target.checked
                      }
                    })}
                    className="h-4 w-4"
                  />
                </div>
              </div>
        </TabsContent>
      </Tabs>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setSettingsDialogOpen(false);
                // Reload settings from localStorage to discard changes
                const savedSettings = localStorage.getItem("alertSettings");
                if (savedSettings) {
                  setSettings(JSON.parse(savedSettings));
                }
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
