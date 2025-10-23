"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  XCircle,
  Loader2,
  AlertCircle,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IPConflict {
  ipAddress: string;
  conflictCount: number;
  assignments: {
    id: string;
    equipmentId: string;
    equipmentName: string;
    equipmentType: string;
    equipmentStatus: string;
    location: string;
    assignedAt: string;
    assignedBy: string;
    notes: string | null;
  }[];
}

interface DuplicateEquipment {
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  assignmentCount: number;
  ipAddresses: {
    address: string;
    assignedAt: string;
    notes: string | null;
  }[];
}

interface OrphanedIP {
  address: string;
  subnet: string;
  status: string;
  updatedAt: string;
}

interface ConflictData {
  summary: {
    totalConflicts: number;
    totalDuplicateEquipment: number;
    totalOrphanedIPs: number;
    totalIssues: number;
  };
  conflicts: IPConflict[];
  duplicateEquipment: DuplicateEquipment[];
  orphanedIPs: OrphanedIP[];
}

export function IPConflictDetection() {
  const [data, setData] = useState<ConflictData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchConflicts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/ip-addresses/conflicts");
      
      if (!response.ok) {
        throw new Error("Failed to fetch conflict data");
      }
      
      const conflictData = await response.json();
      setData(conflictData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
  }, []);

  const handleResolveConflict = async (ipAddress: string, keepAssignmentId: string) => {
    if (!confirm(`Are you sure you want to resolve this conflict? This will deactivate all other assignments for ${ipAddress}.`)) {
      return;
    }

    try {
      setResolving(ipAddress);
      const response = await fetch("/api/ip-addresses/conflicts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "resolve_conflict",
          ipAddress,
          keepAssignmentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to resolve conflict");
      }

      alert(`Conflict resolved successfully for ${ipAddress}`);
      await fetchConflicts();
    } catch (err) {
      alert(`Error resolving conflict: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setResolving(null);
    }
  };

  const handleFixOrphaned = async (ipAddress: string) => {
    if (!confirm(`Fix orphaned IP ${ipAddress}? This will set its status to AVAILABLE.`)) {
      return;
    }

    try {
      setResolving(ipAddress);
      const response = await fetch("/api/ip-addresses/conflicts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "fix_orphaned",
          ipAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fix orphaned IP");
      }

      alert(`Orphaned IP ${ipAddress} fixed successfully`);
      await fetchConflicts();
    } catch (err) {
      alert(`Error fixing orphaned IP: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setResolving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Scanning for IP conflicts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
            Error Loading Conflict Data
          </h3>
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <Button onClick={fetchConflicts} className="mt-4" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { summary } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
            IP Conflict Detection
          </h1>
          <p className="text-muted-foreground">
            Detect and resolve IP address conflicts and inconsistencies
          </p>
        </div>
        <Button onClick={fetchConflicts} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Scan Again
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="dashboard-card-title text-sm font-medium">Total Issues</CardTitle>
            {summary.totalIssues > 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <Shield className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`card-number-large ${summary.totalIssues > 0 ? "text-red-600" : "text-green-600"}`}>
              {summary.totalIssues}
            </div>
            <p className="card-text-secondary text-xs">
              {summary.totalIssues === 0 ? "No issues detected" : "Issues require attention"}
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="dashboard-card-title text-sm font-medium">IP Conflicts</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className={`card-number-large ${summary.totalConflicts > 0 ? "text-orange-600" : "text-gray-600"}`}>
              {summary.totalConflicts}
            </div>
            <p className="card-text-secondary text-xs">
              Multiple assignments per IP
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="dashboard-card-title text-sm font-medium">Duplicate Assignments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className={`card-number-large ${summary.totalDuplicateEquipment > 0 ? "text-yellow-600" : "text-gray-600"}`}>
              {summary.totalDuplicateEquipment}
            </div>
            <p className="card-text-secondary text-xs">
              Equipment with multiple IPs
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="dashboard-card-title text-sm font-medium">Orphaned IPs</CardTitle>
            <XCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`card-number-large ${summary.totalOrphanedIPs > 0 ? "text-blue-600" : "text-gray-600"}`}>
              {summary.totalOrphanedIPs}
            </div>
            <p className="card-text-secondary text-xs">
              ASSIGNED status with no assignments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* No Issues Message */}
      {summary.totalIssues === 0 && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                  No Conflicts Detected
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  Your IP address management is in good shape. All IPs are properly assigned without conflicts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Different Issue Types */}
      {summary.totalIssues > 0 && (
        <Tabs defaultValue="conflicts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="conflicts">
              IP Conflicts ({summary.totalConflicts})
            </TabsTrigger>
            <TabsTrigger value="duplicate">
              Duplicate Assignments ({summary.totalDuplicateEquipment})
            </TabsTrigger>
            <TabsTrigger value="orphaned">
              Orphaned IPs ({summary.totalOrphanedIPs})
            </TabsTrigger>
          </TabsList>

          {/* IP Conflicts Tab */}
          <TabsContent value="conflicts" className="space-y-4">
            {data.conflicts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No IP conflicts found.</p>
                </CardContent>
              </Card>
            ) : (
              data.conflicts.map((conflict) => (
                <Card key={conflict.ipAddress} className="border-orange-200 dark:border-orange-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-orange-600">
                          Conflict: {conflict.ipAddress}
                        </CardTitle>
                        <CardDescription>
                          {conflict.conflictCount} active assignments for this IP address
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">{conflict.conflictCount} Assignments</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Equipment</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Assigned At</TableHead>
                          <TableHead>Assigned By</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conflict.assignments.map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell className="font-medium">{assignment.equipmentName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{assignment.equipmentType}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  assignment.equipmentStatus === "ONLINE"
                                    ? "quantum-status-online"
                                    : "quantum-status-offline"
                                }
                              >
                                {assignment.equipmentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>{assignment.location}</TableCell>
                            <TableCell>{new Date(assignment.assignedAt).toLocaleString()}</TableCell>
                            <TableCell>{assignment.assignedBy}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolveConflict(conflict.ipAddress, assignment.id)}
                                disabled={resolving === conflict.ipAddress}
                              >
                                {resolving === conflict.ipAddress ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>Keep This</>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Duplicate Equipment Tab */}
          <TabsContent value="duplicate" className="space-y-4">
            {data.duplicateEquipment.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No duplicate equipment assignments found.</p>
                </CardContent>
              </Card>
            ) : (
              data.duplicateEquipment.map((dup) => (
                <Card key={dup.equipmentId} className="border-yellow-200 dark:border-yellow-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-yellow-600">
                          {dup.equipmentName}
                        </CardTitle>
                        <CardDescription>
                          This equipment has {dup.assignmentCount} IP addresses assigned
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {dup.assignmentCount} IPs
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Assigned At</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dup.ipAddresses.map((ip) => (
                          <TableRow key={ip.address}>
                            <TableCell className="font-medium font-mono">{ip.address}</TableCell>
                            <TableCell>{new Date(ip.assignedAt).toLocaleString()}</TableCell>
                            <TableCell>{ip.notes || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Orphaned IPs Tab */}
          <TabsContent value="orphaned" className="space-y-4">
            {data.orphanedIPs.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No orphaned IP addresses found.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Orphaned IP Addresses</CardTitle>
                  <CardDescription>
                    These IPs are marked as ASSIGNED but have no active assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Subnet</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orphanedIPs.map((ip) => (
                        <TableRow key={ip.address}>
                          <TableCell className="font-medium font-mono">{ip.address}</TableCell>
                          <TableCell>{ip.subnet}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{ip.status}</Badge>
                          </TableCell>
                          <TableCell>{new Date(ip.updatedAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFixOrphaned(ip.address)}
                              disabled={resolving === ip.address}
                            >
                              {resolving === ip.address ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>Fix Status</>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

