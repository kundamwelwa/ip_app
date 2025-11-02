"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Download,
  Eye,
  Share2,
  Trash2,
  FileText,
  RefreshCw,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

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

interface ReportListProps {
  reports: Report[];
  loading?: boolean;
  onDownload: (reportId: string) => void;
  onView: (reportId: string) => void;
  onShare: (reportId: string) => void;
  onDelete: (reportId: string) => void;
  onRefresh: () => void;
}

export function ReportList({
  reports,
  loading = false,
  onDownload,
  onView,
  onShare,
  onDelete,
  onRefresh,
}: ReportListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.generatedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || report.type === filterType;
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      equipment: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      network: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      maintenance: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      alerts: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      custom: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return colors[category as keyof typeof colors] || colors.custom;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      generating: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };

    const icons = {
      completed: <CheckCircle className="h-3 w-3" />,
      generating: <Loader2 className="h-3 w-3 animate-spin" />,
      failed: <XCircle className="h-3 w-3" />,
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.failed}>
        <span className="flex items-center gap-1">
          {icons[status as keyof typeof icons]}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports by name, description, or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[200px]">
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
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="generating">Generating</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="default"
          onClick={onRefresh}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generated Reports
          </CardTitle>
          <CardDescription>
            {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Report</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Format</TableHead>
                  <TableHead className="font-semibold">Generated By</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Size</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Loading reports...
                      </p>
                    </TableCell>
                  </TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground mt-2">
                        No reports found. Try adjusting your filters.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            {report.name}
                          </div>
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {report.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(report.category)}>
                          {report.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase font-mono text-xs">
                          {report.format}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{report.generatedBy}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatRelativeTime(report.generatedAt)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(report.generatedAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.fileSize ? (
                          <span className="text-sm font-mono">{report.fileSize}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {report.status === "completed" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onDownload(report.id)}
                                title="Download report"
                                className="h-8 w-8 p-0"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onView(report.id)}
                                title="View report"
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onShare(report.id)}
                                title="Share report"
                                className="h-8 w-8 p-0"
                              >
                                <Share2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDelete(report.id)}
                            title="Delete report"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
    </div>
  );
}

