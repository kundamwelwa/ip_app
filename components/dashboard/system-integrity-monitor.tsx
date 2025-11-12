"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Shield,
  RefreshCw,
  Zap,
  TrendingUp,
  Activity,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface IntegrityIssue {
  severity: "CRITICAL" | "WARNING";
  category: string;
  title: string;
  description: string;
  affectedItems: any[];
  count?: number;
  action: string;
  actionUrl: string;
  detectedAt: Date;
}

interface IntegrityData {
  status: "HEALTHY" | "WARNING" | "CRITICAL";
  message: string;
  healthScore: number;
  summary: {
    totalIssues: number;
    criticalIssues: number;
    warnings: number;
    lastChecked: Date;
  };
  issues: IntegrityIssue[];
  recommendations: string[];
}

export function SystemIntegrityMonitor() {
  const [data, setData] = useState<IntegrityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  // Load visibility preference from localStorage
  useEffect(() => {
    const savedVisibility = localStorage.getItem("duplicateIPMonitorVisible");
    if (savedVisibility !== null) {
      setIsVisible(savedVisibility === "true");
    }
  }, []);

  const fetchIntegrityData = async () => {
    try {
      const response = await fetch("/api/system/integrity");
      if (response.ok) {
        const integrityData = await response.json();
        setData(integrityData);
      }
    } catch (error) {
      console.error("Failed to fetch integrity data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIntegrityData();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchIntegrityData, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchIntegrityData();
  };

  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    localStorage.setItem("duplicateIPMonitorVisible", String(newVisibility));
  };

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Checking for duplicate IP assignments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // Minimized view when hidden
  if (!isVisible) {
    return (
      <Card className="border-2 bg-muted/30">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">Duplicate IP Monitor</span>
                {data.summary.criticalIssues > 0 && (
                  <Badge className="bg-red-600">
                    {data.summary.criticalIssues} {data.summary.criticalIssues === 1 ? 'Conflict' : 'Conflicts'}
                  </Badge>
                )}
                {data.summary.criticalIssues === 0 && (
                  <Badge className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    No Issues
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVisibility}
              className="text-muted-foreground hover:text-foreground"
            >
              <Eye className="h-4 w-4 mr-2" />
              Show Monitor
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CRITICAL":
        return "border-red-500 bg-red-50 dark:bg-red-950/20";
      case "WARNING":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
      default:
        return "border-green-500 bg-green-50 dark:bg-green-950/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CRITICAL":
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case "WARNING":
        return <AlertCircle className="h-6 w-6 text-yellow-600" />;
      default:
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    if (severity === "CRITICAL") {
      return (
        <Badge className="bg-red-600 hover:bg-red-700">
          <AlertTriangle className="h-3 w-3 mr-1" />
          CRITICAL
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-600 hover:bg-yellow-700">
        <AlertCircle className="h-3 w-3 mr-1" />
        WARNING
      </Badge>
    );
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthBarColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <Card className={`border-2 ${getStatusColor(data.status)}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(data.status)}
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Duplicated IP Monitor
                {data.summary.criticalIssues > 0 && (
                  <span className="animate-pulse">🚨</span>
                )}
              </CardTitle>
              <CardDescription>
                {data.summary.criticalIssues > 0 
                  ? "Monitoring for duplicate IP assignments - Issues detected"
                  : "Monitoring for duplicate IP assignments - No conflicts detected"
                }
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVisibility}
              title="Hide monitor"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Health Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">IP Integrity Score</span>
            </div>
            <span className={`text-2xl font-bold ${getHealthColor(data.healthScore)}`}>
              {data.healthScore}/100
            </span>
          </div>
          <div className="relative">
            <Progress value={data.healthScore} className="h-3" />
            <div
              className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getHealthBarColor(data.healthScore)}`}
              style={{ width: `${data.healthScore}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {data.summary.criticalIssues === 0 
              ? "All IP addresses are unique to their equipment" 
              : "Some IPs are assigned to multiple equipment"
            }
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-background border">
            <div className="text-3xl font-bold">{data.summary.totalIssues}</div>
            <div className="text-xs text-muted-foreground mt-1">Duplicate IP Conflicts</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-red-100 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900">
            <div className="text-3xl font-bold text-red-600">{data.summary.criticalIssues}</div>
            <div className="text-xs text-red-700 dark:text-red-400 mt-1">Require Immediate Action</div>
          </div>
        </div>

        {expanded && data.issues.length > 0 && (
          <>
            {/* Quick Action Alert */}
            {data.summary.criticalIssues > 0 && (
              <div className="flex items-center space-x-2 p-3 bg-red-100 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                <Zap className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-sm font-medium text-red-900 dark:text-red-100 flex-1">
                  {data.summary.criticalIssues} IP {data.summary.criticalIssues === 1 ? 'address' : 'addresses'} assigned to multiple equipment - Resolve immediately
                </span>
              </div>
            )}

            {/* Issues List */}
            <div className="space-y-3">
              {data.issues.map((issue, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    issue.severity === "CRITICAL"
                      ? "border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
                      : "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getSeverityBadge(issue.severity)}
                        <Badge variant="outline" className="text-xs">
                          {issue.category.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{issue.title}</h4>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                    </div>
                  </div>

                  {/* Affected Items */}
                  {issue.affectedItems && issue.affectedItems.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Affected Items:</p>
                      <div className="space-y-1">
                        {issue.affectedItems.slice(0, 3).map((item, idx) => (
                          <div
                            key={idx}
                            className="text-xs p-2 rounded bg-background/50 border flex items-center justify-between"
                          >
                            <span className="font-mono">
                              {item.name || item.ipAddress || item.address}
                            </span>
                            {item.location && (
                              <span className="text-muted-foreground">{item.location}</span>
                            )}
                          </div>
                        ))}
                        {issue.count && issue.count > 3 && (
                          <p className="text-xs text-muted-foreground">
                            + {issue.count - 3} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => router.push(issue.actionUrl)}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    {issue.action.replace(/_/g, " ")}
                  </Button>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {data.recommendations.length > 0 && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <div className="flex items-start space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                      Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {data.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-blue-800 dark:text-blue-200">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* No Issues */}
        {data.issues.length === 0 && (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-lg text-green-900 dark:text-green-100 mb-1">
              No Duplicate IP Addresses Detected
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              All equipment have unique IP addresses. Each IP is assigned to only one equipment.
            </p>
          </div>
        )}

        <div className="text-xs text-center text-muted-foreground pt-2 border-t">
          Last checked: {new Date(data.summary.lastChecked).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

