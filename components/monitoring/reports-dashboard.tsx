"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ReportGenerator } from "@/components/reports/report-generator";
import { ReportSettings } from "@/components/reports/report-settings";
import { ReportAnalytics } from "@/components/reports/report-analytics";
import { ReportList } from "@/components/reports/report-list";
import {
  FileText,
  RefreshCw,
  Settings,
  Plus,
  BarChart3,
  List,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// Types
interface Report {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  generatedAt: string;
  generatedBy: string;
  status: "generating" | "completed" | "failed";
  fileSize?: string;
  downloadUrl?: string;
  format: string;
  parameters?: Record<string, any>;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  category: "equipment" | "network" | "maintenance" | "alerts" | "custom";
  parameters: {
    name: string;
    label: string;
    type: "date" | "daterange" | "select" | "text" | "number" | "multiselect";
    required: boolean;
    options?: string[];
    defaultValue?: string;
  }[];
  isDefault: boolean;
  estimatedTime?: string;
}

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

export function ReportsDashboard() {
  const [activeTab, setActiveTab] = useState("reports");
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Data states
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reports
  const fetchReports = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const response = await fetch("/api/reports");
      if (!response.ok) throw new Error("Failed to fetch reports");

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/reports/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/reports/analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchReports();
    fetchTemplates();
    fetchAnalytics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchReports(false);
      fetchAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports(false);
    fetchTemplates();
    fetchAnalytics();
  };

  // Handle report generation
  const handleGenerateReport = async (templateId: string, parameters: Record<string, any>) => {
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, parameters }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate report");
      }

      const data = await response.json();
      
      // Refresh reports list
      await fetchReports(false);
      await fetchAnalytics();
      
      alert(`Report generation started: ${data.reportId}`);
    } catch (err) {
      console.error("Error generating report:", err);
      throw err;
    }
  };

  // Handle report download
  const handleDownload = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/download`);
      if (!response.ok) throw new Error("Failed to download report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Failed to download report. Please try again.");
    }
  };

  // Handle report view
  const handleView = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`);
      if (!response.ok) throw new Error("Failed to fetch report details");

      const data = await response.json();
      // Open in new window or show in modal
      console.log("Report details:", data);
      alert("View functionality - implement modal or new window");
    } catch (err) {
      console.error("Error viewing report:", err);
      alert("Failed to view report. Please try again.");
    }
  };

  // Handle report share
  const handleShare = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: [] }), // Get from dialog
      });

      if (!response.ok) throw new Error("Failed to share report");

      alert("Report shared successfully!");
    } catch (err) {
      console.error("Error sharing report:", err);
      alert("Failed to share report. Please try again.");
    }
  };

  // Handle report delete
  const handleDelete = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete report");

      await fetchReports(false);
      await fetchAnalytics();
      alert("Report deleted successfully!");
    } catch (err) {
      console.error("Error deleting report:", err);
      alert("Failed to delete report. Please try again.");
    }
  };

  // Calculate statistics
  const stats = {
    total: reports.length,
    completed: reports.filter((r) => r.status === "completed").length,
    generating: reports.filter((r) => r.status === "generating").length,
    failed: reports.filter((r) => r.status === "failed").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading reports system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate, manage, and analyze system reports
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-blue-200 dark:border-blue-900/50 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All generated</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 dark:border-green-900/50 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {stats.completed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ready to download</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 dark:border-orange-900/50 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generating</CardTitle>
            <Loader2 className="h-4 w-4 text-orange-600 dark:text-orange-400 animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              {stats.generating}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 dark:border-red-900/50 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {stats.failed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/40 p-1 grid w-full grid-cols-3 gap-1">
          <TabsTrigger
            value="reports"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            <List className="h-4 w-4 mr-2" />
            Reports List
          </TabsTrigger>
          <TabsTrigger
            value="generate"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate New
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 transition-all"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Reports List Tab */}
        <TabsContent value="reports">
          <ReportList
            reports={reports}
            loading={refreshing}
            onDownload={handleDownload}
            onView={handleView}
            onShare={handleShare}
            onDelete={handleDelete}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        {/* Generate Report Tab */}
        <TabsContent value="generate">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  No report templates available.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ReportGenerator templates={templates} onGenerate={handleGenerateReport} />
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          {analytics ? (
            <ReportAnalytics data={analytics} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  No analytics data available.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <ReportSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
