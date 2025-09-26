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
  Zap,
  Eye,
  EyeOff,
  Play,
  Pause,
  Square,
  RefreshCw,
  Settings,
  Trash2,
  Edit
} from "lucide-react";

// Types
interface IPConflict {
  id: string;
  ipAddress: string;
  conflictingEquipment: string[];
  equipmentDetails: {
    id: string;
    name: string;
    type: string;
    location: string;
    lastSeen: Date;
    macAddress: string;
    status: "online" | "offline" | "unknown";
  }[];
  detectedAt: Date;
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "investigating" | "resolved" | "false_positive";
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  notes?: string;
}

interface ConflictResolution {
  id: string;
  conflictId: string;
  action: "reassign" | "reserve" | "block" | "investigate" | "ignore";
  targetEquipment: string;
  newIPAddress?: string;
  performedBy: string;
  performedAt: Date;
  notes: string;
  status: "pending" | "completed" | "failed";
}

interface ConflictRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    type: "duplicate_ip" | "unauthorized_device" | "rogue_ap" | "dhcp_conflict";
    threshold: number;
    timeWindow: number;
  };
  actions: {
    type: "alert" | "block" | "reassign" | "investigate";
    severity: "low" | "medium" | "high" | "critical";
  };
  createdAt: Date;
  updatedAt: Date;
}

