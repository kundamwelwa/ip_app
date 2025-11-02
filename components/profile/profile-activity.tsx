"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Network,
  Loader2,
} from "lucide-react";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  _count?: {
    ipAssignments: number;
    auditLogs: number;
    reports: number;
  };
}

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  details?: any;
}

interface ProfileActivityProps {
  profile: UserProfile;
}

export function ProfileActivity({ profile }: ProfileActivityProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/profile/activity?limit=20");
      if (!response.ok) throw new Error("Failed to fetch activities");

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err) {
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const actionTypes = {
      IP_ASSIGNED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      IP_UNASSIGNED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      REPORT_GENERATED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      ALERT_ACKNOWLEDGED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      ALERT_RESOLVED: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    };

    const color = actionTypes[action as keyof typeof actionTypes] || "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";

    return (
      <Badge className={color}>
        {action.replace(/_/g, " ")}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Activity Stats */}
      <div className="md:col-span-3">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IP Assignments</CardTitle>
              <Network className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {profile._count?.ipAssignments || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total IP addresses assigned
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
              <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {profile._count?.reports || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                System reports created
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
              <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {profile._count?.auditLogs || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Logged activities
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest actions in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Action</TableHead>
                    <TableHead className="font-semibold">Entity Type</TableHead>
                    <TableHead className="font-semibold">Date & Time</TableHead>
                    <TableHead className="font-semibold">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id} className="hover:bg-muted/50">
                      <TableCell>
                        {getActionBadge(activity.action)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">
                          {activity.entityType.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDate(activity.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground max-w-xs truncate">
                          {activity.details && typeof activity.details === "object"
                            ? Object.entries(activity.details)
                                .slice(0, 2)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(", ")
                            : "—"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

