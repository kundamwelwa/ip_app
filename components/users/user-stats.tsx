"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Briefcase,
  Wrench,
} from "lucide-react";

interface UserStatsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
    managers: number;
    technicians: number;
  };
}

export function UserStats({ stats }: UserStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="border-2 border-blue-200 dark:border-blue-900/50 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {stats.total}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.active} active, {stats.inactive} inactive
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-200 dark:border-green-900/50 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.active}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.total > 0
              ? Math.round((stats.active / stats.total) * 100)
              : 0}
            % of total users
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-red-200 dark:border-red-900/50 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
          <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">
            {stats.inactive}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Suspended or disabled
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-purple-200 dark:border-purple-900/50 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Administrators</CardTitle>
          <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            {stats.admins}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Full system access</p>
        </CardContent>
      </Card>

      <Card className="border-2 border-orange-200 dark:border-orange-900/50 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Managers</CardTitle>
          <Briefcase className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
            {stats.managers}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Management privileges
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-cyan-200 dark:border-cyan-900/50 hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Technicians</CardTitle>
          <Wrench className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">
            {stats.technicians}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Operational access
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

