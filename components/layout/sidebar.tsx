"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Network,
  Truck,
  Wrench,
  MapPin,
  Activity,
  BarChart3,
  Settings,
  Users,
  Shield,
  AlertTriangle,
  Monitor,
  Router,
  HardHat,
  ChevronLeft,
  ChevronRight,
  FileText,
  HardDrive,
  Search,
  Radio,
  Route,
  Gauge,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isSidebarFeatureEnabled, sidebarFeatures } from "@/lib/feature-flags";

const navigation = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: BarChart3,
        featureFlag: "dashboard",
      },
      {
        title: "Network Status",
        href: "/network-status",
        icon: Activity,
        featureFlag: "networkStatus",
      },
    ],
  },
  {
    title: "Equipment Management",
    items: [
      {
        title: "Mining Equipment",
        href: "/equipment",
        icon: Truck,
        featureFlag: "miningEquipment",
      },
      {
        title: "Rajant Nodes",
        href: "/nodes",
        icon: Router,
        featureFlag: "rajantNodes",
      },
      {
        title: "Mesh Network",
        href: "/mesh",
        icon: Network,
        featureFlag: "meshNetwork",
      },
    ],
  },
  {
    title: "IP Management",
    items: [
      {
        title: "IP Management",
        href: "/ip-management",
        icon: Monitor,
        featureFlag: "ipManagement",
      },
      {
        title: "IP Assignment",
        href: "/ip-assignment",
        icon: MapPin,
        featureFlag: "ipAssignment",
      },
      {
        title: "IP Monitoring",
        href: "/ip-monitoring",
        icon: Activity,
        featureFlag: "ipMonitoring",
      },
      
    ],
  },
  {
    title: "Monitoring",
    items: [
      {
        title: "Equipment Status",
        href: "/status",
        icon: HardHat,
        featureFlag: "equipmentStatus",
      },
      {
        title: "Alerts",
        href: "/alerts",
        icon: AlertTriangle,
        featureFlag: "alerts",
      },
      {
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
        featureFlag: "reports",
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Users",
        href: "/users",
        icon: Users,
        featureFlag: "users",
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        featureFlag: "settings",
      },
      {
        title: "Logs",
        href: "/logs",
        icon: FileText,
        featureFlag: "logs",
      },
      {
        title: "Backup",
        href: "/backup",
        icon: HardDrive,
        featureFlag: "backup",
      },
      {
        title: "Maintenance",
        href: "/maintenance",
        icon: Wrench,
        featureFlag: "maintenance",
      },
    ],
  },
  {
    title: "Tools",
    items: [
      {
        title: "Network Scanner",
        href: "/tools/scanner",
        icon: Search,
        featureFlag: "networkScanner",
      },
      {
        title: "Ping Tool",
        href: "/tools/ping",
        icon: Radio,
        featureFlag: "pingTool",
      },
      {
        title: "Traceroute",
        href: "/tools/traceroute",
        icon: Route,
        featureFlag: "traceroute",
      },
      {
        title: "Bandwidth Test",
        href: "/tools/bandwidth",
        icon: Gauge,
        featureFlag: "bandwidthTest",
      },
    ],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn(
      "flex h-screen flex-col border-r bg-background transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Sidebar Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          {/* Logo and Title */}
          <div className={cn(
            "flex items-center space-x-2 transition-all duration-300 ease-in-out",
            isCollapsed ? "justify-center w-full" : "flex-1"
          )}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary flex-shrink-0">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className={cn(
              "flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
              <span className="text-sm font-semibold whitespace-nowrap">Rajant Mesh</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">Mining Network</span>
            </div>
          </div>
          
          {/* Toggle Button */}
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            isCollapsed ? "absolute right-2" : "ml-auto"
          )}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="h-8 w-8 hover:bg-accent"
                  >
                    <ChevronLeft className={cn(
                      "h-4 w-4 transition-transform duration-300 ease-in-out",
                      isCollapsed && "rotate-180"
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
        <nav className="space-y-1">
          {navigation.map((section, sectionIndex) => {
            // Filter items based on feature flags
            const enabledItems = section.items.filter((item) =>
              isSidebarFeatureEnabled(item.featureFlag as keyof typeof sidebarFeatures)
            );

            // Skip entire section if no items are enabled
            if (enabledItems.length === 0) {
              return null;
            }

            return (
              <div key={section.title}>
                {!isCollapsed && (
                  <div className="px-3 py-2">
                    <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </div>
                )}
                <div className="space-y-1">
                  {enabledItems.map((item) => {
                    const isActive = pathname === item.href;
                    const buttonContent = (
                      <Button
                        key={item.href}
                        asChild
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start text-left transition-all duration-200 ease-in-out",
                          isActive && "bg-primary/10 text-primary",
                          isCollapsed ? "px-2" : "px-3"
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon className={cn(
                            "h-4 w-4 flex-shrink-0 transition-all duration-300 ease-in-out",
                            !isCollapsed && "mr-3"
                          )} />
                          <span className={cn(
                            "transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                          )}>
                            {item.title}
                          </span>
                        </Link>
                      </Button>
                    );

                  if (isCollapsed) {
                    return (
                      <TooltipProvider key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {buttonContent}
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }

                    return buttonContent;
                  })}
                </div>
                {sectionIndex < navigation.length - 1 && !isCollapsed && (
                  <Separator className="my-4" />
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t p-4">
        <div className={cn(
          "flex items-center transition-all duration-300 ease-in-out",
          isCollapsed ? "justify-center" : "space-x-3"
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900 flex-shrink-0">
            <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className={cn(
            "flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            <span className="text-xs font-medium whitespace-nowrap">Network Status</span>
            <span className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap">
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