export function IPConflictDashboard() {
  const [activeTab, setActiveTab] = useState("conflicts");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<IPConflict | null>(null);

  // Mock data - In a real application, this would come from API calls
  const [conflicts, setConflicts] = useState<IPConflict[]>([
    {
      id: "CFL001",
      ipAddress: "192.168.1.12",
      conflictingEquipment: ["Excavator 002", "Unknown Device"],
      equipmentDetails: [
        {
          id: "EQ002",
          name: "Excavator 002",
          type: "Excavator",
          location: "Pit B",
          lastSeen: new Date("2024-01-19T15:45:00"),
          macAddress: "00:1B:44:11:3A:B8",
          status: "offline",
        },
        {
          id: "UNKNOWN",
          name: "Unknown Device",
          type: "Unknown",
          location: "Unknown",
          lastSeen: new Date("2024-01-20T10:30:00"),
          macAddress: "00:1B:44:11:3A:C9",
          status: "online",
        },
      ],
      detectedAt: new Date("2024-01-19T15:45:00"),
      severity: "high",
      status: "active",
      notes: "IP conflict detected between Excavator 002 and unknown device",
    },
    {
      id: "CFL002",
      ipAddress: "192.168.1.15",
      conflictingEquipment: ["Drill 003", "Loader 004"],
      equipmentDetails: [
        {
          id: "EQ003",
          name: "Drill 003",
          type: "Drill",
          location: "Pit C",
          lastSeen: new Date("2024-01-20T09:15:00"),
          macAddress: "00:1B:44:11:3A:C8",
          status: "online",
        },
        {
          id: "EQ004",
          name: "Loader 004",
          type: "Loader",
          location: "Pit A",
          lastSeen: new Date("2024-01-20T11:00:00"),
          macAddress: "00:1B:44:11:3A:CA",
          status: "online",
        },
      ],
      detectedAt: new Date("2024-01-20T11:00:00"),
      severity: "critical",
      status: "investigating",
      notes: "Critical IP conflict - both equipment online simultaneously",
    },
    {
      id: "CFL003",
      ipAddress: "192.168.1.20",
      conflictingEquipment: ["Unauthorized Device"],
      equipmentDetails: [
        {
          id: "UNAUTH001",
          name: "Unauthorized Device",
          type: "Unknown",
          location: "Unknown",
          lastSeen: new Date("2024-01-20T12:00:00"),
          macAddress: "00:1B:44:11:3A:CB",
          status: "online",
        },
      ],
      detectedAt: new Date("2024-01-20T12:00:00"),
      severity: "medium",
      status: "resolved",
      resolution: "Blocked unauthorized device",
      resolvedBy: "Admin",
      resolvedAt: new Date("2024-01-20T12:15:00"),
      notes: "Unauthorized device blocked from network",
    },
  ]);

  const [resolutions, setResolutions] = useState<ConflictResolution[]>([
    {
      id: "RES001",
      conflictId: "CFL003",
      action: "block",
      targetEquipment: "Unauthorized Device",
      performedBy: "Admin",
      performedAt: new Date("2024-01-20T12:15:00"),
      notes: "Blocked unauthorized device from network",
      status: "completed",
    },
  ]);

  const [rules, setRules] = useState<ConflictRule[]>([
    {
      id: "RULE001",
      name: "Duplicate IP Detection",
      description: "Detect when multiple devices use the same IP address",
      enabled: true,
      conditions: {
        type: "duplicate_ip",
        threshold: 1,
        timeWindow: 300,
      },
      actions: {
        type: "alert",
        severity: "high",
      },
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      id: "RULE002",
      name: "Unauthorized Device Detection",
      description: "Detect unauthorized devices on the network",
      enabled: true,
      conditions: {
        type: "unauthorized_device",
        threshold: 1,
        timeWindow: 60,
      },
      actions: {
        type: "block",
        severity: "critical",
      },
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      id: "RULE003",
      name: "DHCP Conflict Detection",
      description: "Detect DHCP server conflicts",
      enabled: false,
      conditions: {
        type: "dhcp_conflict",
        threshold: 2,
        timeWindow: 600,
      },
      actions: {
        type: "investigate",
        severity: "medium",
      },
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
  ]);

  const [formData, setFormData] = useState({
    action: "",
    targetEquipment: "",
    newIPAddress: "",
    notes: "",
  });

  // Statistics
  const totalConflicts = conflicts.length;
  const activeConflicts = conflicts.filter(c => c.status === "active").length;
  const investigatingConflicts = conflicts.filter(c => c.status === "investigating").length;
  const resolvedConflicts = conflicts.filter(c => c.status === "resolved").length;
  const criticalConflicts = conflicts.filter(c => c.severity === "critical").length;
  const highConflicts = conflicts.filter(c => c.severity === "high").length;

  const enabledRules = rules.filter(r => r.enabled).length;
  const totalRules = rules.length;

  // Filter functions
  const filteredConflicts = conflicts.filter(conflict => {
    const matchesSearch = conflict.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conflict.conflictingEquipment.some(eq => eq.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === "all" || conflict.status === filterStatus;
    const matchesSeverity = filterSeverity === "all" || conflict.severity === filterSeverity;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: "destructive",
      high: "destructive",
      medium: "secondary",
      low: "outline",
    } as const;

    return (
      <Badge variant={variants[severity as keyof typeof variants] || "outline"}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "destructive",
      investigating: "secondary",
      resolved: "default",
      false_positive: "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case "unknown":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleResolveConflict = (conflict: IPConflict) => {
    setSelectedConflict(conflict);
    setFormData({
      action: "",
      targetEquipment: "",
      newIPAddress: "",
      notes: "",
    });
    setIsResolveDialogOpen(true);
  };

  const handleConfirmResolution = () => {
    if (!selectedConflict) return;

    const newResolution: ConflictResolution = {
      id: `RES${String(resolutions.length + 1).padStart(3, '0')}`,
      conflictId: selectedConflict.id,
      action: formData.action as "reassign" | "reserve" | "block" | "investigate" | "ignore",
      targetEquipment: formData.targetEquipment,
      newIPAddress: formData.newIPAddress,
      performedBy: "Current User",
      performedAt: new Date(),
      notes: formData.notes,
      status: "pending",
    };

    const updatedConflicts = conflicts.map(conflict => 
      conflict.id === selectedConflict.id 
        ? { 
            ...conflict, 
            status: "resolved" as const,
            resolution: formData.notes,
            resolvedBy: "Current User",
            resolvedAt: new Date()
          }
        : conflict
    );

    setResolutions([...resolutions, newResolution]);
    setConflicts(updatedConflicts);
    setIsResolveDialogOpen(false);
    setSelectedConflict(null);
  };

  const handleToggleRule = (ruleId: string) => {
    const updatedRules = rules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, enabled: !rule.enabled, updatedAt: new Date() }
        : rule
    );
    setRules(updatedRules);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      setRules(rules.filter(rule => rule.id !== ruleId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IP Conflict Resolution</h1>
          <p className="text-muted-foreground">
            Detect, investigate, and resolve IP address conflicts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsRuleDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Rules
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conflicts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConflicts}</div>
            <p className="text-xs text-muted-foreground">
              All detected conflicts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeConflicts}</div>
            <p className="text-xs text-muted-foreground">
              {criticalConflicts} critical, {highConflicts} high
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investigating</CardTitle>
            <Eye className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investigatingConflicts}</div>
            <p className="text-xs text-muted-foreground">
              Under investigation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedConflicts}</div>
            <p className="text-xs text-muted-foreground">
              {totalConflicts > 0 ? ((resolvedConflicts / totalConflicts) * 100).toFixed(1) : 0}% resolution rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
          <TabsTrigger value="resolutions">Resolutions</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conflicts..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>IP Conflicts</CardTitle>
              <CardDescription>
                Detected IP address conflicts and their resolution status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Conflicting Equipment</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConflicts.map((conflict) => (
                    <TableRow key={conflict.id}>
                      <TableCell className="font-medium">{conflict.ipAddress}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {conflict.equipmentDetails.map((equipment, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              {getStatusIcon(equipment.status)}
                              <div>
                                <div className="font-medium">{equipment.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {equipment.type} • {equipment.location}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(conflict.severity)}
                          {getSeverityBadge(conflict.severity)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(conflict.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{conflict.detectedAt.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {conflict.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveConflict(conflict)}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
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

        {/* Resolutions Tab */}
        <TabsContent value="resolutions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conflict Resolutions</CardTitle>
              <CardDescription>
                History of conflict resolution actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conflict ID</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target Equipment</TableHead>
                    <TableHead>New IP</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resolutions.map((resolution) => (
                    <TableRow key={resolution.id}>
                      <TableCell className="font-medium">{resolution.conflictId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{resolution.action}</Badge>
                      </TableCell>
                      <TableCell>{resolution.targetEquipment}</TableCell>
                      <TableCell>
                        {resolution.newIPAddress ? (
                          <span className="font-medium">{resolution.newIPAddress}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{resolution.performedBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{resolution.performedAt.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={resolution.status === "completed" ? "default" : "secondary"}>
                          {resolution.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conflict Detection Rules</CardTitle>
              <CardDescription>
                Configure rules for automatic conflict detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{rule.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.conditions.type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(rule.actions.severity)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`h-2 w-2 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-sm">{rule.enabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleRule(rule.id)}
                          >
                            {rule.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRule(rule.id)}
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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conflict Trends</CardTitle>
                <CardDescription>
                  Conflict detection over time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Conflicts</span>
                    <span className="text-sm text-muted-foreground">{totalConflicts}</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Resolved</span>
                    <span className="text-sm text-muted-foreground">{resolvedConflicts}</span>
                  </div>
                  <Progress value={totalConflicts > 0 ? (resolvedConflicts / totalConflicts) * 100 : 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active</span>
                    <span className="text-sm text-muted-foreground">{activeConflicts}</span>
                  </div>
                  <Progress value={totalConflicts > 0 ? (activeConflicts / totalConflicts) * 100 : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rule Performance</CardTitle>
                <CardDescription>
                  Detection rule effectiveness
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Enabled Rules</span>
                    <span className="text-sm text-muted-foreground">{enabledRules}/{totalRules}</span>
                  </div>
                  <Progress value={totalRules > 0 ? (enabledRules / totalRules) * 100 : 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Detection Rate</span>
                    <span className="text-sm text-muted-foreground">95%</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">False Positives</span>
                    <span className="text-sm text-muted-foreground">5%</span>
                  </div>
                  <Progress value={5} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Resolve Conflict Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve IP Conflict</DialogTitle>
            <DialogDescription>
              Resolve conflict for {selectedConflict?.ipAddress}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resolution-action">Resolution Action</Label>
              <Select
                value={formData.action}
                onValueChange={(value) => setFormData({ ...formData, action: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reassign">Reassign IP</SelectItem>
                  <SelectItem value="reserve">Reserve IP</SelectItem>
                  <SelectItem value="block">Block Device</SelectItem>
                  <SelectItem value="investigate">Investigate Further</SelectItem>
                  <SelectItem value="ignore">Ignore (False Positive)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="target-equipment">Target Equipment</Label>
              <Input
                id="target-equipment"
                value={formData.targetEquipment}
                onChange={(e) => setFormData({ ...formData, targetEquipment: e.target.value })}
                placeholder="Equipment to target"
              />
            </div>
            {formData.action === "reassign" && (
              <div>
                <Label htmlFor="new-ip">New IP Address</Label>
                <Input
                  id="new-ip"
                  value={formData.newIPAddress}
                  onChange={(e) => setFormData({ ...formData, newIPAddress: e.target.value })}
                  placeholder="192.168.1.XX"
                />
              </div>
            )}
            <div>
              <Label htmlFor="resolution-notes">Resolution Notes</Label>
              <Textarea
                id="resolution-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Details about the resolution"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmResolution}>Resolve Conflict</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rules Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Detection Rules</DialogTitle>
            <DialogDescription>
              Configure conflict detection rules and thresholds
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• <strong>Duplicate IP Detection:</strong> Detects when multiple devices use the same IP address</p>
              <p>• <strong>Unauthorized Device Detection:</strong> Identifies unknown devices on the network</p>
              <p>• <strong>DHCP Conflict Detection:</strong> Monitors for DHCP server conflicts</p>
              <p>• <strong>Rogue AP Detection:</strong> Identifies unauthorized access points</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Rules</span>
                <span className="text-sm text-muted-foreground">{totalRules}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Enabled Rules</span>
                <span className="text-sm text-muted-foreground">{enabledRules}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Detection Rate</span>
                <span className="text-sm text-muted-foreground">95%</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => setIsRuleDialogOpen(false)}>
              Configure Rules
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
