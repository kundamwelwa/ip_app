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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Download, 
  Calendar,
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
  Filter,
  RefreshCw,
  Settings,
  Eye,
  Share
} from "lucide-react";

// Types
interface Report {
  id: string;
  name: string;
  type: "equipment_status" | "ip_management" | "network_performance" | "maintenance" | "alerts" | "custom";
  description: string;
  generatedAt: Date;
  generatedBy: string;
  status: "generating" | "completed" | "failed";
  fileSize?: string;
  downloadUrl?: string;
  parameters?: Record<string, any>;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  parameters: {
    name: string;
    type: "date" | "select" | "text" | "number";
    required: boolean;
    options?: string[];
  }[];
  isDefault: boolean;
}

export function ReportsDashboard() {
  const [activeTab, setActiveTab] = useState("reports");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock data
  const [reports, setReports] = useState<Report[]>([
    {
      id: "RPT001",
      name: "Equipment Status Report",
      type: "equipment_status",
      description: "Comprehensive status report for all mining equipment",
      generatedAt: new Date("2024-01-20T10:00:00"),
      generatedBy: "Admin",
      status: "completed",
      fileSize: "2.3 MB",
      downloadUrl: "/reports/equipment-status-2024-01-20.pdf",
    },
    {
      id: "RPT002",
      name: "IP Management Report",
      type: "ip_management",
      description: "IP address assignments and conflicts report",
      generatedAt: new Date("2024-01-19T15:30:00"),
      generatedBy: "Admin",
      status: "completed",
      fileSize: "1.8 MB",
      downloadUrl: "/reports/ip-management-2024-01-19.pdf",
    },
    {
      id: "RPT003",
      name: "Network Performance Report",
      type: "network_performance",
      description: "Network performance metrics and analysis",
      generatedAt: new Date("2024-01-18T09:15:00"),
      generatedBy: "Admin",
      status: "completed",
      fileSize: "3.1 MB",
      downloadUrl: "/reports/network-performance-2024-01-18.pdf",
    },
    {
      id: "RPT004",
      name: "Maintenance Schedule Report",
      type: "maintenance",
      description: "Upcoming maintenance schedules and history",
      generatedAt: new Date("2024-01-20T14:45:00"),
      generatedBy: "Admin",
      status: "generating",
    },
    {
      id: "RPT005",
      name: "Alerts Summary Report",
      type: "alerts",
      description: "Summary of all system alerts and resolutions",
      generatedAt: new Date("2024-01-17T16:20:00"),
      generatedBy: "Admin",
      status: "completed",
      fileSize: "1.2 MB",
      downloadUrl: "/reports/alerts-summary-2024-01-17.pdf",
    },
  ]);

  const [templates, setTemplates] = useState<ReportTemplate[]>([
    {
      id: "TMP001",
      name: "Equipment Status Report",
      description: "Generate a comprehensive equipment status report",
      type: "equipment_status",
      parameters: [
        { name: "startDate", type: "date", required: true },
        { name: "endDate", type: "date", required: true },
        { name: "equipmentType", type: "select", required: false, options: ["All", "Truck", "Excavator", "Drill", "Loader"] },
        { name: "includeOffline", type: "select", required: false, options: ["Yes", "No"] },
      ],
      isDefault: true,
    },
    {
      id: "TMP002",
      name: "IP Management Report",
      description: "Generate IP address management report",
      type: "ip_management",
      parameters: [
        { name: "startDate", type: "date", required: true },
        { name: "endDate", type: "date", required: true },
        { name: "includeConflicts", type: "select", required: false, options: ["Yes", "No"] },
      ],
      isDefault: true,
    },
    {
      id: "TMP003",
      name: "Network Performance Report",
      description: "Generate network performance analysis report",
      type: "network_performance",
      parameters: [
        { name: "startDate", type: "date", required: true },
        { name: "endDate", type: "date", required: true },
        { name: "metricType", type: "select", required: false, options: ["All", "Latency", "Packet Loss", "Signal Strength"] },
      ],
      isDefault: true,
    },
    {
      id: "TMP004",
      name: "Custom Report",
      description: "Create a custom report with specific parameters",
      type: "custom",
      parameters: [
        { name: "reportName", type: "text", required: true },
        { name: "startDate", type: "date", required: true },
        { name: "endDate", type: "date", required: true },
        { name: "dataSources", type: "select", required: false, options: ["Equipment", "IP Management", "Network", "Alerts"] },
      ],
      isDefault: false,
    },
  ]);

  // Statistics
  const totalReports = reports.length;
  const completedReports = reports.filter(r => r.status === "completed").length;
  const generatingReports = reports.filter(r => r.status === "generating").length;
  const failedReports = reports.filter(r => r.status === "failed").length;

  // Filter functions
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || report.type === filterType;
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type: string) => {
    const variants = {
      equipment_status: "default",
      ip_management: "secondary",
      network_performance: "outline",
      maintenance: "secondary",
      alerts: "destructive",
      custom: "outline",
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants] || "outline"}>
        {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      generating: "secondary",
      failed: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "generating":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case "failed":
        return <FileText className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleGenerateReport = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const newReport: Report = {
      id: `RPT${String(reports.length + 1).padStart(3, '0')}`,
      name: template.name,
      type: template.type as any,
      description: template.description,
      generatedAt: new Date(),
      generatedBy: "Current User",
      status: "generating",
    };

    setReports([newReport, ...reports]);
  };

  const handleDownloadReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report || !report.downloadUrl) return;

    // In a real application, this would trigger a download
    console.log(`Downloading report: ${report.downloadUrl}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and manage system reports and analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
            <p className="text-xs text-muted-foreground">
              All reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedReports}</div>
            <p className="text-xs text-muted-foreground">
              Ready for download
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generating</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generatingReports}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <FileText className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedReports}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="equipment_status">Equipment Status</SelectItem>
                <SelectItem value="ip_management">IP Management</SelectItem>
                <SelectItem value="network_performance">Network Performance</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="alerts">Alerts</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>
                All generated reports and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Generated By</TableHead>
                    <TableHead>Generated At</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.name}</div>
                          <div className="text-sm text-muted-foreground max-w-xs truncate">{report.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(report.type)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(report.status)}
                          {getStatusBadge(report.status)}
                        </div>
                      </TableCell>
                      <TableCell>{report.generatedBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{report.generatedAt.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.fileSize ? (
                          <span className="text-sm text-muted-foreground">{report.fileSize}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {report.status === "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadReport(report.id)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share className="h-3 w-3" />
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

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>
                Pre-configured report templates for quick generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{template.name}</h3>
                      {template.isDefault && (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                    <div className="space-y-2">
                      <div className="text-xs font-medium">Parameters:</div>
                      <div className="text-xs text-muted-foreground">
                        {template.parameters.map((param, index) => (
                          <span key={index}>
                            {param.name}
                            {param.required && <span className="text-red-500">*</span>}
                            {index < template.parameters.length - 1 && ", "}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        size="sm"
                        onClick={() => handleGenerateReport(template.id)}
                        className="w-full"
                      >
                        Generate Report
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Report Generation Trends</CardTitle>
                <CardDescription>
                  Report generation over time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">This Week</span>
                    <span className="text-sm text-muted-foreground">12 reports</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">This Month</span>
                    <span className="text-sm text-muted-foreground">45 reports</span>
                  </div>
                  <Progress value={90} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Success Rate</span>
                    <span className="text-sm text-muted-foreground">95%</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Report Types</CardTitle>
                <CardDescription>
                  Most frequently generated reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Equipment Status</span>
                    <span className="text-sm text-muted-foreground">35%</span>
                  </div>
                  <Progress value={35} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">IP Management</span>
                    <span className="text-sm text-muted-foreground">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Network Performance</span>
                    <span className="text-sm text-muted-foreground">20%</span>
                  </div>
                  <Progress value={20} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Maintenance</span>
                    <span className="text-sm text-muted-foreground">15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Alerts</span>
                    <span className="text-sm text-muted-foreground">5%</span>
                  </div>
                  <Progress value={5} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
