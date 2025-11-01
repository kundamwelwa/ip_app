"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Search,
  Link,
  Activity,
  AlertTriangle,
  Network,
  XCircle,
  FileText,
  Truck,
  Zap,
  Settings,
  BarChart3,
  Shield,
  Users,
  Wrench
} from "lucide-react";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    id: "check-ip",
    title: "Check IP Status",
    description: "Verify IP address assignment",
    icon: Search,
    href: "/ip-management",
    color: "text-blue-600"
  },
  {
    id: "assign-ip",
    title: "Assign IP",
    description: "Assign IP to equipment",
    icon: Link,
    href: "/ip-assignment",
    color: "text-green-600"
  },
  {
    id: "equipment-status",
    title: "Equipment Status",
    description: "Monitor equipment health",
    icon: Activity,
    href: "/status",
    color: "text-blue-600 dark:text-blue-400"
  },
  {
    id: "alerts",
    title: "View Alerts",
    description: "System notifications",
    icon: AlertTriangle,
    href: "/alerts",
    color: "text-orange-600"
  },
  {
    id: "network-monitor",
    title: "Network Monitor",
    description: "Real-time network status",
    icon: Network,
    href: "/ip-monitoring",
    color: "text-cyan-600"
  },
  {
    id: "ip-conflicts",
    title: "IP Conflicts",
    description: "Resolve IP conflicts",
    icon: XCircle,
    href: "/ip-conflicts",
    color: "text-red-600"
  },
  {
    id: "generate-report",
    title: "Generate Report",
    description: "Create system reports",
    icon: FileText,
    href: "/reports",
    color: "text-indigo-600"
  },
  {
    id: "manage-equipment",
    title: "Manage Equipment",
    description: "Equipment management",
    icon: Truck,
    href: "/equipment",
    color: "text-yellow-600"
  },
  {
    id: "network-status",
    title: "Network Status",
    description: "Network overview",
    icon: BarChart3,
    href: "/network-status",
    color: "text-teal-600"
  },
  {
    id: "rajant-nodes",
    title: "Rajant Nodes",
    description: "Node management",
    icon: Shield,
    href: "/nodes",
    color: "text-pink-600"
  },
  {
    id: "mesh-network",
    title: "Mesh Network",
    description: "Network topology",
    icon: Network,
    href: "/mesh",
    color: "text-violet-600"
  },
  {
    id: "settings",
    title: "Settings",
    description: "System configuration",
    icon: Settings,
    href: "/settings",
    color: "text-gray-600"
  }
];

export function QuickActions() {
  const handleActionClick = (href: string) => {
    window.location.href = href;
  };

  return (
    <Card className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-primary" />
          <span>Quick Actions</span>
        </CardTitle>
        <CardDescription>
          Common tasks and shortcuts for efficient system management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-primary/10 transition-all duration-200 hover:scale-105 hover:shadow-md"
                onClick={() => handleActionClick(action.href)}
              >
                <IconComponent className={`h-6 w-6 ${action.color}`} />
                <div className="text-center">
                  <div className="text-sm font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        
        {/* Additional Info */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">System Management</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Use these quick actions to efficiently manage your Rajant mesh network, 
            monitor equipment status, and resolve IP conflicts. All actions are 
            designed for professional mining operations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
