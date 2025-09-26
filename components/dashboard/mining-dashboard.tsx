"use client";

import { useState } from "react";
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
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ReservationDialog, ReservationFormData } from "@/components/ip/reservation-dialog";

// Mock data for demonstration
const equipmentData = [
  {
    id: "EQ001",
    name: "Haul Truck CAT 797F",
    type: "Truck",
    ip: "192.168.1.100",
    status: "Online",
    location: "Pit A - Level 3",
    lastSeen: "2 minutes ago",
    meshStrength: 85,
    nodeId: "RAJ-001",
  },
  {
    id: "EQ002",
    name: "Excavator CAT 6020B",
    type: "Excavator",
    ip: "192.168.1.101",
    status: "Online",
    location: "Pit B - Level 2",
    lastSeen: "1 minute ago",
    meshStrength: 92,
    nodeId: "Maj-002",
  },
  {
    id: "EQ003",
    name: "Drill Rig Atlas Copco",
    type: "Drill",
    ip: "192.168.1.102",
    status: "Offline",
    location: "Pit C - Level 1",
    lastSeen: "15 minutes ago",
    meshStrength: 0,
    nodeId: "RAJ-003",
  },
  {
    id: "EQ004",
    name: "Bulldozer CAT D11T",
    type: "Bulldozer",
    ip: "192.168.1.103",
    status: "Maintenance",
    location: "Maintenance Bay",
    lastSeen: "5 minutes ago",
    meshStrength: 78,
    nodeId: "RAJ-004",
  },
];

const networkStats = {
  totalNodes: 24,
  activeNodes: 22,
  meshStrength: 89,
  bandwidth: "2.4 Gbps",
  latency: "12ms",
  uptime: "99.7%",
};

const alerts = [
  {
    id: 1,
    type: "warning",
    message: "Drill Rig Atlas Copco lost mesh connection",
    time: "15 minutes ago",
    equipment: "EQ003",
  },
  {
    id: 2,
    type: "info",
    message: "New equipment detected on network",
    time: "1 hour ago",
    equipment: "EQ005",
  },
  {
    id: 3,
    type: "success",
    message: "Mesh network optimization completed",
    time: "2 hours ago",
    equipment: "System",
  },
];

export function MiningDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [currentIP, setCurrentIP] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Online":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Offline":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Online":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Offline":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "Maintenance":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const handleAssignIP = (ip: string) => {
    setCurrentIP(ip);
    setIsAssignDialogOpen(true);
  };

  const handleReserveIP = (ip: string) => {
    setCurrentIP(ip);
    setIsReserveDialogOpen(true);
  };

  const handleViewDetails = (ip: string) => {
    console.log("Viewing details for IP:", ip);
    // Navigate to detailed view
  };

  const handleUnassign = (ip: string) => {
    console.log("Unassigning IP:", ip);
    // Handle unassignment
  };

  const handleRefresh = (ip: string) => {
    console.log("Refreshing status for IP:", ip);
    // Handle refresh
  };

  const handleConfirmAssignment = (data: AssignmentFormData) => {
    console.log("Assigning IP:", currentIP, "to equipment:", data);
    setIsAssignDialogOpen(false);
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
          <h1 className="text-3xl font-bold tracking-tight">Mining Operations Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of Rajant mesh network and mining equipment
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Activity className="mr-1 h-3 w-3" />
            Live Monitoring
          </Badge>
        </div>
      </div>

      {/* IP Address Checker Section */}
      <IPChecker
        onAssignIP={handleAssignIP}
        onReserveIP={handleReserveIP}
        onViewDetails={handleViewDetails}
        onUnassign={handleUnassign}
        onRefresh={handleRefresh}
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentData.length}</div>
            <p className="text-xs text-muted-foreground">
              {equipmentData.filter(eq => eq.status === "Online").length} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesh Nodes</CardTitle>
            <Router className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.activeNodes}</div>
            <p className="text-xs text-muted-foreground">
              {networkStats.totalNodes} total nodes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Uptime</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.uptime}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesh Strength</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.meshStrength}%</div>
            <p className="text-xs text-muted-foreground">
              Average signal quality
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

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
                  {equipmentData.map((equipment) => (
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
                <CardTitle>Network Performance</CardTitle>
                <CardDescription>Real-time network metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Bandwidth</span>
                    <span className="text-sm text-muted-foreground">{networkStats.bandwidth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Latency</span>
                    <span className="text-sm text-muted-foreground">{networkStats.latency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Mesh Strength</span>
                    <span className="text-sm text-muted-foreground">{networkStats.meshStrength}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Active Nodes</span>
                    <span className="text-sm text-muted-foreground">
                      {networkStats.activeNodes}/{networkStats.totalNodes}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Mesh Strength</TableHead>
                    <TableHead>Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipmentData.map((equipment) => (
                    <TableRow key={equipment.id}>
                      <TableCell className="font-medium">{equipment.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{equipment.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">{equipment.ip}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(equipment.status)}
                          <Badge className={getStatusColor(equipment.status)}>
                            {equipment.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-sm">{equipment.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${equipment.meshStrength}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{equipment.meshStrength}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {equipment.lastSeen}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Mesh Network Topology</CardTitle>
                <CardDescription>Visual representation of the Rajant mesh network</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                  <div className="text-center">
                    <Network className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Network topology visualization
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Interactive mesh network map coming soon
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Node Performance</CardTitle>
                <CardDescription>Individual node performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {equipmentData.map((equipment) => (
                    <div key={equipment.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{equipment.nodeId}</p>
                        <p className="text-xs text-muted-foreground">{equipment.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{equipment.meshStrength}%</p>
                        <p className="text-xs text-muted-foreground">Signal</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Recent alerts and notifications from the mesh network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
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
      </Tabs>

      {/* Quick Actions Section */}
      <QuickActions />

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
    </div>
  );
}
