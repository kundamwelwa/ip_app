"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  CheckCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react";

interface AnalyticsData {
  totalReports: number;
  completedReports: number;
  generatingReports: number;
  failedReports: number;
  avgGenerationTime: number;
  successRate: number;
  reportsThisWeek: number;
  reportsThisMonth: number;
  reportsByType: {
    type: string;
    count: number;
    percentage: number;
  }[];
  recentTrends: {
    label: string;
    value: number;
    trend: "up" | "down" | "stable";
    percentage: number;
  }[];
}

interface ReportAnalyticsProps {
  data: AnalyticsData;
}

export function ReportAnalytics({ data }: ReportAnalyticsProps) {
  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      "Equipment Status": "bg-blue-500",
      "IP Management": "bg-purple-500",
      "Network Performance": "bg-cyan-500",
      "Maintenance": "bg-orange-500",
      "Alerts": "bg-red-500",
      "Custom": "bg-gray-500",
    };
    return colors[type as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-blue-200 dark:border-blue-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {data.totalReports}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time generated</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 dark:border-green-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {data.successRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.completedReports} completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 dark:border-orange-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Gen Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              {data.avgGenerationTime}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per report</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 dark:border-red-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {data.failedReports}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Generation Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Report Generation Trends
            </CardTitle>
            <CardDescription>Report activity over time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentTrends.map((trend, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(trend.trend)}
                    <span className="text-sm font-medium">{trend.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{trend.value}</span>
                    {trend.trend !== "stable" && (
                      <Badge
                        variant={trend.trend === "up" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {trend.trend === "up" ? "+" : "-"}
                        {trend.percentage}%
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress
                  value={(trend.value / data.totalReports) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Report Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Popular Report Types
            </CardTitle>
            <CardDescription>Most frequently generated reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.reportsByType.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${getTypeColor(item.type)}`} />
                    <span className="text-sm font-medium">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{item.count}</span>
                    <span className="text-xs text-muted-foreground">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Activity Timeline
          </CardTitle>
          <CardDescription>Recent report generation activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium">This Week</p>
                  <p className="text-xs text-muted-foreground">
                    Reports generated this week
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {data.reportsThisWeek}
                </p>
                <p className="text-xs text-muted-foreground">reports</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-purple-50 dark:bg-purple-950/30">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-sm font-medium">This Month</p>
                  <p className="text-xs text-muted-foreground">
                    Reports generated this month
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {data.reportsThisMonth}
                </p>
                <p className="text-xs text-muted-foreground">reports</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950/30">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium">Currently Generating</p>
                  <p className="text-xs text-muted-foreground">Reports in progress</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {data.generatingReports}
                </p>
                <p className="text-xs text-muted-foreground">active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

